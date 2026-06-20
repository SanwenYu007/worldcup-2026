<script setup>
// AI 投注策略：从实时赔率(胜平负 had)反推隐含概率。
// 不只看胜负——同时计算每场「爆冷概率」(最热门结果不发生的概率)，给出：
//   1) 稳健串关方案（隐含胜率高、爆冷概率低）
//   2) 单场推荐（标注隐含胜率 + 爆冷风险）
//   3) 冷门预警（爆冷概率高的场次，串关规避 / 可小注博冷门）
// 纯前端计算，透明可解释；含理性投注免责声明。
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const { t, locale } = useI18n()
const outcomeLabel = computed(() => ({ h: t('result.home'), d: t('result.draw'), a: t('result.away') }))

// 赔率 → 去除抽水后的隐含概率
function impliedProbs(had) {
  const inv = { h: 1 / had.h, d: 1 / had.d, a: 1 / had.a }
  const s = inv.h + inv.d + inv.a
  return { h: inv.h / s, d: inv.d / s, a: inv.a / s }
}

// 体彩盘口只有中文队名；用 teams.json 建「中文/英文名 → 球队」映射，实现双语显示。
const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase()
const nameMap = computed(() => {
  const m = new Map()
  ;(store.teamsFull?.teams || []).forEach((tm) => {
    if (tm.cnName) m.set(norm(tm.cnName), tm)
    if (tm.name) m.set(norm(tm.name), tm)
  })
  return m
})
function localizeName(cn) {
  const tm = nameMap.value.get(norm(cn))
  if (!tm) return cn // 映射不到就保留体彩原始中文名
  return locale.value === 'en' ? (tm.name || cn) : (tm.cnName || cn)
}

// 待分析比赛：直接用体彩竞彩原始盘口(oddsFeed)——这是真实赔率，贴近市场概率。
const analyzed = computed(() => {
  const feed = store.oddsFeed?.matches || []
  return feed
    .filter((m) => m.had && [m.had.h, m.had.d, m.had.a].every((x) => Number.isFinite(x) && x > 1))
    .map((m) => {
      const had = m.had
      const p = impliedProbs(had)
      const legs = [
        { key: 'h', prob: p.h, odd: had.h },
        { key: 'd', prob: p.d, odd: had.d },
        { key: 'a', prob: p.a, odd: had.a }
      ]
      const fav = legs.reduce((a, b) => (a.prob >= b.prob ? a : b))
      const upset = legs.reduce((a, b) => (a.odd >= b.odd ? a : b)) // 赔率最高=最大冷门方向
      return {
        key: m.matchNum || `${m.homeName}-${m.awayName}`,
        home: localizeName(m.homeName),
        away: localizeName(m.awayName),
        time: [m.matchDate, m.matchTime].filter(Boolean).join(' ') || m.league || '',
        favKey: fav.key, favProb: fav.prob, favOdd: fav.odd,
        upKey: upset.key, upProb: upset.prob, upOdd: upset.odd,
        upsetProb: 1 - fav.prob // 爆冷概率：最热门结果不发生
      }
    })
})

// 单场推荐：按隐含胜率排序
const items = computed(() => [...analyzed.value].sort((a, b) => b.favProb - a.favProb))

// 冷门预警：按爆冷概率排序，取最高的若干场
const upsets = computed(() => [...analyzed.value].sort((a, b) => b.upsetProb - a.upsetProb).slice(0, 6))

// 稳健串关：只用爆冷概率低（隐含胜率高）的场次，取前 K 场组合
const parlays = computed(() => {
  const safe = items.value.filter((x) => x.upsetProb <= 0.45).slice(0, 4)
  const combos = []
  ;[2, 3, 4].forEach((k) => {
    if (safe.length < k) return
    const legs = safe.slice(0, k)
    const odds = legs.reduce((s, x) => s * x.favOdd, 1)
    const prob = legs.reduce((s, x) => s * x.favProb, 1)
    combos.push({ k, legs, odds, prob })
  })
  return combos
})

