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
- **数据导出/导入** - 支持备份和迁移

### 🎨 UI 优化
- **现代深色主题** - Catppuccin Mocha 风格
- **响应式设计** - 完美支持移动端
- **深色/浅色模式** - 跟随系统或手动切换
- **管理后台** - 实时监控面板

### 🛠️ 高级功能
- **速率限制** - 防止 API 滥用
- **Gzip 压缩** - 减少传输体积 70%
- **内存缓存** - 提升响应速度
- **操作日志** - 审计追踪
- **健康检查** - 自动告警和恢复

## 快速开始

### 一键部署 (推荐)

```bash
# 克隆项目
git clone https://github.com/125540947/electerm-optimization.git
cd electerm-optimization/scripts

# 运行部署脚本
chmod +x deploy-enhanced.sh
./deploy-enhanced.sh
```

### 手动部署

```bash
# 1. 安装依赖
apt-get update && apt-get install -y nodejs npm nginx git

# 2. 部署同步服务
cd /opt/electerm-sync
npm install express jsonwebtoken basic-auth cors compression uuid
pm2 start server.js --name electerm-sync

# 3. 部署 Web 服务
cd /opt/electerm-web
npm install && npm run build
pm2 start "node src/app/app.js" --name electerm-web
```

## 项目结构

```
electerm-optimization/
├── scripts/              # 部署脚本
│   ├── deploy-enhanced.sh   # 增强版一键部署
│   ├── deploy-all.sh        # 完整部署
│   ├── install-sync-server.sh  # 服务安装
│   ├── backup-sync.sh       # 备份脚本
│   ├── health-check.sh      # 健康检查
│   └── monitor.sh           # 监控脚本
├── server/               # 同步服务端
│   ├── server.js           # 基础版
│   ├── server-enhanced.js  # 增强版
│   ├── server-v1.5.js      # v1.5.0 最新版
│   └── encryption.js       # 加密模块
├── ui/                   # UI 主题
│   ├── modern-theme.css    # 现代主题
│   ├── enhanced-theme.css # 增强主题
│   ├── admin-marix.html    # 管理后台
│   ├── monitor.html        # 监控面板
│   └── login.html          # 登录页面
├── sync/                 # 同步客户端
│   ├── webdav-sync.js     # WebDAV 同步
│   ├── sync-panel.js      # 同步面板
│   ├── advanced-sync.js   # 高级功能
│   ├── config-generator.js # 配置生成
│   └── tester.js           # 测试工具
└── docs/                 # 文档
    ├── API.md             # API 完整文档
    ├── INSTALLATION.md    # 安装指南
    └── ...
```

## 新增功能 (v1.5.0)

### API 端点
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/export` | 导出用户数据 |
| POST | `/api/import` | 导入用户数据 |
| GET | `/api/admin/logs` | 操作日志 |
| GET | `/api/admin/stats` | 服务器统计 |

### 管理脚本
```bash
# 备份数据
./scripts/backup-sync.sh backup admin password

# 恢复数据
./scripts/backup-sync.sh restore backup.json admin password

# 健康检查
./scripts/health-check.sh
```

## API 文档

### 认证

```bash
# 注册用户
curl -X POST http://82.158.225.97:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'

# 登录
curl -X POST http://82.158.225.97:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'
```

### 同步

```bash
# 获取数据
curl http://82.158.225.97:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN'

# 保存数据
curl -X PUT http://82.158.225.97:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"version":1,"data":{...}}'
```

### 导出/导入

```bash
# 导出
curl http://82.158.225.97:3000/api/export \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -o backup.json

# 导入 (覆盖)
curl -X POST http://82.158.225.97:3000/api/import \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"data":{...},"merge":false}'

# 导入 (合并)
curl -X POST http://82.158.225.97:3000/api/import \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"data":{...},"merge":true}'
```

### 监控

```bash
# 服务状态
curl http://82.158.225.97:3000/health

# 服务器信息
curl http://82.158.225.97:3000/api/info
```

## 已部署服务器

- **Web**: http://82.158.225.97
- **Sync**: http://82.158.225.97:3000
- **管理后台**: http://82.158.225.97/admin-marix.html
- **监控面板**: http://82.158.225.97/monitor.html

## 技术栈

- **后端**: Node.js 22, Express, JWT
- **前端**: React, Ant Design
- **存储**: JSON 文件 (可扩展 SQLite)
- **部署**: PM2, Nginx

## 许可证

MIT License