/**
 * 任务调度器
 * Cron定时任务管理
 */

class TaskScheduler {
  constructor() {
    this.tasks = new Map();
    this.taskIdCounter = 0;
    this.running = false;
    this.intervalId = null;
  }

  // 解析Cron表达式
  parseCron(expression) {
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      throw new Error('无效的Cron表达式');
    }
    
    return {
      minute: parts[0],
      hour: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4]
    };
  }

  // 检查是否匹配当前时间
  matchesCron(cron, date = new Date()) {
    const minute = date.getMinutes().toString();
    const hour = date.getHours().toString();
    const dayOfMonth = date.getDate().toString();
    const month = (date.getMonth() + 1).toString();
    const dayOfWeek = date.getDay().toString();

    const check = (field, value) => {
      if (value === '*') return true;
      if (value.includes(',')) return value.split(',').includes(field);
      if (value.includes('-')) {
        const [start, end] = value.split('-').map(Number);
        const num = parseInt(field);
        return num >= start && num <= end;
      }
      if (value.includes('/')) {
        const [, step] = value.split('/');
        return parseInt(field) % parseInt(step) === 0;
      }
      return field === value;
    };

    return (
      check(cron.minute, minute) &&
      check(cron.hour, hour) &&
      check(cron.dayOfMonth, dayOfMonth) &&
      check(cron.month, month) &&
      check(cron.dayOfWeek, dayOfWeek)
    );
  }

  // 添加任务
  addTask(config) {
    const taskId = `task-${++this.taskIdCounter}`;
    const task = {
      id: taskId,
      name: config.name || '未命名任务',
      command: config.command,
      cron: this.parseCron(config.cron || '* * * * *'),
      cronExpression: config.cron || '* * * * *',
      enabled: config.enabled !== false,
      lastRun: null,
      nextRun: null,
      runCount: 0,
      lastResult: null,
      onExecute: config.onExecute || (() => {}),
      onSuccess: config.onSuccess || (() => {}),
      onError: config.onError || (() => {})
    };

    this.calculateNextRun(task);
    this.tasks.set(taskId, task);
    return taskId;
  }

  // 计算下次执行时间
  calculateNextRun(task) {
    // 简化的下次执行时间计算
    const now = new Date();
    task.nextRun = new Date(now.getTime() + 60000); // 默认1分钟后
  }

  // 删除任务
  deleteTask(taskId) {
    return this.tasks.delete(taskId);
  }

  // 启用/禁用任务
  setTaskEnabled(taskId, enabled) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = enabled;
      return true;
    }
    return false;
  }

  // 手动执行任务
  async executeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    task.lastRun = new Date();
    task.runCount++;

    try {
      const result = await task.onExecute();
      task.lastResult = { success: true, result };
      task.onSuccess(result);
      return result;
    } catch (error) {
      task.lastResult = { success: false, error: error.message };
      task.onError(error);
      throw error;
    }
  }

  // 启动调度器
  start() {
    if (this.running) return;
    
    this.running = true;
    this.intervalId = setInterval(() => {
      this.checkAndRunTasks();
    }, 10000); // 每10秒检查一次

    console.log('任务调度器已启动');
  }

  // 停止调度器
  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('任务调度器已停止');
  }

  // 检查并执行任务
  checkAndRunTasks() {
    const now = new Date();
    
    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;
      
      if (task.nextRun && now >= task.nextRun) {
        this.executeTask(task.id);
        this.calculateNextRun(task);
      }
    }
  }

  // 获取所有任务
  getAllTasks() {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      cronExpression: task.cronExpression,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
      runCount: task.runCount,
      lastResult: task.lastResult?.success ? '成功' : (task.lastResult?.success === false ? '失败' : '无')
    }));
  }

  // 获取任务统计
  getStats() {
    const stats = {
      total: this.tasks.size,
      enabled: 0,
      disabled: 0,
      totalRuns: 0
    };

    for (const task of this.tasks.values()) {
      if (task.enabled) stats.enabled++;
      else stats.disabled++;
      stats.totalRuns += task.runCount;
    }

    return stats;
  }
}

// 常用Cron表达式
TaskScheduler.CRON_EXAMPLES = {
  EVERY_MINUTE: '* * * * *',
  EVERY_HOUR: '0 * * * *',
  EVERY_DAY: '0 0 * * *',
  EVERY_WEEK: '0 0 * * 0',
  EVERY_MONTH: '0 0 1 * *'
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TaskScheduler };
}