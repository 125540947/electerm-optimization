/**
 * 配置文件版本管理
 * 配置备份/回滚
 */

class ConfigVersionManager {
  constructor(config = {}) {
    this.config = {
      configDir: config.configDir || './configs',
      backupDir: config.backupDir || './backups',
      maxBackups: config.maxBackups || 50,
      autoBackup: config.autoBackup !== false
    };

    this.versions = new Map();
    this.currentVersion = 0;
  }

  // 初始化
  init() {
    console.log('配置文件版本管理系统已初始化');
  }

  // 保存配置
  saveConfig(name, content, metadata = {}) {
    const versionId = ++this.currentVersion;
    const timestamp = new Date().toISOString();
    
    const version = {
      id: versionId,
      name,
      content,
      metadata: {
        ...metadata,
        savedAt: timestamp,
        user: metadata.user || 'system'
      },
      checksum: this.calculateChecksum(content)
    };

    this.versions.set(`${name}-${versionId}`, version);
    
    // 清理旧版本
    this.cleanupOldVersions(name);
    
    console.log(`配置 ${name} 已保存，版本: ${versionId}`);
    return versionId;
  }

  // 计算校验和
  calculateChecksum(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // 获取配置版本列表
  getVersions(configName) {
    const versions = [];
    for (const [key, version] of this.versions) {
      if (key.startsWith(configName + '-')) {
        versions.push({
          id: version.id,
          name: version.name,
          savedAt: version.metadata.savedAt,
          user: version.metadata.user,
          checksum: version.checksum
        });
      }
    }
    return versions.sort((a, b) => b.id - a.id);
  }

  // 获取指定版本
  getVersion(configName, versionId) {
    return this.versions.get(`${configName}-${versionId}`);
  }

  // 获取最新版本
  getLatestVersion(configName) {
    const versions = this.getVersions(configName);
    return versions.length > 0 ? this.getVersion(configName, versions[0].id) : null;
  }

  // 回滚配置
  rollback(configName, versionId) {
    const version = this.getVersion(configName, versionId);
    if (!version) {
      throw new Error(`配置 ${configName} 版本 ${versionId} 不存在`);
    }

    // 保存当前版本作为备份
    const current = this.getLatestVersion(configName);
    if (current) {
      this.saveConfig(configName + '_before_rollback', current.content, {
        user: 'system',
        reason: '回滚前备份'
      });
    }

    // 创建新版本记录回滚
    this.saveConfig(configName, version.content, {
      user: 'system',
      reason: `回滚到版本 ${versionId}`
    });

    console.log(`配置 ${name} 已回滚到版本 ${versionId}`);
    return version;
  }

  // 比较两个版本
  compareVersions(configName, versionId1, versionId2) {
    const v1 = this.getVersion(configName, versionId1);
    const v2 = this.getVersion(configName, versionId2);

    if (!v1 || !v2) {
      throw new Error('版本不存在');
    }

    const diff = {
      version1: versionId1,
      version2: versionId2,
      changes: []
    };

    // 简单的行比较
    const lines1 = v1.content.split('\n');
    const lines2 = v2.content.split('\n');

    const maxLines = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLines; i++) {
      if (lines1[i] !== lines2[i]) {
        diff.changes.push({
          line: i + 1,
          old: lines1[i] || '',
          new: lines2[i] || ''
        });
      }
    }

    diff.added = diff.changes.filter(c => !c.old).length;
    diff.removed = diff.changes.filter(c => !c.new).length;
    diff.modified = diff.changes.filter(c => c.old && c.new).length;

    return diff;
  }

  // 导出配置
  exportConfig(configName, versionId = null) {
    const version = versionId ? this.getVersion(configName, versionId) : this.getLatestVersion(configName);
    if (!version) {
      throw new Error('配置不存在');
    }

    return JSON.stringify({
      name: version.name,
      content: version.content,
      metadata: version.metadata,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // 导入配置
  importConfig(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.name || !data.content) {
        throw new Error('无效的配置格式');
      }

      return this.saveConfig(data.name, data.content, {
        ...data.metadata,
        importedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('导入失败: ' + error.message);
    }
  }

  // 清理旧版本
  cleanupOldVersions(configName) {
    const versions = this.getVersions(configName);
    if (versions.length > this.config.maxBackups) {
      const toDelete = versions.slice(this.config.maxBackups);
      for (const v of toDelete) {
        this.versions.delete(`${configName}-${v.id}`);
      }
    }
  }

  // 获取统计信息
  getStats() {
    const stats = {
      totalConfigs: new Set(),
      totalVersions: this.versions.size,
      byConfig: {}
    };

    for (const [key, version] of this.versions) {
      stats.totalConfigs.add(version.name);
      if (!stats.byConfig[version.name]) {
        stats.byConfig[version.name] = 0;
      }
      stats.byConfig[version.name]++;
    }

    stats.totalConfigs = stats.totalConfigs.size;
    return stats;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConfigVersionManager };
}