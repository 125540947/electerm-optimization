# 同步问题排查

本文档帮助解决 electerm-sync 常见问题。

## 连接问题

### 无法连接到服务器

**症状:**
- 连接超时
- 无法访问服务器

**排查步骤:**

1. **检查服务器是否运行**
   ```bash
   # Docker
   docker-compose ps
   
   # PM2
   pm2 status
   ```

2. **检查端口监听**
   ```bash
   netstat -tlnp | grep 3000
   ```

3. **检查防火墙**
   ```bash
   # UFW
   sudo ufw status
   
   # firewalld
   sudo firewall-cmd --list-ports
   ```

4. **测试本地连接**
   ```bash
   curl http://localhost:3000/health
   ```

5. **检查网络路由**
   ```bash
   ping your-server.com
   telnet your-server.com 3000
   ```

---

### Token 验证失败

**症状:**
- 401 Unauthorized
- Invalid token

**原因:**
- Token 过期
- Token 格式错误
- JWT_SECRET 不匹配

**解决方法:**

1. 重新登录获取新 Token:
   ```bash
   curl -X POST http://your-server.com/api/login \
     -H 'Content-Type: application/json' \
     -d '{"userId":"your-user","password":"your-pass"}'
   ```

2. 检查 JWT_SECRET 是否一致:
   ```bash
   cat /opt/electerm-sync/.env
   ```

---

## 同步问题

### 同步失败

**症状:**
- 同步按钮无响应
- 同步显示失败

**排查步骤:**

1. **检查网络连接**
   ```bash
   curl -X GET http://your-server.com/api/sync \
     -H 'Authorization: Bearer YOUR_TOKEN'
   ```

2. **查看服务器日志**
   ```bash
   pm2 logs electerm-sync
   ```

3. **检查数据格式**
   - 确保数据是有效的 JSON
   - 检查是否有循环引用

4. **测试数据大小**
   - 最大 10MB
   - 压缩大文件

---

### 数据冲突

**症状:**
- 本地和远程数据不一致
- 部分数据丢失

**原因:**
- 多设备同时修改
- 网络中断导致同步中断

**解决策略:**

1. **自动策略** (在客户端配置):
   - `local-wins` - 保留本地
   - `remote-wins` - 保留远程
   - `newest-wins` - 保留最新
   - `merge` - 智能合并

2. **手动解决**:
   - 导出两边的数据
   - 手动合并
   - 重新上传

3. **预防措施**:
   - 减少同步频率
   - 关闭自动同步
   - 修改前先手动同步

---

### 版本冲突

**症状:**
```
Version conflict
Server version: 5
Client version: 3
```

**原因:**
- 远程有更新，本地版本过旧

**解决方法:**

1. 先拉取远程数据:
   ```bash
   curl http://your-server.com/api/sync \
     -H 'Authorization: Bearer YOUR_TOKEN'
   ```

2. 合并后重新上传:
   ```bash
   curl -X PUT http://your-server.com/api/sync \
     -H 'Authorization: Bearer YOUR_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{"version":6,"data":{...}}'
   ```

---

## WebDAV 问题

### WebDAV 连接失败

**症状:**
- 连接测试失败
- 403/404 错误

**排查:**

1. **检查 URL 格式**
   ```
   正确: https://dav.jianguoyun.com/dav/
   错误: https://dav.jianguoyun.com/dav
   ```

2. **测试 WebDAV**
   ```bash
   curl -X PROPFIND https://dav.jianguoyun.com/dav/ \
     -u "user:password" \
     -H "Depth: 0"
   ```

3. **检查服务商支持**
   - 部分服务商不支持 PUT
   - 部分需要完整路径

---

### 坚果云同步失败

**常见问题:**

1. **应用密码未开启**
   - 坚果云需开启「第三方应用管理」
   - 在安全设置中添加应用

2. **免费用户限制**
   - 坚果云免费用户每月有限流
   - 建议升级或使用其他服务

---

## 性能问题

### 同步速度慢

**原因:**
- 网络带宽不足
- 数据过大
- 服务器性能不足

**优化:**

1. **减少同步频率**
   ```javascript
   syncInterval: 600000 // 10分钟
   ```

2. **启用增量同步**
   - 只同步变更的部分
   - 使用时间戳判断

3. **压缩数据**
   - 启用 gzip 压缩
   - 减少传输量

---

### 内存占用高

**原因:**
- 数据文件过大
- 并发请求过多

**优化:**

1. **限制请求大小**
   ```javascript
   app.use(express.json({ limit: '10mb' }));
   ```

2. **使用流处理**
   - 大文件分片上传
   - 避免一次性加载

---

## 数据问题

### 数据丢失

**原因:**
- 误删除
- 服务器故障
- 同步冲突覆盖

**恢复:**

1. **从备份恢复**
   ```bash
   tar -xzf backup.tar.gz -C /
   pm2 restart electerm-sync
   ```

2. **从 WebDAV 恢复**
   - 下载备份文件
   - 导入到客户端

3. **从客户端缓存恢复**
   - localStorage 有缓存
   - 浏览器开发者工具查看

---

### 数据损坏

**症状:**
- JSON 解析错误
- 部分字段丢失

**修复:**

1. **检查 JSON 格式**
   ```bash
   cat data.json | python3 -m json.tool
   ```

2. **修复损坏文件**
   - 删除损坏记录
   - 重新同步

---

## 服务问题

### 服务启动失败

**排查:**

1. **检查端口占用**
   ```bash
   lsof -i :3000
   ```

2. **检查日志**
   ```bash
   pm2 logs electerm-sync --err
   ```

3. **检查环境变量**
   ```bash
   cat .env
   ```

4. **检查权限**
   ```bash
   ls -la data/
   ```

---

### PM2 相关问题

**重启服务:**
```bash
pm2 restart electerm-sync
```

**查看状态:**
```bash
pm2 status
pm2 monit
```

**清理日志:**
```bash
pm2 flush
```

**删除服务:**
```bash
pm2 delete electerm-sync
```

---

## 获取帮助

如果仍无法解决:

1. 查看日志详细信息
2. 收集错误信息
3. 提交 Issue: https://github.com/125540947/electerm-optimization/issues

---

## 预防措施

1. **定期备份**
   ```bash
   # 每日备份
   0 0 * * * tar -czf /backup/electerm-$(date +\%Y\%m\%d).tar.gz /opt/electerm-sync/data/
   ```

2. **监控告警**
   - 使用 PM2 Plus
   - 配置健康检查

3. **日志轮转**
   - 使用 logrotate
   - 定期清理旧日志
