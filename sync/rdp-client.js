/**
 * RDP 远程桌面组件
 * 为 electerm-optimization 添加远程桌面功能
 * 
 * 实现方式: WebSocket + noVNC + xfreerdp (服务器端)
 */

// ==================== RDP 连接管理器 ====================
class RDPClient {
  constructor(options = {}) {
    this.options = {
      host: options.host || '',
      port: options.port || 3389,
      username: options.username || '',
      password: options.password || '',
      domain: options.domain || '',
      width: options.width || 1024,
      height: options.height || 768,
      colorDepth: options.colorDepth || 24,
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onError: options.onError || (() => {})
    };
    
    this.connected = false;
    this.ws = null;
  }

  // 连接到 RDP 服务器 (需要服务器端 WebSocket 代理)
  async connect() {
    const host = this.options.host || process.env.SERVER_HOST || 'localhost';
    const wsUrl = `ws://${host}:3000/api/rdp/connect`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.connected = true;
        this.ws.send(JSON.stringify({
          action: 'connect',
          host: this.options.host,
          port: this.options.port,
          username: this.options.username,
          password: this.options.password,
          width: this.options.width,
          height: this.options.height
        }));
        this.options.onConnect();
      };
      
      this.ws.onmessage = (event) => {
        // 处理服务器返回的 RDP 数据
        this.handleMessage(JSON.parse(event.data));
      };
      
      this.ws.onerror = (error) => {
        this.options.onError(error);
      };
      
      this.ws.onclose = () => {
        this.connected = false;
        this.options.onDisconnect();
      };
      
    } catch (err) {
      this.options.onError(err);
    }
  }

  handleMessage(data) {
    // 处理不同类型的消息
    switch (data.type) {
      case 'screen':
        // 更新屏幕数据
        if (this.onScreenUpdate) {
          this.onScreenUpdate(data.image);
        }
        break;
      case 'connected':
        console.log('RDP 连接成功');
        break;
      case 'error':
        this.options.onError(data.message);
        break;
    }
  }

  // 发送键盘事件
  sendKeyEvent(code, pressed) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({
        action: 'key',
        code: code,
        pressed: pressed
      }));
    }
  }

  // 发送鼠标事件
  sendMouseEvent(x, y, button, pressed) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({
        action: 'mouse',
        x: x,
        y: y,
        button: button,
        pressed: pressed
      }));
    }
  }

  // 发送剪贴板
  sendClipboard(text) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({
        action: 'clipboard',
        text: text
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.connected = false;
  }
}

