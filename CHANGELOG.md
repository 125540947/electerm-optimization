# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-04-04

### 新增
- RDP 远程桌面客户端 (`sync/rdp-client.js`) - Windows/Linux 远程桌面
- VNC 远程桌面客户端 (`sync/vnc-client.js`) - Linux/macOS 远程桌面
- 支持键盘/鼠标事件、剪贴板、全屏模式

### 新增 (之前遗漏)
- 项目对比分析文档 (`docs/COMPARISON.md`, `docs/COMPARISON_DETAIL.md`, `docs/COMPARISON_FINAL.md`)
- 详细功能对比 electerm-optimization vs Marix

---

## [1.7.0] - 2026-04-04

### 新增
- 完整功能对比表 (`docs/COMPARISON_FINAL.md`)
- 与 Marix 功能对比分析

### 已持平功能
- 文件管理: 双面板、权限修改、压缩解压、断点续传 ✅
- 代码编辑: 语法高亮、多标签、主题切换 ✅
- 批量选择、搜索过滤 ✅

---

## [1.6.2] - 2026-04-04

### 新增
- 增强文件管理器 (`sync/enhanced-file-manager.js`)
  - 多文件标签 (标签切换/新增/关闭)
  - 权限修改 (chmod 可视化配置)
  - 压缩/解压 (zip/tar.gz/7z)
  - 断点续传机制
  - 批量选择 (Ctrl+点击)
  - 搜索过滤

---

## [1.6.1] - 2026-04-04

### 新增
- 代码编辑器 (`sync/code-editor.js`)
  - 语法高亮
  - 多语言支持 (JavaScript, Python, PHP 等)
  - 深/浅主题切换
  - 格式化功能

- 基础文件管理器 (`sync/file-manager.js`)
  - 双面板文件浏览
  - 传输队列

---

## [1.6.0] - 2026-04-04

### 新增
- 网络诊断工具 (`sync/network-tools.js`)
  - DNS 查询
  - 端口检测
  - HTTP 检查
  - IP 黑名单检查

- 数据库客户端框架 (`sync/database-client.js`)
  - MySQL/PostgreSQL/MongoDB/Redis/SQLite 连接

- 局域网工具 (`sync/lan-tools.js`)
  - P2P 文件传输框架
  - 服务器配置加密分享

- 框架安装器 (`sync/framework-installer.js`)
  - Laravel, WordPress, Express, NestJS, Django 等

---

## [1.5.3] - 2026-04-04

### 新增
- 安全加固指南 (`docs/SECURITY.md`)
- 故障排查指南 (`docs/TROUBLESHOOTING.md`)
- 快速命令参考 (`docs/QUICK_COMMANDS.md`) - 更新
- Nginx 配置示例 (`nginx.conf`)
- 完善的 Docker 配置 (`docker-compose.yml`)

---

## [1.5.2] - 2026-04-04

### 新增
- 安全加固指南 (`docs/SECURITY.md`)
  - 防火墙配置
  - SSH 安全
  - HTTPS 配置
  - 紧急情况处理

- 故障排查指南 (`docs/TROUBLESHOOTING.md`)
  - 常见问题及解决方案
  - 错误码参考

- Nginx 配置 (`nginx.conf`)
- Docker 配置完善 (`docker-compose.yml`)

---

## [1.5.1] - 2026-04-04

### 新增
- 同步测试工具 (`sync/tester.js`) - 自动化测试同步功能
- 监控面板 (`ui/monitor.html`) - 实时监控服务状态
- 备份脚本 (`scripts/backup-sync.sh`) - 数据备份和恢复
- 健康检查脚本 (`scripts/health-check.sh`) - 自动告警和恢复
- 完整 API 文档 (`docs/API.md`)

### 增强
- README 文档更新 - 添加新功能说明和使用示例
- 管理后台连接 - 直接使用服务器 API

---

## [1.5.0] - 2026-04-04

### 新增
- 服务端 v1.5.0 (`server/server-v1.5.js`)
  - 数据导出/导入 (`/api/export`, `/api/import`)
  - 操作日志 (`/api/admin/logs`)
  - 服务器统计 (`/api/admin/stats`)
  - 内存缓存
  - 改进的速率限制

### 新增
- 增强部署脚本 (`scripts/deploy-enhanced.sh`)
- 完整 API 文档 (`docs/API.md`)
- 增强主题 (`ui/enhanced-theme.css`)

---

## [1.4.0] - 2026-04-03

### 新增
- 数据加密模块 (`server/encryption.js`) - AES-256-GCM
- 管理后台 (`ui/admin-panel.html`)
  - 实时服务器统计
  - 用户管理界面
  - 系统日志查看器
- Release notes v1.4.0

### 增强
- 服务器资源监控
- 用户管理

---

## [1.3.0] - 2026-04-03

### 新增
- 自动备份脚本 (`scripts/backup.sh`)
- Docker 部署支持 (`Dockerfile`, `docker-compose-full.yml`)
- API 客户端封装 (`sync/api-client.js`)
- 快捷命令参考 (`docs/QUICK_COMMANDS.md`)

### 增强
- 服务器监控脚本 (自动重启)
- 完整的部署自动化

---

## [1.2.0] - 2026-04-03

### 新增
- 增强同步服务端 (速率限制、压缩、缓存)
- 登录页面 UI (`ui/login.html`)
- 部署优化脚本
- 服务器加固脚本

### 增强
- 服务器安全加固
- Nginx 配置

---

## [1.1.0] - 2026-04-03

### 新增
- WebDAV 同步支持
- 自定义服务器同步
- 完整 Wiki 文档:
  - INSTALLATION.md
  - WEBDAV_SETUP.md
  - CUSTOM_SERVER.md
  - SYNC_TROUBLESHOOTING.md

### 增强
- 现代 UI 主题 (Catppuccin 风格)
- 响应式设计

---

## [1.0.0] - 2026-04-03

### 新增
- 初始版本发布
- WebDAV 同步模块
- 自定义服务器同步
- 现代 UI 主题
- 一键安装脚本
- 同步面板组件