const pct = (x) => Math.round(x * 100) + '%'
// 爆冷风险分级
const riskClass = (u) => (u >= 0.6 ? 'hot' : u >= 0.45 ? 'warm' : 'cool')
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
      <p class="sub muted">{{ t('strategy.safeSub') }}</p>
      <div class="grid parlays" v-if="parlays.length">
        <div v-for="c in parlays" :key="c.k" class="parlay card">
          <div class="p-top"><b>{{ c.k }}{{ t('strategy.legs') }}</b><span class="big mono">×{{ c.odds.toFixed(2) }}</span></div>
          <div class="p-row"><span>{{ t('strategy.hitRate') }}</span><b class="g">{{ pct(c.prob) }}</b></div>
          <div class="p-legs">
            <div v-for="l in c.legs" :key="l.key" class="leg">
              <span class="lg-tm">{{ l.home }} <i>vs</i> {{ l.away }}</span>
              <span class="lg-pick">{{ outcomeLabel[l.favKey] }} <em>@{{ l.favOdd.toFixed(2) }}</em></span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty card muted">{{ t('strategy.noData') }}</div>

      <!-- 冷门预警 -->
      <div class="section-title">{{ t('strategy.upsetTitle') }}</div>
      <p class="sub muted">{{ t('strategy.upsetSub') }}</p>
      <div class="grid upsets">
        <div v-for="u in upsets" :key="u.key" class="upset card">
          <div class="u-match">{{ u.home }} <i>vs</i> {{ u.away }}</div>
          <div class="u-meta muted">{{ u.time }}</div>
          <div class="u-bar"><span :class="riskClass(u.upsetProb)" :style="{ width: pct(u.upsetProb) }" /></div>
          <div class="u-row">
            <span class="u-lab">{{ t('strategy.upsetProb') }}</span>
            <b :class="'r-' + riskClass(u.upsetProb)">{{ pct(u.upsetProb) }}</b>
          </div>
          <div class="u-row small">
            <span class="u-lab">{{ t('strategy.upsetSide') }}</span>
            <span>{{ outcomeLabel[u.upKey] }} · {{ t('strategy.payout') }} <em class="acc">×{{ u.upOdd.toFixed(2) }}</em></span>
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
            <div class="s-meta muted">{{ it.time }}</div>
          </div>
          <div class="s-pick">
            <span class="pk">{{ outcomeLabel[it.favKey] }}</span>
            <span class="od mono">@{{ it.favOdd.toFixed(2) }}</span>
          </div>
          <div class="s-prob">
            <div class="pb"><span :style="{ width: pct(it.favProb) }" /></div>
            <span class="pv mono">{{ pct(it.favProb) }}</span>
          </div>
          <span class="s-risk" :class="'r-' + riskClass(it.upsetProb)">{{ t('strategy.riskTag') }} {{ pct(it.upsetProb) }}</span>
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
.sub { font-size: 0.78rem; margin: -6px 0 12px; }
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
.lg-tm i, .s-teams i, .u-match i { font-style: normal; color: var(--text-mute); margin: 0 3px; }
.lg-pick { flex-shrink: 0; font-weight: 600; }
.lg-pick em { font-style: normal; color: var(--primary); }

/* 冷门预警 */
.upsets { grid-template-columns: repeat(3, 1fr); }
.upset { padding: 14px 16px; }
.u-match { font-weight: 700; font-size: 0.9rem; }
.u-meta { font-size: 0.72rem; margin: 2px 0 10px; }
.u-bar { height: 7px; background: var(--bg-soft); border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
.u-bar span { display: block; height: 100%; }
.u-bar .hot { background: linear-gradient(90deg, #f0883e, #ef4444); }
.u-bar .warm { background: linear-gradient(90deg, #f5c451, #f0883e); }
.u-bar .cool { background: linear-gradient(90deg, var(--primary-dim), var(--primary)); }
.u-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; }
.u-row.small { font-size: 0.76rem; margin-top: 4px; color: var(--text-dim); }
.u-lab { color: var(--text-mute); }
.u-row b { font-size: 1.05rem; font-weight: 800; }
.acc { font-style: normal; color: var(--accent); font-weight: 700; }
.r-hot { color: #ef4444; }
.r-warm { color: #f0883e; }
.r-cool { color: var(--primary); }

.singles { grid-template-columns: 1fr; gap: 8px; }
.single { display: grid; grid-template-columns: 28px 1fr auto 130px auto; align-items: center; gap: 14px; padding: 12px 16px; }
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
.s-risk { font-size: 0.72rem; font-weight: 700; white-space: nowrap; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border); }
.s-risk.r-hot { border-color: rgba(239,68,68,0.4); }
.s-risk.r-warm { border-color: rgba(240,136,62,0.4); }
.s-risk.r-cool { border-color: var(--primary-dim); }

.disc { margin-top: 20px; font-size: 0.78rem; color: var(--accent); background: rgba(255,209,102,0.08); border: 1px solid rgba(255,209,102,0.25); border-radius: 8px; padding: 10px 14px; }

@media (max-width: 760px) {
  .parlays, .upsets { grid-template-columns: 1fr; }
  .single { grid-template-columns: 24px 1fr auto; }
  .s-prob { grid-column: 2 / 4; }
  .s-risk { grid-column: 2 / 4; justify-self: start; }
}
</style>
