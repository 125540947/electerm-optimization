#!/bin/bash
# 自动备份脚本
# 添加到 crontab: 0 2 * * * /opt/scripts/backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
SERVER_IP="82.158.225.97"
SSH_USER="root"
SSH_PASS="czfkKUGS9741"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "开始备份..."

# 创建备份目录
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "mkdir -p $BACKUP_DIR"

# 备份 electerm-sync 数据
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "cd /opt/electerm-sync && tar -czf $BACKUP_DIR/sync-data-$DATE.tar.gz data/"

# 备份 electerm-web 数据
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "tar -czf $BACKUP_DIR/web-data-$DATE.tar.gz /opt/electerm-data/"

# 备份 Nginx 配置
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "tar -czf $BACKUP_DIR/nginx-$DATE.tar.gz /etc/nginx/"

# 删除 7 天前的备份
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "find $BACKUP_DIR -mtime +7 -delete"

# 列出备份
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "ls -lh $BACKUP_DIR/"

log "备份完成!"
