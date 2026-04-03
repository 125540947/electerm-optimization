# 安装指南

本文档详细介绍 electerm-sync-server 的各种安装方式。

## 系统要求

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 系统 | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ | Ubuntu 22.04 |
| CPU | 1 核 | 2 核 |
| 内存 | 512MB | 1GB |
| 磁盘 | 1GB | 5GB |
| Node.js | 18.x | 22.x |

## 安装方式

### 方式一: Docker 部署 (推荐)

```bash
# 1. 克隆项目
git clone https://github.com/125540947/electerm-optimization.git
cd electerm-optimization

# 2. 配置环境变量
export JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" > .env

# 3. 启动服务
docker-compose up -d

# 4. 检查状态
docker-compose ps
```

#### docker-compose.yml 配置说明

```yaml
version: '3.8'
services:
  electerm-sync:
    image: node:22-alpine
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=3000
      - DATA_DIR=/app/data
      - JWT_SECRET=your-secret-key
```

#### 常用 Docker 命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新并重启
git pull && docker-compose build && docker-compose up -d
```

---

### 方式二: VPS 一键脚本

```bash
# Ubuntu/Debian
wget -qO- https://raw.githubusercontent.com/125540947/electerm-optimization/main/scripts/install-sync-server.sh | sudo bash

# 或
curl -o- https://raw.githubusercontent.com/125540947/electerm-optimization/main/scripts/install-sync-server.sh | sudo bash
```

脚本会自动完成:
- 检测系统环境
- 安装 Node.js 22
- 创建应用目录
- 配置 PM2 进程管理
- 设置防火墙
- 启动服务

---

### 方式三: 手动安装

#### 1. 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. 创建应用目录

```bash
sudo mkdir -p /opt/electerm-sync/data
sudo mkdir -p /opt/electerm-sync/logs
cd /opt/electerm-sync
```

#### 3. 复制服务端代码

从 GitHub 下载或复制 `server/server.js` 和 `package.json`:

```bash
# 创建 package.json
cat > package.json << 'EOF'
{
  "name": "electerm-sync-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "basic-auth": "^2.0.1",
    "cors": "^2.8.5",
    "uuid": "^9.0.1"
  }
}
EOF
```

#### 4. 安装依赖

```bash
npm install --production
```

#### 5. 配置环境变量

```bash
cat > .env << EOF
PORT=3000
DATA_DIR=./data
JWT_SECRET=$(openssl rand -hex 32)
EOF
```

#### 6. 使用 PM2 启动

```bash
sudo npm install -g pm2
pm2 start server.js --name electerm-sync
pm2 save
pm2 startup
```

---

### 方式四: Nginx 反向代理

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS
sudo yum install -y nginx
```

#### 2. 配置反向代理

```bash
sudo cat > /etc/nginx/sites-available/electerm-sync << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/electerm-sync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 方式五: SSL/HTTPS 配置

#### 使用 Let's Encrypt (免费)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com --register-unsafely-without-email

# 自动续期测试
sudo certbot renew --dry-run
```

#### 自定义 SSL 证书

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl.crt;
    ssl_certificate_key /path/to/ssl.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... 其他配置
    }
}
```

---

## 验证安装

### 检查服务状态

```bash
# Docker 方式
docker-compose ps

# PM2 方式
pm2 status
```

### 测试 API

```bash
# 健康检查
curl http://localhost:3000/health

# 服务器信息
curl http://localhost:3000/api/info
```

### 查看日志

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs electerm-sync

# 系统日志
tail -f /var/log/electerm-sync/combined.log
```

---

## 防火墙配置

```bash
# Ubuntu (UFW)
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 卸载

```bash
# Docker
docker-compose down -v
rm -rf electerm-optimization

# 手动安装
sudo pm2 delete electerm-sync
sudo rm -rf /opt/electerm-sync
```

---

## 下一步

- [WebDAV 配置](WEBDAV_SETUP.md)
- [自定义服务器](CUSTOM_SERVER.md)
- [问题排查](SYNC_TROUBLESHOOTING.md)
