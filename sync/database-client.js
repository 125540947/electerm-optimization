/**
 * 数据库连接客户端
 * 为 electerm-optimization 添加数据库管理功能
 * 注意: 实际连接需要服务器端代理支持
 */

class DatabaseClient {
  constructor(config) {
    this.config = {
      type: config.type || 'mysql',
      host: config.host || 'localhost',
      port: config.port || this.getDefaultPort(config.type),
      user: config.user || 'root',
      password: config.password || '',
      database: config.database || ''
    };
    this.apiBase = process.env.API_BASE_URL || 'http://localhost:3000';
  }

  getDefaultPort(type) {
    const ports = {
      mysql: 3306,
      postgresql: 5432,
      mongodb: 27017,
      redis: 6379,
      sqlite: 0
    };
    return ports[type] || 3306;
  }

  // 发送查询请求
  async query(sql) {
    try {
      const response = await fetch(`${this.apiBase}/api/db/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          type: this.config.type,
          host: this.config.host,
          port: this.config.port,
          user: this.config.user,
          password: this.config.password,
          database: this.config.database,
          sql: sql
        })
      });
      return await response.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  // 获取数据库列表
  async getDatabases() {
    const sql = this.config.type === 'mysql' 
      ? 'SHOW DATABASES' 
      : this.config.type === 'postgresql'
      ? "SELECT datname FROM pg_database WHERE datistemplate = false"
      : null;
    return sql ? this.query(sql) : { error: 'Unsupported database type' };
  }

  // 获取表列表
  async getTables() {
    let sql;
    switch (this.config.type) {
      case 'mysql':
        sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${this.config.database}'`;
        break;
      case 'postgresql':
        sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
        break;
      default:
        return { error: 'Unsupported' };
    }
    return this.query(sql);
  }

  // 获取表结构
  async getTableSchema(tableName) {
    let sql;
    switch (this.config.type) {
      case 'mysql':
        sql = `DESCRIBE ${tableName}`;
        break;
      case 'postgresql':
        sql = `SELECT column_name, data_type, is_nullable, column_default 
               FROM information_schema.columns 
               WHERE table_name = '${tableName}'`;
        break;
      default:
        return { error: 'Unsupported' };
    }
    return this.query(sql);
  }

  // 执行 SELECT
  async select(table, limit = 100) {
    return this.query(`SELECT * FROM ${table} LIMIT ${limit}`);
  }

  // 测试连接
  async test() {
    return this.query('SELECT 1');
  }
}

// ==================== 数据库管理器 UI ====================
class DatabaseManagerUI {
  constructor(container) {
    this.container = container;
    this.connections = [];
    this.activeConnection = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="db-manager">
        <div class="db-header">
          <h3>📊 数据库管理</h3>
        </div>
        
        <div class="db-connections">
          <h4>连接列表</h4>
          <div class="db-connection-list" id="connectionList">
            ${this.renderConnectionList()}
          </div>
          <button class="btn btn-primary btn-sm" onclick="showAddConnection()">
            <i class="fas fa-plus"></i> 添加连接
          </button>
        </div>
        
        <div class="db-query" id="queryPanel" style="display: none;">
          <div class="query-input">
            <textarea id="sqlInput" placeholder="SELECT * FROM ..." rows="5"></textarea>
            <button class="btn btn-primary" onclick="executeQuery()">执行</button>
          </div>
          <div class="query-results" id="queryResults"></div>
        </div>
      </div>
    `;
  }

  renderConnectionList() {
    if (this.connections.length === 0) {
      return '<div class="empty">暂无连接</div>';
    }
    return this.connections.map((c, i) => `
      <div class="connection-item" onclick="selectConnection(${i})">
        <span class="db-icon">${this.getDbIcon(c.type)}</span>
        <span class="db-name">${c.name}</span>
        <span class="db-host">${c.host}</span>
      </div>
    `).join('');
  }

  getDbIcon(type) {
    const icons = {
      mysql: '🐬',
      postgresql: '🐘',
      mongodb: '🍃',
      redis: '🔴',
      sqlite: '📄'
    };
    return icons[type] || '📊';
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.DatabaseClient = DatabaseClient;
  window.DatabaseManagerUI = DatabaseManagerUI;
}

if (typeof module !== 'undefined') {
  module.exports = { DatabaseClient, DatabaseManagerUI };
}