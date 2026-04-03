# electerm-optimization v1.4.0

## 功能更新

### 新增功能

#### 1. 数据加密模块 (`server/encryption.js`)
- 端到端加密同步
- AES-256-GCM 加密算法
- PBKDF2 密钥派生

#### 2. 管理面板 (`ui/admin-panel.html`)
- 实时服务器状态监控
- 用户管理界面
- 系统日志查看
- 添加用户功能

### 优化改进

- 服务器资源监控
- 用户列表管理
- 美化管理界面

## 安装升级

```bash
git pull
cd server
npm install crypto
```

## 使用方法

### 加密同步

```javascript
const { SyncEncryption } = require('./encryption');

const enc = new SyncEncryption();
const password = 'your-password';

// 加密
const encrypted = enc.encrypt(data, password);

// 解密
const decrypted = enc.decrypt(encrypted, password);
```

### 访问管理面板

```
http://82.158.225.97/admin-panel.html
```

## 文件变更

```
new file:   server/encryption.js
new file:   ui/admin-panel.html
```

---

**下载**: https://github.com/125540947/electerm-optimization/releases/tag/v1.4.0
