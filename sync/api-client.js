/**
 * electerm-web API 包装器
 * 简化客户端同步操作
 */

class ElectermAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.API_BASE_URL || 'http://localhost:3000';
    this.token = options.token || localStorage.getItem('electerm_token');
    this.userId = options.userId || localStorage.getItem('electerm_user');
  }

  // 获取 headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // 检查是否已登录
  isLoggedIn() {
    return !!this.token;
  }

  // 登录
  async login(userId, password) {
    const response = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      this.token = result.token;
      this.userId = userId;
      localStorage.setItem('electerm_token', this.token);
      localStorage.setItem('electerm_user', this.userId);
    }
    
    return result;
  }

  // 注册
  async register(userId, password) {
    const response = await fetch(`${this.baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      this.token = result.token;
      this.userId = userId;
      localStorage.setItem('electerm_token', this.token);
      localStorage.setItem('electerm_user', this.userId);
    }
    
    return result;
  }

  // 登出
  logout() {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('electerm_token');
    localStorage.removeItem('electerm_user');
  }

  // 获取同步数据
  async getSyncData() {
    if (!this.token) {
      throw new Error('Not logged in');
    }
    
    const response = await fetch(`${this.baseUrl}/api/sync`, {
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  // 保存同步数据
  async saveSyncData(data) {
    if (!this.token) {
      throw new Error('Not logged in');
    }
    
    // 获取当前版本
    const current = await this.getSyncData();
    const version = (current.version || 0) + 1;
    
    const response = await fetch(`${this.baseUrl}/api/sync`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ version, data })
    });
    
    return await response.json();
  }

  // 删除同步数据
  async deleteSyncData() {
    if (!this.token) {
      throw new Error('Not logged in');
    }
    
    const response = await fetch(`${this.baseUrl}/api/sync`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  // 自动同步
  async autoSync(getLocalData, options = {}) {
    const interval = options.interval || 5 * 60 * 1000; // 默认5分钟
    const onSync = options.onSync || (() => {});
    
    setInterval(async () => {
      try {
        const localData = getLocalData();
        const result = await this.saveSyncData(localData);
        onSync(result);
      } catch (err) {
        console.error('Sync error:', err);
      }
    }, interval);
  }
}

// 便捷函数
window.electermAPI = new ElectermAPI();
