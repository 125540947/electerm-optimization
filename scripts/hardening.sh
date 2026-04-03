#!/bin/bash
# 服务器安全加固脚本

set -e

echo "========================================="
echo "  服务器安全加固"
echo "========================================="

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }

# 1. 更新系统
log_info "更新系统包..."
apt-get update -y && apt-get upgrade -y

# 2. 安装安全工具
log_info "安装安全工具..."
apt-get install -y fail2ban ufw auditd

# 3. 配置 SSH
log_info "加固 SSH..."
sed -i 's/^#*PermitRootLogin yes/PermitRootLogin without-password/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config
sed -i 's/^#*MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
echo "AllowUsers root" >> /etc/ssh/sshd_config
systemctl restart sshd

# 4. 配置防火墙
log_info "配置防火墙..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 5. 配置 Fail2Ban
log_info "配置 Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# 6. 加固内核参数
log_info "加固内核参数..."
cat >> /etc/sysctl.conf << 'EOF'

# 网络安全
net.ipv4.tcp_syncookies = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# 禁用 IP 转发
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# 禁用源路由
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# 禁用 ICMP 重定向
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0

# 记录可疑数据包
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
EOF

sysctl -p

# 7. 设置文件权限
log_info "设置文件权限..."
chmod 600 /etc/ssh/sshd_config
chmod 700 /root
chmod 700 /home/*

# 8. 禁止核心转储
echo "* hard core 0" >> /etc/security/limits.conf
echo "* soft core 0" >> /etc/security/limits.conf

# 9. 自动安全更新
log_info "配置自动安全更新..."
apt-get install -y unattended-upgrades
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
  "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Automatic-Reboot "true";
EOF

# 10. 检查开放端口
log_info "检查开放端口..."
netstat -tlnp

echo ""
log_info "========================================="
log_info "  安全加固完成!"
log_info "========================================="
echo ""
echo "请记住:"
echo "  - 使用 SSH 密钥登录"
echo "  - 密码登录已禁用"
echo "  - 防火墙已启用"
echo "  - Fail2Ban 已配置"
