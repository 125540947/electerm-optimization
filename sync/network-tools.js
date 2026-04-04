/**
 * 增强工具集 - 网络诊断和系统工具
 * 为 electerm-optimization 添加 Marix 类似功能
 */

// ==================== DNS 查询 ====================
class DNSTools {
  static async lookup(domain, type = 'A') {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
      const data = await response.json();
      return {
        domain,
        type,
        status: data.Status === 0 ? 'OK' : 'ERROR',
        answers: data.Answer ? data.Answer.map(a => ({
          type: a.type,
          TTL: a.TTL,
          data: a.data
        })) : []
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  static async checkBlacklist(ip) {
    const rbls = [
      'zen.spamhaus.org',
      'spamcop.net',
      'b.barracudacentral.org',
      'bl.spamcop.net',
      'dnsbl.sorbs.net'
    ];
    
    const results = [];
    for (const rbl of rbls) {
      const reversedIP = ip.split('.').reverse().join('.');
      const queryDomain = `${reversedIP}${rbl}`;
      
      try {
        const response = await fetch(`https://dns.google/resolve?name=${queryDomain}&type=A`);
        const data = await response.json();
        results.push({
          rbl,
          listed: data.Status === 0,
          result: data.Answer ? data.Answer[0].data : 'NXDOMAIN'
        });
      } catch {
        results.push({ rbl, listed: false, error: true });
      }
    }
    
    return results;
  }
}

// ==================== 网络工具 ====================
class NetworkTools {
  // Ping (使用 Web API 模拟)
  static async ping(host) {
    const start = Date.now();
    try {
      await fetch(`https://${host}`, { mode: 'no-cors' });
      return {
        host,
        success: true,
        time: Date.now() - start,
        message: 'Host reachable (via HTTP)'
      };
    } catch {
      return {
        host,
        success: false,
        time: null,
        message: 'Host unreachable'
      };
    }
  }

  // 端口检测
  static async checkPort(host, ports = [22, 80, 443, 3000, 3306, 5432]) {
    // 注意: 浏览器无法直接检测端口，这里使用 API 代理方式
    const results = [];
    for (const port of ports) {
      results.push({ port, status: 'unknown', note: '需要服务器端支持' });
    }
    return results;
  }

  // HTTP 检查
  static async checkHTTP(url) {
    const start = Date.now();
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers = {};
      response.headers.forEach((v, k) => headers[k] = v);
      
      return {
        url,
        status: response.status,
        statusText: response.statusText,
        time: Date.now() - start,
        headers: {
          server: headers['server'],
          contentType: headers['content-type'],
          ssl: url.startsWith('https')
        }
      };
    } catch (err) {
      return { url, error: err.message };
    }
  }

  // WHOIS 查询 (需要代理)
  static async whois(domain) {
    return {
      note: '需要服务器端 WHOIS 服务支持',
      suggestion: '可在服务器端部署 whois 服务'
    };
  }
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.DNSTools = DNSTools;
  window.NetworkTools = NetworkTools;
}

if (typeof module !== 'undefined') {
  module.exports = { DNSTools, NetworkTools };
}