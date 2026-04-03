/**
 * electerm-web WebDAV 同步模块
 * 添加到项目中实现 WebDAV 同步功能
 */

// ==================== WebDAV 同步服务 ====================

class WebDAVSync {
  constructor(options = {}) {
    this.url = options.url || '';
    this.username = options.username || '';
    this.password = options.password || '';
    this.syncPath = options.syncPath || '/electerm/sync.json';
    this.autoSync = options.autoSync || false;
    this.syncInterval = options.syncInterval || 5 * 60 * 1000; // 5分钟
    
    this._lastVersion = 0;
    this._localData = null;
    this._syncing = false;
    this._syncTimer = null;
  }

  // 获取完整 URL
  get fullUrl() {
    return this.url.replace(/\/$/, '') + this.syncPath;
  }

  // 生成 Basic Auth 头
  get authHeader() {
    const credentials = btoa(`${this.username}:${this.password}`);
    return `Basic ${credentials}`;
  }

  // 检查配置是否有效
  isConfigured() {
    return !!(this.url && this.username && this.password);
  }

  // 发起请求
  async request(method, path, body = null) {
    const headers = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(path, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 获取远程数据
  async fetchRemote() {
    try {
      const data = await this.request('GET', this.fullUrl);
      return data;
    } catch (error) {
      if (error.message.includes('404')) {
        return null; // 首次同步，无数据
      }
      throw error;
    }
  }

  // 保存远程数据
  async saveRemote(data) {
    const response = await fetch(this.fullUrl, {
      method: 'PUT',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: data.version || 1,
        updated: Date.now(),
        data: data.data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  }

  // 同步数据 (拉取)
  async pull() {
    if (!this.isConfigured()) {
      throw new Error('WebDAV not configured');
    }

    const remoteData = await this.fetchRemote();
    
    if (!remoteData) {
      return null;
    }

    this._lastVersion = remoteData.version || 0;
    return remoteData;
  }

  // 同步数据 (推送)
  async push(localData) {
    if (!this.isConfigured()) {
      throw new Error('WebDAV not configured');
    }

    const version = (this._lastVersion || 0) + 1;
    
    await this.saveRemote({
      version,
      data: localData
    });

    this._lastVersion = version;
    return version;
  }

  // 双向同步
  async sync(localData, onConflict) {
    if (this._syncing) {
      throw new Error('Sync already in progress');
    }

    this._syncing = true;

    try {
      // 获取远程数据
      const remoteData = await this.fetchRemote();

      // 无远程数据，直接推送
      if (!remoteData) {
        const version = await this.push(localData);
        return { action: 'pushed', version };
      }

      // 版本检查
      const localVersion = localData?.version || 0;
      
      if (remoteData.version > localVersion) {
        // 远程版本更新
        if (onConflict) {
          const resolved = await onConflict('remote-wins', remoteData.data);
          if (resolved) {
            this._localData = resolved;
            return { action: 'merged', data: resolved };
          }
        }
        return { action: 'remote-wins', data: remoteData.data };
      } else if (remoteData.version < localVersion) {
        // 本地版本更新，推送
        const version = await this.push(localData);
        return { action: 'pushed', version };
      } else {
        // 版本相同
        return { action: 'up-to-date' };
      }
    } finally {
      this._syncing = false;
    }
  }

  // 开启自动同步
  startAutoSync(getLocalData, onSync) {
    if (this._syncTimer) {
      return;
    }

    this._syncTimer = setInterval(async () => {
      try {
        const localData = getLocalData();
        const result = await this.sync(localData);
        if (onSync) {
          onSync(result);
        }
      } catch (error) {
        console.error('Auto sync error:', error);
      }
    }, this.syncInterval);
  }

  // 停止自动同步
  stopAutoSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
      this._syncTimer = null;
    }
  }

  // 测试连接
  async testConnection() {
    try {
      await this.request('PROPFIND', this.url.replace(/\/$/, '') + '/');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ==================== 自定义服务器同步 ====================

class CustomServerSync {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || '';
    this.userId = options.userId || '';
    this.token = options.token || '';
    this.autoSync = options.autoSync || false;
    this.syncInterval = options.syncInterval || 5 * 60 * 1000;
    
    this._lastVersion = 0;
    this._syncing = false;
    this._syncTimer = null;
  }

  // 检查配置
  isConfigured() {
    return !!(this.serverUrl && this.userId && this.token);
  }

  // 生成 Auth 头
  get authHeader() {
    return `Bearer ${this.token}`;
  }

  // 发起请求
  async request(method, path, body = null) {
    const headers = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json'
    };

    const url = this.serverUrl.replace(/\/$/, '') + path;
    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  }

  // 获取远程数据
  async fetch() {
    try {
      const result = await this.request('GET', '/api/sync');
      this._lastVersion = result.version || 0;
      return result;
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return { version: 0, data: null };
      }
      throw error;
    }
  }

  // 保存远程数据
  async save(localData) {
    const version = (this._lastVersion || 0) + 1;
    
    const result = await this.request('PUT', '/api/sync', {
      version,
      data: localData
    });

    if (!result.success) {
      throw new Error(result.error || 'Sync failed');
    }

    this._lastVersion = result.version;
    return result;
  }

  // 同步
  async sync(localData, onConflict) {
    if (this._syncing) {
      throw new Error('Sync already in progress');
    }

    this._syncing = true;

    try {
      const remoteData = await this.fetch();

      // 无远程数据
      if (!remoteData.data) {
        const result = await this.save(localData);
        return { action: 'pushed', version: result.version };
      }

      const localVersion = localData?.version || 0;

      if (remoteData.version > localVersion) {
        if (onConflict) {
          const resolved = await onConflict('remote-wins', remoteData.data);
          if (resolved) {
            return { action: 'merged', data: resolved };
          }
        }
        return { action: 'remote-wins', data: remoteData.data };
      } else if (remoteData.version < localVersion) {
        const result = await this.save(localData);
        return { action: 'pushed', version: result.version };
      }

      return { action: 'up-to-date' };
    } finally {
      this._syncing = false;
    }
  }

  // 开启自动同步
  startAutoSync(getLocalData, onSync) {
    if (this._syncTimer) return;

    this._syncTimer = setInterval(async () => {
      try {
        const localData = getLocalData();
        const result = await this.sync(localData);
        if (onSync) onSync(result);
      } catch (error) {
        console.error('Auto sync error:', error);
      }
    }, this.syncInterval);
  }

  // 停止自动同步
  stopAutoSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
      this._syncTimer = null;
    }
  }

  // 测试连接
  async testConnection() {
    try {
      await this.request('GET', '/api/sync');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 登录获取 Token
  static async login(serverUrl, userId, password) {
    const url = serverUrl.replace(/\/$/, '') + '/api/login';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    return result;
  }

  // 注册用户
  static async register(serverUrl, userId, password) {
    const url = serverUrl.replace(/\/$/, '') + '/api/register';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }

    return result;
  }
}

// ==================== 导出 ====================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebDAVSync, CustomServerSync };
}

if (typeof window !== 'undefined') {
  window.WebDAVSync = WebDAVSync;
  window.CustomServerSync = CustomServerSync;
}
