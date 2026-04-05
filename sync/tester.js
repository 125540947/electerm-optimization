/**
 * electerm-sync 客户端测试工具
 * 用于测试同步功能
 */

class SyncTester {
  constructor(baseUrl = process.env.API_BASE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.userId = null;
  }

  // 注册
  async register(userId, password) {
    const res = await fetch(`${this.baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });
    const data = await res.json();
    if (data.success) {
      this.token = data.token;
      this.userId = userId;
    }
    return data;
  }

  // 登录
  async login(userId, password) {
    const res = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });
    const data = await res.json();
    if (data.success) {
      this.token = data.token;
      this.userId = userId;
    }
    return data;
  }

  // 获取数据
  async getSync() {
    const res = await fetch(`${this.baseUrl}/api/sync`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await res.json();
  }

  // 保存数据
  async putSync(version, data) {
    const res = await fetch(`${this.baseUrl}/api/sync`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ version, data })
    });
    return await res.json();
  }

  // 导出数据
  async export() {
    const res = await fetch(`${this.baseUrl}/api/export`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await res.json();
  }

  // 导入数据
  async import(data, merge = false) {
    const res = await fetch(`${this.baseUrl}/api/import`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data, merge })
    });
    return await res.json();
  }

  // 测试同步
  async testSync() {
    console.log('=== 开始同步测试 ===\n');
    
    // 1. 注册测试用户
    console.log('1. 注册测试用户...');
    const regResult = await this.register('test_user_' + Date.now(), 'test123456');
    console.log('   注册结果:', regResult.success ? '✅ 成功' : '❌ 失败');
    
    // 2. 保存测试数据
    console.log('\n2. 保存测试数据...');
    const testData = {
      bookmarks: [
        { id: '1', title: 'GitHub', url: 'https://github.com' },
        { id: '2', title: 'Google', url: 'https://google.com' }
      ],
      themes: [
        { id: 'dark', name: 'Dark Theme', colors: { bg: '#000', fg: '#fff' } }
      ],
      quickCommands: [
        { id: '1', name: 'List Files', cmd: 'ls -la' }
      ],
      settings: {
        fontSize: 14,
        theme: 'dark'
      }
    };
    
    const putResult = await this.putSync(0, testData);
    console.log('   保存结果:', putResult.success ? `✅ 版本 ${putResult.version}` : '❌ 失败');
    
    // 3. 读取数据
    console.log('\n3. 读取数据...');
    const getResult = await this.getSync();
    console.log('   读取结果:', getResult.version > 0 ? `✅ 版本 ${getResult.version}` : '❌ 失败');
    console.log('   数据类型:', Object.keys(getResult.data || {}).join(', '));
    
    // 4. 导出数据
    console.log('\n4. 导出数据...');
    const exportResult = await this.export();
    console.log('   导出结果:', exportResult.version ? `✅ 版本 ${exportResult.version}` : '❌ 失败');
    
    // 5. 测试冲突
    console.log('\n5. 测试版本冲突...');
    const conflictResult = await this.putSync(0, { test: 'conflict' });
    console.log('   冲突处理:', conflictResult.success === false ? '✅ 正确拒绝' : '⚠️ 未检测到');
    if (conflictResult.serverVersion) {
      console.log('   服务器版本:', conflictResult.serverVersion);
    }
    
    // 6. 修改密码
    console.log('\n6. 测试修改密码...');
    const pwdResult = await this.changePassword('test123456', 'new123456');
    console.log('   修改结果:', pwdResult.success ? '✅ 成功' : '❌ 失败');
    
    console.log('\n=== 测试完成 ===');
    return {
      register: regResult.success,
      put: putResult.success,
      get: getResult.version > 0,
      export: !!exportResult.version,
      conflict: conflictResult.success === false,
      password: pwdResult.success
    };
  }

  // 修改密码
  async changePassword(oldPassword, newPassword) {
    const res = await fetch(`${this.baseUrl}/api/password`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return await res.json();
  }

  // 压力测试
  async stressTest(count = 10) {
    console.log(`=== 开始压力测试 (${count} 次) ===`);
    const results = [];
    const start = Date.now();
    
    for (let i = 0; i < count; i++) {
      const t = Date.now();
      await this.putSync(i, { test: i });
      results.push(Date.now() - t);
    }
    
    const avg = results.reduce((a, b) => a + b, 0) / count;
    const min = Math.min(...results);
    const max = Math.max(...results);
    
    console.log(`\n压力测试结果:`);
    console.log(`   总耗时: ${Date.now() - start}ms`);
    console.log(`   平均响应: ${avg.toFixed(2)}ms`);
    console.log(`   最快: ${min}ms`);
    console.log(`   最慢: ${max}ms`);
    
    return { avg, min, max, total: Date.now() - start };
  }
}

// 导出
if (typeof window !== 'undefined') {
  window.SyncTester = SyncTester;
}

// Node.js 导出
if (typeof module !== 'undefined') {
  module.exports = { SyncTester };
}