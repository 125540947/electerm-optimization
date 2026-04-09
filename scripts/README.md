# Scripts 说明

> 自动化脚本集合

## 部署脚本

| 脚本 | 说明 | 状态 |
|------|------|------|
| deploy-enhanced.sh | 完整部署（推荐） | ✅ 主用 |
| deploy-all.sh | 全部部署 | ✅ |
| deploy-optimization.sh | 旧版部署 | ⚠️ 已废弃 |

## 运维脚本

| 脚本 | 说明 |
|------|------|
| install-sync-server.sh | 一键安装同步服务器 |
| health-check.sh | 健康检查 |
| monitor.sh | 监控 |
| backup.sh | 备份 |
| backup-sync.sh | 同步备份 |
| hardening.sh | 安全加固 |

## 使用

```bash
# 推荐部署
./scripts/deploy-enhanced.sh

# 健康检查
./scripts/health-check.sh
```