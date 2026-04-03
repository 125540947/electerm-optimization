// electerm-sync-server 服务端代码
// 复制到 /opt/electerm-sync/server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const basicAuth = require('basic-auth');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_DIR = process.env.DATA_DIR || './data';

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 请求日志
app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.path}`;
  if (req.headers.authorization) {
    console.log(log, '- Authenticated');
  } else {
    console.log(log);
  }
  next();
});

// Basic Auth 中间件 (用于管理接口)
const auth = (req, res, next) => {
  const credentials = basicAuth(req);
  
  if (!credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Electerm Sync Admin"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = {
    id: credentials.name,
    pass: credentials.pass
  };
  next();
};

// JWT 验证中间件
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

// 生成 JWT
function generateToken(userId) {
  return jwt.sign(
    { userId, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// 获取用户文件路径
function getUserFile(userId) {
  return path.join(DATA_DIR, `${userId}.json`);
}

// ==================== API 接口 ====================

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 获取服务器信息
app.get('/api/info', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'electerm-sync-server',
    users: fs.existsSync(path.join(DATA_DIR, 'users.json')) 
      ? Object.keys(JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8'))).length 
      : 0
  });
});

// 注册用户
app.post('/api/register', (req, res) => {
  const { userId, password } = req.body;
  
  // 验证参数
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
  let users = {};
  
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }
  
  if (users[userId]) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // 创建用户
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
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  
  const usersFile = path.join(DATA_DIR, 'users.json');
  
  if (!fs.existsSync(usersFile)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  
  if (!users[userId] || users[userId].password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // 更新最后登录时间
  users[userId].updated = Date.now();
  users[userId].lastLogin = Date.now();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  
  const token = generateToken(userId);
  console.log(`User logged in: ${userId}`);
  
  res.json({ success: true, token });
});

// 获取同步数据
app.get('/api/sync', verifyJwt, (req, res) => {
  const userFile = getUserFile(req.userId);
  
  if (!fs.existsSync(userFile)) {
    return res.json({ version: 0, updated: 0, data: null });
  }
  
  const data = JSON.parse(fs.readFileSync(userFile, 'utf8'));
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
  
  // 计算新版本号
  const newVersion = Math.max(version || 0, existingData.version) + 1;
  
  const newData = {
    version: newVersion,
    updated: Date.now(),
    data
  };
  
  fs.writeFileSync(userFile, JSON.stringify(newData, null, 2));
  
  console.log(`User ${req.userId} synced data, version: ${newVersion}`);
  
  res.json({ success: true, version: newVersion });
});

// 删除用户数据
app.delete('/api/sync', verifyJwt, (req, res) => {
  const userFile = getUserFile(req.userId);
  
  if (fs.existsSync(userFile)) {
    fs.unlinkSync(userFile);
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
  
  // 生成新 token
  const newToken = generateToken(req.userId);
  
  res.json({ success: true, token: newToken });
});

// 管理员: 获取用户列表 (需要 Basic Auth)
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
  
  // 删除用户数据
  const userFile = getUserFile(userId);
  if (fs.existsSync(userFile)) {
    fs.unlinkSync(userFile);
  }
  
  console.log(`Admin deleted user: ${userId}`);
  
  res.json({ success: true });
});

// 静态文件 (可选)
app.use(express.static('public'));

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log(`  Electerm Sync Server v1.0.0`);
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
