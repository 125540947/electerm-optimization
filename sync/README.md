# Sync 模块说明

> 同步相关功能模块

## 核心模块

| 模块 | 说明 | 状态 |
|------|------|------|
| enhanced-file-manager.js | 增强文件管理器（双面板、权限、压缩） | ✅ 主用 |
| sync-panel.js | 同步面板 UI | ✅ 主用 |
| webdav-sync.js | WebDAV 同步 | ✅ 主用 |

## 远程连接

| 模块 | 说明 |
|------|------|
| rdp-client.js | RDP 远程桌面 |
| vnc-client.js | VNC 远程桌面 |
| ssh-terminal.js | SSH 终端 |
| port-forward.js | 端口转发 |

## 工具

| 模块 | 说明 |
|------|------|
| framework-installer | 框架安装器 (Laravel, WP, etc) |
| script-library.js | 脚本库 |
| network-tools.js | 网络工具 |
| lan-tools.js | 局域网工具 |
| code-editor.js | 代码编辑器 |
| tester.js | 测试工具 |
| task-scheduler.js | 任务调度 |

## 客户端

| 模块 | 说明 |
|------|------|
| database-client.js | 数据库客户端 |
| docker-manager.js | Docker 管理 |
| config-version.js | 配置版本管理 |
| api-client.js | API 客户端 |

## 关系

```
sync-panel.js (UI)
  ├── enhanced-file-manager.js (文件管理)
  ├── webdav-sync.js (WebDAV 同步)
  ├── rdp-client.js (RDP)
  ├── vnc-client.js (VNC)
  └── ...
```