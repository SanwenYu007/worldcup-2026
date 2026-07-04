import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 生产环境内容安全策略（CSP）。GitHub Pages 无法自定义响应头，故以 <meta> 注入。
// 仅在 build 时注入，避免破坏开发期 Vite HMR（其依赖内联脚本/eval/ws）。
// - script-src 'self'：只允许本站打包脚本，阻断注入型 XSS 执行。
// - style-src 'unsafe-inline'：Vue :style 绑定与 ECharts 提示框需要内联样式，风险较低故保留。
// - img-src https:：允许后续脚本补全的球员真实照片（来自外部 https 图源）。
// - connect-src 'self'：运行时只读取同源 JSON 快照，禁止外联。
// - frame-ancestors 'none'：禁止被 iframe 嵌入（meta 下部分浏览器会忽略，main.js 另有 JS 兜底）。
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests'
].join('; ')

const securityHeadersPlugin = {
  name: 'inject-csp-meta',
  apply: 'build',
  transformIndexHtml(html) {
    const tags = `    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n` +
      '    <meta http-equiv="X-Content-Type-Options" content="nosniff" />\n' +
      '    <meta name="referrer" content="strict-origin-when-cross-origin" />\n'
    return html.replace('</head>', tags + '  </head>')
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  // 部署到子路径（如 GitHub Pages 的 /worldcup-2026/）时通过 VITE_BASE 注入；本地默认 '/'
  base: process.env.VITE_BASE || '/',
  define: {
    // vue-i18n JIT 编译：消息编译为 AST 解释执行，不再用 new Function/eval，
    // 与上方严格 CSP（script-src 'self'）兼容——否则打包后整个应用无法挂载。
    __INTLIFY_JIT_COMPILATION__: true,
    __INTLIFY_PROD_DEVTOOLS__: false
  },
  plugins: [vue(), securityHeadersPlugin],
  build: {
    chunkSizeWarningLimit: 700, // ECharts 单独成块约 650KB，属预期，提高阈值避免误报
    // 把体积最大的 ECharts 单独拆成一个 chunk，降低首屏负担、消除大 chunk 警告
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts', 'vue-echarts']
        }
      }
    }
  },
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
