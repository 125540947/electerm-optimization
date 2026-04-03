#!/bin/bash
# electerm-sync-server 一键搭建脚本
# 支持系统: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

set -e

# 配置
PORT=3000
DATA_DIR="/opt/electerm-sync"
SERVICE_NAME="electerm-sync"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root
if [ "$EUID" -ne 0 ]; then
  log_error "请使用 root 用户运行此脚本"
  exit 1
fi

# 检测系统
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
  else
    log_error "无法检测操作系统"
    exit 1
  fi
  log_info "检测到系统: $OS $VERSION"
}

# 安装 Node.js
install_nodejs() {
  if command -v node &> /dev/null; then
    log_info "Node.js 已安装: $(node --version)"
    return
  fi
  
  log_info "安装 Node.js 22.x..."
  
  case $OS in
    ubuntu|debian)
      curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
      apt-get install -y nodejs
      ;;
    centos|rhel)
      curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
      yum install -y nodejs
      ;;
    *)
      log_error "不支持的操作系统"
      exit 1
      ;;
  esac
  
  log_info "Node.js 安装完成: $(node --version)"
}

# 创建应用目录
create_dirs() {
  log_info "创建应用目录..."
  mkdir -p "$DATA_DIR/data"
  mkdir -p "$DATA_DIR/logs"
  mkdir -p /var/log/$SERVICE_NAME
}

# 创建应用配置
create_app() {
  log_info "创建应用文件..."
  
  cat > "$DATA_DIR/package.json" << 'EOF'
{
  "name": "electerm-sync-server",
  "version": "1.0.0",
  "description": "Electerm 自定义同步服务器",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "basic-auth": "^2.0.1",
    "winston": "^3.11.0",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5"
  }
}
EOF

  cat > "$DATA_DIR/server.js" << 'EOF'
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const basicAuth = require('basic-auth');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DATA_DIR = process.env.DATA_DIR || './data';

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 简单日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Basic Auth 中间件
const auth = (req, res, next) => {
  const credentials = basicAuth(req);
  
  if (!credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Electerm Sync"');
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
    return res.status(401).json({ error: 'Invalid token' });
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

// API: 获取用户列表 (管理员)
app.get('/api/admin/users', auth, (req, res) => {
  const usersFile = path.join(DATA_DIR, 'users.json');
  
  if (!fs.existsSync(usersFile)) {
    return res.json([]);
  }
  
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  res.json(Object.keys(users).map(id => ({ id, updated: users[id].updated })));
});

// API: 注册用户
app.post('/api/register', (req, res) => {
  const { userId, password } = req.body;
  
  if (!userId || !password) {
    return res.status(400).json({ error: 'Missing userId or password' });
  }
  
  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = {};
  
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }
  
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
  res.json({ success: true, token });
});

// API: 登录
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  
  const usersFile = path.join(DATA_DIR, 'users.json');
  
  if (!fs.existsSync(usersFile)) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  
  if (!users[userId] || users[userId].password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  users[userId].updated = Date.now();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  
  const token = generateToken(userId);
  res.json({ success: true, token });
});

// API: 获取同步数据
app.get('/api/sync', verifyJwt, (req, res) => {
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  
  if (!fs.existsSync(userFile)) {
    return res.json({ version: 0, data: null });
  }
  
  const data = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  res.json(data);
});

// API: 保存同步数据
app.put('/api/sync', verifyJwt, (req, res) => {
  const { version, data } = req.body;
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  
  let existingData = { version: 0, updated: 0, data: null };
  
  if (fs.existsSync(userFile)) {
    existingData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  }
  
  // 版本检查
  if (version < existingData.version) {
    return res.json({
      success: false,
      error: 'Version conflict',
      serverVersion: existingData.version,
      serverData: existingData
    });
  }
  
  const newData = {
    version: version || existingData.version + 1,
    updated: Date.now(),
    data
  };
  
  fs.writeFileSync(userFile, JSON.stringify(newData, null, 2));
  
  res.json({ success: true, version: newData.version });
});

