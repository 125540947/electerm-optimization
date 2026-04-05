/**
 * 自动化脚本库
 * 常用运维脚本集合
 */

// 常用脚本模板
const ScriptTemplates = {
  // 系统监控脚本
  systemMonitor: {
    name: '系统监控脚本',
    description: '监控CPU、内存、磁盘、网络',
    script: `#!/bin/bash
# 系统监控脚本

# 配置
ALERT_CPU=80
ALERT_MEM=85
ALERT_DISK=90

# 检查CPU使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}')
if [ "$(echo "$CPU_USAGE > $ALERT_CPU" | bc)" -eq 1 ]; then
    echo "警告: CPU使用率 ${CPU_USAGE}% 超过阈值 ${ALERT_CPU}%"
fi

# 检查内存使用率
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt "$ALERT_MEM" ]; then
    echo "警告: 内存使用率 ${MEM_USAGE}% 超过阈值 ${ALERT_MEM}%"
fi

# 检查磁盘使用率
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt "$ALERT_DISK" ]; then
    echo "警告: 磁盘使用率 ${DISK_USAGE}% 超过阈值 ${ALERT_DISK}%"
fi

echo "系统监控完成"`,

    categories: ['monitor', 'system'],
    tags: ['监控', '系统', '资源']
  },

  // 自动备份脚本
  autoBackup: {
    name: '自动备份脚本',
    description: '定时备份数据库和文件',
    script: `#!/bin/bash
# 自动备份脚本

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份MySQL数据库
echo "开始备份MySQL数据库..."
mysqldump -u root -p password all_databases > "$BACKUP_DIR/mysql_$DATE.sql"
if [ $? -eq 0 ]; then
    echo "MySQL备份成功: mysql_$DATE.sql"
else
    echo "MySQL备份失败!"
fi

# 备份重要文件
echo "开始备份重要文件..."
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /home /var/www 2>/dev/null
if [ $? -eq 0 ]; then
    echo "文件备份成功: files_$DATE.tar.gz"
fi

# 清理旧备份
echo "清理旧备份..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

echo "备份完成"`,
    
    categories: ['backup', 'database'],
    tags: ['备份', '数据库', '自动']
  },

  // 日志清理脚本
  logCleanup: {
    name: '日志清理脚本',
    description: '自动清理旧日志文件',
    script: `#!/bin/bash
# 日志清理脚本

LOG_DIRS="/var/log /opt/*/logs"
MAX_SIZE=100
MAX_DAYS=30

# 清理大于指定大小的日志
for dir in $LOG_DIRS; do
    if [ -d "$dir" ]; then
        find "$dir" -type f -name "*.log" -size +${MAX_SIZE}M -exec truncate -s 0 {} \\;
        echo "已清理 $dir 中过大的日志文件"
    fi
done

# 清理过期日志
find /var/log -type f -name "*.log" -mtime +$MAX_DAYS -delete

# 清理系统日志
journalctl --vacuum-time=${MAX_DAYS}d

echo "日志清理完成"`,

    categories: ['cleanup', 'system'],
    tags: ['日志', '清理', '维护']
  },

  // 服务健康检查脚本
  healthCheck: {
    name: '服务健康检查脚本',
    description: '检查关键服务运行状态',
    script: `#!/bin/bash
# 服务健康检查脚本

SERVICES="nginx mysql redis docker sshd"

echo "========== 服务健康检查 =========="
for service in $SERVICES; do
    if systemctl is-active --quiet $service; then
        echo "✓ $service: 运行中"
    else
        echo "✗ $service: 已停止"
        # 尝试重启
        systemctl restart $service
        sleep 2
        if systemctl is-active --quiet $service; then
            echo "  -> 已自动重启"
        else
            echo "  -> 重启失败，需要人工处理"
        fi
    fi
done
echo "=================================="`,

    categories: ['monitor', 'service'],
    tags: ['健康检查', '服务', '监控']
  },

  // SSL证书检查脚本
  sslCheck: {
    name: 'SSL证书检查脚本',
    description: '检查SSL证书有效期',
    script: `#!/bin/bash
# SSL证书检查脚本

DAYS_WARNING=30

# 检查证书有效期
check_cert() {
    local domain=$1
    local expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
    
    if [ -z "$expiry" ]; then
        echo "✗ $domain: 无法获取证书信息"
        return
    fi
    
    local expiry_date=$(date -d "$expiry" +%s)
    local today=$(date +%s)
    local days=$(( (expiry_date - today) / 86400 ))
    
    if [ $days -lt 0 ]; then
        echo "✗ $domain: 证书已过期"
    elif [ $days -lt $DAYS_WARNING ]; then
        echo "⚠ $domain: 证书将在 $days 天后过期"
    else
        echo "✓ $domain: 证书有效 (剩余 $days 天)"
    fi
}

# 检查多个域名
DOMAINS="example.com api.example.com"
for domain in $DOMAINS; do
    check_cert $domain
done`,

    categories: ['security', 'ssl'],
    tags: ['SSL', '证书', '安全']
  },

  // Docker清理脚本
  dockerCleanup: {
    name: 'Docker清理脚本',
    description: '清理Docker缓存和未使用资源',
    script: `#!/bin/bash
# Docker清理脚本

echo "========== Docker 清理 =========="

# 清理停止的容器
echo "清理停止的容器..."
docker container prune -f

# 清理未使用的镜像
echo "清理未使用的镜像..."
docker image prune -a -f

# 清理未使用的卷
echo "清理未使用的卷..."
docker volume prune -f

# 清理构建缓存
echo "清理构建缓存..."
docker builder prune -f

# 显示磁盘使用情况
echo ""
echo "磁盘使用情况:"
docker system df

echo "================================="`,
    
    categories: ['cleanup', 'docker'],
    tags: ['Docker', '清理', '容器']
  },

  // 用户管理脚本
  userManagement: {
    name: '用户管理脚本',
    description: '创建、删除、锁定用户',
    script: `#!/bin/bash
# 用户管理脚本

case "$1" in
    create)
        username=$2
        password=$3
        if [ -z "$username" ] || [ -z "$password" ]; then
            echo "用法: $0 create <用户名> <密码>"
            exit 1
        fi
        useradd -m -s /bin/bash $username
        echo "$username:$password" | chpasswd
        echo "用户 $username 已创建"
        ;;
    delete)
        username=$2
        if [ -z "$username" ]; then
            echo "用法: $0 delete <用户名>"
            exit 1
        fi
        userdel -r $username
        echo "用户 $username 已删除"
        ;;
    lock)
        username=$2
        passwd -l $username
        echo "用户 $username 已锁定"
        ;;
    unlock)
        username=$2
        passwd -u $username
        echo "用户 $username 已解锁"
        ;;
    list)
        echo "系统用户列表:"
        awk -F: '$3 >= 1000 && $1 != "nobody" {print $1}' /etc/passwd
        ;;
    *)
        echo "用法: $0 {create|delete|lock|unlock|list} [参数]"
        ;;
esac`,

    categories: ['user', 'management'],
    tags: ['用户', '管理', '系统']
  },

  // 网络诊断脚本
  networkDiagnosis: {
    name: '网络诊断脚本',
    description: '网络连通性和延迟检测',
    script: `#!/bin/bash
# 网络诊断脚本

TARGETS="8.8.8.8 1.1.1.1 google.com baidu.com"

echo "========== 网络诊断 =========="

# 检查DNS解析
echo "检查DNS解析..."
for host in google.com baidu.com; do
    ip=$(host $host | grep "has address" | head -1 | awk '{print $NF}')
    echo "  $host -> $ip"
done

# 检查网络连通性
echo ""
echo "检查网络连通性..."
for target in $TARGETS; do
    if ping -c 1 -W 2 $target > /dev/null 2>&1; then
        echo "  ✓ $target: 可达"
    else
        echo "  ✗ $target: 不可达"
    fi
done

# 检查延迟
echo ""
echo "网络延迟检测..."
ping -c 4 8.8.8.8 | tail -1

echo "================================="`,
    
    categories: ['network', 'diagnosis'],
    tags: ['网络', '诊断', '延迟']
  }
};

