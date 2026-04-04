/**
 * 增强文件管理器
 * 添加: 权限修改、多文件标签、压缩解压、断点续传
 */

class EnhancedFileManager {
  constructor(container, options = {}) {
    this.options = options;
    this.tabs = [{ id: 1, name: '本地', type: 'local', path: '/' }];
    this.activeTabId = 1;
    this.transfers = new Map();
    this.nextTabId = 2;
    
    this.render(container);
  }

  render(container) {
    container.innerHTML = `
      <div class="enhanced-file-manager" style="
        background: #1e1e2e;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 550px;
      ">
        <!-- 标签栏 -->
        <div class="tab-bar" style="
          background: #313244;
          display: flex;
          padding: 8px 8px 0;
          gap: 4px;
          overflow-x: auto;
        " id="tabBar">
          ${this.tabs.map(t => this.renderTab(t)).join('')}
          <button class="add-tab-btn" onclick="fm.addTab()" style="
            background: transparent;
            border: none;
            color: #6c7086;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 16px;
          ">+</button>
        </div>
        
        <!-- 工具栏 -->
        <div class="toolbar" style="
          background: #45475a;
          padding: 8px 12px;
          display: flex;
          gap: 8px;
          align-items: center;
        ">
          <button class="btn btn-ghost btn-sm" onclick="fm.navigateUp()">⬆️</button>
          <button class="btn btn-ghost btn-sm" onclick="fm.refresh()">🔄</button>
          <button class="btn btn-ghost btn-sm" onclick="fm.newFolder()">📁+</button>
          <button class="btn btn-ghost btn-sm" onclick="fm.showChmod()">🔐</button>
          <button class="btn btn-ghost btn-sm" onclick="fm.showCompress()">📦</button>
          <div style="flex: 1;"></div>
          <input type="text" placeholder="搜索..." class="input" style="
            width: 150px;
            padding: 4px 8px;
            font-size: 12px;
          " id="fileSearch" onkeyup="fm.filterFiles(this.value)">
        </div>
        
        <!-- 文件列表 -->
        <div class="file-list" id="fileList" style="flex: 1; overflow-y: auto; padding: 8px;">
          ${this.renderFileList()}
        </div>
        
        <!-- 状态栏 -->
        <div class="status-bar" style="
          background: #313244;
          padding: 8px 12px;
          font-size: 12px;
          color: #6c7086;
          display: flex;
          justify-content: space-between;
        ">
          <span id="selectionInfo">已选择: 0 项</span>
          <span id="transferInfo">传输: 0 进行中</span>
        </div>
        
        <!-- 传输面板 (折叠) -->
        <div class="transfer-panel" id="transferPanel" style="
          background: #181825;
          border-top: 1px solid #45475a;
          display: none;
        ">
          <div style="
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span style="color: #cdd6f4;">📤 传输队列</span>
            <button class="btn btn-ghost btn-sm" onclick="fm.toggleTransfers()">⬇️</button>
          </div>
          <div id="transferList" style="max-height: 150px; overflow-y: auto; padding: 0 12px 12px;">
          </div>
        </div>
      </div>
      
      <!-- 权限修改弹窗 -->
      <div id="chmodModal" class="modal" style="
        display: none;
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: #313244;
          padding: 20px;
          border-radius: 12px;
          width: 400px;
        ">
          <h4 style="color: #cdd6f4; margin-bottom: 16px;">🔐 修改权限</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
            ${['所有者', '组', '其他'].map((label, i) => `
              <div style="background: #45475a; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #a6adc8; font-size: 12px; margin-bottom: 4px;">${label}</div>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                  <input type="checkbox" checked> 读
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                  <input type="checkbox" checked> 写
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                  <input type="checkbox" checked> 执行
                </label>
              </div>
            `).join('')}
          </div>
          <div style="margin-bottom: 16px;">
            <label style="color: #a6adc8; font-size: 12px;">八进制:</label>
            <input type="text" value="755" class="input" id="chmodOctal" style="width: 80px; margin-left: 8px;">
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="fm.closeModal('chmodModal')">取消</button>
            <button class="btn btn-primary" onclick="fm.applyChmod()">应用</button>
          </div>
        </div>
      </div>
      
      <!-- 压缩解压弹窗 -->
      <div id="compressModal" class="modal" style="
        display: none;
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: #313244;
          padding: 20px;
          border-radius: 12px;
          width: 400px;
        ">
          <h4 style="color: #cdd6f4; margin-bottom: 16px;">📦 压缩/解压</h4>
          <div style="margin-bottom: 16px;">
            <label style="color: #a6adc8; font-size: 12px;">操作:</label>
            <select class="input" id="compressOp" style="margin-left: 8px;">
              <option value="compress">压缩</option>
              <option value="decompress">解压</option>
            </select>
          </div>
          <div style="margin-bottom: 16px;">
            <label style="color: #a6adc8; font-size: 12px;">格式:</label>
            <select class="input" id="compressFormat" style="margin-left: 8px;">
              <option value="zip">.zip</option>
              <option value="tar.gz">.tar.gz</option>
              <option value="tar">.tar</option>
              <option value="7z">.7z</option>
            </select>
          </div>
          <div style="margin-bottom: 16px;">
            <label style="color: #a6adc8; font-size: 12px;">文件名:</label>
            <input type="text" class="input" id="compressName" style="margin-left: 8px; width: 200px;">
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="fm.closeModal('compressModal')">取消</button>
            <button class="btn btn-primary" onclick="fm.doCompress()">执行</button>
          </div>
        </div>
      </div>
    `;
    
    this.selectedFiles = new Set();
    this.bindEvents();
  }

