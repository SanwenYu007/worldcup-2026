<script setup>
// AI 投注策略：从实时赔率(胜平负 had)反推隐含概率，给出高胜率单场推荐 + 稳健串关组合。
// 纯前端计算，透明可解释；含理性投注免责声明。
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const { t } = useI18n()
const outcomeLabel = computed(() => ({ h: t('result.home'), d: t('result.draw'), a: t('result.away') }))

// 赔率 → 去除抽水后的隐含概率
function impliedProbs(had) {
  const inv = { h: 1 / had.h, d: 1 / had.d, a: 1 / had.a }
  const s = inv.h + inv.d + inv.a
  return { h: inv.h / s, d: inv.d / s, a: inv.a / s, sum: s }
}

// 数据源：优先体彩实时赔率(oddsFeed)，回退到比赛自带 had
const items = computed(() => {
  const out = []
  const feed = store.oddsFeed?.matches || []
  feed.forEach((m) => {
    if (!m.had) return
    const p = impliedProbs(m.had)
    const best = ['h', 'd', 'a'].reduce((a, b) => (p[a] >= p[b] ? a : b))
    out.push({
      key: m.matchNum || `${m.homeName}-${m.awayName}`,
      home: m.homeName, away: m.awayName, time: m.matchTime || '', league: m.league || '',
      pick: best, prob: p[best], odd: m.had[best]
    })
  })
  return out.sort((a, b) => b.prob - a.prob)
})

// 稳健串关：取隐含胜率最高的前 K 场组合
const parlays = computed(() => {
  const top = items.value.slice(0, 4)
  const combos = []
  ;[2, 3, 4].forEach((k) => {
    if (top.length < k) return
    const legs = top.slice(0, k)
    const odds = legs.reduce((s, x) => s * x.odd, 1)
    const prob = legs.reduce((s, x) => s * x.prob, 1)
    combos.push({ k, legs, odds, prob })
  })
  return combos
})

const pct = (x) => Math.round(x * 100) + '%'
</script>

<template>
  <div class="view">
    <div class="head">
      <h2>{{ t('strategy.title') }}</h2>
    </div>
    <p class="lead muted">{{ t('strategy.lead') }}</p>

    <div v-if="!items.length" class="empty card muted">{{ t('strategy.noData') }}</div>

    <template v-else>
      <!-- 稳健串关方案 -->
      <div class="section-title">{{ t('strategy.safeTitle') }}</div>
      <div class="grid parlays">
        <div v-for="c in parlays" :key="c.k" class="parlay card">
          <div class="p-top"><b>{{ c.k }}{{ t('strategy.legs') }}</b><span class="big mono">×{{ c.odds.toFixed(2) }}</span></div>
          <div class="p-row"><span>{{ t('strategy.hitRate') }}</span><b class="g">{{ pct(c.prob) }}</b></div>
          <div class="p-legs">
            <div v-for="l in c.legs" :key="l.key" class="leg">
              <span class="lg-tm">{{ l.home }} <i>vs</i> {{ l.away }}</span>
              <span class="lg-pick">{{ outcomeLabel[l.pick] }} <em>@{{ l.odd.toFixed(2) }}</em></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 单场推荐 -->
      <div class="section-title">{{ t('strategy.singleTitle') }}</div>
      <div class="grid singles">
        <div v-for="(it, i) in items" :key="it.key" class="single card">
          <span class="s-rank">{{ i + 1 }}</span>
          <div class="s-match">
            <div class="s-teams">{{ it.home }} <i>vs</i> {{ it.away }}</div>
            <div class="s-meta muted">{{ it.league }} · {{ it.time }}</div>
          </div>
          <div class="s-pick">
            <span class="pk">{{ outcomeLabel[it.pick] }}</span>
            <span class="od mono">@{{ it.odd.toFixed(2) }}</span>
          </div>
          <div class="s-prob">
            <div class="pb"><span :style="{ width: pct(it.prob) }" /></div>
            <span class="pv mono">{{ pct(it.prob) }}</span>
          </div>
        </div>
      </div>
    </template>

    <p class="disc">{{ t('strategy.disclaimer') }}</p>
  </div>
</template>

<style scoped>
.head { margin: 24px 0 6px; }
.head h2 { font-size: 1.4rem; font-weight: 800; }
.lead { font-size: 0.86rem; margin-bottom: 14px; }
.empty { padding: 30px; text-align: center; }

.parlays { grid-template-columns: repeat(3, 1fr); }
.parlay { padding: 16px; }
.p-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.p-top b { font-size: 1rem; }
.p-top .big { font-size: 1.5rem; font-weight: 800; color: var(--accent); }
.p-row { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-dim); margin-bottom: 10px; }
.p-row .g { color: var(--primary); }
.p-legs { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--border); padding-top: 10px; }
.leg { display: flex; justify-content: space-between; font-size: 0.78rem; gap: 8px; }
.lg-tm { color: var(--text-dim); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lg-tm i, .s-teams i { font-style: normal; color: var(--text-mute); margin: 0 3px; }
.lg-pick { flex-shrink: 0; font-weight: 600; }
.lg-pick em { font-style: normal; color: var(--primary); }

.singles { grid-template-columns: 1fr; gap: 8px; }
.single { display: grid; grid-template-columns: 28px 1fr auto 150px; align-items: center; gap: 14px; padding: 12px 16px; }
.s-rank { font-weight: 800; color: var(--text-mute); text-align: center; }
.s-teams { font-weight: 700; font-size: 0.92rem; }
.s-meta { font-size: 0.72rem; margin-top: 2px; }
.s-pick { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.s-pick .pk { font-weight: 700; color: var(--primary); }
.s-pick .od { font-size: 0.8rem; color: var(--text-dim); }
.s-prob { display: flex; align-items: center; gap: 8px; }
.s-prob .pb { flex: 1; height: 8px; background: var(--bg-soft); border-radius: 6px; overflow: hidden; }
.s-prob .pb span { display: block; height: 100%; background: linear-gradient(90deg, var(--primary-dim), var(--primary)); }
.s-prob .pv { font-weight: 800; color: var(--primary); width: 42px; text-align: right; }

.disc { margin-top: 20px; font-size: 0.78rem; color: var(--accent); background: rgba(255,209,102,0.08); border: 1px solid rgba(255,209,102,0.25); border-radius: 8px; padding: 10px 14px; }

@media (max-width: 760px) {
  .parlays { grid-template-columns: 1fr; }
  .single { grid-template-columns: 24px 1fr auto; }
  .s-prob { grid-column: 2 / 4; }
}
</style>
