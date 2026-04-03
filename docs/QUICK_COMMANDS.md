# 快速命令参考

## 常用命令

### 服务管理
```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart electerm-sync

# 查看日志
pm2 logs electerm-sync

# 停止服务
pm2 stop electerm-sync
```

### Nginx
```bash
# 检查配置
nginx -t

# 重载配置
nginx -s reload

# 重启
systemctl restart nginx
```

### 备份
```bash
# 手动备份
/opt/scripts/backup.sh

# 添加定时任务 (每天凌晨2点)
crontab -e
0 2 * * * /opt/scripts/backup.sh
```

### 监控
```bash
# 添加定时监控 (每5分钟)
crontab -e
*/5 * * * * /opt/scripts/monitor.sh
```

## 服务地址

| 服务 | 地址 |
|------|------|
| Web | http://82.158.225.97 |
| Sync API | http://82.158.225.97:3000 |

## API 测试

```bash
# 健康检查
curl http://82.158.225.97:3000/health

# 服务器信息
curl http://82.158.225.97:3000/api/info

# 注册用户
curl -X POST http://82.158.225.97:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"test","password":"test123"}'

# 登录
curl -X POST http://82.158.225.97:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"test","password":"test123"}'
```

## 故障排查

```bash
# 检查进程
ps aux | grep node

# 检查端口
netstat -tlnp | grep -E '3000|5580|80'

# 查看错误日志
tail -f /var/log/electerm-web.log

# 防火墙状态
ufw status
```
