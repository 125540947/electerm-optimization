/**
 * electerm-web 同步面板 UI 组件
 * 用于集成到现有的设置/同步界面中
 */

class SyncPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSync: options.onSync || (() => {}),
      onDataChange: options.onDataChange || (() => {}),
      ...options
    };
    
    // 同步状态
    this.currentProvider = options.provider || 'none';
    this.syncing = false;
    
    // 初始化各 provider
    this.providers = {
      none: null,
      webdav: new WebDAVSync(options.webdavConfig),
      custom: new CustomServerSync(options.customConfig)
    };
    
    this.render();
  }

  // 渲染面板
  render() {
    this.container.innerHTML = `
      <div class="sync-panel">
        <div class="sync-header">
          <h3>${t('sync_data') || '数据同步'}</h3>
          <button class="btn-close" id="syncCloseBtn">×</button>
        </div>
        
        <div class="sync-provider-selector">
          <label>${t('sync_provider') || '同步方式'}</label>
          <select id="syncProvider" class="input">
            <option value="none" ${this.currentProvider === 'none' ? 'selected' : ''}>
              ${t('sync_none') || '不启用同步'}
            </option>
            <option value="webdav" ${this.currentProvider === 'webdav' ? 'selected' : ''}>
              WebDAV (网盘/自建)
            </option>
            <option value="custom" ${this.currentProvider === 'custom' ? 'selected' : ''}>
              ${t('sync_custom_server') || '自定义服务器'}
            </option>
            <option value="github" ${this.currentProvider === 'github' ? 'selected' : ''}>
              GitHub Gist
            </option>
            <option value="gitee" ${this.currentProvider === 'gitee' ? 'selected' : ''}>
              Gitee
            </option>
          </select>
        </div>
        
        <div class="sync-config" id="syncConfig">
          ${this.renderProviderConfig(this.currentProvider)}
        </div>
        
        <div class="sync-actions">
          <button class="btn btn-secondary" id="syncTestBtn">
            ${t('test_connection') || '测试连接'}
          </button>
          <button class="btn btn-primary" id="syncNowBtn">
            ${t('sync_now') || '立即同步'}
          </button>
        </div>
        
        <div class="sync-status" id="syncStatus"></div>
        
        <div class="sync-auto">
          <label class="checkbox-label">
            <input type="checkbox" id="autoSync" />
            <span>${t('auto_sync') || '自动同步'}</span>
          </label>
          <select id="syncInterval" class="input" style="width: auto;">
            <option value="60000">1 ${t('minute') || '分钟'}</option>
            <option value="300000" selected>5 ${t('minutes') || '分钟'}</option>
            <option value="600000">10 ${t('minutes') || '分钟'}</option>
            <option value="1800000">30 ${t('minutes') || '分钟'}</option>
            <option value="3600000">1 ${t('hour') || '小时'}</option>
          </select>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }

  // 渲染 provider 配置表单
  renderProviderConfig(provider) {
    switch (provider) {
      case 'webdav':
        return `
          <div class="provider-config">
            <div class="form-group">
              <label>WebDAV URL</label>
              <input type="text" id="webdavUrl" class="input" 
                placeholder="https://your-nas.com/remote.php/dav/files/user/" />
            </div>
            <div class="form-group">
              <label>${t('username') || '用户名'}</label>
              <input type="text" id="webdavUser" class="input" />
            </div>
            <div class="form-group">
              <label>${t('password') || '密码'}</label>
              <input type="password" id="webdavPass" class="input" />
            </div>
            <div class="form-group">
              <label>${t('sync_path') || '同步路径'} (可选)</label>
              <input type="text" id="webdavPath" class="input" value="/electerm/sync.json" />
            </div>
          </div>
        `;
      
      case 'custom':
        return `
          <div class="provider-config">
            <div class="form-group">
              <label>${t('server_url') || '服务器地址'}</label>
              <input type="text" id="customUrl" class="input" 
                placeholder="https://your-server.com" />
            </div>
            <div class="form-group">
              <label>User ID</label>
              <input type="text" id="customUserId" class="input" />
            </div>
            <div class="form-group">
              <label>Token</label>
              <input type="password" id="customToken" class="input" />
            </div>
            <div class="form-group">
              <button class="btn btn-secondary" id="customLoginBtn">
                ${t('login_register') || '登录/注册'}
              </button>
            </div>
          </div>
        `;
      
      case 'github':
      case 'gitee':
        return `
          <div class="provider-config">
            <div class="form-group">
              <label>Gist ID</label>
              <input type="text" id="gistId" class="input" />
            </div>
            <div class="form-group">
              <label>${t('access_token') || '访问令牌'}</label>
              <input type="password" id="gistToken" class="input" />
            </div>
          </div>
        `;
      
      default:
        return `
          <div class="provider-config">
            <p class="text-muted">${t('select_provider') || '请选择同步方式'}</p>
          </div>
        `;
    }
  }

  // 绑定事件
  bindEvents() {
    // Provider 切换
    const providerSelect = document.getElementById('syncProvider');
    providerSelect?.addEventListener('change', (e) => {
      this.currentProvider = e.target.value;
      document.getElementById('syncConfig').innerHTML = 
        this.renderProviderConfig(this.currentProvider);
    });

    // 测试连接
    document.getElementById('syncTestBtn')?.addEventListener('click', () => {
      this.testConnection();
    });

    // 立即同步
    document.getElementById('syncNowBtn')?.addEventListener('click', () => {
      this.syncNow();
    });

    // 自定义服务器登录
    document.getElementById('customLoginBtn')?.addEventListener('click', () => {
      this.customLogin();
    });

    // 关闭按钮
    document.getElementById('syncCloseBtn')?.addEventListener('click', () => {
      this.container.style.display = 'none';
    });
  }

  // 获取当前 provider 配置
  getConfig() {
    const config = { provider: this.currentProvider };
    
    switch (this.currentProvider) {
      case 'webdav':
        config.webdav = {
          url: document.getElementById('webdavUrl')?.value,
          username: document.getElementById('webdavUser')?.value,
          password: document.getElementById('webdavPass')?.value,
          syncPath: document.getElementById('webdavPath')?.value
        };
        break;
        
      case 'custom':
        config.custom = {
          serverUrl: document.getElementById('customUrl')?.value,
          userId: document.getElementById('customUserId')?.value,
          token: document.getElementById('customToken')?.value
        };
        break;
        
      case 'github':
      case 'gitee':
        config.gist = {
          id: document.getElementById('gistId')?.value,
          token: document.getElementById('gistToken')?.value
        };
        break;
    }
    
    return config;
  }

  // 从配置恢复
  loadConfig(config) {
    if (!config) return;
    
    this.currentProvider = config.provider || 'none';
    
    const providerSelect = document.getElementById('syncProvider');
    if (providerSelect) {
      providerSelect.value = this.currentProvider;
    }
    
    document.getElementById('syncConfig').innerHTML = 
      this.renderProviderConfig(this.currentProvider);
    
    // 填充保存的配置
    if (config.webdav) {
      document.getElementById('webdavUrl').value = config.webdav.url || '';
      document.getElementById('webdavUser').value = config.webdav.username || '';
      document.getElementById('webdavPass').value = config.webdav.password || '';
      document.getElementById('webdavPath').value = config.webdav.syncPath || '/electerm/sync.json';
    }
    
    if (config.custom) {
      document.getElementById('customUrl').value = config.custom.serverUrl || '';
      document.getElementById('customUserId').value = config.custom.userId || '';
      document.getElementById('customToken').value = config.custom.token || '';
    }
    
    if (config.gist) {
      document.getElementById('gistId').value = config.gist.id || '';
      document.getElementById('gistToken').value = config.gist.token || '';
    }
  }

  // 测试连接
  async testConnection() {
    const statusEl = document.getElementById('syncStatus');
    statusEl.innerHTML = '<span class="text-muted">测试中...</span>';
    statusEl.className = 'sync-status testing';
    
    try {
      let result;
      
      switch (this.currentProvider) {
        case 'webdav':
          const webdav = new WebDAVSync({
            url: document.getElementById('webdavUrl').value,
            username: document.getElementById('webdavUser').value,
            password: document.getElementById('webdavPass').value
          });
          result = await webdav.testConnection();
          break;
          
        case 'custom':
          const custom = new CustomServerSync({
            serverUrl: document.getElementById('customUrl').value,
            userId: document.getElementById('customUserId').value,
            token: document.getElementById('customToken').value
          });
          result = await custom.testConnection();
          break;
          
        default:
          result = { success: false, error: 'Unsupported provider' };
      }
      
      if (result.success) {
        statusEl.innerHTML = '<span class="text-success">✓ 连接成功</span>';
        statusEl.className = 'sync-status success';
      } else {
        statusEl.innerHTML = `<span class="text-error">✗ ${result.error}</span>`;
        statusEl.className = 'sync-status error';
      }
    } catch (error) {
      statusEl.innerHTML = `<span class="text-error">✗ ${error.message}</span>`;
      statusEl.className = 'sync-status error';
    }
  }

  // 立即同步
  async syncNow() {
    if (this.syncing) return;
    
    const statusEl = document.getElementById('syncStatus');
    const syncBtn = document.getElementById('syncNowBtn');
    
    this.syncing = true;
    syncBtn.disabled = true;
    syncBtn.textContent = t('syncing') || '同步中...';
    
    try {
      const config = this.getConfig();
      const localData = this.options.onDataChange();
      
      let result;
      
      switch (this.currentProvider) {
        case 'webdav':
          const webdav = new WebDAVSync(config.webdav);
          result = await webdav.sync(localData);
          break;
          
        case 'custom':
          const custom = new CustomServerSync(config.custom);
          result = await custom.sync(localData);
          break;
          
        default:
          // 原有 GitHub/Gitee 处理
          result = await this.originalSync(config);
      }
      
      if (result.action === 'pushed' || result.action === 'merged') {
        statusEl.innerHTML = '<span class="text-success">✓ 同步成功</span>';
        this.options.onSync(result);
      } else if (result.action === 'remote-wins') {
        statusEl.innerHTML = '<span class="text-warning">⬇ 已更新远程数据</span>';
        this.options.onSync(result);
      } else {
        statusEl.innerHTML = '<span class="text-muted">已是最新</span>';
      }
    } catch (error) {
      statusEl.innerHTML = `<span class="text-error">✗ ${error.message}</span>`;
    } finally {
      this.syncing = false;
      syncBtn.disabled = false;
      syncBtn.textContent = t('sync_now') || '立即同步';
    }
  }

  // 自定义服务器登录/注册
  async customLogin() {
    const serverUrl = document.getElementById('customUrl').value;
    const userId = document.getElementById('customUserId').value;
    const password = prompt('请输入密码:');
    
    if (!password) return;
    
    try {
      // 尝试登录
      let result = await CustomServerSync.login(serverUrl, userId, password);
      
      if (result.token) {
        document.getElementById('customToken').value = result.token;
        alert('登录成功!');
      }
    } catch (error) {
      // 登录失败，尝试注册
      if (error.message.includes('401') || error.message.includes('not found')) {
        try {
          const result = await CustomServerSync.register(serverUrl, userId, password);
          document.getElementById('customToken').value = result.token;
          alert('注册成功!');
        } catch (regError) {
          alert(`注册失败: ${regError.message}`);
        }
      } else {
        alert(`错误: ${error.message}`);
      }
    }
  }

  // 原有同步方法 (GitHub/Gitee)
  async originalSync(config) {
    // 保留原有实现
    return { action: 'up-to-date' };
  }
}

// 全局挂载
if (typeof window !== 'undefined') {
  window.SyncPanel = SyncPanel;
}