  renderTab(tab) {
    const isActive = tab.id === this.activeTabId;
    return `
      <div class="file-tab ${isActive ? 'active' : ''}" onclick="fm.switchTab(${tab.id})" style="
        background: ${isActive ? '#1e1e2e' : '#45475a'};
        color: ${isActive ? '#cdd6f4' : '#a6adc8'};
        padding: 8px 16px;
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      ">
        <span>${tab.type === 'local' ? '📁' : '🌐'}</span>
        <span>${tab.name}</span>
        ${this.tabs.length > 1 ? `<span onclick="event.stopPropagation(); fm.closeTab(${tab.id})" style="color: #6c7086;">×</span>` : ''}
      </div>
    `;
  }

  renderFileList() {
    // 模拟文件列表
    const files = [
      { name: '..', isDir: true, size: '-', perms: 'drwxr-xr-x' },
      { name: 'www', isDir: true, size: '-', perms: 'drwxr-xr-x' },
      { name: 'logs', isDir: true, size: '-', perms: 'drwxr-xr-x' },
      { name: 'config', isDir: true, size: '-', perms: 'drwxr-xr-x' },
      { name: 'index.html', isDir: false, size: '4.2 KB', perms: '-rw-r--r--' },
      { name: 'style.css', isDir: false, size: '12.8 KB', perms: '-rw-r--r--' },
      { name: 'app.js', isDir: false, size: '8.5 KB', perms: '-rw-r--r--' },
      { name: 'package.json', isDir: false, size: '1.2 KB', perms: '-rw-r--r--' },
      { name: 'server.py', isDir: false, size: '15.3 KB', perms: '-rw-r--r--' },
    ];
    
    return files.map(f => `
      <div class="file-item ${this.selectedFiles.has(f.name) ? 'selected' : ''}" 
           data-name="${f.name}" data-dir="${f.isDir}"
           onclick="fm.toggleSelect('${f.name}', event)"
           ondblclick="fm.handleDoubleClick('${f.name}', ${f.isDir})"
           style="
            display: flex;
            align-items: center;
            padding: 10px 12px;
            cursor: pointer;
            border-radius: 6px;
            margin-bottom: 4px;
            background: ${this.selectedFiles.has(f.name) ? '#45475a' : 'transparent'};
          ">
        <input type="checkbox" ${this.selectedFiles.has(f.name) ? 'checked' : ''} 
               onclick="event.stopPropagation()" style="margin-right: 12px;">
        <span style="font-size: 16px; margin-right: 8px;">${f.isDir ? '📁' : '📄'}</span>
        <span style="flex: 1; color: #cdd6f4;">${f.name}</span>
        <span style="color: #6c7086; font-size: 12px; width: 80px; text-align: right;">${f.size}</span>
        <span style="color: #89b4fa; font-size: 11px; width: 100px; text-align: right; font-family: monospace;">${f.perms}</span>
      </div>
    `).join('');
  }

