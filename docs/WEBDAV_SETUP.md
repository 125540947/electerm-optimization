# WebDAV 配置指南

本文档介绍如何配置 WebDAV 同步。

## 什么是 WebDAV

WebDAV (Web-based Distributed Authoring and Versioning) 是一种允许用户通过 HTTP 协议编辑和管理 Web 服务器上的文件的协议。许多网盘服务都支持 WebDAV。

## 支持的服务商

### 国内服务商

| 服务商 | URL 格式 | 备注 |
|--------|----------|------|
| 坚果云 | `https://dav.jianguoyun.com/dav/` | 免费用户有限制 |
| 阿里云盘 (Alist) | `http://IP:5244/dav/` | 需安装 Alist |
| 115 云 | 部分支持 | 需要第三方工具 |

### 国际服务商

| 服务商 | URL 格式 | 备注 |
|--------|----------|------|
| Nextcloud | `https://your-domain/remote.php/dav/files/user/` | 自建首选 |
| OwnCloud | `https://your-domain/remote.php/dav/files/user/` | |
| pCloud | `https://webdav.pcloud.com/` | |
| Box | `https://box.com/api/2.0/` | |

### 自建 NAS

| 设备 | WebDAV 路径 |
|------|-------------|
| 群晖 DSM | `http://IP:5005/remote.php/dav/files/user/` |
| QNAP | `http://IP:8080/dav/` |
| TrueNAS | `http://IP/dav/username/` |

---

## 坚果云配置

### 1. 获取信息

1. 登录 [坚果云](https://www.jianguoyun.com/)
2. 进入「设置」→「安全」
3. 开启「第三方应用管理」
4. 添加应用，获取「应用密码」

### 2. 配置参数

```
WebDAV URL: https://dav.jianguoyun.com/dav/
用户名: 你的坚果云账号
密码: 应用密码
同步路径: /electerm/sync.json
```

### 3. 测试连接

```bash
curl -X PROPFIND https://dav.jianguoyun.com/dav/ \
  -u "your-email@example.com:your-app-password" \
  -H "Depth: 0"
```

---

## Nextcloud 配置

### 1. 创建用户

在 Nextcloud 管理界面创建专用同步用户。

### 2. 获取 WebDAV 地址

```
https://your-nextcloud.com/remote.php/dav/files/username/
```

### 3. 配置示例

```
WebDAV URL: https://your-nextcloud.com/remote.php/dav/files/syncuser/
用户名: syncuser
密码: syncuser-password
同步路径: /electerm/sync.json
```

### 4. 测试连接

```bash
curl -X PROPFIND https://your-nextcloud.com/remote.php/dav/files/syncuser/ \
  -u "syncuser:syncuser-password" \
  -H "Depth: 0"
```

---

## 阿里云盘 (Alist) 配置

### 1. 安装 Alist

```bash
# Docker 方式
docker run -d --restart=always -v /etc/alist:/opt/alist/data -p 5244:5244 -e PASSWORD=your-password xhofe/alist:latest
```

### 2. 添加阿里云盘

1. 登录 Alist 管理后台
2. 存储 → 添加 → 阿里云盘
3. 输入 refresh_token (需自行获取)

### 3. 配置 WebDAV

```
WebDAV URL: http://your-server:5244/dav/
用户名: admin
密码: your-password
同步路径: /electerm/sync.json
```

---

## 群晖 NAS 配置

### 1. 启用 WebDAV

1. 登录 DSM
2. 控制面板 → 文件服务 → WebDAV
3. 勾选「启用 WebDAV」
4. 选择端口 (默认 5005)

### 2. 创建专用用户

1. 控制面板 → 用户 → 新增
2. 创建 `electerm-sync` 用户
3. 分配只读权限

### 3. 配置参数

```
WebDAV URL: http://192.168.1.100:5005/remote.php/dav/files/electerm-sync/
用户名: electerm-sync
密码: sync-password
同步路径: /electerm/sync.json
```

---

## 在 electerm-web 中配置

### 方法一: 使用同步面板 UI

1. 打开 electerm-web
2. 进入「设置」→「数据同步」
3. 选择「WebDAV」
4. 填写配置信息
5. 点击「测试连接」
6. 保存并同步

### 方法二: 手动配置

编辑配置文件:

```json
{
  "sync": {
    "provider": "webdav",
    "webdav": {
      "url": "https://dav.jianguoyun.com/dav/",
      "username": "your-email@example.com",
      "password": "your-app-password",
      "syncPath": "/electerm/sync.json",
      "autoSync": true,
      "syncInterval": 300000
    }
  }
}
```

---

## 常见问题

### Q1: 连接失败

**可能原因:**
- URL 不正确
- 用户名/密码错误
- 服务商不支持 PUT 方法

**解决方法:**
1. 确认 URL 格式
2. 检查账号密码
3. 尝试用其他 WebDAV 客户端测试

### Q2: 403 禁止访问

**可能原因:**
- 账号权限不足
- 应用密码未开启

**解决方法:**
1. 检查账号权限
2. 坚果云需开启「第三方应用管理」

### Q3: 同步文件被覆盖

**可能原因:**
- 多设备同时修改
- 版本冲突

**解决方法:**
1. 启用「冲突自动解决」
2. 手动合并数据

### Q4: 同步速度慢

**可能原因:**
- 网络连接问题
- 文件过大

**解决方法:**
1. 检查网络
2. 减少同步频率

---

## 安全性建议

1. **使用 HTTPS** - 生产环境必须使用
2. **专用账号** - 创建专用同步用户
3. **限制权限** - 只读即可
4. **定期备份** - 备份 WebDAV 端数据
