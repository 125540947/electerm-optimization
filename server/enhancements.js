/**
 * electerm-sync-server 功能增强模块
 * 添加更多同步相关的功能
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==================== 数据加密模块 ====================

class DataEncryption {
  constructor(secretKey) {
    this.secretKey = secretKey;
    this.algorithm = 'aes-256-gcm';
  }

  // 加密数据
  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const json = JSON.stringify(data);
    let encrypted = cipher.update(json, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      data: encrypted,
      tag: authTag.toString('hex')
    };
  }

  // 解密数据
  decrypt(encryptedData) {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

// ==================== 数据导出/导入 ====================

class DataExportImport {
  constructor(dataDir) {
    this.dataDir = dataDir;
  }

  // 导出所有用户数据
  exportAll() {
    const usersFile = path.join(this.dataDir, 'users.json');
    if (!fs.existsSync(usersFile)) {
      return { error: 'No data' };
    }

    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const exportData = {
      exported: Date.now(),
      version: '1.0.0',
      users: {}
    };

    for (const userId of Object.keys(users)) {
      const userFile = path.join(this.dataDir, `${userId}.json`);
      if (fs.existsSync(userFile)) {
        exportData.users[userId] = JSON.parse(fs.readFileSync(userFile, 'utf8'));
      }
    }

    return exportData;
  }

  // 导入数据
  importData(importData, merge = true) {
    if (!importData.users) {
      return { error: 'Invalid format' };
    }

    const results = { success: [], failed: [] };

    for (const [userId, data] of Object.entries(importData.users)) {
      try {
        const userFile = path.join(this.dataDir, `${userId}.json`);
        
        if (fs.existsSync(userFile) && !merge) {
          results.failed.push({ userId, error: 'User exists, merge=false' });
          continue;
        }

        fs.writeFileSync(userFile, JSON.stringify(data, null, 2));
        results.success.push(userId);
      } catch (err) {
        results.failed.push({ userId, error: err.message });
      }
    }

    return results;
  }

  // 导出单个用户
  exportUser(userId) {
    const userFile = path.join(this.dataDir, `${userId}.json`);
    if (!fs.existsSync(userFile)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(userFile, 'utf8'));
  }
}

// ==================== 增量同步支持 ====================

class IncrementalSync {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.changesDir = path.join(dataDir, 'changes');
    
    if (!fs.existsSync(this.changesDir)) {
      fs.mkdirSync(this.changesDir, { recursive: true });
    }
  }

  // 记录变更
  recordChange(userId, changeType, data) {
    const changeFile = path.join(this.changesDir, `${userId}.json`);
    let changes = [];
    
    if (fs.existsSync(changeFile)) {
      changes = JSON.parse(fs.readFileSync(changeFile, 'utf8'));
    }

    changes.push({
      timestamp: Date.now(),
      type: changeType,
      data
    });

    // 只保留最近 100 条变更
    changes = changes.slice(-100);
    
    fs.writeFileSync(changeFile, JSON.stringify(changes, null, 2));
  }

  // 获取变更列表
  getChanges(userId, since) {
    const changeFile = path.join(this.changesDir, `${userId}.json`);
    if (!fs.existsSync(changeFile)) {
      return [];
    }

    const changes = JSON.parse(fs.readFileSync(changeFile, 'utf8'));
    
    if (since) {
      return changes.filter(c => c.timestamp > since);
    }
    
    return changes;
  }

  // 清理旧变更
  cleanup(userId, olderThan) {
    const changeFile = path.join(this.changesDir, `${userId}.json`);
    if (!fs.existsSync(changeFile)) {
      return;
    }

    let changes = JSON.parse(fs.readFileSync(changeFile, 'utf8'));
    changes = changes.filter(c => c.timestamp > olderThan);
    
    fs.writeFileSync(changeFile, JSON.stringify(changes, null, 2));
  }
}

// ==================== 审计日志 ====================

class AuditLog {
  constructor(dataDir) {
    this.logFile = path.join(dataDir, 'audit.log');
  }

  log(action, userId, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      ...details
    };
    
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
  }

  getLogs(userId, limit = 100) {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    const lines = fs.readFileSync(this.logFile, 'utf8').split('\n').filter(Boolean);
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (userId) {
      return logs.filter(l => l.userId === userId).slice(-limit);
    }

    return logs.slice(-limit);
  }
}

// ==================== Webhook 通知 ====================

class WebhookNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async notify(event, data) {
    if (!this.webhookUrl) return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          data,
          timestamp: Date.now()
        })
      });
    } catch (err) {
      console.error('Webhook error:', err.message);
    }
  }
}

// ==================== 速率限制 ====================

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isLimited(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // 清理过期请求
    const recentRequests = userRequests.filter(t => now - t < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return true;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return false;
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }
}

// ==================== 导出模块 ====================

module.exports = {
  DataEncryption,
  DataExportImport,
  IncrementalSync,
  AuditLog,
  WebhookNotifier,
  RateLimiter
};
