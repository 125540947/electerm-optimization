#!/bin/bash
# 增强版一键部署脚本 - 支持多版本部署
# 运行前请确保已配置 SSH 密钥访问

set -e

# ===== 配置 =====
SERVER_IP="${SERVER_IP}"
SSH_PORT="22"
SSH_USER="root"
SSH_PASS="czfkKUGS9741"
SYNC_VERSION="1.5.0"

# ===== 颜色 =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# ===== 帮助信息 =====
show_help() {
  echo "用法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  -s, --sync        只部署同步服务"
  echo "  -w, --web         只部署 Web 服务"
  echo "  -n, --nginx       只配置 Nginx"
  echo "  -a, --all         部署所有服务 (默认)"
  echo "  -r, --restart     重启服务"
  echo "  -t, --status      查看服务状态"
  echo "  -h, --help        显示帮助"
}

# ===== 检查依赖 =====
check_deps() {
  log_info "检查依赖..."
  command -v sshpass >/dev/null 2>&1 || { log_error "需要安装 sshpass"; exit 1; }
}

# ===== SSH 连接测试 =====
test_connection() {
  log_info "测试 SSH 连接..."
  if sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 $SSH_USER@$SERVER_IP "echo 'OK'" 2>/dev/null; then
    log_info "SSH 连接成功"
  else
    log_error "SSH 连接失败"
    exit 1
  fi
}

# ===== 部署 electerm-sync =====
deploy_sync() {
  log_step "部署同步服务 v$SYNC_VERSION..."
  
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << 'EOF'
set -e

# 创建目录
mkdir -p /opt/electerm-sync && cd /opt/electerm-sync

# 初始化
if [ ! -f package.json ]; then
  npm init -y
fi

# 安装依赖
npm install express jsonwebtoken basic-auth cors compression uuid

# 创建服务端代码
cat > server.js << 'SERVERJS'
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const basicAuth = require('basic-auth');
const cors = require('cors');
const compression = require('compression');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
const DATA_DIR = process.env.DATA_DIR || './data';
const RATE_LIMIT = process.env.RATE_LIMIT || 100;
const CACHE_TTL = process.env.CACHE_TTL || 60000;

const app = express();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// 缓存
class MemoryCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache) {
        if (now - item.timestamp > this.ttl) this.cache.delete(key);
      }
    }, this.ttl);
  }
  set(key, value) { this.cache.set(key, { value, timestamp: Date.now() }); }
  get(key) { const item = this.cache.get(key); return item && Date.now() - item.timestamp < this.ttl ? item.value : null; }
  delete(key) { this.cache.delete(key); }
}
const cache = new MemoryCache(CACHE_TTL);

// 速率限制
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
    if (recentRequests.length >= this.maxRequests) return false;
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}
const rateLimiter = new RateLimiter(RATE_LIMIT);

const rateLimitMiddleware = (req, res, next) => {
  if (!rateLimiter.isAllowed(req.ip)) return res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
  next();
};

const auth = (req, res, next) => {
  const credentials = basicAuth(req);
  if (!credentials) { res.setHeader('WWW-Authenticate', 'Basic realm="Electerm Sync"'); return res.status(401).json({ error: 'Authentication required' }); }
  req.user = { id: credentials.name, pass: credentials.pass };
  next();
};

const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalid token' });
  try { req.userId = jwt.verify(authHeader.substring(7), JWT_SECRET).userId; next(); } catch (err) { return res.status(401).json({ error: 'Invalid token' }); }
};

function generateToken(userId) { return jwt.sign({ userId, iat: Date.now() }, JWT_SECRET, { expiresIn: '30d' }); }

const operationLog = [];

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime(), memory: process.memoryUsage() }));
app.get('/api/info', (req, res) => {
  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : {};
  res.json({ version: '1.5.0', name: 'electerm-sync-server-enhanced', users: Object.keys(users).length, features: ['sync', 'export', 'import', 'history'] });
});

app.post('/api/register', rateLimitMiddleware, (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'Missing credentials' });
  if (userId.length < 3 || password.length < 6) return res.status(400).json({ error: 'Invalid length' });
  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : {};
  if (users[userId]) return res.status(400).json({ error: 'User exists' });
  users[userId] = { password, created: Date.now(), updated: Date.now(), lastLogin: null };
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true, token: generateToken(userId) });
});

