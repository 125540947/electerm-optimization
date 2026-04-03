/**
 * electerm-web 中文语言补丁
 * 将此文件复制到 electerm-web 目录并在 index.pug 中引用
 */

// 修改默认语言为中文
window.defaultLang = 'zh_CN'

// 在页面加载后自动设置中文
document.addEventListener('DOMContentLoaded', function() {
  // 等待应用初始化
  setTimeout(function() {
    if (window.store) {
      // 设置界面语言
      window.store.setConfig({ language: 'zh_CN' })
      // 设置 AI 语言
      window.store.setConfig({ languageAI: 'zh_CN' })
    }
  }, 2000)
})

// 拦截语言设置
window.setChinese = function() {
  if (window.store) {
    window.store.setConfig({ language: 'zh_CN' })
    window.store.setConfig({ languageAI: 'zh_CN' })
    console.log('Language set to Chinese')
  }
}
