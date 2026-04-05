/**
 * WebSocket终端服务器
 * 提供实时SSH会话的WebSocket服务
 */

const WebSocket = require('ws');

class WebSocketTerminalServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3001,
      shell: config.shell || '/bin/sh',
      maxSessions: config.maxSessions || 10
    };
    
    this.sessions = new Map();
    this.server = null;
  }

  // 启动服务器
  start() {
    this.server = new WebSocket.Server({ port: this.config.port });
    
    this.server.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log(`WebSocket终端服务器已启动: port ${this.config.port}`);
    return this;
  }

  // 处理新连接
  handleConnection(ws, req) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      ws,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    console.log(`新终端会话: ${sessionId}`);

    // 发送欢迎信息
    ws.send(JSON.stringify({
      type: 'welcome',
      sessionId,
      message: '已连接到WebSocket终端服务器'
    }));

    // 处理消息
    ws.on('message', (data) => {
      this.handleMessage(sessionId, data);
    });

    // 处理关闭
    ws.on('close', () => {
      this.handleClose(sessionId);
    });

    // 处理错误
    ws.on('error', (error) => {
      this.handleError(sessionId, error);
    });
  }

  // 处理消息
  handleMessage(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const message = JSON.parse(data);
      session.lastActivity = new Date();

      switch (message.type) {
        case 'resize':
          // 处理终端大小调整
          this.handleResize(session, message.cols, message.rows);
          break;
          
        case 'input':
          // 处理终端输入
          this.handleInput(session, message.data);
          break;
          
        case 'ping':
          // 心跳检测
          session.ws.send(JSON.stringify({ type: 'pong' }));
          break;
          
        default:
          console.log(`未知消息类型: ${message.type}`);
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  }

  // 处理终端输入
  handleInput(session, data) {
    // 在实际实现中，这里会通过SSH执行命令
    // 并返回输出到WebSocket
    console.log(`会话 ${session.id} 输入: ${data.substring(0, 50)}...`);
    
    // 模拟输出
    session.ws.send(JSON.stringify({
      type: 'output',
      data: '\r\n$ ' + data + '\r\n命令已执行\r\n'
    }));
  }

  // 处理终端大小调整
  handleResize(session, cols, rows) {
    console.log(`会话 ${session.id} 调整大小: ${cols}x${rows}`);
  }

  // 处理连接关闭
  handleClose(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`会话 ${sessionId} 已关闭`);
      this.sessions.delete(sessionId);
    }
  }

  // 处理错误
  handleError(sessionId, error) {
    console.error(`会话 ${sessionId} 错误:`, error.message);
  }

  // 生成会话ID
  generateSessionId() {
    return 'term-' + Math.random().toString(36).substr(2, 9);
  }

  // 停止服务器
  stop() {
    if (this.server) {
      for (const session of this.sessions.values()) {
        session.ws.close();
      }
      this.server.close();
      console.log('WebSocket终端服务器已停止');
    }
  }

  // 获取会话列表
  getSessions() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity
    }));
  }

  // 广播消息
  broadcast(message) {
    const data = JSON.stringify(message);
    for (const session of this.sessions.values()) {
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(data);
      }
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebSocketTerminalServer };
}