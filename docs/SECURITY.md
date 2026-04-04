# 安全加固指南

> electerm-optimization 安全配置最佳实践

## 1. 防火墙配置

### UFW (Ubuntu/Debian)
```bash
# 安装 UFW
apt-get install ufw

# 配置规则
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # Sync API (可选，仅内网)

# 启用防火墙
ufw enable

# 查看状态
ufw status verbose
```

### Firewalld (CentOS/RHEL)
```bash
# 安装
yum install firewalld
systemctl enable firewalld

# 配置规则
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp

# 重新加载
firewall-cmd --reload
```

## 2. SSH 安全

### 禁用密码登录
```bash
# 编辑 SSH 配置
nano /etc/ssh/sshd_config

# 修改以下行
PasswordAuthentication no
PermitRootLogin without-password
PubkeyAuthentication yes

# 重启 SSH
systemctl restart sshd
```

### 更换 SSH 端口
```bash
# 编辑 SSH 配置
nano /etc/ssh/sshd_config

# 更换端口 (例如 2222)
Port 2222

# 重启 SSH
systemctl restart sshd
```

## 3. JWT 密钥配置

### 生成强密钥
```bash
# 使用 OpenSSL
openssl rand -hex 32

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 配置环境变量
```bash
# 在 /opt/electerm-sync/.env 中设置
echo "JWT_SECRET=$(openssl rand -hex 32)" >> /opt/electerm-sync/.env

# 重启服务
pm2 restart electerm-sync
```

## 4. HTTPS 配置

### 使用 Let's Encrypt
```bash
# 安装 Certbot
apt-get install certbot python3-certbot-nginx

# 获取证书 (需要域名)
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### Nginx 配置 HTTPS
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    location / {
        proxy_pass http://127.0.0.1:5577;
        # ... 其他配置
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 5. API 安全

### 速率限制
```javascript
// 在 server.js 中已内置
// 每分钟 100 次请求
const RATE_LIMIT = 100;
```

### CORS 配置
```javascript
// 仅允许受信任的域名
app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true
}));
```

### 请求大小限制
```javascript
// 限制请求体大小
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

## 6. 数据安全

### 定期备份
```bash
# 使用备份脚本
./scripts/backup-sync.sh backup user pass

# 设置定时任务 (每天凌晨 3 点)
crontab -e
0 3 * * * /path/to/backup-sync.sh backup
```

### 文件权限
```bash
# 设置正确的文件权限
chmod 600 /opt/electerm-sync/.env
chmod 700 /opt/electerm-sync/data
chmod 700 /opt/electerm-sync/logs
```

## 7. 监控和告警

### 使用健康检查脚本
```bash
# 手动运行
./scripts/health-check.sh

# 设置定时任务 (每 5 分钟)
crontab -e
*/5 * * * * /path/to/health-check.sh >> /var/log/health.log 2>&1
```

### 日志监控
```bash
# 实时查看错误日志
pm2 logs electerm-sync --err --nostream

# 统计错误数量
grep -c "Error" /var/log/electerm-sync/error.log
```

## 8. 安全检查清单

| 项目 | 状态 | 说明 |
|------|------|------|
| 防火墙已配置 | ✅ | 仅开放必要端口 |
| SSH 密钥登录 | ⚠️ | 建议启用 |
| JWT 密钥已更改 | ✅ | 使用随机密钥 |
| HTTPS 已配置 | ⚠️ | 需要域名 |
| 速率限制已启用 | ✅ | 已配置 |
| 定期备份 | ⚠️ | 建议设置 cron |
| 日志监控 | ⚠️ | 建议设置监控 |

## 9. 紧急情况处理

### 服务被攻击
```bash
# 1. 封禁 IP
iptables -I INPUT -s ATTACKER_IP -j DROP

# 2. 重启服务
pm2 restart all

# 3. 检查日志
pm2 logs --err --lines 50

# 4. 查看异常请求
tail -f /var/log/electerm-sync/combined.log | grep ERROR
```

### 数据泄露
```bash
# 1. 立即停止服务
pm2 stop all

# 2. 更改所有密码
# - JWT 密钥
# - 数据库密码
# - API 密钥

# 3. 检查泄露范围
# - 查看访问日志
# - 检查异常用户

# 4. 恢复备份
./scripts/backup-sync.sh restore backup_file user pass
```

## 10. 安全更新

```bash
# 更新系统
apt-get update && apt-get upgrade

# 更新 Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# 更新依赖
cd /opt/electerm-sync
npm update

# 重启服务
pm2 restart all
```