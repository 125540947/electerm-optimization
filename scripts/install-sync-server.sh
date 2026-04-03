#!/bin/bash
# electerm-sync-server 一键搭建脚本 v2.0
# 支持系统: Ubuntu / Debian / CentOS / RHEL / Fedora / Rocky / AlmaLinux / Amazon Linux

set -e

# 配置
PORT=${PORT:-3000}
DATA_DIR="/opt/electerm-sync"
SERVICE_NAME="electerm-sync"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP $1/$2]${NC} $3"; }

# 打印 banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║          electerm-sync-server 安装脚本 v2.0                   ║"
    echo "║                                                               ║"
    echo "║          自动同步服务器 - 支持 WebDAV/自定义服务器           ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_NAME=$NAME
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/centos-release ]; then
        OS="centos"
        OS_NAME="CentOS"
        OS_VERSION=$(grep -oP '\d+' /etc/centos-release | head -1)
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
        OS_NAME="Red Hat"
        OS_VERSION=$(grep -oP '\d+' /etc/redhat-release | head -1)
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    # 标准化系统名称
    case $OS in
        ubuntu) OS_FAMILY="debian" ;;
        debian) OS_FAMILY="debian" ;;
        centos) OS_FAMILY="rhel" ;;
        rhel) OS_FAMILY="rhel" ;;
        fedora) OS_FAMILY="rhel" ;;
        rocky) OS_FAMILY="rhel" ;;
        alma*) OS_FAMILY="rhel" ;;
        amazon) OS_FAMILY="rhel" ;;
        *) OS_FAMILY="$OS" ;;
    esac
    
    log_info "检测到系统: ${BOLD}${OS_NAME}${NC} ${OS_VERSION} (${OS_FAMILY})"
}

# 检测系统架构
detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) ARCH="x64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        armv7l) ARCH="armv7l" ;;
        *) log_warn "未知的架构: $ARCH" ;;
    esac
    log_info "系统架构: ${ARCH}"
}

# 检测是否以 root 运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户运行此脚本"
        echo -e "用法: ${YELLOW}sudo ./install.sh${NC}"
        exit 1
    fi
    log_success "以 root 权限运行"
}

# 检测端口是否被占用
check_port() {
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        log_warn "端口 $PORT 已被占用，尝试查找可用端口..."
        for ((i=3001; i<=3999; i++)); do
            if ! netstat -tuln 2>/dev/null | grep -q ":$i "; then
                PORT=$i
                log_info "使用端口: $PORT"
                break
            fi
        done
    fi
    log_success "端口 $PORT 可用"
}

# 安装 Node.js
install_nodejs() {
    log_step "1" "6" "安装 Node.js 22.x"
    
    # 检查是否已安装
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            log_success "Node.js 版本满足要求"
            return 0
        fi
    fi
    
    log_info "安装 Node.js 22.x..."
    
    case $OS_FAMILY in
        debian)
            curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
            apt-get install -y nodejs
            ;;
        rhel)
            curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
            yum install -y nodejs
            ;;
        *)
            log_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac
    
    log_success "Node.js 安装完成: $(node --version)"
}

# 创建应用目录和文件
create_app() {
    log_step "2" "6" "创建应用目录"
    
    mkdir -p "$DATA_DIR/data"
    mkdir -p "$DATA_DIR/logs"
    mkdir -p /var/log/$SERVICE_NAME
    
    log_success "目录创建完成: $DATA_DIR"
    
    # 创建 package.json
    log_step "3" "6" "创建应用文件"
    
    cat > "$DATA_DIR/package.json" << 'EOF'
{
  "name": "electerm-sync-server",
  "version": "1.1.0",
  "description": "Electerm 自定义同步服务器 - 支持 WebDAV/自定义服务器",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["electerm", "ssh", "sync", "webdav"],
  "author": "electerm-optimization",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "basic-auth": "^2.0.1",
    "winston": "^3.11.0",
    "cors": "^2.8.5"
  }
}
EOF

    # 复制 server.js (如果不存在)
    if [ ! -f "$DATA_DIR/server.js" ]; then
        # 内联服务代码
        cat > "$DATA_DIR/server.js" << 'SERVEREOF'
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const basicAuth = require('basic-auth');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
const DATA_DIR = process.env.DATA_DIR || './data';

app.use(cors());
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
app.get('/api/info', (req, res) => res.json({ version: '1.1.0', name: 'electerm-sync-server' }));

app.post('/api/register', (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'Missing userId or password' });
  
  const usersFile = path.join(DATA_DIR, 'users.json');
  let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : {};
  
  if (users[userId]) return res.status(400).json({ error: 'User already exists' });
  
  users[userId] = { password, created: Date.now(), updated: Date.now() };
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  
  res.json({ success: true, token: generateToken(userId) });
});

app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  const usersFile = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersFile)) return res.status(401).json({ error: 'User not found' });
  
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
  console.log(`  electerm-sync-server v1.1.0`);
  console.log(`  Running on http://0.0.0.0:${PORT}`);
  console.log(`  Data directory: ${DATA_DIR}`);
  console.log(`========================================`);
});

