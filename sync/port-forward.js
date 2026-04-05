/**
 * 端口转发管理器
 * 管理SSH隧道和端口映射
 */

class PortForwardManager {
  constructor() {
    this.forwards = new Map();
    this.forwardIdCounter = 0;
  }

  // 创建本地端口转发 (Local Port Forwarding)
  async createLocalForward(config) {
    const forwardId = `local-${++this.forwardIdCounter}`;
    const forward = {
      id: forwardId,
      type: 'local',
      localPort: config.localPort || 8080,
      remoteHost: config.remoteHost || 'localhost',
      remotePort: config.remotePort || 80,
      sshConfig: {
        host: config.sshHost,
        port: config.sshPort || 22,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey
      },
      status: 'pending',
      createdAt: new Date()
    };

    // 模拟启动端口转发
    setTimeout(() => {
      forward.status = 'active';
      console.log(`本地端口转发已启动: localhost:${forward.localPort} -> ${forward.remoteHost}:${forward.remotePort}`);
    }, 100);

    this.forwards.set(forwardId, forward);
    return forwardId;
  }

  // 创建远程端口转发 (Remote Port Forwarding)
  async createRemoteForward(config) {
    const forwardId = `remote-${++this.forwardIdCounter}`;
    const forward = {
      id: forwardId,
      type: 'remote',
      remotePort: config.remotePort || 8080,
      localHost: config.localHost || 'localhost',
      localPort: config.localPort || 80,
      sshConfig: {
        host: config.sshHost,
        port: config.sshPort || 22,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey
      },
      status: 'pending',
      createdAt: new Date()
    };

    setTimeout(() => {
      forward.status = 'active';
      console.log(`远程端口转发已启动: ${forward.remoteHost}:${forward.remotePort} -> localhost:${forward.localPort}`);
    }, 100);

    this.forwards.set(forwardId, forward);
    return forwardId;
  }

  // 创建动态端口转发 (SOCKS代理)
  async createDynamicForward(config) {
    const forwardId = `dynamic-${++this.forwardIdCounter}`;
    const forward = {
      id: forwardId,
      type: 'dynamic',
      localPort: config.localPort || 1080,
      sshConfig: {
        host: config.sshHost,
        port: config.sshPort || 22,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey
      },
      status: 'pending',
      createdAt: new Date()
    };

    setTimeout(() => {
      forward.status = 'active';
      console.log(`动态端口转发(SOCKS代理)已启动: localhost:${forward.localPort}`);
    }, 100);

    this.forwards.set(forwardId, forward);
    return forwardId;
  }

  // 停止端口转发
  stopForward(forwardId) {
    const forward = this.forwards.get(forwardId);
    if (forward) {
      forward.status = 'stopped';
      console.log(`端口转发已停止: ${forwardId}`);
      return true;
    }
    return false;
  }

  // 删除端口转发
  deleteForward(forwardId) {
    this.stopForward(forwardId);
    return this.forwards.delete(forwardId);
  }

  // 获取所有端口转发
  getAllForwards() {
    return Array.from(this.forwards.values());
  }

  // 获取转发的状态统计
  getStats() {
    const stats = {
      total: this.forwards.size,
      active: 0,
      stopped: 0,
      pending: 0
    };

    for (const forward of this.forwards.values()) {
      stats[forward.status]++;
    }

    return stats;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PortForwardManager };
}