// 脚本管理器
class ScriptLibrary {
  constructor() {
    this.scripts = new Map();
    this.categories = new Set();
    this.tags = new Set();
    
    // 加载所有模板
    this.loadTemplates();
  }

  // 加载模板
  loadTemplates() {
    for (const [key, template] of Object.entries(ScriptTemplates)) {
      this.register(key, template);
    }
  }

  // 注册脚本
  register(id, script) {
    this.scripts.set(id, script);
    
    // 收集分类和标签
    if (script.categories) {
      script.categories.forEach(c => this.categories.add(c));
    }
    if (script.tags) {
      script.tags.forEach(t => this.tags.add(t));
    }
  }

  // 获取脚本
  getScript(id) {
    return this.scripts.get(id);
  }

  // 搜索脚本
  search(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [id, script] of this.scripts) {
      if (
        script.name.toLowerCase().includes(lowerQuery) ||
        script.description.toLowerCase().includes(lowerQuery) ||
        (script.tags && script.tags.some(t => t.toLowerCase().includes(lowerQuery)))
      ) {
        results.push({ id, ...script });
      }
    }
    
    return results;
  }

  // 按分类获取
  getByCategory(category) {
    return Array.from(this.scripts.values())
      .filter(s => s.categories && s.categories.includes(category));
  }

  // 获取所有分类
  getCategories() {
    return Array.from(this.categories);
  }

  // 获取所有标签
  getTags() {
    return Array.from(this.tags);
  }

  // 获取统计
  getStats() {
    return {
      totalScripts: this.scripts.size,
      categories: this.categories.size,
      tags: this.tags.size
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScriptLibrary, ScriptTemplates };
}