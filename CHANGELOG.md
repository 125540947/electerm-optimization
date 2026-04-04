# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.1] - 2026-04-04

### Added
- 同步测试工具 (`sync/tester.js`) - 自动化测试同步功能
- 监控面板 (`ui/monitor.html`) - 实时监控服务状态
- 备份脚本 (`scripts/backup-sync.sh`) - 数据备份和恢复
- 健康检查脚本 (`scripts/health-check.sh`) - 自动告警和恢复
- 完整 API 文档 (`docs/API.md`)

### Enhanced
- README 文档更新 - 添加新功能说明和使用示例
- 管理后台连接 - 直接使用服务器 API

### Added
- New server version with API v1.5.0 (`server/server-v1.5.js`)
- Data export/import API endpoints (`/api/export`, `/api/import`)
- Admin operation logs (`/api/admin/logs`)
- Server statistics endpoint (`/api/admin/stats`)
- Enhanced deployment script (`scripts/deploy-enhanced.sh`)
- Complete API documentation (`docs/API.md`)
- Enhanced UI theme (`ui/enhanced-theme.css`)

### Enhanced
- Rate limiting with better error messages
- Memory caching with TTL
- Operation logging for audit
- Merge support for data import
- Better error handling with retry information

### Fixed
- Admin password handling in deployment scripts
- Version conflict detection improvements

### Added
- Data encryption module (`server/encryption.js`) with AES-256-GCM
- Admin dashboard (`ui/admin-panel.html`) with:
  - Real-time server stats (uptime, memory, users)
  - User management interface
  - System logs viewer
- Release notes for v1.4.0

### Enhanced
- Server resource monitoring
- User management

## [1.3.0] - 2026-04-03

### Added
- Auto backup script (`scripts/backup.sh`)
- Docker deployment support (`Dockerfile`, `docker-compose-full.yml`)
- API client wrapper (`sync/api-client.js`)
- Quick commands reference (`docs/QUICK_COMMANDS.md`)

### Enhanced
- Server monitoring script with auto-restart
- Complete deployment automation

## [1.2.0] - 2026-04-03

### Added
- Enhanced sync server with rate limiting, compression, and caching
- Login page UI (`ui/login.html`)
- Deploy optimization script
- Server hardening script

### Enhanced
- Server security加固
- Nginx configuration

## [1.1.0] - 2026-04-03

### Added
- WebDAV sync support
- Custom server sync
- Complete Wiki documentation:
  - INSTALLATION.md
  - WEBDAV_SETUP.md
  - CUSTOM_SERVER.md
  - SYNC_TROUBLESHOOTING.md

### Enhanced
- Modern UI theme (Catppuccin style)
- Responsive design

## [1.0.0] - 2026-04-03

### Added
- Initial release
- WebDAV sync module
- Custom server sync
- Modern UI theme
- One-click install script
- Sync panel component
