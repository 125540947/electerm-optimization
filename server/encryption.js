/**
 * electerm-sync 数据加密模块
 * 端到端加密同步
 */

const crypto = require('crypto');

class SyncEncryption {
  constructor(options = {}) {
    this.algorithm = options.algorithm || 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.saltLength = 64;
  }

  // 生成密钥
  generateKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha512');
  }

  // 加密数据
  encrypt(data, password) {
    const salt = crypto.randomBytes(this.saltLength);
    const key = this.generateKey(password, salt);
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const json = JSON.stringify(data);
    let encrypted = cipher.update(json, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      data: encrypted,
      tag: authTag.toString('hex')
    };
  }

  // 解密数据
  decrypt(encryptedData, password) {
    const { salt, iv, data, tag } = encryptedData;
    
    const key = this.generateKey(password, Buffer.from(salt, 'hex'));
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // 生成随机密码
  generatePassword(length = 32) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }
}

// 导出
module.exports = { SyncEncryption };

// 如果直接运行
if (require.main === module) {
  const enc = new SyncEncryption();
  const password = 'my-secret-password';
  
  const testData = {
    bookmarks: [{ id: 1, name: 'Test' }],
    settings: { theme: 'dark' }
  };
  
  console.log('原始数据:', testData);
  
  const encrypted = enc.encrypt(testData, password);
  console.log('加密后:', encrypted);
  
  const decrypted = enc.decrypt(encrypted, password);
  console.log('解密后:', decrypted);
  
  console.log('验证:', JSON.stringify(testData) === JSON.stringify(decrypted));
}
