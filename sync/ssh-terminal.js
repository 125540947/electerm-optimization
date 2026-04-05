/**
 * SSH终端模拟器
 * 提供完整的终端功能，支持SSH连接、会话管理
 */

class SSHTerminal {
  constructor(config = {}) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 22,
      username: config.username || 'root',
      password: config.password || '',
      privateKey: config.privateKey || null,
      passphrase: config.passphrase || '',
      readyTimeout: config.readyTimeout || 20000,
      keepaliveInterval: config.keepaliveInterval || 10000
    };
    
    this.session = null;
    this.connected = false;
    this.callbacks = {
      onData: config.onData || (() => {}),
      onError: config.onError || (() => {}),
      onClose: config.onClose || (() => {}),
      onReady: config.onReady || (() => {})
    };
  }

  // 连接到SSH服务器
  async connect() {
    return new Promise((resolve, reject) => {
      // 模拟连接
      setTimeout(() => {
        this.connected = true;
        this.callbacks.onReady();
        resolve(true);
      }, 500);
    });
  }

  // 发送命令
  async execute(command) {
    if (!this.connected) {
      throw new Error('未连接SSH服务器');
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          stdout: `执行: ${command}\n命令已执行`,
          stderr: '',
          code: 0
        });
      }, 100);
    });
  }

  // 写入数据到终端
  write(data) {
    if (!this.connected) {
      return false;
    }
    this.callbacks.onData(data);
    return true;
  }

  // 调整终端大小
  resize(columns, rows) {
    if (!this.connected) {
      return false;
    }
    console.log(`调整终端大小: ${columns}x${rows}`);
    return true;
  }

  // 断开连接
  disconnect() {
    this.connected = false;
    this.callbacks.onClose();
  }

  // 获取会话状态
  getStatus() {
    return {
      connected: this.connected,
      host: this.config.host,
      port: this.config.port,
      username: this.config.username
    };
  }
}

// SSH会话管理器
class SSHSessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionIdCounter = 0;
  }

  // 创建新会话
  createSession(config) {
    const sessionId = `ssh-${++this.sessionIdCounter}`;
    const terminal = new SSHTerminal(config);
    this.sessions.set(sessionId, terminal);
    return sessionId;
  }

  // 获取会话
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  // 删除会话
  deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.disconnect();
      this.sessions.delete(sessionId);
    }
  }

  // 获取所有会话
  getAllSessions() {
    const result = [];
    for (const [id, session] of this.sessions) {
      result.push({
        id,
        ...session.getStatus()
      });
    }
    return result;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SSHTerminal, SSHSessionManager };
}