app.post('/api/login', rateLimitMiddleware, (req, res) => {
  const { userId, password } = req.body;
  const usersFile = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersFile)) return res.status(401).json({ error: 'Invalid credentials' });
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  if (!users[userId] || users[userId].password !== password) return res.status(401).json({ error: 'Invalid credentials' });
  users[userId].lastLogin = Date.now();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true, token: generateToken(userId) });
});

app.get('/api/sync', verifyJwt, (req, res) => {
  const cacheKey = `sync:${req.userId}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  const data = fs.existsSync(userFile) ? JSON.parse(fs.readFileSync(userFile, 'utf8')) : { version: 0, data: null };
  cache.set(cacheKey, data);
  res.json(data);
});

app.put('/api/sync', verifyJwt, (req, res) => {
  const { version, data } = req.body;
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  let existingData = fs.existsSync(userFile) ? JSON.parse(fs.readFileSync(userFile, 'utf8')) : { version: 0 };
  if (version && version < existingData.version) return res.json({ success: false, error: 'Version conflict', serverVersion: existingData.version, serverData: existingData.data });
  const newVersion = Math.max(version || 0, existingData.version) + 1;
  fs.writeFileSync(userFile, JSON.stringify({ version: newVersion, updated: Date.now(), data }, null, 2));
  cache.delete(`sync:${req.userId}`);
  res.json({ success: true, version: newVersion });
});

app.delete('/api/sync', verifyJwt, (req, res) => {
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  if (fs.existsSync(userFile)) { fs.unlinkSync(userFile); cache.delete(`sync:${req.userId}`); }
  res.json({ success: true });
});

app.post('/api/password', verifyJwt, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  if (users[req.userId].password !== oldPassword) return res.status(400).json({ error: 'Incorrect password' });
  users[req.userId].password = newPassword;
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  cache.delete(`sync:${req.userId}`);
  res.json({ success: true, token: generateToken(req.userId) });
});

app.get('/api/export', verifyJwt, (req, res) => {
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  if (!fs.existsSync(userFile)) return res.json({ version: 0, data: null });
  const data = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  res.setHeader('Content-Disposition', `attachment; filename="electerm-backup-${req.userId}.json"`);
  res.json({ exportedAt: Date.now(), version: data.version, userId: req.userId, data: data.data });
});

app.post('/api/import', verifyJwt, (req, res) => {
  const { data, merge = false } = req.body;
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  let existingData = fs.existsSync(userFile) ? JSON.parse(fs.readFileSync(userFile, 'utf8')) : { version: 0, data: null };
  const newVersion = existingData.version + 1;
  fs.writeFileSync(userFile, JSON.stringify({ version: newVersion, updated: Date.now(), data: merge ? { ...existingData.data, ...data } : data }, null, 2));
  cache.delete(`sync:${req.userId}`);
  res.json({ success: true, version: newVersion });
});

app.get('/api/admin/users', auth, (req, res) => {
  const usersFile = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersFile)) return res.json([]);
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  res.json(Object.entries(users).map(([id, data]) => ({ id, created: data.created, lastLogin: data.lastLogin })));
});

app.delete('/api/admin/users/:userId', auth, (req, res) => {
  const { userId } = req.params;
  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  delete users[userId];
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  const userFile = path.join(DATA_DIR, `${userId}.json`);
  if (fs.existsSync(userFile)) fs.unlinkSync(userFile);
  cache.delete(`sync:${userId}`);
  res.json({ success: true });
});

app.get('/api/admin/logs', auth, (req, res) => res.json(operationLog.slice(-100)));

app.get('/api/admin/stats', auth, (req, res) => {
  const usersFile = path.join(DATA_DIR, 'users.json');
  let totalSize = 0;
  if (fs.existsSync(DATA_DIR)) {
    fs.readdirSync(DATA_DIR).forEach(f => { const stat = fs.statSync(path.join(DATA_DIR, f)); if (stat.isFile()) totalSize += stat.size; });
  }
  res.json({ users: fs.existsSync(usersFile) ? Object.keys(JSON.parse(fs.readFileSync(usersFile, 'utf8'))).length : 0, dataSize: totalSize, uptime: process.uptime(), memory: process.memoryUsage() });
});

app.listen(PORT, '0.0.0.0', () => console.log(`electerm-sync v1.5.0 running on port ${PORT}`));
process.on('SIGINT', () => process.exit(0));
SERVERJS

# 配置环境
echo "PORT=3000" > .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env

# 使用 PM2 管理
pm2 delete electerm-sync 2>/dev/null || true
pm2 start server.js --name electerm-sync
pm2 save

echo "Sync 服务部署完成"
EOF

  log_info "同步服务部署成功"
}

# ===== 部署 electerm-web =====
deploy_web() {
  log_step "部署 Web 服务..."
  
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << 'EOF'
set -e
cd /opt
if [ ! -d electerm-web ]; then
  git clone https://github.com/electerm/electerm-web.git
fi
cd electerm-web
cp -n .sample.env .env 2>/dev/null || true
echo -e "PORT=5580\nDB_PATH=/opt/electerm-data\nSERVER_SECRET=$(openssl rand -hex 32)" > .env
mkdir -p /opt/electerm-data
npm config set legacy-peer-deps true
npm install
npm run build
pm2 delete electerm-web 2>/dev/null || true
pm2 start "node src/app/app.js" --name electerm-web
pm2 save
echo "Web 服务部署完成"
EOF

  log_info "Web 服务部署成功"
}

# ===== 配置 Nginx =====
configure_nginx() {
  log_step "配置 Nginx..."
  
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << 'EOF'
rm -f /etc/nginx/sites-enabled/default
cat > /etc/nginx/sites-available/electerm << 'NGINX'
upstream electerm_web {
    server 127.0.0.1:5580;
}
upstream electerm_sync {
    server 127.0.0.1:3000;
}
server {
    listen 80;
    server_name _;
    # Web 服务
    location / {
        proxy_pass http://electerm_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }
    # API 代理
    location /api/ {
        proxy_pass http://electerm_sync;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    # 同步服务直接访问
    location ~ ^/sync/(.*)$ {
        proxy_pass http://electerm_sync/$1;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/electerm /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "Nginx 配置完成"
EOF

  log_info "Nginx 配置成功"
}

# ===== 重启服务 =====
restart_services() {
  log_step "重启服务..."
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "pm2 restart all && sleep 2 && pm2 status"
  log_info "服务已重启"
}

# ===== 查看状态 =====
show_status() {
  log_step "服务状态:"
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "pm2 status; echo ''; curl -s http://localhost:3000/health; echo ''; curl -s http://localhost:3000/api/info"
}

# ===== 主函数 =====
main() {
  DEPLOY_ALL=true
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      -s|--sync) DEPLOY_ALL=false; deploy_sync; shift ;;
      -w|--web) DEPLOY_ALL=false; deploy_web; shift ;;
      -n|--nginx) DEPLOY_ALL=false; configure_nginx; shift ;;
      -r|--restart) DEPLOY_ALL=false; restart_services; shift ;;
      -t|--status) DEPLOY_ALL=false; show_status; shift ;;
      -a|--all) DEPLOY_ALL=true; shift ;;
      -h|--help) show_help; exit 0 ;;
      *) log_error "未知选项: $1"; show_help; exit 1 ;;
    esac
  done
  
  if $DEPLOY_ALL; then
    echo "========================================="
    echo "  electerm 增强版部署脚本 v$SYNC_VERSION"
    echo "========================================="
    check_deps
    test_connection
    deploy_sync
    deploy_web
    configure_nginx
    echo ""
    log_info "========================================="
    log_info "  部署完成!"
    log_info "========================================="
    echo ""
    echo "Web 服务: http://$SERVER_IP"
    echo "同步服务: http://$SERVER_IP:3000"
    echo ""
    echo "管理后台: http://$SERVER_IP/admin-marix.html"
    echo "管理员账号: admin"
    echo "管理员密码: czfkKUGS9741"
  fi
}

main "$@"