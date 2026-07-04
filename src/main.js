import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n, setLocale } from './i18n'
import { initTheme } from './theme'
import './styles/main.css'

// 防点击劫持：静态托管(GitHub Pages)无法下发 X-Frame-Options 响应头，meta 的
// frame-ancestors 在部分浏览器也会被忽略，这里在 JS 层兜底——若被异源 iframe 嵌入则跳出。
if (window.top !== window.self) {
  try {
    if (window.top.location.hostname !== window.location.hostname) {
      window.top.location = window.location.href
    }
  } catch {
    // 跨域无法读取 top.location，说明确为异源嵌入，直接跳出。
    window.top.location = window.location.href
  }
}

setLocale(i18n.global.locale.value) // 同步 <html lang>
initTheme() // 应用持久化的深/浅色主题
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
