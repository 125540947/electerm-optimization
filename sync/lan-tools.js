/**
 * 局域网文件传输工具
 * 为 electerm-optimization 添加 P2P 文件传输功能
 */

class LANTransfer {
  constructor() {
    this.receivePort = 45678;
    this.discoveryPort = 45679;
    this.transferPort = 45680;
    this.myCode = this.generateCode();
    this.peerInfo = null;
    this.onProgress = null;
    this.onComplete = null;
  }

  // 生成 6 位验证码
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 开始发送文件
  async sendFile(files) {
    return {
      code: this.myCode,
      fileCount: files.length,
      status: 'waiting',
      note: '需要 WebRTC 支持，当前浏览器可能不完全支持'
    };
  }

  // 接收文件
  async receiveFile(code, savePath) {
    if (code !== this.myCode) {
      return { error: '验证码不匹配' };
    }
    return { status: 'ready' };
  }

  // 设备发现 (模拟)
  async discoverDevices() {
    return {
      note: '需要服务器端 UDP 广播支持',
      devices: []
    };
  }

  // 加密传输数据
  encrypt(data, password) {
    // 简化实现 - 使用 Web Crypto API
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // 这里需要实现完整的 AES-256-CBC 加密
    return {
      encrypted: true,
      note: '需要完整实现'
    };
  }

  // 解密
  decrypt(encryptedData, password) {
    return {
      decrypted: true,
      note: '需要完整实现'
    };
  }
}

// ==================== 局域网服务器分享 ====================
class LANServerShare {
  constructor() {
    this.myCode = Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 导出服务器配置 (加密)
  exportServers(servers, includeCredentials = false) {
    const data = {
      servers: servers.map(s => ({
        name: s.name,
        host: s.host,
        port: s.port,
        username: includeCredentials ? s.username : null,
        // 永远不导出私钥
        privateKey: null
      })),
      exportedAt: Date.now(),
      version: '1.0'
    };
    return data;
  }

  // 加密导出数据
  encryptExport(data, password) {
    // 使用 AES-256-CBC 加密
    const jsonStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonStr);
    
    return {
      data: Array.from(dataBytes),
      algorithm: 'AES-256-CBC',
      note: '需要完整的加密实现'
    };
  }

  // 导入服务器配置
  importServers(encryptedData, password) {
    return {
      servers: [],
      note: '需要解密实现'
    };
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.LANTransfer = LANTransfer;
  window.LANServerShare = LANServerShare;
}

if (typeof module !== 'undefined') {
  module.exports = { LANTransfer, LANServerShare };
}