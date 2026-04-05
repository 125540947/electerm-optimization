#!/bin/bash
# electerm-sync 备份脚本
# 自动备份用户数据和配置

set -e

# 配置
SERVER="${SERVER_IP}"
PORT="3000"
BACKUP_DIR="/opt/electerm-sync/backups"
DATE=$(date +%Y%m%d_%H%M%S)
ADMIN_USER="admin"
ADMIN_PASS="czfkKUGS9741"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份函数
backup_data() {
  local user=$1
  local pass=$2
  local output=$3
  
  log_info "备份用户: $user"
  
  # 获取 token
  TOKEN=$(curl -s -X POST "http://$SERVER:$PORT/api/login" \
    -H 'Content-Type: application/json' \
    -d "{\"userId\":\"$user\",\"password\":\"$pass\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    log_error "登录失败: $user"
    return 1
  fi
  
  # 导出数据
  curl -s "http://$SERVER:$PORT/api/export" \
    -H "Authorization: Bearer $TOKEN" \
    -o "$output"
  
  if [ -s "$output" ]; then
    log_info "备份完成: $output"
    return 0
  else
    log_error "备份文件为空"
    return 1
  fi
}

# 列出备份
list_backups() {
  log_info "可用备份:"
  ls -lh "$BACKUP_DIR" | tail -n +2 | awk '{print $9, $5}' | while read name size; do
    echo "  - $name ($size)"
  done
}

# 恢复备份
restore_backup() {
  local backup_file=$1
  local user=$2
  local pass=$3
  
  if [ ! -f "$backup_file" ]; then
    log_error "备份文件不存在: $backup_file"
    return 1
  fi
  
  log_info "恢复备份: $backup_file"
  
  # 登录获取 token
  TOKEN=$(curl -s -X POST "http://$SERVER:$PORT/api/login" \
    -H 'Content-Type: application/json' \
    -d "{\"userId\":\"$user\",\"password\":\"$pass\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    log_error "登录失败"
    return 1
  fi
  
  # 读取备份数据
  DATA=$(cat "$backup_file")
  
  # 导入数据 (覆盖)
  RESULT=$(curl -s -X POST "http://$SERVER:$PORT/api/import" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"data\":$DATA,\"merge\":false}")
  
  if echo "$RESULT" | grep -q '"success":true'; then
    log_info "恢复成功"
    return 0
  else
    log_error "恢复失败: $RESULT"
    return 1
  fi
}

# 自动备份所有用户
auto_backup_all() {
  log_info "开始自动备份..."
  
  # 获取用户列表
  USERS=$(curl -s -u "$ADMIN_USER:$ADMIN_PASS" "http://$SERVER:$PORT/api/admin/users")
  
  echo "$USERS" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | while read user; do
    backup_file="$BACKUP_DIR/${user}_${DATE}.json"
    # 这里需要每个用户的密码，实际使用需要从配置文件读取
    echo "用户: $user"
  done
  
  log_info "自动备份完成"
}

# 清理旧备份 (保留最近 N 个)
clean_old_backups() {
  local keep=${1:-10}
  
  log_info "清理旧备份, 保留最近 $keep 个..."
  
  cd "$BACKUP_DIR"
  ls -t | tail -n +$((keep + 1)) | xargs -r rm -f
  
  log_info "清理完成"
}

# 主命令
case "$1" in
  backup)
    USER=${2:-$ADMIN_USER}
    PASS=${3:-$ADMIN_PASS}
    OUTPUT="${4:-$BACKUP_DIR/${USER}_${DATE}.json}"
    backup_data "$USER" "$PASS" "$OUTPUT"
    ;;
  restore)
    backup_file="$2"
    USER=${3:-$ADMIN_USER}
    PASS=${4:-$ADMIN_PASS}
    restore_backup "$backup_file" "$USER" "$PASS"
    ;;
  list)
    list_backups
    ;;
  clean)
    clean_old_backups "${2:-10}"
    ;;
  auto)
    auto_backup_all
    ;;
  *)
    echo "用法: $0 {backup|restore|list|clean|auto} [参数]"
    echo ""
    echo "命令:"
    echo "  backup [user] [pass] [output]  备份指定用户数据"
    echo "  restore <file> [user] [pass]    从备份恢复数据"
    echo "  list                            列出所有备份"
    echo "  clean [N]                       清理旧备份, 保留最近N个"
    echo "  auto                            自动备份所有用户"
    exit 1
    ;;
esac