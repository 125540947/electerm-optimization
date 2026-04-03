# electerm-web 完整使用指南

## 目录
- [快速开始](#快速开始)
- [同步服务器部署](#同步服务器部署)
- [WebDAV 配置](#webdav-配置)
- [客户端配置](#客户端配置)
- [UI 优化](#ui-优化)
- [常见问题](#常见问题)

---

## 快速开始

### 方式一: Docker 部署 (推荐)

```bash
# 1. 克隆或下载本项目
git clone https://github.com/your-username/electerm-optimization.git
cd electerm-optimization

# 2. 配置 JWT 密钥 (生产环境必须修改!)
export JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" > .env

# 3. 启动服务
docker-compose up -d

# 4. 检查状态
docker-compose ps
```

### 方式二: VPS 一键脚本

```bash
# Ubuntu/Debian
wget -qO- https://raw.githubusercontent.com/your-repo/main/scripts/install-sync-server.sh | sudo bash

# 或
curl -o- https://raw.githubusercontent.com/your-repo/main/scripts/install-sync-server.sh | sudo bash
```

---

## 同步服务器部署

### 服务器要求

| 项目 | 要求 |
|------|------|
| 系统 | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ |
| CPU | 1 核 |
| 内存 | 512MB+ |
| 端口 | 3000 (需开放) |

### 手动安装 (高级)

```bash
# 1. 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# 2. 创建目录
sudo mkdir -p /opt/electerm-sync/data
cd /opt/electerm-sync

# 3. 下载服务端代码 (或从本项目复制)
# 见下方 server.js

# 4. 安装依赖
npm install

# 5. 配置环境变量
cat > .env << EOF
PORT=3000
DATA_DIR=./data
JWT_SECRET=your-secret-key-change-this
EOF

# 6. 使用 PM2 启动
npm install -g pm2
pm2 start server.js --name electerm-sync
pm2 save
```

### Nginx 反向代理 (可选)

```nginx
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
    }
}
```

### SSL 配置 (可选)

使用 Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## WebDAV 配置

### 支持的 WebDAV 服务

#### 1. 坚果云
```
URL: https://dav.jianguoyun.com/dav/
用户名: 你的坚果云账号
密码: 你的坚果云密码
路径: /electerm/sync.json
```

#### 2. Nextcloud
```
URL: https://你的域名/remote.php/dav/files/用户名/
用户名: Nextcloud 用户名
密码: Nextcloud 密码
路径: /electerm/sync.json
```

#### 3. 阿里云盘 (通过 Alist)
```
URL: http://你的Alist地址/dav/
用户名: Alist 用户名
密码: Alist 密码
路径: /electerm/sync.json
```

#### 4. 群晖 NAS
```
URL: http://你的NAS地址:5005/remote.php/dav/files/用户名/
用户名: DSM 用户名
密码: DSM 密码
路径: /electerm/sync.json
```

#### 5. OwnCloud
```
URL: https://你的域名/remote.php/dav/files/用户名/
用户名: OwnCloud 用户名
密码: OwnCloud 密码
路径: /electerm/sync.json
```

---

## 客户端配置

### electerm-web 集成

#### 方法 1: 替换/合并同步面板代码

将 `sync/sync-panel.js` 和 `sync/webdav-sync.js` 的内容集成到你现有的同步逻辑中。

#### 方法 2: 油猴脚本 (临时方案)

```javascript
// 添加自定义同步选项到 UI
// 在同步设置页面添加 WebDAV 和自定义服务器选项
```

#### 方法 3: 修改源代码

```bash
# 克隆 electerm-web
git clone https://github.com/electerm/electerm-web.git
cd electerm-web

# 将同步模块复制到 src 目录
cp ../sync/webdav-sync.js src/
cp ../sync/sync-panel.js src/

# 修改同步相关代码添加新 provider
# 参考现有 GitHub/Gist 同步实现
```

---

## UI 优化

### 方式 1: CSS 覆盖

```html
<!-- 在 index.html 添加 -->
<link rel="stylesheet" href="modern-theme.css">
```

### 方式 2: 编译时集成

```bash
# 复制到项目
cp modern-theme.css electerm-web/src/styles/

# 修改入口文件引入
```

### 主题预览

| 主题 | 背景 | 文字 | 强调色 |
|------|------|------|--------|
| 深色 (默认) | #1e1e2e | #cdd6f4 | #89b4fa |
| 浅色 | #eff1f5 | #4c4f69 | #1e66f5 |

---

## 常见问题

### Q1: WebDAV 连接失败

**可能原因:**
- URL 不正确 (注意末尾斜杠)
- 用户名/密码错误
- 服务不支持 WebDAV PUT 方法

**解决方法:**
1. 确认 URL 格式正确
2. 尝试用其他 WebDAV 客户端测试
3. 检查服务商是否允许 PUT 请求

### Q2: 同步冲突

**可能原因:**
- 多设备同时修改
- 版本号不一致

**解决方法:**
- 默认保留最新版本
- 可手动导出合并

### Q3: 服务器无法启动

**检查:**
```bash
# 查看日志
pm2 logs electerm-sync

# 或 Docker
docker-compose logs electerm-sync

# 检查端口
netstat -tlnp | grep 3000
```

### Q4: 忘记 JWT_SECRET

**重置:**
```bash
# 生成新的
openssl rand -hex 32

# 更新
pm2 restart electerm-sync
```

### Q5: 数据备份

```bash
# 备份
tar -czf electerm-sync-backup.tar.gz /opt/electerm-sync/data/

# 恢复
tar -xzf electerm-sync-backup.tar.gz -C /
```

---

## API 参考

### 认证

#### 注册
```bash
curl -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'
```

响应:
```json
{"success":true,"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

#### 登录
```bash
curl -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'
```

### 同步

#### 获取数据
```bash
curl http://localhost:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

响应:
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
```bash
curl -X PUT http://localhost:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "version": 2,
    "data": {
      "bookmarks": [...],
      "themes": [...],
      "quickCommands": [...],
      "settings": {...}
    }
  }'
```

---

## 安全建议

1. ✅ 生产环境使用 HTTPS
2. ✅ 修改默认 JWT_SECRET
3. ✅ 使用强密码
4. ✅ 配置防火墙只开放 80/443
5. ✅ 定期备份数据
6. ✅ 启用失败告警

---

## 技术支持

- [GitHub Issues](https://github.com/your-repo/electerm-optimization/issues)
- [Wiki](https://github.com/your-repo/electerm-optimization/wiki)
- Email: your-email@example.com