// ==================== RDP UI 组件 ====================
class RDPPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.client = null;
    this.isConnected = false;
    
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="rdp-panel" style="
        background: #1e1e2e;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 600px;
      ">
        <!-- 连接面板 -->
        <div class="rdp-connect" id="rdpConnectPanel" style="padding: 24px;">
          <h3 style="color: #cdd6f4; margin-bottom: 20px;">🖥️ RDP 远程桌面</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label style="color: #a6adc8; font-size: 12px;">服务器地址</label>
              <input type="text" id="rdpHost" class="input" placeholder="192.168.1.100">
            </div>
            <div class="form-group">
              <label style="color: #a6adc8; font-size: 12px;">端口</label>
              <input type="text" id="rdpPort" class="input" value="3389">
            </div>
            <div class="form-group">
              <label style="color: #a6adc8; font-size: 12px;">用户名</label>
              <input type="text" id="rdpUser" class="input" placeholder="Administrator">
            </div>
            <div class="form-group">
              <label style="color: #a6adc8; font-size: 12px;">密码</label>
              <input type="password" id="rdpPass" class="input" placeholder="密码">
            </div>
          </div>
          
          <div class="form-group">
            <label style="color: #a6adc8; font-size: 12px;">分辨率</label>
            <select id="rdpResolution" class="input" style="width: 200px;">
              <option value="800x600">800 x 600</option>
              <option value="1024x768" selected>1024 x 768</option>
              <option value="1280x720">1280 x 720 (720p)</option>
              <option value="1920x1080">1920 x 1080 (1080p)</option>
            </select>
          </div>
          
          <button class="btn btn-primary" onclick="rdpPanel.connect()" style="
            width: 100%;
            margin-top: 16px;
          ">
            <i class="fas fa-desktop"></i> 连接
          </button>
          
          <div style="
            margin-top: 16px;
            padding: 12px;
            background: #313244;
            border-radius: 8px;
            font-size: 12px;
            color: #6c7086;
          ">
            <strong>注意:</strong> 需要服务器端安装 xfreerdp 并配置 WebSocket 代理才能使用。
          </div>
        </div>
        
        <!-- 远程桌面显示区 -->
        <div class="rdp-screen" id="rdpScreen" style="
          display: none;
          flex: 1;
          flex-direction: column;
          background: #000;
        ">
          <div style="
            background: #313244;
            padding: 8px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span style="color: #a6adc8; font-size: 12px;" id="rdpStatus">
              🟢 已连接到: <span id="rdpHostDisplay"></span>
            </span>
            <button class="btn btn-ghost btn-sm" onclick="rdpPanel.disconnect()">
              断开连接
            </button>
          </div>
          
          <div id="rdpCanvas" style="
            flex: 1;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c7086;
          ">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🖥️</div>
              <div>RDP 会话进行中</div>
              <div style="font-size: 12px; margin-top: 8px;">
                键盘和鼠标事件将传输到远程服务器
              </div>
            </div>
          </div>
          
          <!-- 工具栏 -->
          <div style="
            background: #313244;
            padding: 8px 16px;
            display: flex;
            gap: 8px;
          ">
            <button class="btn btn-ghost btn-sm" onclick="rdpPanel.sendCtrlAltDel()">
              Ctrl+Alt+Del
            </button>
            <button class="btn btn-ghost btn-sm" onclick="rdpPanel.toggleFullscreen()">
              全屏
            </button>
            <button class="btn btn-ghost btn-sm" onclick="rdpPanel.screenshot()">
              截图
            </button>
          </div>
        </div>
      </div>
    `;
  }

  connect() {
    const host = document.getElementById('rdpHost').value;
    const port = document.getElementById('rdpPort').value;
    const user = document.getElementById('rdpUser').value;
    const pass = document.getElementById('rdpPass').value;
    const resolution = document.getElementById('rdpResolution').value;
    
    if (!host) {
      alert('请输入服务器地址');
      return;
    }
    
    const [width, height] = resolution.split('x');
    
    this.client = new RDPClient({
      host: host,
      port: parseInt(port),
      username: user,
      password: pass,
      width: parseInt(width),
      height: parseInt(height),
      onConnect: () => {
        this.isConnected = true;
        document.getElementById('rdpConnectPanel').style.display = 'none';
        document.getElementById('rdpScreen').style.display = 'flex';
        document.getElementById('rdpHostDisplay').textContent = `${host}:${port}`;
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.disconnect();
      },
      onError: (err) => {
        alert('连接失败: ' + err.message);
      }
    });
    
    this.client.connect();
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
    }
    this.isConnected = false;
    document.getElementById('rdpConnectPanel').style.display = 'block';
    document.getElementById('rdpScreen').style.display = 'none';
  }

  sendCtrlAltDel() {
    // 发送 Ctrl+Alt+Del
    if (this.client && this.isConnected) {
      this.client.sendKeyEvent('Delete', true); // Ctrl+Alt+Del 序列
    }
  }

  toggleFullscreen() {
    const elem = document.getElementById('rdpCanvas');
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  }

  screenshot() {
    alert('截图功能需要服务器端支持');
  }
}

// ==================== 服务器端实现提示 ====================
/*
服务器端需要安装 xfreerdp 并创建 WebSocket 代理:

1. 安装 xfreerdp:
   # Ubuntu/Debian
   apt-get install xfreerdp
   
   # 或从源码编译最新版

2. 创建 WebSocket RDP 代理服务:

const WebSocket = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  let rdpProcess = null;
  
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    
    if (data.action === 'connect') {
      // 启动 xfreerdp
      rdpProcess = spawn('xfreerdp', [
        `/v:${data.host}:${data.port}`,
        `/u:${data.username}`,
        `/p:${data.password}`,
        `/w:${data.width}`,
        `/h:${data.height}`,
        '/bitmap-cache',
        '/clipboard',
        '/drive:clipboard,/tmp'
      ]);
      
      rdpProcess.stdout.on('data', (buf) => {
        ws.send({ type: 'screen', data: buf.toString('base64') });
      });
      
      rdpProcess.on('close', () => {
        ws.close();
      });
    }
    else if (data.action === 'key') {
      // 转发键盘事件到 xfreerdp
    }
    else if (data.action === 'mouse') {
      // 转发鼠标事件到 xfreerdp
    }
  });
  
  ws.on('close', () => {
    if (rdpProcess) {
      rdpProcess.kill();
    }
  });
});

3. 注意事项:
   - RDP 需要目标服务器允许远程连接
   - Windows 服务器需启用远程桌面
   - Linux 服务器需安装 xrdp
   - 建议使用 SSL/TLS 加密连接
*/

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.RDPClient = RDPClient;
  window.RDPPanel = RDPPanel;
}

if (typeof module !== 'undefined') {
  module.exports = { RDPClient, RDPPanel };
}