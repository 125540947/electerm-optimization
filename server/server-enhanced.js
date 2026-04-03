/**
 * electerm-sync-server 增强版
 * 包含性能监控、安全加固、缓存优化
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const basicAuth = require('basic-auth');
const cors = require('cors');
const compression = require('compression');

// ==================== 配置 ====================
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
const DATA_DIR = process.env.DATA_DIR || './data';
const RATE_LIMIT = process.env.RATE_LIMIT || 100;
const CACHE_TTL = process.env.CACHE_TTL || 60000;

// ==================== 初始化 ====================
const app = express();

// 中间件
app.use(cors());
app.use(compression()); // Gzip 压缩
app.use(express.json({ limit: '10mb' }));

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ==================== 缓存 ====================
class MemoryCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
    this.startCleanup();
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache) {
        if (now - item.timestamp > this.ttl) {
          this.cache.delete(key);
        }
      }
    }, this.ttl);
  }
}

const cache = new MemoryCache(CACHE_TTL);

// ==================== 速率限制 ====================
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(t => now - t < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter(RATE_LIMIT);

// 中间件: 速率限制
const rateLimitMiddleware = (req, res, next) => {
  const identifier = req.ip;
  if (!rateLimiter.isAllowed(identifier)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
};

// ==================== 认证中间件 ====================
const auth = (req, res, next) => {
  const credentials = basicAuth(req);
  if (!credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Electerm Sync"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = { id: credentials.name, pass: credentials.pass };
  next();
};

const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

function generateToken(userId) {
  return jwt.sign(
    { userId, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// ==================== 工具函数 ====================
function getUserFile(userId) {
  return path.join(DATA_DIR, `${userId}.json`);
}

function getStats() {
  const usersFile = path.join(DATA_DIR, 'users.json');
  let userCount = 0;
  if (fs.existsSync(usersFile)) {
    userCount = Object.keys(JSON.parse(fs.readFileSync(usersFile, 'utf8'))).length;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && f !== 'users.json');
  
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    users: userCount,
    dataFiles: files.length,
    cacheSize: cache.cache.size
  };
}

// ==================== API 路由 ====================

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// 性能指标
app.get('/api/metrics', rateLimitMiddleware, (req, res) => {
  res.json(getStats());
});

// 服务器信息
app.get('/api/info', (req, res) => {
  res.json({
    version: '1.2.0',
    name: 'electerm-sync-server-enhanced',
    features: ['rate-limit', 'cache', 'compression', 'metrics']
  });
});

// 注册用户
app.post('/api/register', rateLimitMiddleware, (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'Missing userId or password' });
  }
  if (userId.length < 3) {
    return res.status(400).json({ error: 'userId must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : {};

  if (users[userId]) {
    return res.status(400).json({ error: 'User already exists' });
  }

  users[userId] = {
    password,
    created: Date.now(),
    updated: Date.now()
  };

  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  
  const token = generateToken(userId);
  console.log(`New user registered: ${userId}`);
  
  res.json({ success: true, token });
});

// 登录
app.post('/api/login', rateLimitMiddleware, (req, res) => {
  const { userId, password } = req.body;
  const usersFile = path.join(DATA_DIR, 'users.json');

  if (!fs.existsSync(usersFile)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

  if (!users[userId] || users[userId].password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  users[userId].updated = Date.now();
  users[userId].lastLogin = Date.now();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const token = generateToken(userId);
  console.log(`User logged in: ${userId}`);

  res.json({ success: true, token });
});

// 获取同步数据 (带缓存)
app.get('/api/sync', verifyJwt, (req, res) => {
  const cacheKey = `sync:${req.userId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const userFile = getUserFile(req.userId);
  if (!fs.existsSync(userFile)) {
    return res.json({ version: 0, data: null });
  }

  const data = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  cache.set(cacheKey, data);
  res.json(data);
});

// 保存同步数据
app.put('/api/sync', verifyJwt, (req, res) => {
  const { version, data } = req.body;
  const userFile = getUserFile(req.userId);

  let existingData = { version: 0, updated: 0, data: null };

  if (fs.existsSync(userFile)) {
    existingData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  }

  // 版本检查 (乐观锁)
  if (version && version < existingData.version) {
    return res.json({
      success: false,
      error: 'Version conflict',
      serverVersion: existingData.version,
      serverData: existingData.data,
      serverUpdated: existingData.updated
    });
  }

  const newVersion = Math.max(version || 0, existingData.version) + 1;

  const newData = {
    version: newVersion,
    updated: Date.now(),
    data
  };

  fs.writeFileSync(userFile, JSON.stringify(newData, null, 2));

  // 清除缓存
  cache.delete(`sync:${req.userId}`);

  console.log(`User ${req.userId} synced data, version: ${newVersion}`);

  res.json({ success: true, version: newVersion });
});

// 删除用户数据
app.delete('/api/sync', verifyJwt, (req, res) => {
  const userFile = getUserFile(req.userId);

  if (fs.existsSync(userFile)) {
    fs.unlinkSync(userFile);
    cache.delete(`sync:${req.userId}`);
    console.log(`User ${req.userId} deleted their data`);
  }

  res.json({ success: true });
});

// 修改密码
app.post('/api/password', verifyJwt, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const usersFile = path.join(DATA_DIR, 'users.json');

  if (!fs.existsSync(usersFile)) {
    return res.status(404).json({ error: 'User not found' });
  }

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

  if (!users[req.userId]) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (users[req.userId].password !== oldPassword) {
    return res.status(400).json({ error: 'Incorrect old password' });
  }

  users[req.userId].password = newPassword;
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const newToken = generateToken(req.userId);

  res.json({ success: true, token: newToken });
});

// 管理员: 获取用户列表
app.get('/api/admin/users', auth, (req, res) => {
  const usersFile = path.join(DATA_DIR, 'users.json');

  if (!fs.existsSync(usersFile)) {
    return res.json([]);
  }

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const list = Object.entries(users).map(([id, data]) => ({
    id,
    created: data.created,
    updated: data.updated,
    lastLogin: data.lastLogin
  }));

  res.json(list);
});

// 管理员: 删除用户
app.delete('/api/admin/users/:userId', auth, (req, res) => {
  const { userId } = req.params;
  const usersFile = path.join(DATA_DIR, 'users.json');

  if (!fs.existsSync(usersFile)) {
    return res.status(404).json({ error: 'User not found' });
  }

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

  if (!users[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }

  delete users[userId];
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const userFile = getUserFile(userId);
  if (fs.existsSync(userFile)) {
    fs.unlinkSync(userFile);
  }
  cache.delete(`sync:${userId}`);

  console.log(`Admin deleted user: ${userId}`);

  res.json({ success: true });
});

// 管理员: 系统状态
app.get('/api/admin/stats', auth, (req, res) => {
  res.json(getStats());
});

// ==================== 错误处理 ====================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== 启动 ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log(`  electerm-sync-server v1.2.0`);
  console.log(`  Enhanced with:`);
  console.log(`  - Rate limiting (${RATE_LIMIT} req/min)`);
  console.log(`  - Response compression`);
  console.log(`  - Response caching`);
  console.log(`  - Performance metrics`);
  console.log(`  Running on http://0.0.0.0:${PORT}`);
  console.log(`  Data directory: ${DATA_DIR}`);
  console.log('========================================');
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});
