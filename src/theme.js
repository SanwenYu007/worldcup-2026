import { ref } from 'vue'

// 主题：深色(默认) / 浅色，持久化到 localStorage，写入 <html data-theme>。
const KEY = 'wc2026-theme'
const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
export const theme = ref(stored === 'light' ? 'light' : 'dark')

export function applyTheme(t) {
  theme.value = t
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', t)
  }
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, t)
}

export function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

// 初始化（main.js 调用）
export function initTheme() {
  applyTheme(theme.value)
}
