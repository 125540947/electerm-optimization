/**
 * electerm-sync 配置生成器
 * 快速生成客户端配置
 */

class ConfigGenerator {
  constructor() {
    this.configs = {};
  }

  // 生成 WebDAV 配置
  generateWebDAV(config) {
    const { url, username, password, syncPath, autoSync, interval } = config;
    
    return {
      provider: 'webdav',
      webdav: {
        url,
        username,
        password,
        syncPath: syncPath || '/electerm/sync.json',
        autoSync: autoSync || false,
        syncInterval: interval || 300000
      }
    };
  }

  // 生成自定义服务器配置
  generateCustomServer(config) {
    const { serverUrl, userId, token, autoSync, interval } = config;
    
    return {
      provider: 'custom',
      custom: {
        serverUrl,
        userId,
        token,
        autoSync: autoSync || false,
        syncInterval: interval || 300000
      }
    };
  }

  // 生成 GitHub Gist 配置
  generateGist(config) {
    const { gistId, token, autoSync, interval } = config;
    
    return {
      provider: 'github',
      gist: {
        id: gistId,
        token,
        autoSync: autoSync || false,
        syncInterval: interval || 300000
      }
    };
  }

  // 生成 Gitee 配置
  generateGitee(config) {
    const { gistId, token, autoSync, interval } = config;
    
    return {
      provider: 'gitee',
      gist: {
        id: gistId,
        token,
        autoSync: autoSync || false,
        syncInterval: interval || 300000
      }
    };
  }

  // 验证配置
  validate(config) {
    const errors = [];
    const provider = config.provider;

    switch (provider) {
      case 'webdav':
        if (!config.webdav?.url) errors.push('Missing WebDAV URL');
        if (!config.webdav?.username) errors.push('Missing username');
        if (!config.webdav?.password) errors.push('Missing password');
        break;
        
      case 'custom':
        if (!config.custom?.serverUrl) errors.push('Missing server URL');
        if (!config.custom?.userId) errors.push('Missing user ID');
        if (!config.custom?.token) errors.push('Missing token');
        break;
        
      case 'github':
      case 'gitee':
        if (!config.gist?.id) errors.push('Missing Gist ID');
        if (!config.gist?.token) errors.push('Missing token');
        break;
        
      default:
        errors.push('Unknown provider');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 导出配置
  export(config, format = 'json') {
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }

    if (format === 'json') {
      return JSON.stringify(config, null, 2);
    } else if (format === 'base64') {
      return btoa(JSON.stringify(config));
    }
    
    throw new Error('Unknown format');
  }

  // 导入配置
  import(configString, format = 'json') {
    try {
      if (format === 'base64') {
        return JSON.parse(atob(configString));
      }
      return JSON.parse(configString);
    } catch (err) {
      throw new Error('Invalid config string');
    }
  }
}

// ==================== 配置模板 ====================

const CONFIG_TEMPLATES = {
  // 坚果云
  jianguoyun: {
    provider: 'webdav',
    webdav: {
      url: 'https://dav.jianguoyun.com/dav/',
      username: '',
      password: '',
      syncPath: '/electerm/sync.json',
      autoSync: true,
      syncInterval: 300000
    }
  },

  // Nextcloud
  nextcloud: {
    provider: 'webdav',
    webdav: {
      url: 'https://your-nextcloud.com/remote.php/dav/files/username/',
      username: '',
      password: '',
      syncPath: '/electerm/sync.json',
      autoSync: true,
      syncInterval: 300000
    }
  },

  // 阿里云盘 (Alist)
  aliyun: {
    provider: 'webdav',
    webdav: {
      url: 'http://your-alist-server:5244/dav/',
      username: 'admin',
      password: '',
      syncPath: '/electerm/sync.json',
      autoSync: true,
      syncInterval: 300000
    }
  },

  // 群晖 NAS
  synology: {
    provider: 'webdav',
    webdav: {
      url: 'http://your-nas-ip:5005/remote.php/dav/files/username/',
      username: '',
      password: '',
      syncPath: '/electerm/sync.json',
      autoSync: true,
      syncInterval: 300000
    }
  },

  // 自建服务器
  custom: {
    provider: 'custom',
    custom: {
      serverUrl: 'https://your-server.com',
      userId: '',
      token: '',
      autoSync: true,
      syncInterval: 300000
    }
  }
};

// 全局挂载
if (typeof window !== 'undefined') {
  window.ConfigGenerator = ConfigGenerator;
  window.CONFIG_TEMPLATES = CONFIG_TEMPLATES;
}

module.exports = { ConfigGenerator, CONFIG_TEMPLATES };
