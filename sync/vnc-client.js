/**
 * VNC 远程桌面组件
 * 基于 noVNC 的 WebSocket VNC 客户端
 * 可连接 VNC 服务器 (Linux 远程桌面)
 */

class VNCClient {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      host: options.host || '',
      port: options.port || 5900,
      password: options.password || '',
      viewOnly: options.viewOnly || false,
      scale: options.scale || true,
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onError: options.onError || (() => {})
    };
    
    this.rfb = null;
    this.connected = false;
  }

  // 连接 VNC 服务器
  connect() {
    // 使用 WebSocket 连接到 VNC 代理
    // 注意: 需要服务器端配置 noVNC websockify 代理
    const host = this.options.host || process.env.SERVER_HOST || 'localhost';
    const wsUrl = `ws://${host}:3000/api/vnc?host=${this.options.host}&port=${this.options.port}`;
    
    try {
      this.rfb = new RFB(document.getElementById('vncContainer'), wsUrl, {
        credentials: { password: this.options.password },
        viewOnly: this.options.viewOnly
      });
      
      this.rfb.addEventListener('connect', () => {
        this.connected = true;
        this.options.onConnect();
        
        if (this.options.scale) {
          this.rfb.scaleViewport = true;
          this.rfb.resizeSession = true;
        }
      });
      
      this.rfb.addEventListener('disconnect', () => {
        this.connected = false;
        this.options.onDisconnect();
      });
      
      this.rfb.addEventListener('securityfailure', (e) => {
        this.options.onError('认证失败: ' + e.detail.reason);
      });
      
    } catch (err) {
      this.options.onError(err.message);
    }
  }

  // 发送剪贴板
  sendClipboard(text) {
    if (this.rfb && this.connected) {
      this.rfb.clipboardPaste(text);
    }
  }

  // 发送键盘快捷键
  sendKey(keys) {
    if (this.rfb && this.connected) {
      // 发送 Ctrl+Alt+Del
      this.rfb.sendKey(0xFFE3, 'Control_L'); // Ctrl
      this.rfb.sendKey(0xFFE9, 'Alt_L');      // Alt
      this.rfb.sendKey(0xFFFF, 'Delete');     // Del
    }
  }

  disconnect() {
    if (this.rfb) {
      this.rfb.disconnect();
    }
    this.connected = false;
  }
}

// ==================== VNC UI 组件 ====================
class VNCPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.client = null;
    
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="vnc-panel" style="
        background: #1e1e2e;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 600px;
      ">
        <!-- 连接面板 -->
        <div class="vnc-connect" style="padding: 24px;">
          <h3 style="color: #cdd6f4; margin-bottom: 20px;">🖥️ VNC 远程桌面</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label style="color: #a6adc8; font-size: 12px;">服务器地址</label>
              <input type="text" id="vncHost" class="input" placeholder="192.168.1.100">
            </div>
            <div class="form-group">
              <label style="color: #a6adc8; font-size: 12px;">端口</label>
              <input type="text" id="vncPort" class="input" value="5900">
            </div>
          </div>
          
          <div class="form-group">
            <label style="color: #a6adc8; font-size: 12px;">密码</label>
            <input type="password" id="vncPass" class="input" placeholder="VNC 密码">
          </div>
          
          <label style="display: flex; align-items: center; gap: 8px; color: #a6adc8; margin-bottom: 16px;">
            <input type="checkbox" id="vncViewOnly">
            <span style="font-size: 12px;">仅查看模式 (禁用输入)</span>
          </label>
          
          <button class="btn btn-primary" onclick="vncPanel.connect()" style="width: 100%;">
            <i class="fas fa-desktop"></i> 连接
          </button>
          
          <div style="margin-top: 16px; padding: 12px; background: #313244; border-radius: 8px; font-size: 12px; color: #6c7086;">
            <strong>支持的服务器:</strong>
            <ul style="margin: 8px 0 0 16px;">
              <li>Linux: x11vnc, TigerVNC, RealVNC</li>
              <li>macOS: 内置 VNC 服务器</li>
              <li>Windows: RealVNC, TightVNC</li>
            </ul>
          </div>
        </div>
        
        <!-- VNC 显示区 -->
        <div class="vnc-screen" style="display: none; flex: 1; flex-direction: column; background: #000;">
          <div style="background: #313244; padding: 8px 16px; display: flex; justify-content: space-between;">
            <span style="color: #a6adc8; font-size: 12px;">
              🟢 VNC 连接: <span id="vncHostDisplay"></span>
            </span>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-ghost btn-sm" onclick="vncPanel.toggleScale()">🔍 缩放</button>
              <button class="btn btn-ghost btn-sm" onclick="vncPanel.disconnect()">断开</button>
            </div>
          </div>
          
          <div id="vncContainer" style="flex: 1; background: #000;">
            <!-- noVNC 画布将在这里 -->
          </div>
        </div>
      </div>
    `;
  }

  connect() {
    const host = document.getElementById('vncHost').value;
    const port = document.getElementById('vncPort').value;
    const pass = document.getElementById('vncPass').value;
    const viewOnly = document.getElementById('vncViewOnly').checked;
    
    if (!host) {
      alert('请输入服务器地址');
      return;
    }
    
    // 初始化 VNC 客户端
    this.client = new VNCClient(this.container, {
      host: host,
      port: parseInt(port),
      password: pass,
      viewOnly: viewOnly,
      scale: true,
      onConnect: () => {
        document.querySelector('.vnc-connect').style.display = 'none';
        document.querySelector('.vnc-screen').style.display = 'flex';
        document.getElementById('vncHostDisplay').textContent = `${host}:${port}`;
      },
      onDisconnect: () => {
        this.disconnect();
      },
      onError: (err) => {
        alert('连接失败: ' + err);
      }
    });
    
    this.client.connect();
  }

  toggleScale() {
    if (this.client && this.client.rfb) {
      this.client.rfb.scaleViewport = !this.client.rfb.scaleViewport;
    }
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
    }
    document.querySelector('.vnc-connect').style.display = 'block';
    document.querySelector('.vnc-screen').style.display = 'none';
  }
}

// ==================== 服务器端配置说明 ====================
/*
要在服务器上启用 VNC:

1. Ubuntu/Debian 安装 VNC 服务器:
   apt-get update
   apt-get install x11vnc

2. 启动 VNC 服务器:
   x11vnc -display :0 -forever -shared -bg

3. 安装 noVNC websockify 代理:
   git clone https://github.com/novnc/noVNC.git
   cd noVNC
   utils/websockify --web . 6080 localhost:5900

4. 或者使用简化版 WebSocket 代理:
   npm install -g websockify
   websockify --web /path/to/noVNC 3001 localhost:5900

5. 在 electerm-sync-server 中添加路由:
   app.get('/api/vnc', (req, res) => {
     // 代理到 VNC 服务器
   });
*/

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.VNCClient = VNCClient;
  window.VNCPanel = VNCPanel;
}

if (typeof module !== 'undefined') {
  module.exports = { VNCClient, VNCPanel };
}