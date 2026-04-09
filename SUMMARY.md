# Electerm Web UI & Sync 优化

## 项目结构

```
electerm-optimization/
├── README.md                    # 项目说明
├── CONFIG.md                    # 配置指南
├── CHANGELOG.md                 # 更新日志
├── docker-compose.yml           # Docker 部署
├── docker-compose-full.yml      # 完整部署
├── nginx.conf                   # Nginx 配置
├── Dockerfile                   # Docker 镜像
│
├── docs/                        # 文档 (14 files)
│   ├── README.md               # 文档索引
│   ├── COMPARISON_FINAL.md     # 功能对比
│   └── ...
│
├── scripts/                     # 自动化脚本 (9 files)
│   ├── deploy-enhanced.sh      # 完整部署
│   ├── install-sync-server.sh  # 一键安装
│   ├── health-check.sh         # 健康检查
│   └── ...
│
├── server/                      # 服务器模块 (11 files)
│   ├── server-v1.5.js          # 主版本
│   ├── monitoring.js            # 监控
│   └── ...
│
├── sync/                       # 同步模块 (21 files)
│   ├── enhanced-file-manager.js
│   ├── sync-panel.js
│   ├── webdav-sync.js
│   └── ...
│
├── ui/                         # 前端界面 (10 files)
│   ├── cluster-manager.html
│   ├── modern-theme.css
│   └── ...
│
└── patch/                      # 补丁
    └── zh-cn-patch.js
```

## 核心功能

### ✅ WebDAV 同步
- 支持 Nextcloud、坚果云、阿里云盘
- 双向同步、冲突处理
- 自动同步定时任务

### ✅ 自建服务器
- 轻量级 Node.js 服务
- Basic Auth + JWT 认证
- 一键安装脚本

### ✅ UI 优化
- Catppuccin Mocha 风格
- CSS Variables 动态主题
- 响应式布局 (移动端)

### ✅ 远程连接
- RDP 远程桌面
- VNC 远程桌面
- SSH 终端
- 端口转发

### ✅ 工具集
- 框架安装器 (Laravel, WP, etc)
- 网络工具
- 局域网传输
- 数据库客户端
- Docker 管理

## 快速开始

### Docker 部署
```bash
docker-compose up -d
```

### VPS 一键安装
```bash
curl -o- https://raw.githubusercontent.com/your-repo/electerm-optimization/main/scripts/install-sync-server.sh | bash
```

### 使用同步面板
```javascript
const syncPanel = new SyncPanel(container, options);
```