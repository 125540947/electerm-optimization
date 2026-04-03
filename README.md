# Electerm-Web 优化方案

[![GitHub](https://img.shields.io/github/stars/your-repo/electerm-optimization)](https://github.com/your-repo/electerm-optimization)
[![License](https://img.shields.io/github/license/your-repo/electerm-optimization)](LICENSE)
[![Node.js](https://img.shields.io/node/v/electron)](https://nodejs.org)

## 概述
本文档描述 electerm-web 的优化改进，包括：
1. WebDAV 同步支持
2. 自定义同步服务器支持  
3. UI 界面优化

---

## 1. WebDAV 同步

### 数据结构

```typescript
interface SyncData {
  version: string;
  updated: number;
  data: {
    bookmarks: Bookmark[];
    themes: Theme[];
    quickCommands: QuickCommand[];
    settings: Settings;
  };
}
```

### API 调用

```
GET/POST  {webdav-url}/electerm/sync.json
Headers:
  Authorization: Basic base64(user:pass)
  Content-Type: application/json
```

---

## 2. 自定义服务器同步

### API 接口

```
PUT  {server-url}/api/sync
Headers:
  Authorization: Bearer {jwt}
  Content-Type: application/json
Body: { sync data json }

Response: { success: boolean, version: number }
```

### JWT Payload

```json
{
  "userId": "user-identifier",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 3. UI 优化

### 颜色变量

```css
:root {
  --terminal-bg: #1e1e2e;
  --terminal-fg: #cdd6f4;
  --accent: #89b4fa;
  --border: #313244;
  --success: #a6e3a1;
  --error: #f38ba8;
}
```

### 布局改进

- 移动端底部标签栏
- 可折叠侧边栏
- 终端标签拖拽排序
- 快捷命令搜索增强