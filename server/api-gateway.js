/**
 * API网关
 * 统一认证和限流
 */

class APIGateway {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      rateLimitWindow: config.rateLimitWindow || 60000, // 1分钟
      rateLimitMax: config.rateLimitMax || 100, // 最大请求数
      jwtSecret: config.jwtSecret || 'default-secret',
      whitelist: config.whitelist || [],
      blacklist: config.blacklist || []
    };

    this.routes = new Map();
    this.middlewares = [];
    this.rateLimits = new Map();
  }

  // 注册路由
  registerRoute(config) {
    const route = {
      path: config.path,
      method: config.method || 'GET',
      handler: config.handler,
      auth: config.auth !== false,
      rateLimit: config.rateLimit !== false,
      description: config.description || '',
      tags: config.tags || []
    };

    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
    return this;
  }

  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  // 速率限制检查
  checkRateLimit(clientId) {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    let record = this.rateLimits.get(clientId);
    
    if (!record || record.windowStart < windowStart) {
      record = { windowStart: now, count: 0 };
      this.rateLimits.set(clientId, record);
    }
    
    record.count++;
    
    if (record.count > this.config.rateLimitMax) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.windowStart + this.config.rateLimitWindow
      };
    }
    
    return {
      allowed: true,
      remaining: this.config.rateLimitMax - record.count,
      resetTime: record.windowStart + this.config.rateLimitWindow
    };
  }

  // JWT认证
  verifyToken(token) {
    try {
      // 简化的JWT验证
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }
      
      return payload;
    } catch (error) {
      return null;
    }
  }

  // IP黑名单检查
  isBlacklisted(ip) {
    return this.config.blacklist.includes(ip);
  }

  // IP白名单检查
  isWhitelisted(ip) {
    if (this.config.whitelist.length === 0) return true;
    return this.config.whitelist.includes(ip);
  }

  // 请求处理
  async handleRequest(req, res) {
    const clientId = req.ip || 'unknown';
    
    // IP黑名单检查
    if (this.isBlacklisted(clientId)) {
      return res.status(403).json({ error: 'IP已被禁止' });
    }
    
    // 白名单检查
    if (!this.isWhitelisted(clientId)) {
      return res.status(403).json({ error: 'IP不在白名单中' });
    }
    
    // 速率限制
    const rateLimit = this.checkRateLimit(clientId);
    res.setHeader('X-RateLimit-Limit', this.config.rateLimitMax);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimit.resetTime);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }
    
    // 执行中间件
    for (const middleware of this.middlewares) {
      await middleware(req, res);
      if (res.headersSent) return;
    }
    
    // 路由匹配
    const key = `${req.method}:${req.path}`;
    const route = this.routes.get(key);
    
    if (!route) {
      return res.status(404).json({ error: '路由不存在' });
    }
    
    // 认证检查
    if (route.auth) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '缺少认证令牌' });
      }
      
      const token = authHeader.substring(7);
      const payload = this.verifyToken(token);
      
      if (!payload) {
        return res.status(401).json({ error: '无效的认证令牌' });
      }
      
      req.user = payload;
    }
    
    // 执行处理器
    try {
      await route.handler(req, res);
    } catch (error) {
      console.error('请求处理错误:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 获取路由列表
  getRoutes() {
    return Array.from(this.routes.values()).map(r => ({
      path: r.path,
      method: r.method,
      auth: r.auth,
      rateLimit: r.rateLimit,
      description: r.description
    }));
  }

  // 获取统计信息
  getStats() {
    return {
      totalRoutes: this.routes.size,
      totalClients: this.rateLimits.size,
      middlewares: this.middlewares.length
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIGateway };
}