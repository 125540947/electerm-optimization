# 故障排查指南

> electerm-optimization 常见问题及解决方案

## 1. 服务无法启动

### 症状: PM2 显示服务 stopped
```bash
# 查看错误日志
pm2 logs electerm-sync --err --lines 30
```

**常见原因:**
- 端口被占用
- 缺少依赖
- 配置文件错误

**解决方案:**
```bash
# 1. 检查端口
netstat -tlnp | grep 3000

# 2. 重新安装依赖
cd /opt/electerm-sync
npm install

# 3. 测试启动
node server.js
```

## 2. 502 Bad Gateway

### 症状: 浏览器显示 502 错误

**检查步骤:**
```bash
# 1. 检查 Nginx 状态
systemctl status nginx

# 2. 检查后端服务
pm2 status

# 3. 检查端口监听
netstat -tlnp | grep -E '3000|5577|80'

# 4. 测试后端直接访问
curl http://127.0.0.1:5577
curl http://127.0.0.1:3000/api/info
```

**解决方案:**
```bash
# 重启 Nginx
systemctl restart nginx

# 重启后端服务
pm2 restart all
```

## 3. 认证失败

### 症状: 登录返回 "Invalid credentials"

**排查步骤:**
```bash
# 1. 检查用户文件
cat /opt/electerm-sync/data/users.json

# 2. 验证密码
# 密码是明文存储的，直接对比
```

**解决方案:**
```bash
# 注册新用户
curl -X POST http://82.158.225.97:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"newuser","password":"newpass"}'
```

## 4. 同步失败

### 症状: 数据无法保存或同步

**检查:**
```bash
# 1. 检查 Token 有效性
curl http://82.158.225.97:3000/api/sync \
  -H 'Authorization: Bearer YOUR_TOKEN'

# 2. 检查版本冲突
# 服务器会返回当前版本和数据
```

**解决方案:**
```javascript
// 版本冲突时，获取服务器数据后合并
const serverData = conflictResult.serverData;
// 合并后重新提交
```

## 5. 内存占用高

### 症状: 服务响应变慢

**检查:**
```bash
# 查看内存使用
pm2 show electerm-sync
free -h

# 查看 Node.js 内存
curl http://82.158.225.97:3000/health
```

**解决方案:**
```bash
# 重启服务清理内存
pm2 restart electerm-sync

# 或设置内存限制
pm2 start server.js --max-memory-restart 200M
```

## 6. CORS 错误

### 症状: 浏览器控制台显示 CORS 错误

**解决方案:**
```javascript
// 在 server.js 中配置
const cors = require('cors');
app.use(cors({
  origin: '*', // 或指定域名
  credentials: true
}));
```

## 7. WebSocket 连接失败

### 症状: 实时功能无法使用

**检查:**
```bash
# 检查 WebSocket 端口
netstat -tlnp | grep -E '5577|3000'

# 测试 WebSocket
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://82.158.225.97/api/ws
```

**解决方案:**
```nginx
# Nginx 配置 WebSocket 支持
location / {
    proxy_pass http://127.0.0.1:5577;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}
```

## 8. 磁盘空间不足

### 症状: 无法写入数据

**检查:**
```bash
df -h
du -sh /opt/electerm-sync/data/*
```

**清理:**
```bash
# 清理 PM2 日志
pm2 logs --err --lines 0

# 清理旧的备份
rm -f /opt/electerm-sync/backups/*

# 压缩日志
logrotate -f /etc/logrotate.d/electerm
```

## 9. 数据库损坏

### 症状: 用户数据异常

**检查:**
```bash
# 检查 JSON 文件语法
node -e "JSON.parse(require('fs').readFileSync('/opt/electerm-sync/data/users.json'))"
```

**修复:**
```bash
# 备份后重置
cp /opt/electerm-sync/data/users.json /backup/
echo '{}' > /opt/electerm-sync/data/users.json
pm2 restart electerm-sync
```

## 10. 服务自动停止

### 症状: 服务频繁重启

**检查:**
```bash
# 查看重启次数
pm2 show electerm-sync | grep restarts

# 查看详细日志
pm2 logs electerm-sync --err --lines 50
```

**解决方案:**
```bash
# 增加内存限制
pm2 start server.js --max-memory-restart 500M

# 禁用自动重启 (仅调试)
pm2 start server.js --no-autorestart
```

## 错误码参考

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求格式 |
| 401 | 认证失败 | 检查 Token |
| 403 | 权限不足 | 检查用户权限 |
| 404 | 资源不存在 | 检查 URL |
| 429 | 请求过于频繁 | 等待后重试 |
| 500 | 服务器错误 | 检查日志 |
| 502 | 网关错误 | 重启服务 |

## 诊断命令汇总

```bash
# 一键诊断
echo "=== 服务状态 ===" && pm2 status
echo "=== 端口监听 ===" && netstat -tlnp | grep -E '3000|5577|80'
echo "=== 磁盘空间 ===" && df -h
echo "=== 内存使用 ===" && free -h
echo "=== 健康检查 ===" && curl -s http://82.158.225.97:3000/health
echo "=== API 信息 ===" && curl -s http://82.158.225.97:3000/api/info
```