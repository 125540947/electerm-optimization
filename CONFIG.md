# electerm-web 优化配置示例

## 目录结构

```
electerm-optimization/
├── README.md                 # 总体说明
├── docker-compose.yml        # Docker 部署
├── scripts/
│   └── install-sync-server.sh  # 一键安装脚本
├── ui/
│   └── modern-theme.css      # 现代主题样式
├── sync/
│   ├── webdav-sync.js       # WebDAV 同步模块
│   └── sync-panel.js        # 同步面板组件
└── config/
    └── sync.example.json    # 配置示例
```

## 快速开始

### 1. 部署同步服务器 (二选一)

#### 方式 A: 一键脚本 (Linux)
```bash
wget https://raw.githubusercontent.com/your-repo/main/scripts/install-sync-server.sh
chmod +x install-sync-server.sh
sudo ./install-sync-server.sh
```

#### 方式 B: Docker
```bash
# 生成 JWT 密钥
export JWT_SECRET=$(openssl rand -hex 32)

# 启动服务
docker-compose up -d
```

### 2. WebDAV 配置 (推荐网盘用户)

支持的 WebDAV 服务:
- **Nextcloud** - 自建云盘
- **坚果云** - 国内网盘
- **阿里云盘 (WebDAV)** - 需安装alist
- **群晖 NAS** - DSM 自带 WebDAV
- **OwnCloud** - 自建云盘

配置示例:
```json
{
  "provider": "webdav",
  "webdav": {
    "url": "https://your-nas.com/remote.php/dav/files/username/",
    "username": "your-username",
    "password": "your-password",
    "syncPath": "/electerm/sync.json"
  }
}
```

### 3. 自定义服务器配置

适用于自建 VPS 的用户:

```json
{
  "provider": "custom",
  "custom": {
    "serverUrl": "https://your-server.com",
    "userId": "your-user-id",
    "token": "your-jwt-token"
  }
}
```

获取 Token:
```bash
# 注册用户
curl -X POST https://your-server.com/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'

# 登录
curl -X POST https://your-server.com/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"your-user","password":"your-pass"}'
```

## UI 优化集成

### 方式 1: CSS 覆盖

在 `index.html` 中引入:
```html
<link rel="stylesheet" href="modern-theme.css">
```

### 方式 2: JS 集成同步面板

```javascript
import { SyncPanel } from './sync/sync-panel.js';

const syncPanel = new SyncPanel(document.getElementById('sync-container'), {
  onSync: (result) => {
    console.log('同步结果:', result);
  },
  onDataChange: () => {
    return getElectermData(); // 获取本地数据
  }
});

// 加载已保存的配置
syncPanel.loadConfig(savedConfig);
```

## 支持的同步数据类型

- [x] 书签 (Bookmarks)
- [x] 主题 (Themes)  
- [x] 快捷命令 (Quick Commands)
- [x] 设置 (Settings)
- [x] 终端配置 (Terminal Profiles)

## 安全建议

1. **生产环境务必修改 JWT_SECRET**
2. **使用 HTTPS** (必选)
3. **配置防火墙** 只开放必要端口
4. **定期备份** `./data` 目录
5. **使用强密码**

## 常见问题

### Q: WebDAV 连接失败
A: 检查 URL 是否正确，部分服务商需要完整路径

### Q: 同步冲突怎么办?
A: 默认以版本号大的为准，可配置手动处理

### Q: 如何迁移数据?
A: 导出本地 JSON -> 手动合并 -> 下次同步时自动合并
