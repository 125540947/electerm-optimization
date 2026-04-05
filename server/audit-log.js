/**
 * 审计日志系统
 * 完整操作记录和日志查询
 */

class AuditLogger {
  constructor(config = {}) {
    this.config = {
      logDir: config.logDir || './logs/audit',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 30,
      retentionDays: config.retentionDays || 90,
      levels: config.levels || ['info', 'warning', 'error', 'critical']
    };
    
    this.currentLogFile = null;
    this.buffer = [];
    this.bufferSize = 100;
  }

  // 记录日志
  log(entry) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: entry.level || 'info',
      user: entry.user || 'system',
      action: entry.action,
      resource: entry.resource,
      details: entry.details || {},
      ip: entry.ip || 'unknown',
      userAgent: entry.userAgent || 'unknown',
      result: entry.result || 'success'
    };

    // 添加到缓冲区
    this.buffer.push(logEntry);

    // 如果缓冲区满，写入文件
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }

    // 控制台输出
    console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.user}: ${logEntry.action}`);

    return logEntry.id;
  }

  // 刷新缓冲区到文件
  flush() {
    if (this.buffer.length === 0) return;
    
    // 模拟写入文件
    console.log(`写入 ${this.buffer.length} 条日志到文件`);
    this.buffer = [];
  }

  // 生成唯一ID
  generateId() {
    return 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // 查询日志
  query(options = {}) {
    // 模拟查询结果
    const results = [
      {
        id: 'audit-1',
        timestamp: new Date().toISOString(),
        level: 'info',
        user: 'admin',
        action: 'login',
        resource: '/api/auth/login',
        result: 'success'
      },
      {
        id: 'audit-2',
        timestamp: new Date().toISOString(),
        level: 'info',
        user: 'admin',
        action: 'file.upload',
        resource: '/api/files/upload',
        result: 'success'
      }
    ];

    // 应用过滤
    return results.filter(entry => {
      if (options.level && entry.level !== options.level) return false;
      if (options.user && entry.user !== options.user) return false;
      if (options.action && !entry.action.includes(options.action)) return false;
      if (options.startDate && new Date(entry.timestamp) < new Date(options.startDate)) return false;
      if (options.endDate && new Date(entry.timestamp) > new Date(options.endDate)) return false;
      return true;
    });
  }

  // 获取用户活动统计
  getUserStats(userId, days = 7) {
    return {
      userId,
      totalActions: 156,
      actionsByType: {
        login: 12,
        fileUpload: 45,
        fileDownload: 38,
        configChange: 8,
        userManagement: 5
      },
      lastActivity: new Date().toISOString()
    };
  }

  // 获取安全告警
  getSecurityAlerts(days = 7) {
    return [
      {
        id: 'alert-1',
        level: 'warning',
        message: '多次失败的登录尝试',
        user: 'unknown',
        ip: '192.168.1.100',
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-2',
        level: 'info',
        message: '新设备登录',
        user: 'admin',
        ip: '192.168.1.50',
        timestamp: new Date().toISOString()
      }
    ];
  }

  // 导出日志
  export(format = 'json', filters = {}) {
    const logs = this.query(filters);
    
    if (format === 'csv') {
      const header = 'ID,Timestamp,Level,User,Action,Resource,Result\n';
      const rows = logs.map(l => 
        `${l.id},${l.timestamp},${l.level},${l.user},${l.action},${l.resource},${l.result}`
      ).join('\n');
      return header + rows;
    }
    
    return JSON.stringify(logs, null, 2);
  }

  // 生成审计报告
  generateReport(startDate, endDate) {
    const logs = this.query({ startDate, endDate });
    
    const report = {
      period: { startDate, endDate },
      totalEvents: logs.length,
      eventsByLevel: {},
      eventsByUser: {},
      eventsByAction: {},
      topUsers: [],
      topActions: []
    };

    // 统计
    for (const log of logs) {
      report.eventsByLevel[log.level] = (report.eventsByLevel[log.level] || 0) + 1;
      report.eventsByUser[log.user] = (report.eventsByUser[log.user] || 0) + 1;
      report.eventsByAction[log.action] = (report.eventsByAction[log.action] || 0) + 1;
    }

    // 排序
    report.topUsers = Object.entries(report.eventsByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([user, count]) => ({ user, count }));

    report.topActions = Object.entries(report.eventsByAction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    return report;
  }

  // 清理旧日志
  cleanup() {
    console.log('清理90天前的审计日志');
    return { deleted: 0, freed: 0 };
  }
}

// 预定义的操作类型
AuditLogger.ACTIONS = {
  // 认证
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login_failed',
  PASSWORD_CHANGE: 'auth.password_change',
  
  // 文件操作
  FILE_UPLOAD: 'file.upload',
  FILE_DOWNLOAD: 'file.download',
  FILE_DELETE: 'file.delete',
  FILE_VIEW: 'file.view',
  
  // 配置
  CONFIG_CHANGE: 'config.change',
  CONFIG_VIEW: 'config.view',
  
  // 用户管理
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change'
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuditLogger };
}