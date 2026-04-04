/**
 * 文件管理器组件
 * 双面板文件管理器，支持本地和远程文件操作
 */

class FileManager {
  constructor(container, options = {}) {
    this.options = {
      localPath: options.localPath || '/',
      remotePath: options.remotePath || '/',
      onFileSelect: options.onFileSelect || (() => {}),
      onPathChange: options.onPathChange || (() => {})
    };
    
    this.local = new FilePanel('local', options.localPath);
    this.remote = new FilePanel('remote', options.remotePath);
    this.activePanel = 'local';
    
    this.render(container);
  }

  render(container) {
    container.innerHTML = `
      <div class="file-manager" style="
        display: flex;
        gap: 16px;
        height: 500px;
        background: #1e1e2e;
        border-radius: 8px;
        overflow: hidden;
      ">
        <div class="panel local-panel" style="flex: 1; display: flex; flex-direction: column;">
          <div class="panel-header" style="
            background: #313244;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span style="color: #cdd6f4; font-weight: 600;">📁 本地</span>
            <button class="btn btn-ghost btn-sm" onclick="fileManager.navigate('local', '..')">⬆️</button>
          </div>
          <div class="panel-path" style="
            background: #45475a;
            padding: 8px 12px;
            color: #a6adc8;
            font-size: 12px;
            font-family: monospace;
          ">${this.options.localPath}</div>
          <div class="panel-content" id="localFiles" style="flex: 1; overflow-y: auto; padding: 8px;">
            ${this.local.render()}
          </div>
        </div>
        
        <div class="panel-actions" style="
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        ">
          <button class="btn btn-secondary btn-sm" onclick="fileManager.upload()">⬆️ 上传</button>
          <button class="btn btn-secondary btn-sm" onclick="fileManager.download()">⬇️ 下载</button>
        </div>
        
        <div class="panel remote-panel" style="flex: 1; display: flex; flex-direction: column;">
          <div class="panel-header" style="
            background: #313244;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span style="color: #cdd6f4; font-weight: 600;">🌐 远程</span>
            <button class="btn btn-ghost btn-sm" onclick="fileManager.navigate('remote', '..')">⬆️</button>
          </div>
          <div class="panel-path" style="
            background: #45475a;
            padding: 8px 12px;
            color: #a6adc8;
            font-size: 12px;
            font-family: monospace;
          ">${this.options.remotePath}</div>
          <div class="panel-content" id="remoteFiles" style="flex: 1; overflow-y: auto; padding: 8px;">
            ${this.remote.render()}
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }

  bindEvents() {
    // 双击文件/目录处理
    container = document.querySelector('.file-manager');
    container.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.file-item');
      if (item) {
        const panel = item.dataset.panel;
        const path = item.dataset.path;
        const isDir = item.dataset.isDir === 'true';
        
        if (isDir) {
          this.navigate(panel, path);
        } else {
          this.selectFile(panel, path);
        }
      }
    });
  }

  navigate(panel, path) {
    // 模拟导航
    if (panel === 'local') {
      this.options.localPath = path;
    } else {
      this.options.remotePath = path;
    }
    this.render(document.querySelector('.file-manager').parentElement);
  }

  selectFile(panel, path) {
    this.options.onFileSelect({ panel, path });
  }

  upload() {
    // 模拟上传
    alert('上传功能: 需要服务器端 SFTP 支持');
  }

  download() {
    // 模拟下载
    alert('下载功能: 需要服务器端 SFTP 支持');
  }
}

class FilePanel {
  constructor(type, path) {
    this.type = type;
    this.path = path;
    this.files = this.getMockFiles();
  }

  getMockFiles() {
    // 模拟文件列表
    return [
      { name: '.', isDir: true },
      { name: '..', isDir: true },
      { name: '📁 www', isDir: true },
      { name: '📁 logs', isDir: true },
      { name: '📁 config', isDir: true },
      { name: '📄 index.html', isDir: false, size: '4.2 KB' },
      { name: '📄 style.css', isDir: false, size: '12.8 KB' },
      { name: '📄 app.js', isDir: false, size: '8.5 KB' },
      { name: '📄 package.json', isDir: false, size: '1.2 KB' },
      { name: '📄 README.md', isDir: false, size: '2.1 KB' }
    ];
  }

  render() {
    return this.files.map(f => `
      <div class="file-item" data-panel="${this.type}" data-path="${this.path}/${f.name}" data-is-dir="${f.isDir}" style="
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        color: ${f.isDir ? '#89b4fa' : '#cdd6f4'};
      " onmouseover="this.style.background='#313244'" onmouseout="this.style.background='transparent'">
        <span>${f.name}</span>
        <span style="color: #6c7086; font-size: 12px;">${f.size || ''}</span>
      </div>
    `).join('');
  }
}

// ==================== 文件传输管理器 ====================
class TransferManager {
  constructor() {
    this.queue = [];
    this.transfers = new Map();
  }

  // 添加传输任务
  addTransfer(file, fromPanel, toPanel) {
    const transfer = {
      id: Date.now(),
      file: file.name,
      from: fromPanel,
      to: toPanel,
      progress: 0,
      status: 'pending',
      startTime: null,
      endTime: null
    };
    
    this.queue.push(transfer);
    this.renderQueue();
    return transfer.id;
  }

  // 开始传输
  async startTransfer(transferId) {
    const transfer = this.queue.find(t => t.id === transferId);
    if (!transfer) return;
    
    transfer.status = 'transferring';
    transfer.startTime = Date.now();
    
    // 模拟传输进度
    for (let i = 0; i <= 100; i += 10) {
      transfer.progress = i;
      this.updateProgress(transferId);
      await new Promise(r => setTimeout(r, 200));
    }
    
    transfer.status = 'completed';
    transfer.endTime = Date.now();
    this.updateProgress(transferId);
  }

  updateProgress(transferId) {
    // 更新 UI
    const el = document.getElementById(`transfer-${transferId}`);
    if (el) {
      const progress = el.querySelector('.progress-bar');
      if (progress) {
        progress.style.width = `${this.queue.find(t => t.id === transferId).progress}%`;
      }
    }
  }

  renderQueue() {
    const container = document.getElementById('transferQueue');
    if (!container) return;
    
    container.innerHTML = this.queue.map(t => `
      <div id="transfer-${t.id}" class="transfer-item" style="
        background: #313244;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #cdd6f4;">${t.file}</span>
          <span style="color: ${t.status === 'completed' ? '#a6e3a1' : '#f9e2af'};">${t.status}</span>
        </div>
        <div class="progress" style="
          background: #45475a;
          height: 4px;
          border-radius: 2px;
        ">
          <div class="progress-bar" style="
            background: #89b4fa;
            height: 100%;
            width: ${t.progress}%;
            border-radius: 2px;
            transition: width 0.2s;
          "></div>
        </div>
      </div>
    `).join('');
  }

  // 批量操作
  async transferMultiple(files, fromPanel, toPanel) {
    for (const file of files) {
      const id = this.addTransfer(file, fromPanel, toPanel);
      await this.startTransfer(id);
    }
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.FileManager = FileManager;
  window.TransferManager = TransferManager;
}

if (typeof module !== 'undefined') {
  module.exports = { FileManager, TransferManager };
}