#!/bin/bash
# electerm-web 完整优化部署脚本
# 一键部署所有优化改进

set -e

echo "========================================="
echo "  electerm-web 优化部署脚本"
echo "========================================="

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# 检查 root
if [ "$EUID" -ne 0 ]; then
  echo "请使用 root 运行此脚本"
  exit 1
fi

cd /opt/electerm-sync

log_info "更新同步服务到增强版..."

# 备份原版
if [ -f server.js ]; then
  cp server.js server.js.bak
fi

# 复制增强版
cat > server.js << 'SERVEREOF'
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const basicAuth = require('basic-auth');
const cors = require('cors');
const compression = require('compression');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
const DATA_DIR = process.env.DATA_DIR || './data';

const app = express();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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
    return res.status(401).json({ error: 'Invalid token' });
  }
};

function generateToken(userId) {
  return jwt.sign({ userId, iat: Date.now() }, JWT_SECRET, { expiresIn: '30d' });
}

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));
app.get('/api/info', (req, res) => res.json({ version: '1.2.0', name: 'electerm-sync-enhanced' }));

app.post('/api/register', (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'Missing credentials' });
  
  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : {};
  if (users[userId]) return res.status(400).json({ error: 'User exists' });
  
  users[userId] = { password, created: Date.now(), updated: Date.now() };
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true, token: generateToken(userId) });
});

app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  const usersFile = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersFile)) return res.status(401).json({ error: 'Invalid credentials' });
  
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  if (!users[userId] || users[userId].password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  users[userId].updated = Date.now();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ success: true, token: generateToken(userId) });
});

app.get('/api/sync', verifyJwt, (req, res) => {
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  if (!fs.existsSync(userFile)) return res.json({ version: 0, data: null });
  res.json(JSON.parse(fs.readFileSync(userFile, 'utf8')));
});

app.put('/api/sync', verifyJwt, (req, res) => {
  const { version, data } = req.body;
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  let existingData = fs.existsSync(userFile) ? JSON.parse(fs.readFileSync(userFile, 'utf8')) : { version: 0 };
  
  const newVersion = Math.max(version || 0, existingData.version) + 1;
  const newData = { version: newVersion, updated: Date.now(), data };
  
  fs.writeFileSync(userFile, JSON.stringify(newData, null, 2));
  res.json({ success: true, version: newVersion });
});

app.delete('/api/sync', verifyJwt, (req, res) => {
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  if (fs.existsSync(userFile)) fs.unlinkSync(userFile);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`  electerm-sync-server v1.2.0`);
  console.log(`  Running on http://0.0.0.0:${PORT}`);
  console.log(`========================================`);
});

process.on('SIGINT', () => { console.log('\nShutting down...'); process.exit(0); });
SERVEREOF

log_info "安装额外依赖..."
cd /opt/electerm-sync
npm install compression --save

log_info "重启同步服务..."
pm2 restart electerm-sync

log_info "等待服务启动..."
sleep 3

log_info "测试服务..."
curl -s http://localhost:3000/api/info

echo ""
log_info "========================================="
log_info "  优化部署完成!"
log_info "========================================="
