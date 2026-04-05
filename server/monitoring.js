/**
 * 监控告警系统
 * Prometheus风格
 */

class MonitoringSystem {
  constructor(config = {}) {
    this.config = {
      retentionDays: config.retentionDays || 15,
      scrapeInterval: config.scrapeInterval || 60000, // 1分钟
      alertThreshold: config.alertThreshold || {}
    };

    this.metrics = new Map();
    this.alerts = new Map();
    this.alertRules = [];
    this.targets = [];
  }

  // 添加监控目标
  addTarget(target) {
    this.targets.push({
      ...target,
      lastScrape: null,
      status: 'unknown'
    });
  }

  // 添加指标
  addMetric(name, value, labels = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push({
      value,
      labels,
      timestamp: new Date()
    });

    // 保持数据保留期限
    this.pruneOldMetrics(name);
  }

  // 修剪旧指标
  pruneOldMetrics(name) {
    const cutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    const metrics = this.metrics.get(name);
    
    this.metrics.set(name, metrics.filter(m => m.timestamp.getTime() > cutoff));
  }

  // 获取指标
  getMetric(name, labels = {}) {
    const metrics = this.metrics.get(name) || [];
    return metrics.filter(m => {
      for (const key in labels) {
        if (m.labels[key] !== labels[key]) return false;
      }
      return true;
    });
  }

  // 计算指标统计
  getMetricStats(name, duration = 3600000) {
    const cutoff = Date.now() - duration;
    const metrics = (this.metrics.get(name) || [])
      .filter(m => m.timestamp.getTime() > cutoff)
      .map(m => m.value);

    if (metrics.length === 0) return null;

    const sorted = [...metrics].sort((a, b) => a - b);
    const sum = metrics.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / metrics.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  // 添加告警规则
  addAlertRule(rule) {
    this.alertRules.push({
      ...rule,
      id: 'alert-' + Math.random().toString(36).substr(2, 9),
      enabled: rule.enabled !== false,
      lastTriggered: null,
      triggers: 0
    });
  }

  // 评估告警规则
  evaluateRules() {
    const triggeredAlerts = [];

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const metrics = this.getMetric(rule.metric, rule.labels || {});
      if (metrics.length === 0) continue;

      const latestValue = metrics[metrics.length - 1].value;
      let shouldAlert = false;

      switch (rule.condition) {
        case '>':
          shouldAlert = latestValue > rule.threshold;
          break;
        case '<':
          shouldAlert = latestValue < rule.threshold;
          break;
        case '>=':
          shouldAlert = latestValue >= rule.threshold;
          break;
        case '<=':
          shouldAlert = latestValue <= rule.threshold;
          break;
        case '==':
          shouldAlert = latestValue === rule.threshold;
          break;
      }

      if (shouldAlert) {
        rule.lastTriggered = new Date();
        rule.triggers++;

        const alert = {
          id: rule.id,
          name: rule.name,
          severity: rule.severity || 'warning',
          message: rule.message.replace('{{value}}', latestValue).replace('{{threshold}}', rule.threshold),
          metric: rule.metric,
          value: latestValue,
          threshold: rule.threshold,
          triggeredAt: new Date()
        };

        this.alerts.set(alert.id, alert);
        triggeredAlerts.push(alert);
      }
    }

    return triggeredAlerts;
  }

  // 获取告警列表
  getAlerts(filters = {}) {
    let alerts = Array.from(this.alerts.values());

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters.status === 'firing') {
      alerts = alerts.filter(a => !a.resolvedAt);
    } else if (filters.status === 'resolved') {
      alerts = alerts.filter(a => a.resolvedAt);
    }

    return alerts;
  }

  // 解决告警
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  // 创建Prometheus格式的指标
  toPrometheusFormat() {
    let output = '';

    for (const [name, metrics] of this.metrics) {
      for (const metric of metrics) {
        let labels = Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        
        labels = labels ? `{${labels}}` : '';
        
        output += `${name}${labels} ${metric.value} ${metric.timestamp.getTime()}\n`;
      }
    }

    return output;
  }

  // 获取监控目标状态
  getTargetsStatus() {
    return this.targets.map(t => ({
      name: t.name,
      url: t.url,
      status: t.status,
      lastScrape: t.lastScrape
    }));
  }

  // 模拟采集指标
  scrapeTargets() {
    for (const target of this.targets) {
      // 模拟采集
      const mockValues = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network_in: Math.random() * 1000,
        network_out: Math.random() * 1000,
        requests: Math.floor(Math.random() * 1000),
        latency: Math.random() * 500
      };

      for (const [key, value] of Object.entries(mockValues)) {
        this.addMetric(key, value, { target: target.name });
      }

      target.lastScrape = new Date();
      target.status = 'up';
    }

    // 评估告警规则
    return this.evaluateRules();
  }

  // 获取系统统计
  getStats() {
    return {
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalAlerts: this.alerts.size,
      activeAlerts: this.getAlerts({ status: 'firing' }).length,
      totalRules: this.alertRules.length,
      enabledRules: this.alertRules.filter(r => r.enabled).length,
      targets: this.targets.length
    };
  }
}

// 预定义告警规则
MonitoringSystem.DEFAULT_RULES = [
  {
    name: 'CPU使用率过高',
    metric: 'cpu',
    condition: '>',
    threshold: 80,
    severity: 'warning',
    message: 'CPU使用率 {{value}}% 超过阈值 {{threshold}}%'
  },
  {
    name: '内存使用率过高',
    metric: 'memory',
    condition: '>',
    threshold: 85,
    severity: 'critical',
    message: '内存使用率 {{value}}% 超过阈值 {{threshold}}%'
  },
  {
    name: '磁盘使用率过高',
    metric: 'disk',
    condition: '>',
    threshold: 90,
    severity: 'critical',
    message: '磁盘使用率 {{value}}% 超过阈值 {{threshold}}%'
  },
  {
    name: '延迟过高',
    metric: 'latency',
    condition: '>',
    threshold: 200,
    severity: 'warning',
    message: '延迟 {{value}}ms 超过阈值 {{threshold}}ms'
  }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MonitoringSystem };
}