# 快速命令参考

> electerm-optimization 常用命令速查表

## 服务管理

### PM2 命令
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs electerm-sync
pm2 logs electerm-web

# 重启服务
pm2 restart electerm-sync
pm2 restart all

# 停止服务
pm2 stop electerm-sync

# 删除服务
pm2 delete electerm-sync

# 开机自启
pm2 save
pm2 startup
```

### Nginx 命令
```bash
# 测试配置
nginx -t

# 重载配置
systemctl reload nginx

# 重启
systemctl restart nginx

# 查看状态
systemctl status nginx
```

## API 调用

### 基础
```bash
# 健康检查
curl http://82.158.225.97:3000/health

# 服务器信息
curl http://82.158.225.97:3000/api/info
```

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

# 删除数据
curl -X DELETE http://82.158.225.97:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN'

# 导出数据
curl http://82.158.225.97:3000/api/export \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -o backup.json

# 导入数据
curl -X POST http://82.158.225.97:3000/api/import \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"data":{...},"merge":false}'
```

### 管理员
```bash
# 用户列表
curl -u admin:czfkKUGS9741 http://82.158.225.97:3000/api/admin/users

# 删除用户
curl -X DELETE -u admin:czfkKUGS9741 \
  http://82.158.225.97:3000/api/admin/users/username

# 操作日志
curl -u admin:czfkKUGS9741 http://82.158.225.97:3000/api/admin/logs

# 服务器统计
curl -u admin:czfkKUGS9741 http://82.158.225.97:3000/api/admin/stats
```

### 修改密码
```bash
curl -X POST http://82.158.225.97:3000/api/password \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"oldPassword":"old-pass","newPassword":"new-pass"}'
```

## 服务器地址

| 服务 | 地址 |
|------|------|
| 主站 | http://82.158.225.97 |
| 同步API | http://82.158.225.97:3000 |
| 管理后台 | http://82.158.225.97/admin-marix.html |
| 监控面板 | http://82.158.225.97/monitor.html |

## 常用工具

### 检查端口
```bash
netstat -tlnp | grep 3000
netstat -tlnp | grep 5577
netstat -tlnp | grep 80
```

### 查看进程
```bash
ps aux | grep node
ps aux | grep pm2
```

### 磁盘和内存
```bash
df -h
free -h
uptime
```

### 日志轮转
```bash
# 查看日志大小
ls -lh /var/log/electerm-*

# 清理日志
pm2 logs --err --lines 0
```

## 备份和恢复

```bash
# 备份脚本
./scripts/backup-sync.sh backup user pass

# 恢复脚本
./scripts/backup-sync.sh restore backup.json user pass

# 健康检查
./scripts/health-check.sh
```

## 快速部署

```bash
# 完整部署
./scripts/deploy-enhanced.sh

# 只部署同步服务
./scripts/deploy-enhanced.sh --sync

# 只部署 Web
./scripts/deploy-enhanced.sh --web

# 重启服务
./scripts/deploy-enhanced.sh --restart

# 查看状态
./scripts/deploy-enhanced.sh --status
```