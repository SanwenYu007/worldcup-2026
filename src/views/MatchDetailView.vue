<script setup>
// 比赛详情：聚合 AI 预测比分、预测首发、胜平负赔率、双方近期战绩与交锋。
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const route = useRoute()
const router = useRouter()
const store = useDataStore()
const { t, locale } = useI18n()

const match = computed(() => store.matches.find((m) => String(m.id) === String(route.params.id)) || null)

const enByCode = computed(() => {
  const m = {}
  ;(store.teamsFull?.teams || []).forEach((tm) => { if (tm.code) m[tm.code] = tm.name })
  return m
})
const teamOf = (code) => store.getTeam(code)
const dName = (code) => {
  const tm = teamOf(code)
  if (!tm) return code
  return locale.value === 'en' ? (enByCode.value[code] || tm.name) : tm.name
}

const outcomeLabel = computed(() => ({ home: t('result.home'), draw: t('result.draw'), away: t('result.away') }))
const fmtDate = (d) => new Date(d).toLocaleString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

const prediction = computed(() => match.value ? store.getPrediction(match.value) : null)
const lineup = computed(() => match.value ? store.getLineup(match.value) : null)
const odds = computed(() => match.value?.odds?.had || null)
const impl = computed(() => {
  const o = odds.value
  if (!o) return null
  const inv = { h: 1 / o.h, d: 1 / o.d, a: 1 / o.a }
  const s = inv.h + inv.d + inv.a
  return { h: Math.round(inv.h / s * 100), d: Math.round(inv.d / s * 100), a: Math.round(inv.a / s * 100) }
})
const noteOf = (l) => (l?.note ? (l.note[locale.value] || l.note.zh || l.note.en || '') : '')

// 某队近期战绩（最多 5 场已结束）
function form(code) {
  return store.matches
    .filter((m) => m.status === 'finished' && m.homeGoals != null && (m.home === code || m.away === code))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((m) => {
      const isHome = m.home === code
      const gf = isHome ? m.homeGoals : m.awayGoals
      const ga = isHome ? m.awayGoals : m.homeGoals
      return { id: m.id, opp: dName(isHome ? m.away : m.home), gf, ga, res: gf > ga ? 'w' : gf === ga ? 'd' : 'l' }
    })
}
const homeForm = computed(() => match.value ? form(match.value.home) : [])
const awayForm = computed(() => match.value ? form(match.value.away) : [])
const resText = (r) => (r === 'w' ? t('common.win') : r === 'd' ? t('common.draw') : t('common.loss'))
</script>

