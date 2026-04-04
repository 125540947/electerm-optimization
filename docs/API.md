# API 文档

## 基础信息

- **基础 URL**: `http://82.158.225.97:3000`
- **认证方式**: Bearer Token (JWT)
- **返回格式**: JSON

## 认证接口

### 注册用户

```
POST /api/register
```

**请求体:**
```json
{
  "userId": "your-user",
  "password": "your-password"
}
```

**响应:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 登录

```
POST /api/login
```

**请求体:**
```json
{
  "userId": "your-user",
  "password": "your-password"
}
```

**响应:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 同步接口

### 获取数据

```
GET /api/sync
Authorization: Bearer YOUR_TOKEN
```

**响应:**
```json
{
  "version": 1,
  "updated": 1704067200000,
  "data": {
    "bookmarks": [...],
    "themes": [...],
    "quickCommands": [...],
    "settings": {...}
  }
}
```

---

### 保存数据

```
PUT /api/sync
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**请求体:**
```json
{
  "version": 1,
  "data": {
    "bookmarks": [...],
    "themes": [...],
    "quickCommands": [...],
    "settings": {...}
  }
}
```

**响应:**
```json
{
  "success": true,
  "version": 2
}
```

**冲突响应:**
```json
{
  "success": false,
  "error": "Version conflict",
  "serverVersion": 3,
  "serverData": {...},
  "serverUpdated": 1704067200000
}
```

---

### 删除数据

```
DELETE /api/sync
Authorization: Bearer YOUR_TOKEN
```

**响应:**
```json
{
  "success": true
}
```

---

## 新增功能

### 修改密码

```
POST /api/password
Authorization: Bearer YOUR_TOKEN
```

**请求体:**
```json
{
  "oldPassword": "old-pass",
  "newPassword": "new-pass"
}
```

---

### 导出数据

```
GET /api/export
Authorization: Bearer YOUR_TOKEN
```

**响应:** 下载 JSON 文件

---

### 导入数据

```
POST /api/import
Authorization: Bearer YOUR_TOKEN
```

**请求体:**
```json
{
  "data": {...},
  "merge": false
}
```

`merge: true` 会合并现有数据，`merge: false` 会覆盖。

---

### 健康检查

```
GET /health
```

**响应:**
```json
{
  "status": "ok",
  "timestamp": 1704067200000,
  "uptime": 3600,
  "memory": {...}
}
```

---

### 服务器信息

```
GET /api/info
```

**响应:**
```json
{
  "version": "1.5.0",
  "name": "electerm-sync-server-enhanced",
  "users": 5,
  "features": ["sync", "export", "import", "history"]
}
```

---

## 管理员接口

**认证方式:** Basic Auth (用户名: admin, 密码: czfkKUGS9741)

### 获取用户列表

```
GET /api/admin/users
```

### 删除用户

```
DELETE /api/admin/users/:userId
```

### 获取操作日志

```
GET /api/admin/logs?limit=100
```

### 获取服务器统计

```
GET /api/admin/stats
```

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

---

## 示例

### curl 命令

```bash
# 注册
curl -X POST http://82.158.225.97:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"myuser","password":"mypass123"}'

# 登录
TOKEN=$(curl -s -X POST http://82.158.225.97:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"userId":"myuser","password":"mypass123"}' | jq -r '.token')

# 获取数据
curl http://82.158.225.97:3000/api/sync \
  -H "Authorization: Bearer $TOKEN"

# 保存数据
curl -X PUT http://82.158.225.97:3000/api/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"version":1,"data":{"bookmarks":[]}}'
```