# Marix UI 风格分析

## Marix UI 特点

基于 [Marix](https://github.com/marixdev/marix) 项目分析:

### 1. 整体设计
- **深色主题** - 以 `#0d1117` 为背景,类似 GitHub Dark
- **简洁扁平** - 无复杂渐变,强调清晰线条
- **卡片式布局** - 模块化,边界清晰

### 2. 色彩系统
| 用途 | 颜色 | Hex |
|------|------|-----|
| 主背景 | 深黑蓝 | `#0d1117` |
| 次背景 | 暗黑灰 | `#161b22` |
| 三级背景 | 灰色 | `#21262d` |
| 悬停背景 | 浅灰 | `#30363d` |
| 主强调 | Marix蓝 | `#388bfd` |
| 成功 | 绿色 | `#3fb950` |
| 危险 | 红色 | `#f85149` |
| 文字主色 | 白灰 | `#e6edf3` |
| 文字次要 | 灰 | `#8b949e` |

### 3. 排版
- 字体: 系统默认 (Apple System, Segoe UI)
- 圆角: 小尺寸 (4-8px), 偏方形
- 间距: 紧凑型 (8-16px)

### 4. 组件
- 按钮: 方形圆角,简洁
- 输入框: 边框明显,聚焦高亮
- 侧边栏: 固定宽度,图标+文字
- 表格: 线框分隔,无复杂样式

### 5. 图标
- 使用 Font Awesome 或类似
- 简洁线条风格

---

## electerm-optimization 适配

已将 Marix 风格应用于项目:

### 已创建
- `ui/marix-theme.css` - 完整主题
- `ui/admin-marix.html` - 管理面板

### 风格对比

| 特性 | 原版 | Marix 版 |
|------|------|----------|
| 背景 | 灰蓝 `#1a1d23` | 深黑 `#0d1117` |
| 强调色 | 蓝 `#4dabf7` | Marix蓝 `#388bfd` |
| 圆角 | 8-12px | 4-8px |
| 风格 | 渐变 | 扁平 |

---

## 使用方法

### 应用主题
```html
<link rel="stylesheet" href="marix-theme.css">
```

### 访问管理面板
```
http://82.158.225.97/admin-marix.html
```

### 主题变量

```css
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --accent: #388bfd;
  --text-primary: #e6edf3;
}
```
