# Server 目录说明

> 各版本服务器文件说明

## 当前版本

**主版本: `server-v1.5.js`** (最新, 2026-04-04)

## 文件说明

| 文件 | 版本 | 状态 | 说明 |
|------|------|------|------|
| server-v1.5.js | v1.5.0 | ✅ 主版本 | 完整功能，速率限制、缓存、API版本控制 |
| server-enhanced.js | v1.4 | ⚠️ 已废弃 | 旧增强版，功能被 v1.5 覆盖 |
| server.js | v1.3 | ⚠️ 已废弃 | 原始版本 |
| enhancements.js | - | ✅ 活跃 | 增强功能模块 |
| monitoring.js | - | ✅ 活跃 | 监控模块 |
| api-gateway.js | - | ✅ 活跃 | API 网关 |
| cert-manager.js | - | ✅ 活跃 | 证书管理 |

## 启动方式

```bash
# 使用主版本
node server-v1.5.js

# 或通过软链接
ln -sf server-v1.5.js server.js
```