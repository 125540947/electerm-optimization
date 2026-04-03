# 自建同步服务器

本文档介绍如何自建 electerm-sync-server。

## 为什么自建服务器

- **数据隐私** - 数据存在自己的服务器
- **完全控制** - 不依赖第三方服务
- **自定义功能** - 可根据需要扩展
- **无限制** - 不受服务商限制

## 服务器要求

| 项目 | 最低 | 推荐 |
|------|------|------|
| 系统 | Ubuntu 20.04 | Ubuntu 22.04 |
| CPU | 1 核 | 2 核 |
| 内存 | 512MB | 1GB |
| 硬盘 | 1GB | 10GB |
| 带宽 | 1Mbps | 5Mbps |
| 公网 IP | 需要 | 固定 IP 最佳 |

## 快速部署

### 方式一: 一键脚本

```bash
wget -qO- https://raw.githubusercontent.com/125540947/electerm-optimization/main/scripts/install-sync-server.sh | sudo bash
```

### 方式二: Docker

```bash
mkdir -p electerm-sync && cd electerm-sync
cat > docker-compose.yml << 'EOF'
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
      - JWT_SECRET=change-this-in-production
EOF

docker-compose up -d
```

---

## 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3000 |
| DATA_DIR | 数据目录 | ./data |
| JWT_SECRET | JWT 密钥 | (必需) |

### JWT_SECRET 生成

```bash
# 方法 1: openssl
openssl rand -hex 32

# 方法 2: uuid
uuidgen

# 方法 3: node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API 文档

### 认证

#### 注册用户

```http
POST /api/register
Content-Type: application/json

{
  "userId": "your-user",
  "password": "your-password"
}
```

**响应:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 登录

```http
POST /api/login
Content-Type: application/json

{
  "userId": "your-user",
  "password": "your-password"
}
```

**响应:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 同步

#### 获取数据

```http
GET /api/sync
Authorization: Bearer <token>
```

**响应:**
```json
{
  "version": 1,
  "updated": 1704067200000,
  "data": {
    "bookmarks": [...],
    "themes": [...],
    "quickCommands": [...],
    "settings": {...}
  }
}
```

#### 保存数据

```http
PUT /api/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": 2,
  "data": {
    "bookmarks": [...],
    "themes": [...],
    "quickCommands": [...],
    "settings": {...}
  }
}
```

**响应:**
```json
{
  "success": true,
  "version": 2
}
```

#### 删除数据

```http
DELETE /api/sync
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true
}
```

### 管理

#### 修改密码

```http
POST /api/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "old-pass",
  "newPassword": "new-pass"
}
```

**响应:**
```json
{
  "success": true,
  "token": "new-token"
}
```

---

## 安全配置

### 1. 强制 HTTPS

使用 Nginx 反向代理 + SSL 证书:

```nginx
server {
    listen 443 ssl http2;
    server_name sync.your-domain.com;

    ssl_certificate /etc/ssl/certs/your.crt;
    ssl_certificate_key /etc/ssl/private/your.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. IP 白名单

在 server.js 中添加:

```javascript
const ALLOWED_IPS = ['127.0.0.1', '192.168.1.0/24'];

app.use((req, res, next) => {
  const clientIP = req.ip;
  if (!ALLOWED_IPS.some(ip => 
    clientIP === ip || clientIP.startsWith(ip.replace('/24', ''))
  )) {
    return res.status(403).json({ error: 'IP not allowed' });
  }
  next();
});
```

### 3. 速率限制

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制100次
});
app.use('/api/', limiter);
```

---

## 备份与恢复

### 备份

```bash
# 备份数据目录
tar -czf electerm-sync-backup-$(date +%Y%m%d).tar.gz /opt/electerm-sync/data/

# 或 rsync
rsync -avz /opt/electerm-sync/data/ backup-server:/backup/electerm-sync/
```

### 恢复

```bash
# 解压恢复
tar -xzf electerm-sync-backup-20240101.tar.gz -C /

# 重启服务
pm2 restart electerm-sync
```

---

## 监控

### PM2 监控

```bash
pm2 monit
```

### 日志管理

```bash
# 查看实时日志
pm2 logs electerm-sync

# 清理日志
pm2 flush
```

---

## 故障排查

### 服务启动失败

```bash
# 检查端口
netstat -tlnp | grep 3000

# 检查日志
pm2 logs electerm-sync --err

# 检查配置
cat /opt/electerm-sync/.env
```

### 无法连接

```bash
# 检查防火墙
sudo ufw status

# 检查服务状态
pm2 status
pm2 restart electerm-sync
```

### Token 过期

- 默认 30 天过期
- 重新登录获取新 Token

---

## 下一步

- [安装指南](INSTALLATION.md)
- [WebDAV 配置](WEBDAV_SETUP.md)
- [问题排查](SYNC_TROUBLESHOOTING.md)
