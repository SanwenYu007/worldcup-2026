<script setup>
import { onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { useDataStore } from './stores/data'

const store = useDataStore()

onMounted(() => {
  // 非阻塞尝试加载真实数据；失败则继续用示例数据
  store.tryLoadLive()
})
</script>

<template>
  <header class="topbar">
    <div class="container bar-inner">
      <RouterLink to="/" class="brand">
        <span class="ball">⚽</span>
        <span class="brand-txt">2026 <b>世界杯</b></span>
      </RouterLink>
      <nav class="nav">
        <RouterLink to="/" exact-active-class="active">总览</RouterLink>
        <RouterLink to="/schedule" active-class="active">赛程</RouterLink>
        <RouterLink to="/timeline" active-class="active">时间表</RouterLink>
        <RouterLink to="/odds" active-class="active">实时赔率</RouterLink>
        <RouterLink to="/predictions" active-class="active">AI预测</RouterLink>
        <RouterLink to="/stats" active-class="active">数据</RouterLink>
        <RouterLink to="/feedback" active-class="active">意见</RouterLink>
      </nav>
      <span class="src-tag" :class="store.source">
        {{ store.source === 'live' ? '实时数据' : '示例数据' }}
      </span>
    </div>
  </header>

  <main class="container">
    <!-- 直接渲染路由组件：不加页面级过渡，避免切换时的空白/重叠帧 -->
    <RouterView />
  </main>

  <footer class="footer container">
    <span>2026 FIFA 世界杯 · {{ store.meta.host }} · 48 队 / 104 场</span>
    <span class="muted">作品集演示 · Vue 3 + ECharts</span>
  </footer>
</template>

<style scoped>
.topbar {
  position: sticky; top: 0; z-index: 50;
  backdrop-filter: blur(12px);
  background: rgba(11, 16, 32, 0.78);
  border-bottom: 1px solid var(--border);
}
.bar-inner { display: flex; align-items: center; gap: 18px; height: 60px; }
.brand { display: flex; align-items: center; gap: 9px; font-size: 1.15rem; font-weight: 800; }
.brand b { color: var(--primary); }
.ball { font-size: 1.4rem; transition: transform 0.8s ease; }
.brand:hover .ball { transform: rotate(360deg); }
.nav { display: flex; gap: 6px; margin-left: 8px; }
.nav a {
  padding: 7px 16px; border-radius: 999px; font-weight: 600; font-size: 0.92rem;
  color: var(--text-dim); transition: all 0.18s;
}
.nav a:hover { color: var(--text); background: var(--card); }
.nav a.active { color: #06231b; background: var(--primary); }
.src-tag {
  margin-left: auto; font-size: 0.72rem; padding: 4px 10px; border-radius: 999px;
  border: 1px solid var(--border); color: var(--text-mute);
}
.src-tag.live { color: var(--primary); border-color: var(--primary-dim); }
.footer {
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  padding: 28px 20px 40px; font-size: 0.82rem; color: var(--text-mute);
  margin-top: 30px; border-top: 1px solid var(--border);
}
@media (max-width: 720px) {
  .bar-inner { gap: 8px; }
  .brand-txt { display: none; }
  .src-tag { display: none; }
  .nav { margin-left: 0; overflow-x: auto; flex: 1; -webkit-overflow-scrolling: touch; }
  .nav::-webkit-scrollbar { display: none; }
  .nav a { padding: 7px 12px; font-size: 0.86rem; flex-shrink: 0; }
  .footer { flex-direction: column; }
}
</style>
