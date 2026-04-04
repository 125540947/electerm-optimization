/**
 * 框架安装器
 * 一键安装常见 Web 框架和 CMS
 * 通过 SSH 执行命令实现
 */

class FrameworkInstaller {
  constructor(sshConnection) {
    this.ssh = sshConnection;
  }

  // 可安装的框架列表
  static get FRAMEWORKS() {
    return {
      // PHP 框架
      laravel: {
        name: 'Laravel',
        category: 'PHP',
        versions: ['11', '10', '9'],
        requirements: ['PHP >= 8.1', 'Composer', 'MySQL/PostgreSQL'],
        install: (version, options) => `composer create-project laravel/laravel ${options.path}="${version}"`
      },
      wordpress: {
        name: 'WordPress',
        category: 'PHP',
        versions: ['latest'],
        requirements: ['PHP >= 7.4', 'MySQL'],
        install: (version, options) => `wp core download --path=${options.path}`
      },
      symfony: {
        name: 'Symfony',
        category: 'PHP',
        versions: ['7', '6', '5'],
        requirements: ['PHP >= 8.1', 'Composer'],
        install: (version, options) => `composer create-project symfony/skeleton ${options.path}="${version}.*"`
      },
      
      // Node.js 框架
      express: {
        name: 'Express.js',
        category: 'Node.js',
        versions: ['latest'],
        requirements: ['Node.js >= 18', 'npm'],
        install: (version, options) => `mkdir -p ${options.path} && cd ${options.path} && npm init -y && npm install express`
      },
      nestjs: {
        name: 'NestJS',
        category: 'Node.js',
        versions: ['10', '9'],
        requirements: ['Node.js >= 18', 'npm'],
        install: (version, options) => `@nestjs/cli new ${options.path} --version ${version} --package-manager npm --skip-install`
      },
      nextjs: {
        name: 'Next.js',
        category: 'Node.js',
        versions: ['14', '13'],
        requirements: ['Node.js >= 18'],
        install: (version, options) => `npx create-next-app@latest ${options.path} --version ${version} --use-npm --skip-install`
      },
      nuxt: {
        name: 'Nuxt.js',
        category: 'Node.js',
        versions: ['3'],
        requirements: ['Node.js >= 18'],
        install: (version, options) => `npx nuxi init ${options.path}`
      },
      
      // Python 框架
      django: {
        name: 'Django',
        category: 'Python',
        versions: ['5', '4'],
        requirements: ['Python >= 3.10', 'pip'],
        install: (version, options) => `pip install django==${version}.* && django-admin startproject ${options.path}`
      },
      flask: {
        name: 'Flask',
        category: 'Python',
        versions: ['3', '2'],
        requirements: ['Python >= 3.8', 'pip'],
        install: (version, options) => `pip install flask==${version}.* && mkdir -p ${options.path}`
      }
    };
  }

  // 获取所有框架
  static getAll() {
    return this.FRAMEWORKS;
  }

  // 按类别分组
  static getByCategory() {
    const categories = {};
    for (const [key, fw] of Object.entries(this.FRAMEWORKS)) {
      if (!categories[fw.category]) {
        categories[fw.category] = [];
      }
      categories[fw.category].push({ key, ...fw });
    }
    return categories;
  }

  // 检查服务器环境
  async checkEnvironment() {
    const checks = {
      node: await this.runCommand('node --version'),
      npm: await this.runCommand('npm --version'),
      php: await this.runCommand('php --version'),
      composer: await this.runCommand('composer --version 2>/dev/null || echo "not installed"'),
      python: await this.runCommand('python3 --version'),
      pip: await this.runCommand('pip --version 2>/dev/null || echo "not installed"')
    };
    
    return {
      node: checks.node.output,
      npm: checks.npm.output,
      php: checks.php.output,
      composer: checks.composer.output.includes('not installed') ? null : checks.composer.output,
      python: checks.python.output,
      pip: checks.pip.output.includes('not installed') ? null : checks.pip.output
    };
  }

