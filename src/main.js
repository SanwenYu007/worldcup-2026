import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n, setLocale } from './i18n'
import { initTheme } from './theme'
import './styles/main.css'

setLocale(i18n.global.locale.value) // 同步 <html lang>
initTheme() // 应用持久化的深/浅色主题
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
