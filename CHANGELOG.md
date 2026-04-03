# electerm-optimization Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-04-03

### Added
- Advanced sync features (encryption, audit log, webhooks)
- Complete Wiki documentation
- Config generator for client
- Offline cache support
- Conflict resolver with multiple strategies
- Batch sync manager

### Documentation
- INSTALLATION.md - Complete installation guide
- WEBDAV_SETUP.md - WebDAV configuration for all major providers
- CUSTOM_SERVER.md - Self-hosted server guide
- SYNC_TROUBLESHOOTING.md - Troubleshooting guide

## [1.0.0] - 2026-04-03

### Added
- WebDAV sync support
- Custom server sync
- Modern UI theme (Catppuccin)
- Docker deployment
- VPS one-click install script
- Sync panel UI component

---

## Upgrade Guide

### From v1.0.0 to v1.1.0

1. Pull latest code:
```bash
git pull
```

2. Update dependencies:
```bash
npm install
```

3. Restart service:
```bash
pm2 restart electerm-sync
# or
docker-compose restart
```

---

## Migration Notes

### Data Format Changes

The sync data format is backward compatible. No migration needed.

### Config Changes

If using custom configuration, update to new format:

Old:
```json
{
  "sync": {
    "type": "webdav",
    "url": "...",
    "username": "...",
    "password": "..."
  }
}
```

New:
```json
{
  "sync": {
    "provider": "webdav",
    "webdav": {
      "url": "...",
      "username": "...",
      "password": "..."
    }
  }
}
```