  // 检查框架依赖
  async checkRequirements(frameworkKey) {
    const framework = this.FRAMEWORKS[frameworkKey];
    if (!framework) return { error: 'Framework not found' };
    
    const env = await this.checkEnvironment();
    const missing = [];
    
    for (const req of framework.requirements) {
      if (req.includes('Node') && !env.node) missing.push('Node.js');
      if (req.includes('PHP') && !env.php) missing.push('PHP');
      if (req.includes('Python') && !env.python) missing.push('Python');
      if (req.includes('Composer') && !env.composer) missing.push('Composer');
    }
    
    return {
      canInstall: missing.length === 0,
      missing,
      environment: env
    };
  }

  // 安装框架 (生成 SSH 命令)
  install(frameworkKey, version, options = {}) {
    const framework = this.FRAMEWORKS[frameworkKey];
    if (!framework) return { error: 'Framework not found' };
    
    const installPath = options.path || '/var/www/html';
    const installCmd = framework.install(version, { path: installPath });
    
    // 返回完整的安装命令序列
    const commands = [
      `# 安装 ${framework.name} ${version}`,
      `mkdir -p ${installPath}`,
      installCmd,
      `# 设置权限`,
      `chown -R www-data:www-data ${installPath}`,
      `chmod -R 755 ${installPath}`
    ];
    
    return {
      framework: frameworkKey,
      version,
      path: installPath,
      commands,
      estimatedTime: '5-15 分钟',
      note: '实际执行需要在服务器上运行'
    };
  }

  // 执行命令 (通过 SSH)
  async runCommand(cmd) {
    // 这里需要 SSH 连接实现
    return {
      output: '',
      error: '需要 SSH 连接支持',
      success: false
    };
  }
}

// ==================== 安装向导 UI ====================
class FrameworkInstallerUI {
  constructor(container) {
    this.container = container;
    this.installer = new FrameworkInstaller(null);
    this.selectedFramework = null;
  }

  render() {
    const categories = FrameworkInstaller.getByCategory();
    
    let html = `
      <div class="framework-installer">
        <div class="fw-header">
          <h3>🚀 一键安装框架</h3>
          <p>在服务器上快速安装 Web 框架和 CMS</p>
        </div>
        
        <div class="fw-env-check">
          <h4>环境检查</h4>
          <button class="btn btn-secondary btn-sm" onclick="checkEnvironment()">
            <i class="fas fa-search"></i> 检查环境
          </button>
          <div id="envResult" class="env-status"></div>
        </div>
        
        <div class="fw-categories">`;
    
    for (const [category, frameworks] of Object.entries(categories)) {
      html += `
        <div class="fw-category">
          <h5>${category}</h5>
          <div class="fw-list">`;
      
      for (const fw of frameworks) {
        html += `
          <div class="fw-item" onclick="selectFramework('${fw.key}')">
            <span class="fw-name">${fw.name}</span>
            <span class="fw-versions">v${fw.versions.join(', ')}</span>
          </div>`;
      }
      
      html += `</div></div>`;
    }
    
    html += `</div>
        
        <div class="fw-install-panel" id="installPanel" style="display: none;">
          <h4>安装配置</h4>
          <div class="form-group">
            <label>目标路径</label>
            <input type="text" id="installPath" value="/var/www/html" class="input">
          </div>
          <div class="form-group">
            <label>版本</label>
            <select id="versionSelect" class="input"></select>
          </div>
          <button class="btn btn-primary" onclick="startInstall()">
            <i class="fas fa-rocket"></i> 开始安装
          </button>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.FrameworkInstaller = FrameworkInstaller;
  window.FrameworkInstallerUI = FrameworkInstallerUI;
}

if (typeof module !== 'undefined') {
  module.exports = { FrameworkInstaller, FrameworkInstallerUI };
}