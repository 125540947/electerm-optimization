#!/bin/bash
# electerm-sync 健康检查与自动恢复脚本
# 可配合 cron 使用: */5 * * * * /opt/electerm-sync/health-check.sh

set -e

# 配置
SERVER="82.158.225.97"
PORT="3000"
MAX_RESTARTS=3
CHECK_INTERVAL=10

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查服务健康状态
check_health() {
  local response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER:$PORT/health" 2>/dev/null || echo "000")
  if [ "$response" = "200" ]; then
    return 0
  else
    return 1
  fi
}

# 检查 API 功能
check_api() {
  local response=$(curl -s "http://$SERVER:$PORT/api/info" 2>/dev/null)
  if echo "$response" | grep -q '"version"'; then
    return 0
  else
    return 1
  fi
}

# 获取服务状态
get_status() {
  curl -s "http://$SERVER:$PORT/health" 2>/dev/null || echo '{"status":"error"}'
}

# 重启服务
restart_service() {
  log_warn "尝试重启服务..."
  sshpass -p "czfkKUGS9741" ssh -o StrictHostKeyChecking=no root@$SERVER "pm2 restart electerm-sync" 2>/dev/null || {
    log_error "SSH 重启失败"
    return 1
  }
  log_info "重启命令已发送"
  return 0
}

# 发送告警通知
send_alert() {
  local message=$1
  log_error "ALERT: $message"
  # 这里可以添加邮件、钉钉、TG 等通知
}

# 主检查流程
main() {
  log_info "开始健康检查..."
  
  # 检查端口连通性
  if ! nc -z -w5 $SERVER $PORT 2>/dev/null; then
    log_error "端口 $PORT 无法连接"
    send_alert "端口 $PORT 不可达"
    exit 1
  fi
  
  # 检查健康端点
  if ! check_health; then
    log_warn "健康检查失败, 尝试检查 API..."
    if ! check_api; then
      log_error "API 检查失败"
      send_alert "服务无响应"
      exit 1
    fi
  fi
  
  # 获取详细状态
  STATUS=$(get_status)
  VERSION=$(echo "$STATUS" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
  UPTIME=$(echo "$STATUS" | grep -o '"uptime":[0-9]*' | cut -d':' -f2)
  
  # 计算运行时间
  if [ -n "$UPTIME" ]; then
    HOURS=$((UPTIME / 3600))
    MINS=$(((UPTIME % 3600) / 60))
    UPTIME_STR="${HOURS}h ${MINS}m"
  else
    UPTIME_STR="未知"
  fi
  
  log_info "状态: 正常"
  log_info "版本: $VERSION"
  log_info "运行时间: $UPTIME_STR"
  
  # 检查版本
  if [ "$VERSION" = "1.5.0" ]; then
    log_info "✓ 版本已是最新"
  else
    log_warn "✗ 版本不是最新 (当前: $VERSION)"
  fi
  
  # 检查重启次数
  RESTART_COUNT=$(sshpass -p "czfkKUGS9741" ssh -o StrictHostKeyChecking=no root@$SERVER "pm2 show electerm-sync" 2>/dev/null | grep -o 'restarted:[0-9]*' | cut -d':' -f2 || echo "0")
  if [ "$RESTART_COUNT" -gt "$MAX_RESTARTS" ]; then
    send_alert "服务重启次数过多: $RESTART_COUNT"
  fi
  
  log_info "健康检查完成"
  exit 0
}

# 运行
main