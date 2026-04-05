#!/bin/bash
# 服务器监控脚本
# 添加到 crontab: */5 * * * * /opt/scripts/monitor.sh

SERVER_IP="${SERVER_IP}"
SSH_USER="root"
SSH_PASS="czfkKUGS9741"
ALERT_EMAIL="admin@example.com"

LOG_FILE="/var/log/electerm-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 检查服务状态
check_services() {
    # 检查 Web 服务
    WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP)
    if [ "$WEB_STATUS" != "200" ]; then
        log "WARNING: Web 服务异常 (HTTP $WEB_STATUS)"
        return 1
    fi
    
    # 检查 Sync 服务
    SYNC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:3000/health)
    if [ "$SYNC_STATUS" != "200" ]; then
        log "WARNING: Sync 服务异常 (HTTP $SYNC_STATUS)"
        return 1
    fi
    
    log "OK: 所有服务正常"
    return 0
}

# 检查资源使用
check_resources() {
    MEMORY=$(free -m | awk 'NR==2{print $3}')
    DISK=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    
    if [ $MEMORY -gt 900 ]; then
        log "WARNING: 内存使用过高 (${MEMORY}MB)"
    fi
    
    if [ $DISK -gt 90 ]; then
        log "WARNING: 磁盘使用过高 (${DISK}%)"
    fi
}

# 检查进程
check_processes() {
    if ! pgrep -f "node src/app/app.js" > /dev/null; then
        log "ERROR: electerm-web 进程丢失，尝试重启..."
        cd /opt/electerm-web
        nohup node src/app/app.js > /var/log/electerm-web.log 2>&1 &
    fi
    
    if ! pgrep -f "electerm-sync" > /dev/null; then
        log "ERROR: electerm-sync 进程丢失，尝试重启..."
        cd /opt/electerm-sync
        pm2 restart electerm-sync
    fi
}

# 主函数
main() {
    check_services
    check_resources
    check_processes
}

main "$@"
