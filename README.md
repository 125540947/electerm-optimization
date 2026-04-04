# electerm-optimization

> electerm-web 优化项目 - 包含 WebDAV 同步、自定义服务器同步、现代 UI 主题、远程桌面

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
- **操作日志** - 审计追踪

### 🎨 UI 优化
- **现代深色主题** - Catppuccin Mocha 风格
- **响应式设计** - 完美支持移动端
- **深色/浅色模式** - 跟随系统或手动切换
- **管理后台** - 实时监控面板

### 🖥️ 远程桌面
- **RDP 远程桌面** - Windows/Linux 远程控制
- **VNC 远程桌面** - Linux/macOS 远程控制
- **键盘/鼠标事件** - 完整远程控制
- **剪贴板共享** - 跨设备复制粘贴

### 🛠️ 开发工具
- **代码编辑器** - 语法高亮、多语言支持
- **文件管理器** - 双面板、压缩解压、权限修改
- **数据库客户端** - MySQL/PostgreSQL/MongoDB/Redis
- **网络诊断工具** - DNS/Ping/端口检测
- **框架安装器** - Laravel/WordPress/Express 等

### 🛡️ 高级功能
- **速率限制** - 防止 API 滥用
- **Gzip 压缩** - 减少传输体积 70%
- **内存缓存** - 提升响应速度
- **健康检查** - 自动告警和恢复
- **备份脚本** - 自动数据备份

## 快速开始

### 一键部署 (推荐)

```bash
git clone https://github.com/125540947/electerm-optimization.git
cd electerm-optimization/scripts
chmod +x deploy-enhanced.sh
./deploy-enhanced.sh
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
│   ├── enhanced-theme.css  # 增强主题
│   ├── admin-marix.html     # 管理后台
│   ├── monitor.html        # 监控面板
│   └── login.html           # 登录页面
├── sync/                 # 同步客户端
│   ├── webdav-sync.js      # WebDAV 同步
│   ├── sync-panel.js       # 同步面板
│   ├── advanced-sync.js    # 高级功能
│   ├── code-editor.js      # 代码编辑器
│   ├── file-manager.js     # 文件管理器
│   ├── enhanced-file-manager.js  # 增强文件管理器
│   ├── database-client.js  # 数据库客户端
│   ├── network-tools.js    # 网络诊断工具
│   ├── rdp-client.js       # RDP 远程桌面
│   ├── vnc-client.js       # VNC 远程桌面
│   ├── lan-tools.js        # 局域网工具
│   ├── framework-installer.js  # 框架安装器
│   └── tester.js           # 测试工具
└── docs/                 # 文档
    ├── API.md             # API 完整文档
    ├── SECURITY.md        # 安全加固指南
    ├── TROUBLESHOOTING.md # 故障排查指南
    ├── COMPARISON.md      # 项目对比
    └── ...
```

## 已部署服务器

> 可自行部署到任意服务器

```bash
git clone https://github.com/125540947/electerm-optimization.git
cd electerm-optimization/scripts
chmod +x deploy-enhanced.sh
./deploy-enhanced.sh
```

## 技术栈

- **后端**: Node.js 22, Express, JWT
- **前端**: React, Ant Design, xterm.js
- **存储**: JSON 文件 (可扩展 SQLite)
- **部署**: PM2, Nginx
- **安全**: Argon2id, AES-256-GCM

## 许可证

MIT License