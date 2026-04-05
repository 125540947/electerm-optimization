#!/bin/bash
# 完整的一键部署脚本 - 适用于新服务器
# 运行前请确保已配置 SSH 密钥访问

set -e

# ===== 配置 =====
SERVER_IP="${SERVER_IP}"
SSH_PORT="22"
SSH_USER="root"
SSH_PASS="czfkKUGS9741"

# ===== 颜色 =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===== 检查依赖 =====
check_deps() {
  log_info "检查依赖..."
  command -v sshpass >/dev/null 2>&1 || { log_error "需要安装 sshpass"; exit 1; }
}

# ===== 安装基础软件 =====
install_base() {
  log_info "安装基础软件..."
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "apt-get update && apt-get install -y nodejs npm nginx git curl"
}

# ===== 部署 electerm-sync =====
deploy_sync() {
  log_info "部署同步服务..."
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << 'EOF'
mkdir -p /opt/electerm-sync && cd /opt/electerm-sync
npm init -y
npm install express jsonwebtoken basic-auth cors compression uuid
cat > server.js << 'SERVERJS'
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

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`); next(); });

const auth = (req, res, next) => {
  const credentials = basicAuth(req);
  if (!credentials) { res.setHeader('WWW-Authenticate', 'Basic realm="Electerm Sync"'); return res.status(401).json({ error: 'Authentication required' }); }
  req.user = { id: credentials.name, pass: credentials.pass };
  next();
};

const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalid token' });
  const token = authHeader.substring(7);
  try { const decoded = jwt.verify(token, JWT_SECRET); req.userId = decoded.userId; next(); } catch (err) { return res.status(401).json({ error: 'Invalid token' }); }
};

function generateToken(userId) { return jwt.sign({ userId, iat: Date.now() }, JWT_SECRET, { expiresIn: '30d' }); }

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
  if (!users[userId] || users[userId].password !== password) return res.status(401).json({ error: 'Invalid credentials' });
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
  fs.writeFileSync(userFile, JSON.stringify({ version: newVersion, updated: Date.now(), data }, null, 2));
  res.json({ success: true, version: newVersion });
});

app.delete('/api/sync', verifyJwt, (req, res) => {
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  if (fs.existsSync(userFile)) fs.unlinkSync(userFile);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => { console.log(`electerm-sync v1.2.0 running on port ${PORT}`); });
process.on('SIGINT', () => process.exit(0));
SERVERJS

echo "PORT=3000" > .env
npm install -g pm2
pm2 start server.js --name electerm-sync
pm2 save
EOF
}

# ===== 部署 electerm-web =====
deploy_web() {
  log_info "部署 Web 服务..."
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << 'EOF'
cd /opt
git clone https://github.com/electerm/electerm-web.git
cd electerm-web
cp .sample.env .env
echo -e "PORT=5580\nDB_PATH=/opt/electerm-data\nSERVER_SECRET=$(openssl rand -hex 32)" > .env
mkdir -p /opt/electerm-data
npm config set legacy-peer-deps true
npm install
npm run build
nohup node src/app/app.js > /var/log/electerm-web.log 2>&1 &
EOF
}

# ===== 配置 Nginx =====
configure_nginx() {
  log_info "配置 Nginx..."
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP << 'EOF'
rm -f /etc/nginx/sites-enabled/default
cat > /etc/nginx/sites-available/electerm << 'NGINX'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:5580;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/electerm /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
EOF
}

# ===== 主函数 =====
main() {
  echo "========================================="
  echo "  electerm 一键部署脚本"
  echo "========================================="
  
  check_deps
  install_base
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
  echo "测试命令:"
  echo "  curl http://$SERVER_IP:3000/health"
  echo "  curl http://$SERVER_IP:3000/api/info"
}

main "$@"