<template>
  <div class="view">
    <button class="back" @click="router.back()">{{ t('match.back') }}</button>

    <div v-if="!match" class="empty card muted">{{ t('match.notFound') }}</div>

    <template v-else>
      <!-- 比分头 -->
      <div class="score card">
        <div class="side">
          <div class="fl">{{ teamOf(match.home)?.flag }}</div>
          <div class="nm">{{ dName(match.home) }}</div>
        </div>
        <div class="mid">
          <div v-if="match.homeGoals != null" class="sc">{{ match.homeGoals }} : {{ match.awayGoals }}</div>
          <div v-else class="vs">{{ t('common.vs') }}</div>
          <div class="when">{{ fmtDate(match.date) }}</div>
          <div class="stage muted">{{ match.group ? match.group + ' ' + t('common.group') : (['r32','r16','qf','sf','third','final'].includes(match.stage) ? t('overview.stages.' + match.stage) : (match.stageName || '')) }}</div>
        </div>
        <div class="side">
          <div class="fl">{{ teamOf(match.away)?.flag }}</div>
          <div class="nm">{{ dName(match.away) }}</div>
        </div>
      </div>

      <div class="grid cols">
        <!-- AI 预测 -->
        <div class="card blk">
          <div class="blk-h">{{ t('match.prediction') }}</div>
          <template v-if="prediction">
            <div class="pred-sc">{{ prediction.score.home }} : {{ prediction.score.away }}
              <span class="tag">{{ outcomeLabel[prediction.outcome] }}</span>
            </div>
            <div class="conf muted">{{ t('common.confidence') }} {{ Math.round(prediction.confidence * 100) }}%</div>
            <p class="reason muted">{{ prediction.reasoning }}</p>
          </template>
          <div v-else class="muted sm">{{ t('predictions.empty') }}</div>
        </div>

        <!-- 赔率 -->
        <div class="card blk">
          <div class="blk-h">{{ t('match.odds') }}</div>
          <div v-if="odds" class="odds3">
            <div class="o"><span>{{ t('result.home') }}</span><b>{{ odds.h.toFixed(2) }}</b><i v-if="impl">{{ impl.h }}%</i></div>
            <div class="o"><span>{{ t('result.draw') }}</span><b>{{ odds.d.toFixed(2) }}</b><i v-if="impl">{{ impl.d }}%</i></div>
            <div class="o"><span>{{ t('result.away') }}</span><b>{{ odds.a.toFixed(2) }}</b><i v-if="impl">{{ impl.a }}%</i></div>
          </div>
          <div v-else class="muted sm">{{ t('match.noOdds') }}</div>
        </div>
      </div>

      <!-- 预测首发 -->
      <div class="card blk" v-if="lineup">
        <div class="blk-h">{{ t('match.lineup') }}<small v-if="lineup.homeFormation"> · {{ lineup.homeFormation }} / {{ lineup.awayFormation }}</small></div>
        <div class="grid xi2">
          <div>
            <div class="xi-tm">{{ dName(match.home) }}</div>
            <ol><li v-for="(n, i) in lineup.homeXI" :key="'h'+i">{{ n }}</li></ol>
          </div>
          <div>
            <div class="xi-tm">{{ dName(match.away) }}</div>
            <ol><li v-for="(n, i) in lineup.awayXI" :key="'a'+i">{{ n }}</li></ol>
          </div>
        </div>
        <p class="reason muted" v-if="noteOf(lineup)">{{ noteOf(lineup) }}</p>
      </div>

      <!-- 近期战绩 -->
      <div class="card blk">
        <div class="blk-h">{{ t('match.form') }}</div>
        <div class="grid xi2">
          <div>
            <div class="xi-tm">{{ dName(match.home) }}</div>
            <div v-if="homeForm.length" class="forms">
              <span v-for="f in homeForm" :key="f.id" class="fchip" :class="f.res">{{ f.gf }}-{{ f.ga }} <small>{{ f.opp }}</small></span>
            </div>
            <div v-else class="muted sm">{{ t('match.noForm') }}</div>
          </div>
          <div>
            <div class="xi-tm">{{ dName(match.away) }}</div>
            <div v-if="awayForm.length" class="forms">
              <span v-for="f in awayForm" :key="f.id" class="fchip" :class="f.res">{{ f.gf }}-{{ f.ga }} <small>{{ f.opp }}</small></span>
            </div>
            <div v-else class="muted sm">{{ t('match.noForm') }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.back { margin: 20px 0 14px; background: none; border: 1px solid var(--border); color: var(--text-dim); padding: 6px 14px; border-radius: 999px; font-size: 0.84rem; }
.back:hover { color: var(--text); border-color: var(--primary-dim); }
.empty { padding: 40px; text-align: center; }
.score { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 24px 18px; gap: 10px; }
.side { text-align: center; }
.fl { font-size: 2.6rem; }
.nm { font-weight: 800; font-size: 1.05rem; margin-top: 4px; }
.mid { text-align: center; }
.sc { font-size: 2.2rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.vs { font-size: 1.4rem; font-weight: 700; color: var(--text-mute); }
.when { font-size: 0.82rem; color: var(--text-dim); margin-top: 4px; }
.stage { font-size: 0.74rem; }
.cols { grid-template-columns: 1fr 1fr; }
.blk { padding: 16px; margin-top: 14px; }
.blk-h { font-weight: 700; color: var(--accent); margin-bottom: 10px; }
.blk-h small { color: var(--text-mute); font-weight: 500; }
.pred-sc { font-size: 1.6rem; font-weight: 800; }
.pred-sc .tag { font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-left: 8px; vertical-align: middle; }
.conf { font-size: 0.78rem; margin: 4px 0 8px; }
.reason { font-size: 0.82rem; line-height: 1.55; }
.sm { font-size: 0.82rem; }
.odds3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.o { text-align: center; background: var(--bg-soft); border-radius: 8px; padding: 10px 6px; }
.o span { display: block; font-size: 0.74rem; color: var(--text-mute); }
.o b { display: block; font-size: 1.3rem; font-weight: 800; margin: 2px 0; }
.o i { font-style: normal; font-size: 0.72rem; color: var(--primary); }
.xi2 { grid-template-columns: 1fr 1fr; }
.xi-tm { font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 6px; }
.xi2 ol { margin: 0; padding-left: 1.3em; }
.xi2 li { font-size: 0.8rem; line-height: 1.6; color: var(--text-dim); }
.forms { display: flex; flex-wrap: wrap; gap: 5px; }
.fchip { font-size: 0.74rem; padding: 3px 7px; border-radius: 6px; border: 1px solid var(--border); font-variant-numeric: tabular-nums; }
.fchip small { color: var(--text-mute); margin-left: 2px; }
.fchip.w { border-color: var(--primary-dim); color: var(--primary); }
.fchip.l { border-color: rgba(239,107,107,0.4); color: #ef6b6b; }
.fchip.d { color: var(--text-dim); }
@media (max-width: 680px) { .cols { grid-template-columns: 1fr; } }
</style>