process.on('SIGINT', () => { console.log('\nShutting down...'); process.exit(0); });
SERVEREOF
    fi
    
    # 创建 .env 文件
    cat > "$DATA_DIR/.env" << EOF
PORT=$PORT
DATA_DIR=$DATA_DIR/data
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || uuidgen)
EOF

    # 创建 PM2 配置
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
    error_file: '/var/log/electerm-sync/error.log',
    time: true
  }]
};
EOF

    log_success "应用文件创建完成"
}

# 安装依赖并启动
install_and_start() {
    log_step "4" "6" "安装依赖"
    
    cd "$DATA_DIR"
    npm install --production
    
    log_success "依赖安装完成"
    
    # 安装 PM2
    log_step "5" "6" "配置进程管理"
    
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # 启动服务
    log_step "6" "6" "启动服务"
    
    pm2 kill 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    # 设置开机自启
    pm2 startup 2>/dev/null || true
    
    log_success "服务已启动: pm2 status electerm-sync"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    case $OS_FAMILY in
        debian)
            if command -v ufw &> /dev/null; then
                ufw --force enable 2>/dev/null || true
                ufw allow $PORT/tcp 2>/dev/null || true
                ufw allow 80/tcp 2>/dev/null || true
                ufw allow 443/tcp 2>/dev/null || true
                log_success "防火墙已配置 (UFW)"
            fi
            ;;
        rhel)
            if command -v firewall-cmd &> /dev/null; then
                firewall-cmd --permanent --add-port=$PORT/tcp 2>/dev/null || true
                firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
                firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
                firewall-cmd --reload 2>/dev/null || true
                log_success "防火墙已配置 (firewalld)"
            elif command -v ufw &> /dev/null; then
                ufw --force enable 2>/dev/null || true
                ufw allow $PORT/tcp 2>/dev/null || true
                log_success "防火墙已配置 (UFW)"
            fi
            ;;
    esac
}

# 打印安装完成信息
print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🎉 安装完成!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BOLD}服务地址:${NC}    http://localhost:$PORT"
    echo -e "  ${BOLD}数据目录:${NC}    $DATA_DIR/data"
    echo -e "  ${BOLD}日志目录:${NC}    /var/log/$SERVICE_NAME"
    echo ""
    echo -e "  ${YELLOW}常用命令:${NC}"
    echo -e "    查看状态:  ${CYAN}pm2 status${NC}"
    echo -e "    查看日志:  ${CYAN}pm2 logs electerm-sync${NC}"
    echo -e "    重启服务:  ${CYAN}pm2 restart electerm-sync${NC}"
    echo -e "    停止服务:  ${CYAN}pm2 stop electerm-sync${NC}"
    echo ""
    echo -e "  ${YELLOW}首次使用:${NC}"
    echo -e "    1. 注册用户:"
    echo -e "       ${CYAN}curl -X POST http://localhost:$PORT/api/register \\${NC}"
    echo -e "       ${CYAN}  -H 'Content-Type: application/json' \\${NC}"
    echo -e "       ${CYAN}  -d '{\"userId\":\"your-user\",\"password\":\"your-pass\"}'${NC}"
    echo ""
    echo -e "    2. 登录获取 Token:"
    echo -e "       ${CYAN}curl -X POST http://localhost:$PORT/api/login \\${NC}"
    echo -e "       ${CYAN}  -H 'Content-Type: application/json' \\${NC}"
    echo -e "       ${CYAN}  -d '{\"userId\":\"your-user\",\"password\":\"your-pass\"}'${NC}"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# 卸载函数
uninstall() {
    log_warn "开始卸载..."
    
    pm2 delete electerm-sync 2>/dev/null || true
    
    case $OS_FAMILY in
        debian)
            ufw delete allow $PORT/tcp 2>/dev/null || true
            ;;
        rhel)
            firewall-cmd --permanent --remove-port=$PORT/tcp 2>/dev/null || true
            firewall-cmd --reload 2>/dev/null || true
            ;;
    esac
    
    log_info "是否删除数据目录? (y/N)"
    read -r confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        rm -rf "$DATA_DIR"
        rm -rf /var/log/$SERVICE_NAME
        log_info "数据目录已删除"
    fi
    
    log_success "卸载完成"
}

# 主函数
main() {
    print_banner
    
    # 检查参数
    case "${1:-}" in
        -h|--help)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  -h, --help     显示帮助"
            echo "  -u, --uninstall 卸载"
            echo "  -r, --restart  重启服务"
            echo "  -s, --status   查看状态"
            echo "  -l, --logs     查看日志"
            exit 0
            ;;
        -u|--uninstall)
            uninstall
            exit 0
            ;;
        -r|--restart)
            pm2 restart electerm-sync
            exit 0
            ;;
        -s|--status)
            pm2 status electerm-sync
            exit 0
            ;;
        -l|--logs)
            pm2 logs electerm-sync
            exit 0
            ;;
    esac
    
    check_root
    detect_os
    detect_arch
    check_port
    install_nodejs
    create_app
    install_and_start
    configure_firewall
    print_summary
}

main "$@"
