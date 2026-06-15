import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // 部署到子路径（如 GitHub Pages 的 /worldcup-2026/）时通过 VITE_BASE 注入；本地默认 '/'
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
  server: {
    port: 5173,
    // 可选「实时模式」：开发时把 /api 代理到 football-data.org，避开浏览器 CORS。
    // 线上仍用 src/data 缓存 JSON，因此这里只影响本地开发。
    proxy: {
      '/api/football': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/football/, ''),
        headers: {
          // 本地开发时通过环境变量注入，避免泄露
          'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN || ''
        }
      }
    }
  }
})
