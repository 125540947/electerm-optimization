/**
 * 代码编辑器组件
 * 基于 CodeMirror 6 简化实现
 * 为 electerm-optimization 添加内置代码编辑功能
 */

class CodeEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      language: options.language || 'javascript',
      theme: options.theme || 'dark',
      readOnly: options.readOnly || false,
      lineNumbers: options.lineNumbers !== false,
      onChange: options.onChange || (() => {})
    };
    
    this.content = '';
    this.editor = null;
    this.init();
  }

  init() {
    // 简化版 - 使用 contenteditable div
    this.container.innerHTML = `
      <div class="code-editor" style="
        background: #1e1e2e;
        color: #cdd6f4;
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        font-size: 14px;
        line-height: 1.6;
        border-radius: 8px;
        overflow: hidden;
      ">
        <div class="editor-toolbar" style="
          background: #313244;
          padding: 8px 12px;
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #45475a;
        ">
          <span class="lang-badge" style="
            background: #45475a;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
          ">${this.getLanguageLabel(this.options.language)}</span>
          <button class="editor-btn" onclick="editorInstance.toggleTheme()" style="
            background: transparent;
            border: none;
            color: #a6adc8;
            cursor: pointer;
            padding: 2px 6px;
          ">🌓</button>
          <button class="editor-btn" onclick="editorInstance.formatCode()" style="
            background: transparent;
            border: none;
            color: #a6adc8;
            cursor: pointer;
            padding: 2px 6px;
          ">✨</button>
        </div>
        <div class="editor-content" contenteditable="true" style="
          padding: 16px;
          min-height: 300px;
          outline: none;
          white-space: pre-wrap;
          tab-size: 2;
        " id="editorContent">${this.content}</div>
        <div class="editor-status" style="
          background: #313244;
          padding: 4px 12px;
          font-size: 12px;
          color: #6c7086;
          border-top: 1px solid #45475a;
        ">
          <span id="lineCount">行: 1</span>
          <span id="charCount" style="margin-left: 16px;">字符: 0</span>
        </div>
      </div>
    `;
    
    this.editorContent = this.container.querySelector('#editorContent');
    this.lineCountEl = this.container.querySelector('#lineCount');
    this.charCountEl = this.container.querySelector('#charCount');
    
    // 绑定事件
    this.editorContent.addEventListener('input', () => this.onInput());
    this.editorContent.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    this.updateStatus();
  }

  getLanguageLabel(lang) {
    const labels = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      php: 'PHP',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      yaml: 'YAML',
      bash: 'Bash',
      sql: 'SQL',
      markdown: 'Markdown'
    };
    return labels[lang] || lang;
  }

  handleKeyDown(e) {
    // Tab 键处理
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
    
    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.options.onChange(this.getValue());
    }
  }

  onInput() {
    this.content = this.editorContent.innerText;
    this.updateStatus();
    this.highlightSyntax();
    this.options.onChange(this.content);
  }

  updateStatus() {
    const lines = this.content.split('\n').length;
    this.lineCountEl.textContent = `行: ${lines}`;
    this.charCountEl.textContent = `字符: ${this.content.length}`;
  }

  // 简单语法高亮
  highlightSyntax() {
    // 这里使用简单的正则匹配，实际需要 CodeMirror 或 Monaco Editor
    let html = this.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 字符串
    html = html.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span style="color: #a6e3a1">$&</span>');
    // 注释
    html = html.replace(/(\/\/.*$|#.*$)/gm, '<span style="color: #6c7086">$&</span>');
    // 关键字
    html = html.replace(/\b(function|const|let|var|if|else|for|while|return|import|export|class|def|php|echo)\b/g, '<span style="color: #cba6f7">$&</span>');
    
    // 保存光标位置 (简化处理)
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    this.editorContent.innerHTML = html;
    
    // 恢复光标 (不完美)
    if (range) {
      try {
        selection.removeAllRanges();
        selection.addRange(range);
      } catch {}
    }
  }

  getValue() {
    return this.content;
  }

  setValue(content) {
    this.content = content;
    this.editorContent.innerText = content;
    this.updateStatus();
  }

  toggleTheme() {
    this.options.theme = this.options.theme === 'dark' ? 'light' : 'dark';
    const editor = this.container.querySelector('.code-editor');
    if (this.options.theme === 'light') {
      editor.style.background = '#f5f5f5';
      editor.style.color = '#333';
    } else {
      editor.style.background = '#1e1e2e';
      editor.style.color = '#cdd6f4';
    }
  }

  formatCode() {
    // 简单格式化
    let formatted = this.content;
    
    // JSON 格式化
    if (this.options.language === 'json') {
      try {
        const obj = JSON.parse(this.content);
        formatted = JSON.stringify(obj, null, 2);
      } catch {}
    }
    
    this.setValue(formatted);
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.CodeEditor = CodeEditor;
}

if (typeof module !== 'undefined') {
  module.exports = { CodeEditor };
}