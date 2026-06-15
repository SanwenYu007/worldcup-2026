<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const outcomeLabel = { home: '主胜', draw: '平局', away: '客胜' }

const data = computed(() => store.predictions)

// 把预测与真实比赛配对，标注命中情况。
const rows = computed(() => {
  if (!data.value?.predictions) return []
  return data.value.predictions.map((p) => {
    const match = store.matches.find((m) => m.id === p.matchId) ||
      store.matches.find((m) => store.getTeam(m.home)?.name === p.homeName && store.getTeam(m.away)?.name === p.awayName)
    let result = null
    if (match && match.status === 'finished' && match.homeGoals != null) {
      const actualOutcome = match.homeGoals > match.awayGoals ? 'home' : match.homeGoals === match.awayGoals ? 'draw' : 'away'
      result = {
        score: `${match.homeGoals}:${match.awayGoals}`,
        exact: match.homeGoals === p.score.home && match.awayGoals === p.score.away,
        outcomeHit: actualOutcome === p.outcome
      }
    }
    return { p, match, result }
  })
})

const fmtDate = (d) => new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
const fmtGen = computed(() => data.value?.generatedAt ? new Date(data.value.generatedAt).toLocaleString('zh-CN') : '')

// 准确率统计（已完赛的预测）
const settled = computed(() => rows.value.filter((r) => r.result))
const accuracy = computed(() => {
  if (!settled.value.length) return null
  const exact = settled.value.filter((r) => r.result.exact).length
  const out = settled.value.filter((r) => r.result.outcomeHit).length
  return { total: settled.value.length, exact, out,
    exactPct: Math.round(exact / settled.value.length * 100),
    outPct: Math.round(out / settled.value.length * 100) }
})
</script>

<template>
  <div class="view">
    <div class="head">
      <div>
        <h2>AI 比分预测</h2>
        <p class="muted">由 <b>{{ data?.modelLabel || 'AI 模型' }}</b> 综合两队<b>实力值</b>与<b>近期战绩</b>，预测未来 {{ data?.horizonDays || 2 }} 天比赛的比分与胜负；每条预测附判断依据与置信度。</p>
      </div>
      <span class="gen muted" v-if="fmtGen">更新于 {{ fmtGen }}</span>
    </div>

    <div class="acc card" v-if="accuracy">
      <div class="acc-item"><b>{{ accuracy.total }}</b><span>已验证</span></div>
      <div class="acc-item"><b class="g">{{ accuracy.outPct }}%</b><span>胜负命中 {{ accuracy.out }}/{{ accuracy.total }}</span></div>
      <div class="acc-item"><b class="a">{{ accuracy.exactPct }}%</b><span>比分命中 {{ accuracy.exact }}/{{ accuracy.total }}</span></div>
    </div>

    <div v-if="!rows.length" class="empty card muted">暂无预测数据（public/predictions.json）。</div>

    <div class="grid list">
      <div v-for="r in rows" :key="r.p.matchId" class="pred card" :class="{ done: r.result }">
        <div class="p-head">
          <span class="when">{{ fmtDate(r.p.date) }}</span>
          <span class="badge" v-if="r.result"
            :class="r.result.exact ? 'finished' : (r.result.outcomeHit ? 'finished' : 'scheduled')">
            {{ r.result.exact ? '✓ 比分命中' : (r.result.outcomeHit ? '✓ 胜负命中' : '✗ 未命中') }}
          </span>
          <span class="badge scheduled" v-else>待赛</span>
        </div>
        <div class="p-match">
          <span class="tm">{{ r.p.homeName }}</span>
          <span class="pscore mono">{{ r.p.score.home }} : {{ r.p.score.away }}</span>
          <span class="tm">{{ r.p.awayName }}</span>
        </div>
        <div class="p-meta">
          <span class="out">预测 {{ outcomeLabel[r.p.outcome] }}</span>
          <span class="conf">置信度 {{ Math.round(r.p.confidence * 100) }}%</span>
          <span class="actual" v-if="r.result">实际 {{ r.result.score }}</span>
        </div>
        <div class="conf-bar"><span :style="{ width: r.p.confidence * 100 + '%' }" /></div>
        <p class="reason muted">{{ r.p.reasoning }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin: 24px 0 16px; flex-wrap: wrap; }
.head h2 { font-size: 1.4rem; font-weight: 800; }
.head p { font-size: 0.86rem; margin-top: 4px; }
.gen { font-size: 0.74rem; }
.acc { display: flex; gap: 28px; padding: 16px 22px; margin-bottom: 18px; }
.acc-item { display: flex; flex-direction: column; }
.acc-item b { font-size: 1.5rem; font-weight: 800; }
.acc-item b.g { color: var(--primary); }
.acc-item b.a { color: var(--accent); }
.acc-item span { font-size: 0.74rem; color: var(--text-dim); }
.empty { padding: 30px; text-align: center; }
.list { grid-template-columns: repeat(2, 1fr); }
.pred { padding: 16px; }
.pred.done { border-color: var(--primary-dim); }
.p-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.when { font-size: 0.76rem; color: var(--text-mute); }
.p-match { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; margin-bottom: 10px; }
.p-match .tm { font-weight: 700; font-size: 0.95rem; }
.p-match .tm:last-child { text-align: right; }
.pscore { font-size: 1.5rem; font-weight: 800; color: #5b8def; }
.p-meta { display: flex; gap: 14px; font-size: 0.78rem; margin-bottom: 8px; flex-wrap: wrap; }
.p-meta .out { color: var(--text); font-weight: 600; }
.p-meta .conf { color: var(--text-mute); }
.p-meta .actual { margin-left: auto; color: var(--primary); font-weight: 600; }
.conf-bar { height: 5px; background: var(--bg-soft); border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
.conf-bar span { display: block; height: 100%; background: linear-gradient(90deg, #5b8def, #2dd4a7); }
.reason { font-size: 0.8rem; line-height: 1.5; }
@media (max-width: 760px) { .list { grid-template-columns: 1fr; } }
</style>