// API: 删除用户数据
app.delete('/api/sync', verifyJwt, (req, res) => {
  const userFile = path.join(DATA_DIR, `${req.userId}.json`);
  
  if (fs.existsSync(userFile)) {
    fs.unlinkSync(userFile);
  }
  
  res.json({ success: true });
});

// 静态文件服务 (可选)
app.use(express.static('public'));

// 启动服务器
app.listen(PORT, () => {
  console.log(`Electerm Sync Server 运行在 http://0.0.0.0:${PORT}`);
  console.log(`数据目录: ${DATA_DIR}`);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
EOF

  cat > "$DATA_DIR/.env" << EOF
PORT=3000
DATA_DIR=$DATA_DIR/data
JWT_SECRET=$(uuidgen)
EOF

  # PM2 配置
  cat > "$DATA_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'electerm-sync',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATA_DIR: './data'
    },
    env_file: '.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    log_file: '/var/log/electerm-sync/combined.log',
    out_file: '/var/log/electerm-sync/out.log',
    error_file: '/var/log/electerm-sync/error.log'
  }]
};
EOF
}

# 配置防火墙
configure_firewall() {
  log_info "配置防火墙..."
  
  if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow $PORT/tcp
    log_info "防火墙已配置 (UFW)"
  elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=$PORT/tcp
    firewall-cmd --reload
    log_info "防火墙已配置 (firewalld)"
  else
    log_warn "未检测到防火墙工具，跳过"
  fi
}

# 安装 PM2 并启动
install_pm2() {
  log_info "安装 PM2..."
  
  if command -v pm2 &> /dev/null; then
    log_info "PM2 已安装"
  else
    npm install -g pm2
  fi
}

# 启动服务
start_service() {
  log_info "安装依赖并启动服务..."
  
  cd "$DATA_DIR"
  npm install --production
  
  # 启动服务
  pm2 start ecosystem.config.js
  pm2 save
  
  log_info "服务已启动!"
}

# 生成客户端配置
show_client_config() {
  echo ""
  echo "========================================"
  echo "         安装完成!"
  echo "========================================"
  echo ""
  echo "服务端信息:"
  echo "  地址: http://你的服务器IP:$PORT"
  echo ""
  echo "使用方法:"
  echo "  1. 注册用户:"
  echo "     curl -X POST http://localhost:$PORT/api/register \\"
  echo "       -H 'Content-Type: application/json' \\"
  echo "       -d '{\"userId\":\"your-user\",\"password\":\"your-pass\"}'"
  echo ""
  echo "  2. 登录获取 Token:"
  echo "     curl -X POST http://localhost:$PORT/api/login \\"
  echo "       -H 'Content-Type: application/json' \\"
  echo "       -d '{\"userId\":\"your-user\",\"password\":\"your-pass\"}'"
  echo ""
  echo "  3. 同步数据 (PUT):"
  echo "     curl -X PUT http://localhost:$PORT/api/sync \\"
  echo "       -H 'Authorization: Bearer YOUR_TOKEN' \\"
  echo "       -H 'Content-Type: application/json' \\"
  echo "       -d '{\"version\":1,\"data\":{...}}'"
  echo ""
  echo "  4. 获取数据 (GET):"
  echo "     curl http://localhost:$PORT/api/sync \\"
  echo "       -H 'Authorization: Bearer YOUR_TOKEN'"
  echo ""
  echo "常用命令:"
  echo "  查看状态: pm2 status"
  echo "  查看日志: pm2 logs electerm-sync"
  echo "  重启服务: pm2 restart electerm-sync"
  echo "========================================"
}

# 主函数
main() {
  log_info "开始安装 electerm-sync-server..."
  
  detect_os
  install_nodejs
  create_dirs
  create_app
  configure_firewall
  install_pm2
  start_service
  show_client_config
}

main "$@"
