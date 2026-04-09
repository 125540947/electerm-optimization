/**
 * electerm-web 自动打开 SFTP 面板补丁
 * 
 * 使用方法:
 * 1. 将此文件复制到 electerm-web 的 build/ 或 dist/ 目录
 * 2. 在 index.html 中引入: <script src="auto-sftp-patch.js"></script>
 * 3. 或者在浏览器控制台中粘贴此代码测试
 * 
 * 功能: 连接 SSH 时自动打开 SFTP 文件管理器面板
 */

(function() {
  'use strict';
  
  const CONFIG = {
    enabled: true,
    autoOpenSftp: true,  // 自动打开 SFTP
    delay: 1000          // 延迟打开时间 (毫秒)
  };
  
  console.log('[Auto-SFTP] 补丁已加载');
  
  // 监听 session 变化
  function initPatch() {
    // 等待 electerm 初始化完成
    const checkReady = setInterval(() => {
      if (window.store && window.store.sessions) {
        clearInterval(checkReady);
        patchSessionManager();
      }
    }, 500);
    
    // 超时后停止检查
    setTimeout(() => clearInterval(checkReady), 10000);
  }
  
  function patchSessionManager() {
    // 拦截创建 session 的方法
    const originalCreateSession = window.store?.createSession;
    
    if (originalCreateSession) {
      window.store.createSession = function(...args) {
        const result = originalCreateSession.apply(this, args);
        
        // 延迟后自动打开 SFTP
        if (CONFIG.autoOpenSftp) {
          setTimeout(() => {
            const sessionType = args[0]?.type || args[0]?.sessionType;
            if (sessionType === 'ssh' || sessionType === 'terminal') {
              openSftpPanel();
              console.log('[Auto-SFTP] 已自动打开 SFTP 面板');
            }
          }, CONFIG.delay);
        }
        
        return result;
      };
      console.log('[Auto-SFTP] 已拦截 createSession');
    }
    
    // 监听 sessions 变化
    window.store?.on('sessions', (sessions) => {
      if (CONFIG.autoOpenSftp && sessions?.length > 0) {
        const activeSession = sessions.find(s => s.type === 'ssh' && s.active);
        if (activeSession && !window._sftpAutoOpened) {
          window._sftpAutoOpened = true;
          setTimeout(openSftpPanel, CONFIG.delay);
        }
      }
    });
  }
  
  function openSftpPanel() {
    // 触发 SFTP 面板打开事件
    // 方法1: 通过 store 触发
    if (window.store) {
      window.store.setTerminalGroupExpand(true);
    }
    
    // 方法2: 通过 UI 操作
    const sftpButtons = document.querySelectorAll('[data-sftp], [title*="SFTP"], [title*="文件"]');
    if (sftpButtons.length > 0) {
      sftpButtons[0].click();
      return;
    }
    
    // 方法3: 查找快捷键
    const findSftpTab = () => {
      const tabs = document.querySelectorAll('.tab, [class*="tab"]');
      for (const tab of tabs) {
        if (tab.textContent?.toLowerCase().includes('sftp') || 
            tab.textContent?.toLowerCase().includes('文件')) {
          return tab;
        }
      }
      return null;
    };
    
    const sftpTab = findSftpTab();
    if (sftpTab) {
      sftpTab.click();
    }
  }
  
  // 导出配置接口
  window.autoSftpConfig = {
    enable: () => { CONFIG.enabled = true; console.log('[Auto-SFTP] 已启用'); },
    disable: () => { CONFIG.enabled = false; console.log('[Auto-SFTP] 已禁用'); },
    setDelay: (ms) => { CONFIG.delay = ms; console.log(`[Auto-SFTP] 延迟设置为 ${ms}ms`); },
    openNow: () => openSftpPanel()
  };
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPatch);
  } else {
    initPatch();
  }
  
})();

console.log('%c Auto-SFTP 补丁 %c 已就绪 ', 'background: #4CAF50; color: white', 'color: #4CAF50');
console.log('使用 window.autoSftpConfig.enable() / disable() 控制');