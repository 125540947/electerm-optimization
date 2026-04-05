/**
 * 插件系统
 * 扩展框架
 */

class PluginManager {
  constructor(config = {}) {
    this.config = {
      pluginsDir: config.pluginsDir || './plugins',
      enabledPlugins: config.enabledPlugins || []
    };

    this.plugins = new Map();
    this.hooks = new Map();
    this.api = null;
  }

  // 初始化API供插件使用
  initAPI(api) {
    this.api = api;
  }

  // 注册插件
  register(plugin) {
    if (!plugin.name) {
      throw new Error('插件必须具有名称');
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已存在`);
    }

    // 验证插件
    if (plugin.validate && !plugin.validate()) {
      throw new Error('插件验证失败');
    }

    // 初始化插件
    if (plugin.init) {
      plugin.init(this.api);
    }

    // 注册钩子
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        this.registerHook(hookName, handler);
      }
    }

    this.plugins.set(plugin.name, plugin);
    console.log(`插件已注册: ${plugin.name}`);

    return this;
  }

  // 卸载插件
  unregister(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    // 调用卸载钩子
    if (plugin.destroy) {
      plugin.destroy();
    }

    this.plugins.delete(pluginName);
    console.log(`插件已卸载: ${pluginName}`);

    return true;
  }

  // 注册钩子
  registerHook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(handler);
  }

  // 触发钩子
  async triggerHook(hookName, data) {
    const handlers = this.hooks.get(hookName) || [];
    const results = [];

    for (const handler of handlers) {
      try {
        const result = await handler(data);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  // 执行插件方法
  async executePluginMethod(pluginName, method, ...args) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !plugin[method]) {
      throw new Error(`插件 ${pluginName} 或方法 ${method} 不存在`);
    }

    return await plugin[method](...args);
  }

  // 获取所有插件
  getPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version || '1.0.0',
      description: p.description || '',
      enabled: true
    }));
  }

  // 获取插件信息
  getPluginInfo(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return null;

    return {
      name: plugin.name,
      version: plugin.version || '1.0.0',
      description: plugin.description || '',
      author: plugin.author || 'Unknown',
      hooks: Object.keys(plugin.hooks || {}),
      methods: Object.keys(plugin).filter(k => typeof plugin[k] === 'function' && k !== 'init' && k !== 'destroy')
    };
  }

  // 获取统计信息
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      totalHooks: this.hooks.size,
      plugins: this.getPlugins().map(p => p.name)
    };
  }
}

// 内置钩子列表
PluginManager.HOOKS = {
  // 请求相关
  BEFORE_REQUEST: 'before_request',
  AFTER_REQUEST: 'after_request',
  
  // 认证相关
  BEFORE_AUTH: 'before_auth',
  AFTER_AUTH: 'after_auth',
  
  // 文件相关
  BEFORE_FILE_UPLOAD: 'before_file_upload',
  AFTER_FILE_UPLOAD: 'after_file_upload',
  BEFORE_FILE_DELETE: 'before_file_delete',
  
  // 系统相关
  SYSTEM_INIT: 'system_init',
  SYSTEM_SHUTDOWN: 'system_shutdown',
  SCHEDULED_TASK: 'scheduled_task'
};

// 示例插件
class SamplePlugin {
  constructor() {
    this.name = 'sample-plugin';
    this.version = '1.0.0';
    this.description = '示例插件';
    this.hooks = {
      before_request: (data) => {
        console.log('Before request:', data.path);
      },
      after_request: (data) => {
        console.log('After request:', data.status);
      }
    };
  }

  init(api) {
    console.log('示例插件初始化');
  }

  customMethod() {
    return '插件方法调用成功';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PluginManager, SamplePlugin };
}