<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { simulateTitle } from '../composables/useProjection'

const store = useDataStore()
const { t, locale } = useI18n()
const N = 3000

const results = ref([])
const computing = ref(true)

// 英文名映射（store.teams 只有中文名，teams.json 有英文名）
const enByCode = computed(() => {
  const m = {}
  ;(store.teamsFull?.teams || []).forEach((tm) => { if (tm.code) m[tm.code] = tm.name })
  return m
})
const dName = (tm) => (locale.value === 'en' ? (enByCode.value[tm.code] || tm.name) : tm.name)

function run() {
  computing.value = true
  // 让「计算中」先渲染，再跑同步模拟
  setTimeout(() => {
    results.value = simulateTitle(store.teams, store.groups, store.matches, N)
    computing.value = false
  }, 30)
}

onMounted(run)
// 真实数据(实力值/赛果)到达或刷新后，重算模拟
watch(() => store.lastUpdated, run)

const top = computed(() => results.value.filter((r) => r.title > 0.0005).slice(0, 16))
const maxTitle = computed(() => (top.value[0]?.title || 1))
const pct = (x) => (x * 100 >= 1 ? Math.round(x * 100) + '%' : (x * 100).toFixed(1) + '%')
</script>

<template>
  <div class="view">
    <div class="head">
      <h2>🏆 {{ t('champion.title') }}</h2>
    </div>
    <p class="lead muted">{{ t('champion.lead', { n: N.toLocaleString() }) }}</p>

    <div v-if="computing" class="empty card muted">{{ t('champion.computing', { n: N.toLocaleString() }) }}</div>

    <template v-else>
      <div class="board card">
        <div class="row hd">
          <span class="c-rank">{{ t('champion.rank') }}</span>
          <span class="c-team">{{ t('standings.team') }}</span>
          <span class="c-bar">{{ t('champion.titleProb') }}</span>
          <span class="c-num">{{ t('champion.reachFinal') }}</span>
          <span class="c-num">{{ t('champion.reachSemi') }}</span>
        </div>
        <div class="row" v-for="(r, i) in top" :key="r.team.code">
          <span class="c-rank">{{ i + 1 }}</span>
          <span class="c-team"><span class="flag">{{ r.team.flag }}</span>{{ dName(r.team) }}</span>
          <span class="c-bar">
            <span class="bar"><b :style="{ width: (r.title / maxTitle * 100) + '%' }" /></span>
            <em>{{ pct(r.title) }}</em>
          </span>
          <span class="c-num">{{ pct(r.final) }}</span>
          <span class="c-num">{{ pct(r.semi) }}</span>
        </div>
      </div>
      <p class="disc">{{ t('champion.model') }}</p>
    </template>
  </div>
</template>

<style scoped>
.head { margin: 24px 0 6px; }
.head h2 { font-size: 1.4rem; font-weight: 800; }
.lead { font-size: 0.86rem; margin-bottom: 14px; }
.empty { padding: 40px; text-align: center; }
.board { padding: 8px 6px; }
.row { display: grid; grid-template-columns: 44px 1.4fr 2fr 64px 64px; align-items: center; gap: 10px; padding: 9px 12px; border-top: 1px solid var(--border); font-size: 0.88rem; }
.row.hd { border-top: none; font-size: 0.72rem; color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.03em; }
.row:nth-child(2) { font-weight: 700; }
.c-rank { color: var(--text-mute); font-weight: 700; text-align: center; }
.c-team { display: flex; align-items: center; gap: 6px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.flag { font-size: 1.05rem; }
.c-bar { display: flex; align-items: center; gap: 8px; }
.c-bar .bar { flex: 1; height: 10px; background: var(--bg-soft); border-radius: 6px; overflow: hidden; }
.c-bar .bar b { display: block; height: 100%; background: linear-gradient(90deg, #f5c451, #ffd166); }
.c-bar em { font-style: normal; font-weight: 800; color: var(--accent); width: 46px; text-align: right; }
.c-num { text-align: right; color: var(--text-dim); font-variant-numeric: tabular-nums; }
.disc { margin-top: 18px; font-size: 0.78rem; color: var(--accent); background: rgba(255,209,102,0.08); border: 1px solid rgba(255,209,102,0.25); border-radius: 8px; padding: 10px 14px; }
@media (max-width: 640px) {
  .row { grid-template-columns: 30px 1.2fr 1.6fr 48px; }
  .c-num:last-child { display: none; }
}
</style>