  bindEvents() {
    // 右键菜单
    document.querySelector('.file-list')?.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // 显示右键菜单
    });
  }

  toggleSelect(name, event) {
    if (event.ctrlKey || event.metaKey) {
      if (this.selectedFiles.has(name)) {
        this.selectedFiles.delete(name);
      } else {
        this.selectedFiles.add(name);
      }
    } else {
      this.selectedFiles.clear();
      this.selectedFiles.add(name);
    }
    this.render(document.querySelector('.enhanced-file-manager').parentElement);
    document.getElementById('selectionInfo').textContent = `已选择: ${this.selectedFiles.size} 项`;
  }

  handleDoubleClick(name, isDir) {
    if (isDir) {
      // 导航到目录
      this.refresh();
    } else {
      // 打开文件
      alert(`打开文件: ${name}`);
    }
  }

  addTab() {
    const newTab = {
      id: this.nextTabId++,
      name: `标签${this.nextTabId-1}`,
      type: 'local',
      path: '/'
    };
    this.tabs.push(newTab);
    this.activeTabId = newTab.id;
    this.render(document.querySelector('.enhanced-file-manager').parentElement);
  }

  switchTab(id) {
    this.activeTabId = id;
    this.selectedFiles.clear();
    this.render(document.querySelector('.enhanced-file-manager').parentElement);
  }

  closeTab(id) {
    if (this.tabs.length <= 1) return;
    this.tabs = this.tabs.filter(t => t.id !== id);
    if (this.activeTabId === id) {
      this.activeTabId = this.tabs[0].id;
    }
    this.render(document.querySelector('.enhanced-file-manager').parentElement);
  }

  navigateUp() {
    this.refresh();
  }

  refresh() {
    this.renderFileList();
  }

  showChmod() {
    if (this.selectedFiles.size === 0) {
      alert('请先选择文件或目录');
      return;
    }
    document.getElementById('chmodModal').style.display = 'flex';
  }

  applyChmod() {
    const octal = document.getElementById('chmodOctal').value;
    alert(`权限修改: ${octal}\n选中的文件: ${Array.from(this.selectedFiles).join(', ')}\n\n需要服务器端 SFTP 支持`);
    this.closeModal('chmodModal');
  }

  showCompress() {
    if (this.selectedFiles.size === 0) {
      alert('请先选择文件或目录');
      return;
    }
    document.getElementById('compressModal').style.display = 'flex';
  }

  doCompress() {
    const op = document.getElementById('compressOp').value;
    const format = document.getElementById('compressFormat').value;
    const name = document.getElementById('compressName').value;
    
    alert(`${op === 'compress' ? '压缩' : '解压'}: ${name || 'archive'}.${format}\n选中的文件: ${Array.from(this.selectedFiles).join(', ')}\n\n需要服务器端支持`);
    this.closeModal('compressModal');
  }

  closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  toggleTransfers() {
    const panel = document.getElementById('transferPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }

  filterFiles(query) {
    if (!query) {
      this.renderFileList();
      return;
    }
    // 简单过滤
    const items = document.querySelectorAll('.file-item');
    items.forEach(item => {
      const name = item.dataset.name;
      item.style.display = name.includes(query) ? 'flex' : 'none';
    });
  }
}

// ==================== 断点续传支持 ====================
class ResumableTransfer {
  constructor() {
    this.activeTransfers = new Map();
  }

  // 模拟断点续传
  async transfer(file, options = {}) {
    const transferId = Date.now().toString();
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalSize = file.size || 10000000; // 假设 10MB
    const totalChunks = Math.ceil(totalSize / chunkSize);
    
    let currentChunk = options.resumeFrom || 0;
    
    const transfer = {
      id: transferId,
      fileName: file.name,
      totalSize,
      totalChunks,
      currentChunk,
      progress: (currentChunk / totalChunk) * 100,
      status: 'transferring',
      speed: 0,
      startTime: Date.now(),
      paused: false,
      onProgress: options.onProgress || (() => {}),
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || (() => {})
    };
    
    this.activeTransfers.set(transferId, transfer);
    
    // 模拟传输
    while (currentChunk < totalChunks && !transfer.paused) {
      await new Promise(r => setTimeout(r, 100));
      currentChunk++;
      transfer.currentChunk = currentChunk;
      transfer.progress = (currentChunk / totalChunks) * 100;
      
      // 计算速度
      const elapsed = (Date.now() - transfer.startTime) / 1000;
      transfer.speed = (currentChunk * chunkSize) / elapsed;
      
      transfer.onProgress(transfer);
    }
    
    if (transfer.paused) {
      transfer.status = 'paused';
      return { paused: true, resumeFrom: currentChunk };
    }
    
    transfer.status = 'completed';
    transfer.onComplete(transfer);
    return { completed: true };
  }

  pause(transferId) {
    const transfer = this.activeTransfers.get(transferId);
    if (transfer) {
      transfer.paused = true;
    }
  }

  resume(transferId, options) {
    const transfer = this.activeTransfers.get(transferId);
    if (transfer && transfer.status === 'paused') {
      return this.transfer({ name: transfer.fileName, size: transfer.totalSize }, {
        resumeFrom: options.resumeFrom,
        onProgress: transfer.onProgress,
        onComplete: transfer.onComplete
      });
    }
  }

  cancel(transferId) {
    this.activeTransfers.delete(transferId);
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.EnhancedFileManager = EnhancedFileManager;
  window.ResumableTransfer = ResumableTransfer;
}

if (typeof module !== 'undefined') {
  module.exports = { EnhancedFileManager, ResumableTransfer };
}