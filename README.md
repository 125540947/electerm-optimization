# electerm-optimization

> electerm-web 优化项目 - 包含 WebDAV 同步、自定义服务器同步、现代 UI 主题

[![GitHub stars](https://img.shields.io/github/stars/125540947/electerm-optimization)](https://github.com/125540947/electerm-optimization)
[![License](https://img.shields.io/github/license/125540947/electerm-optimization)](LICENSE)

## 功能特性

### 🔄 同步功能
- **WebDAV 同步** - 支持坚果云、Nextcloud、阿里云盘、群晖 NAS
- **自定义服务器同步** - 自建 VPS 同步服务
- **端到端加密** - 可选数据加密传输
- **冲突自动解决** - 多种策略可选
- **离线缓存** - 网络不佳时自动缓存

### 🎨 UI 优化
- **现代深色主题** - Catppuccin Mocha 风格
- **响应式设计** - 完美支持移动端
- **深色/浅色模式** - 跟随系统或手动切换

### 🛠️ 高级功能
- **速率限制** - 防止 API 滥用
- **Gzip 压缩** - 减少传输体积 70%
- **性能监控** - 实时监控服务状态

## 快速开始

### 一键部署 (推荐)

```bash
# 克隆项目
git clone https://github.com/125540947/electerm-optimization.git
cd electerm-optimization/scripts

# 运行部署脚本
chmod +x deploy-all.sh
./deploy-all.sh
```

### 手动部署

```bash
# 1. 安装依赖
apt-get update && apt-get install -y nodejs npm nginx git

# 2. 部署同步服务
cd /opt/electerm-sync
npm install
pm2 start server.js --name electerm-sync

# 3. 部署 Web 服务
cd /opt/electerm-web
npm install && npm run build
node src/app/app.js
```

## 项目结构

```
electerm-optimization/
├── scripts/              # 部署脚本
│   ├── deploy-all.sh     # 一键部署
│   ├── deploy-optimization.sh
│   ├── install-sync-server.sh
│   ├── hardening.sh
│   └── monitor.sh        # 监控脚本
├── server/               # 同步服务端
│   ├── server.js
│   └── server-enhanced.js
├── ui/                   # UI 主题
│   ├── modern-theme.css
│   ├── clear-theme.css
│   ├── login.html
│   └── sync-settings-demo.html
├── sync/                 # 同步客户端
│   ├── webdav-sync.js
│   ├── sync-panel.js
│   ├── advanced-sync.js
│   └── config-generator.js
├── docs/                 # 文档
│   ├── INSTALLATION.md
│   ├── WEBDAV_SETUP.md
│   ├── CUSTOM_SERVER.md
│   ├── SYNC_TROUBLESHOOTING.md
│   └── OPTIMIZATION.md
└── docker-compose.yml
```

## API 文档

### 认证

```bash
# 注册用户
curl -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'

# 登录
curl -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'
```

### 同步

```bash
# 获取数据
curl http://localhost:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN'

# 保存数据
curl -X PUT http://localhost:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"version":1,"data":{...}}'
```

### 监控

```bash
# 服务状态
curl http://localhost:3000/api/info

# 健康检查
curl http://localhost:3000/health
```

## 已部署服务器

- **Web**: http://82.158.225.97
- **Sync**: http://82.158.225.97:3000

## 技术栈

- **后端**: Node.js 22, Express, JWT
- **前端**: React, Ant Design
- **存储**: JSON 文件 (可扩展 SQLite)
- **部署**: PM2, Nginx

## 许可证

MIT License
