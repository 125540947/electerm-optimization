# electerm-optimization

[![GitHub stars](https://img.shields.io/github/stars/125540947/electerm-optimization)](https://github.com/125540947/electerm-optimization/stargazers)
[![License](https://img.shields.io/github/license/125540947/electerm-optimization)](LICENSE)
[![Node.js](https://img.shields.io/node/v/22)](https://nodejs.org)

> electerm-web 优化项目 - WebDAV 同步、自定义服务器同步、现代 UI 主题

## 功能特性

### 🔄 同步功能
- **WebDAV 同步** - 支持坚果云、Nextcloud、阿里云盘、群晖 NAS 等
- **自定义服务器同步** - 自建 VPS 同步服务
- **端到端加密** - 可选数据加密传输
- **冲突自动解决** - 多种策略可选
- **离线缓存** - 网络不佳时自动缓存

### 🎨 UI 优化
- **现代深色主题** - Catppuccin Mocha 风格
- **响应式设计** - 完美支持移动端
- **深色/浅色模式** - 跟随系统或手动切换
- **现代化组件** - 美化的按钮、输入框、卡片

### 🛠️ 高级功能
- **增量同步** - 只同步变更部分
- **审计日志** - 记录所有操作
- **Webhook 通知** - 同步事件推送
- **速率限制** - 防止滥用

## 快速开始

### Docker 部署 (推荐)

```bash
# 克隆项目
git clone https://github.com/125540947/electerm-optimization.git
cd electerm-optimization

# 配置并启动
export JWT_SECRET=$(openssl rand -hex 32)
docker-compose up -d
```

### VPS 一键脚本

```bash
wget -qO- https://raw.githubusercontent.com/125540947/electerm-optimization/main/scripts/install-sync-server.sh | sudo bash
```

## 文档

- [📖 安装指南](docs/INSTALLATION.md)
- [☁️ WebDAV 配置](docs/WEBDAV_SETUP.md)
- [🖥️ 自建服务器](docs/CUSTOM_SERVER.md)
- [🔧 同步问题排查](docs/SYNC_TROUBLESHOOTING.md)
- [📚 完整用户指南](docs/USER_GUIDE.md)

## 项目结构

```
electerm-optimization/
├── scripts/           # 安装脚本
│   └── install-sync-server.sh
├── server/            # 同步服务端
│   ├── server.js
│   └── enhancements.js
├── ui/                # UI 主题
│   └── modern-theme.css
├── sync/              # 同步客户端
│   ├── webdav-sync.js
│   ├── sync-panel.js
│   └── advanced-sync.js
├── docker-compose.yml
└── docs/              # 文档
```

## 支持的同步方式

| 方式 | 说明 | 难度 |
|------|------|------|
| WebDAV | 坚果云/Nextcloud/阿里云盘 | ⭐ |
| 自建服务器 | VPS 自建 | ⭐⭐ |
| GitHub Gist | 官方支持 | ⭐ |
| Gitee | 官方支持 | ⭐ |

## 技术栈

- **后端**: Node.js 22, Express, JWT
- **前端**: Vanilla JS, CSS Variables
- **存储**: JSON 文件 (可扩展 SQLite)
- **部署**: Docker, PM2

## API

### 自建服务器 API

```bash
# 注册
curl -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'

# 登录
curl -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'

# 获取数据
curl http://localhost:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN'

# 保存数据
curl -X PUT http://localhost:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"version":1,"data":{...}}'
```

## 贡献

欢迎提交 Issue 和 PR！

## 许可证

MIT License
