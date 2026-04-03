/**
 * electerm-web 高级功能模块
 * 增强同步客户端功能
 */

// ==================== 加密同步客户端 ====================

class EncryptedSync {
  constructor(options = {}) {
    this.sync = options.sync; // WebDAVSync 或 CustomServerSync 实例
    this.encryptionKey = options.encryptionKey;
    this.encryption = new DataEncryption(encryptionKey);
  }

  // 加密推送
  async pushEncrypted(localData) {
    const encrypted = this.encryption.encrypt(localData);
    return await this.sync.push({ data: encrypted, encrypted: true });
  }

  // 解密拉取
  async pullDecrypted() {
    const result = await this.sync.pull();
    if (!result || !result.data?.encrypted) {
      return result;
    }
    
    return {
      ...result,
      data: this.encryption.decrypt(result.data.data)
    };
  }
}

// ==================== 批量同步管理器 ====================

class BatchSyncManager {
  constructor(syncInstances = []) {
    this.instances = syncInstances;
    this.queue = [];
    this.processing = false;
  }

  // 添加同步任务
  addTask(task) {
    this.queue.push(task);
    if (!this.processing) {
      this.processQueue();
    }
  }

  // 处理队列
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      
      try {
        const result = await this.executeSync(task);
        if (task.onComplete) {
          task.onComplete(result);
        }
      } catch (err) {
        if (task.onError) {
          task.onError(err);
        }
      }
    }

    this.processing = false;
  }

  // 执行同步
  async executeSync(task) {
    const { type, data, instanceIndex = 0 } = task;
    const instance = this.instances[instanceIndex];

    if (!instance) {
      throw new Error('Invalid sync instance');
    }

    if (type === 'push') {
      return await instance.push(data);
    } else {
      return await instance.pull();
    }
  }
}

// ==================== 离线数据缓存 ====================

class OfflineCache {
  constructor(storageKey = 'electerm-sync-cache') {
    this.storageKey = storageKey;
    this.cache = this.loadCache();
  }

  loadCache() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : { version: 0, data: null, updated: 0 };
    } catch {
      return { version: 0, data: null, updated: 0 };
    }
  }

  saveCache(data) {
    this.cache = {
      ...data,
      updated: Date.now()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  getCache() {
    return this.cache;
  }

  clearCache() {
    this.cache = { version: 0, data: null, updated: 0 };
    localStorage.removeItem(this.storageKey);
  }

  hasFreshCache(maxAge = 24 * 60 * 60 * 1000) {
    return Date.now() - this.cache.updated < maxAge;
  }
}

// ==================== 冲突解决器 ====================

class ConflictResolver {
  constructor(strategy = 'auto') {
    this.strategy = strategy;
  }

  // 自动解决策略
  resolve(local, remote) {
    switch (this.strategy) {
      case 'local-wins':
        return { resolved: true, data: local, source: 'local' };
      
      case 'remote-wins':
        return { resolved: true, data: remote, source: 'remote' };
      
      case 'newest-wins':
        const result = local.updated > remote.updated ? local : remote;
        return { resolved: true, data: result, source: result === local ? 'local' : 'remote' };
      
      case 'merge':
        return this.merge(local, remote);
      
      default:
        return { resolved: false, data: null };
    }
  }

  // 智能合并
  merge(local, remote) {
    const merged = {
      bookmarks: this.mergeArrays(local.bookmarks, remote.bookmarks, 'id'),
      themes: this.mergeArrays(local.themes, remote.themes, 'id'),
      quickCommands: this.mergeArrays(local.quickCommands, remote.quickCommands, 'id'),
      settings: { ...remote.settings, ...local.settings }
    };

    return { resolved: true, data: merged, source: 'merged' };
  }

  // 合并数组 (保留两边都有的 + 最新的)
  mergeArrays(localArr = [], remoteArr = [], key) {
    const map = new Map();
    
    for (const item of remoteArr) {
      map.set(item[key], item);
    }
    
    for (const item of localArr) {
      const existing = map.get(item[key]);
      
      if (!existing) {
        map.set(item[key], item);
      } else if (item.updated > existing.updated) {
        map.set(item[key], item);
      }
    }
    
    return Array.from(map.values());
  }
}

// ==================== 同步历史记录 ====================

class SyncHistory {
  constructor(maxRecords = 50) {
    this.maxRecords = maxRecords;
    this.history = this.loadHistory();
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem('electerm-sync-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    localStorage.setItem('electerm-sync-history', JSON.stringify(this.history));
  }

  addRecord(action, details) {
    this.history.push({
      timestamp: Date.now(),
      action,
      ...details
    });

    if (this.history.length > this.maxRecords) {
      this.history = this.history.slice(-this.maxRecords);
    }

    this.saveHistory();
  }

  getRecords(limit = 20) {
    return this.history.slice(-limit);
  }

  clear() {
    this.history = [];
    this.saveHistory();
  }
}

// ==================== 多设备同步状态 ====================

class DeviceSyncState {
  constructor() {
    this.devices = new Map();
  }

  registerDevice(deviceId, info) {
    this.devices.set(deviceId, {
      ...info,
      lastSeen: Date.now()
    });
  }

  updateDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = Date.now();
    }
  }

  getDevices() {
    return Array.from(this.devices.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }

  getActiveDevices(maxInactive = 30 * 60 * 1000) {
    const now = Date.now();
    return this.getDevices().filter(d => now - d.lastSeen < maxInactive);
  }
}

// ==================== 导出 ====================

if (typeof window !== 'undefined') {
  window.EncryptedSync = EncryptedSync;
  window.BatchSyncManager = BatchSyncManager;
  window.OfflineCache = OfflineCache;
  window.ConflictResolver = ConflictResolver;
  window.SyncHistory = SyncHistory;
  window.DeviceSyncState = DeviceSyncState;
}

// 兼容 CommonJS
if (typeof module !== 'undefined') {
  module.exports = {
    EncryptedSync,
    BatchSyncManager,
    OfflineCache,
    ConflictResolver,
    SyncHistory,
    DeviceSyncState
  };
}
