<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const { t, locale } = useI18n()

// 每场「更多玩法」展开状态（按场次编号）
const expanded = ref(new Set())
const toggle = (k) => {
  const s = new Set(expanded.value)
  s.has(k) ? s.delete(k) : s.add(k)
  expanded.value = s
}
const isOpen = (k) => expanded.value.has(k)

const lc = () => (locale.value === 'en' ? 'en-GB' : 'zh-CN')
const feed = computed(() => store.oddsFeed)
const fetchedAt = computed(() => feed.value?.fetchedAt ? new Date(feed.value.fetchedAt).toLocaleString(lc()) : '')

// 按日期分组、组内按时间排序（数据源已排序，这里再保险一次）。
const dayGroups = computed(() => {
  const list = [...(feed.value?.matches || [])].sort((a, b) => (a.dateTime || '').localeCompare(b.dateTime || ''))
  const days = {}
  list.forEach((m) => {
    const key = m.matchDate || t('common.other')
    ;(days[key] ||= []).push(m)
  })
  return Object.entries(days).map(([date, matches]) => ({ date, matches }))
})

const weekday = (d) => { const dt = new Date(d); return isNaN(dt) ? '' : dt.toLocaleDateString(lc(), { weekday: 'short' }) }
const fmtDay = (d) => {
  const dt = new Date(d)
  return isNaN(dt) ? d : dt.toLocaleDateString(lc(), { month: 'long', day: 'numeric' })
}
// 让球数显示为带符号数字：主队让球为负(-1/-2)，受让为正(+1/+2)，平手为 0
const goalLineText = (l) => (l > 0 ? `+${l}` : `${l}`)

// ===== 足球计算器（混合过关，支持一场多选/复式）=====
// 同一场可选多个结果（并列），注数=各场所选数量相乘；本金按注数倍增。
const UNIT = 2 // 竞彩单注 2 元
const picks = ref({}) // matchNum -> [{ num, matchLabel, label, odd }]
const multiplier = ref(1)

function pick(m, label, odd) {
  const key = m.matchNum
  const arr = picks.value[key] ? [...picks.value[key]] : []
  const idx = arr.findIndex((x) => x.label === label)
  if (idx >= 0) arr.splice(idx, 1) // 再点取消
  else arr.push({ num: m.matchNum, matchLabel: `${store.dispNameCn(m.homeName)} vs ${store.dispNameCn(m.awayName)}`, label, odd })
  const next = { ...picks.value }
  if (arr.length) next[key] = arr
  else delete next[key]
  picks.value = next
}
const isPicked = (m, label) => (picks.value[m.matchNum] || []).some((x) => x.label === label)
const removePick = (num, label) => {
  const arr = (picks.value[num] || []).filter((x) => x.label !== label)
  const next = { ...picks.value }
  if (arr.length) next[num] = arr
  else delete next[num]
  picks.value = next
}
const clearAll = () => { picks.value = {} }

const matchEntries = computed(() => Object.entries(picks.value)) // [[matchNum, arr], ...]
const selections = computed(() => matchEntries.value.flatMap(([, arr]) => arr))
const matchCount = computed(() => matchEntries.value.length)
const betCount = computed(() => matchEntries.value.reduce((p, [, arr]) => p * arr.length, 1)) // 注数

// 所有组合的总赔率（每场各取一个结果做笛卡尔积）
const products = computed(() => {
  if (!matchCount.value) return []
  let ps = [1]
  for (const [, arr] of matchEntries.value) {
    const nxt = []
    for (const p of ps) for (const s of arr) nxt.push(p * s.odd)
    ps = nxt
  }
  return ps
})
const minOdds = computed(() => (products.value.length ? Math.min(...products.value) : 0))
const maxOdds = computed(() => (products.value.length ? Math.max(...products.value) : 0))
const isRange = computed(() => betCount.value > 1 && minOdds.value.toFixed(2) !== maxOdds.value.toFixed(2))

const parlayType = computed(() => {
  const n = matchCount.value
  const en = locale.value === 'en'
  if (n === 0) return ''
  if (n === 1) return betCount.value > 1 ? (en ? `Single ×${betCount.value}` : `单场${betCount.value}注`) : (en ? 'Single' : '单关')
  return (en ? `${n}-fold` : `${n}串1`) + (betCount.value > 1 ? (en ? ' combo' : ' 复式') : '')
})
const mult = computed(() => Math.max(1, Math.floor(multiplier.value) || 1))
const stake = computed(() => (matchCount.value ? betCount.value * UNIT * mult.value : 0))
const maxPrize = computed(() => UNIT * mult.value * maxOdds.value)
</script>

<template>
  <div class="view">
    <div class="head">
      <div>
        <h2>{{ t('odds.title') }}</h2>
        <p class="muted">{{ t('odds.lead') }}</p>
      </div>
      <span class="gen muted" v-if="fetchedAt">{{ t('common.updatedAt') }} {{ fetchedAt }}</span>
    </div>

    <div v-if="!dayGroups.length" class="empty card muted">
      {{ t('odds.empty') }}
    </div>

    <div v-for="day in dayGroups" :key="day.date" class="day">
      <div class="day-head">
        <span class="d-date">{{ fmtDay(day.date) }}</span>
        <span class="d-wd">{{ weekday(day.date) }}</span>
        <span class="d-count muted">{{ day.matches.length }}</span>
      </div>

      <div class="rows">
        <div v-for="(m, i) in day.matches" :key="i" class="orow card">
          <div class="orow-main">
            <!-- 左侧：场次 + 联赛 + 时间 -->
            <div class="info">
              <span class="num">{{ m.matchNum }}</span>
              <span class="league">{{ m.league }}</span>
              <span class="time mono">{{ m.matchTime }}</span>
            </div>
            <!-- 中间：对阵 -->
            <div class="teams">
              <div class="tm"><span v-if="m.homeRank" class="rk">{{ m.homeRank }}</span>{{ store.dispNameCn(m.homeName) }}</div>
              <div class="tm"><span v-if="m.awayRank" class="rk">{{ m.awayRank }}</span>{{ store.dispNameCn(m.awayName) }}</div>
            </div>
            <!-- 右侧：胜平负 + 让球胜平负，列头 胜/平/负 -->
            <div class="odds">
              <div class="ohead"><span></span><span>{{ t('common.win') }}</span><span>{{ t('common.draw') }}</span><span>{{ t('common.loss') }}</span></div>
              <div class="oline" v-if="m.hhad">
                <span class="lbl">{{ t('odds.handicap') }}<i>{{ goalLineText(m.hhad.goalLine) }}</i></span>
                <span class="cell" :class="{ sel: isPicked(m, `让球${goalLineText(m.hhad.goalLine)}·胜`) }" @click="pick(m, `让球${goalLineText(m.hhad.goalLine)}·胜`, m.hhad.h)">{{ m.hhad.h.toFixed(2) }}</span>
                <span class="cell" :class="{ sel: isPicked(m, `让球${goalLineText(m.hhad.goalLine)}·平`) }" @click="pick(m, `让球${goalLineText(m.hhad.goalLine)}·平`, m.hhad.d)">{{ m.hhad.d.toFixed(2) }}</span>
                <span class="cell" :class="{ sel: isPicked(m, `让球${goalLineText(m.hhad.goalLine)}·负`) }" @click="pick(m, `让球${goalLineText(m.hhad.goalLine)}·负`, m.hhad.a)">{{ m.hhad.a.toFixed(2) }}</span>
              </div>
              <div class="oline" v-if="m.had">
                <span class="lbl">{{ t('schedule.oddsTitle') }}</span>
                <span class="cell" :class="{ sel: isPicked(m, '胜平负·胜') }" @click="pick(m, '胜平负·胜', m.had.h)">{{ m.had.h.toFixed(2) }}</span>
                <span class="cell" :class="{ sel: isPicked(m, '胜平负·平') }" @click="pick(m, '胜平负·平', m.had.d)">{{ m.had.d.toFixed(2) }}</span>
                <span class="cell" :class="{ sel: isPicked(m, '胜平负·负') }" @click="pick(m, '胜平负·负', m.had.a)">{{ m.had.a.toFixed(2) }}</span>
              </div>
              <div class="oline none" v-if="!m.had && !m.hhad">{{ t('odds.noOpen') }}</div>
            </div>
          </div>

          <!-- 更多玩法：比分 / 总进球 / 半全场 -->
          <button v-if="m.ttg || m.crs || m.hafu" class="more-btn" @click="toggle(m.matchNum)">
            {{ isOpen(m.matchNum) ? t('common.back') : t('odds.moreplay') }} · {{ t('odds.score') }} / {{ t('odds.totalGoals') }} / {{ t('odds.halffull') }}
            <span :class="{ flip: isOpen(m.matchNum) }">▾</span>
          </button>

          <div class="more" v-if="isOpen(m.matchNum)">
            <div class="mk" v-if="m.crs">
              <div class="mk-t">{{ t('odds.score') }}</div>
              <div class="chips">
                <div v-for="c in m.crs" :key="c.score" class="chip" :class="{ sel: isPicked(m, `比分·${c.score}`) }" @click="pick(m, `比分·${c.score}`, c.odds)"><b>{{ c.score }}</b><i>{{ c.odds.toFixed(2) }}</i></div>
              </div>
            </div>
            <div class="mk" v-if="m.ttg">
              <div class="mk-t">{{ t('odds.totalGoals') }}</div>
              <div class="chips ttg">
                <div v-for="tg in m.ttg" :key="tg.goals" class="chip" :class="{ sel: isPicked(m, `进球·${tg.goals}`) }" @click="pick(m, `进球·${tg.goals}`, tg.odds)"><b>{{ tg.goals }}</b><i>{{ tg.odds.toFixed(2) }}</i></div>
              </div>
            </div>
            <div class="mk" v-if="m.hafu">
              <div class="mk-t">{{ t('odds.halffull') }}</div>
              <div class="chips hafu">
                <div v-for="h in m.hafu" :key="h.combo" class="chip" :class="{ sel: isPicked(m, `半全场·${h.combo}`) }" @click="pick(m, `半全场·${h.combo}`, h.odds)"><b>{{ h.combo }}</b><i>{{ h.odds.toFixed(2) }}</i></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="src muted">{{ locale === 'en' ? 'Odds from' : '赔率来自' }} <a href="https://m.sporttery.cn/mjc/jsq/zqhhgg/" target="_blank" rel="noopener">m.sporttery.cn</a>{{ locale === 'en' ? ', for reference only.' : '，仅供参考。' }}</p>

    <!-- 足球计算器（混合过关）：底部悬浮 -->
    <div class="calc" v-if="selections.length">
      <div class="calc-inner container">
        <div class="c-main">
          <div class="c-top">
            <span class="c-title">⚽ {{ t('odds.calc') }}</span>
            <span class="c-type">{{ parlayType }}</span>
            <span class="c-count muted">{{ matchCount }} / {{ betCount }}</span>
            <button class="c-clear" @click="clearAll">{{ t('odds.clear') }}</button>
          </div>
          <div class="c-picks">
            <span v-for="s in selections" :key="s.num + '-' + s.label" class="c-pick" @click="removePick(s.num, s.label)">
              <b>{{ s.num }}</b> {{ s.label }} <i>@{{ s.odd.toFixed(2) }}</i> <em>✕</em>
            </span>
          </div>
        </div>
        <div class="c-calc">
          <div class="c-hero">
            <span class="c-hero-num mono">{{ maxOdds.toFixed(2) }}</span>
            <span class="c-hero-lbl">×<br><small>{{ isRange ? `${locale === 'en' ? 'min' : '最低'} ${minOdds.toFixed(2)}` : (locale === 'en' ? '(per 1 stake)' : '（1 倍回报）') }}</small></span>
          </div>
          <div class="c-money">
            <label>{{ t('odds.multiplier') }} <input type="number" min="1" v-model.number="multiplier" /></label>
            <div class="c-line"><span>{{ t('odds.stake') }}</span><b class="mono">{{ stake }} {{ locale === 'en' ? '¥' : '元' }}</b></div>
            <div class="c-line hl"><span>{{ t('odds.maxWin') }}</span><b class="mono">{{ maxPrize.toFixed(2) }} {{ locale === 'en' ? '¥' : '元' }}</b></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view { padding-bottom: 130px; }
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin: 24px 0 16px; flex-wrap: wrap; }
.head h2 { font-size: 1.4rem; font-weight: 800; }
.head p { font-size: 0.86rem; margin-top: 4px; }
.gen { font-size: 0.74rem; }
.empty { padding: 30px; text-align: center; }
.empty code { color: var(--accent); }

.day { margin-bottom: 18px; }
.day-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-left: 2px; }
.d-date { font-weight: 800; font-size: 1rem; }
.d-wd { color: var(--text-dim); font-size: 0.85rem; }
.d-count { margin-left: auto; font-size: 0.74rem; }

.rows { display: flex; flex-direction: column; gap: 10px; }
.orow { padding: 12px 16px; }
.orow-main { display: grid; grid-template-columns: 110px 1fr 320px; align-items: center; gap: 14px; }

.info { display: flex; flex-direction: column; gap: 3px; }
.info .num { font-weight: 800; color: var(--accent); font-size: 0.82rem; }
.info .league { font-size: 0.72rem; color: var(--text-dim); background: var(--bg-soft); padding: 1px 6px; border-radius: 5px; align-self: flex-start; }
.info .time { font-size: 0.78rem; color: var(--text-mute); }

.teams { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.teams .tm { font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.teams .rk { color: var(--text-mute); font-weight: 600; font-size: 0.75rem; margin-right: 5px; }

.odds { display: flex; flex-direction: column; gap: 5px; }
.ohead, .oline { display: grid; grid-template-columns: 62px 1fr 1fr 1fr; gap: 6px; align-items: center; }
.ohead span { text-align: center; font-size: 0.68rem; color: var(--text-mute); }
.oline .lbl { font-size: 0.74rem; color: var(--text-dim); font-weight: 600; }
.oline .lbl i { font-style: normal; color: var(--accent); margin-left: 3px; font-size: 0.68rem; }
.oline .cell {
  text-align: center; font-weight: 800; font-variant-numeric: tabular-nums; cursor: pointer;
  background: var(--bg-soft); border: 1px solid var(--border); border-radius: 6px; padding: 5px 0; font-size: 0.86rem;
  transition: all 0.12s;
}
.oline .cell:hover { border-color: var(--primary-dim); }
.oline .cell.sel { background: var(--primary); color: #06231b; border-color: var(--primary); }
.oline.none { color: var(--text-mute); font-size: 0.78rem; padding: 4px 0; }

.src { font-size: 0.74rem; margin-top: 8px; }
.src a { color: var(--primary); }

.more-btn {
  width: 100%; margin-top: 10px; padding: 6px; background: transparent;
  border: 1px dashed var(--border); border-radius: 8px; color: var(--text-dim);
  font-size: 0.76rem; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.more-btn span { transition: transform 0.2s; }
.more-btn span.flip { transform: rotate(180deg); }
.more { margin-top: 10px; display: flex; flex-direction: column; gap: 12px; }
.mk-t { font-size: 0.74rem; color: var(--text-mute); margin-bottom: 6px; }
.mk-t small { color: var(--text-dim); font-size: 0.66rem; }
.chips { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.chips.ttg { grid-template-columns: repeat(8, 1fr); }
.chips.hafu { grid-template-columns: repeat(9, 1fr); }
.chip {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: var(--bg-soft); border: 1px solid var(--border); border-radius: 6px; padding: 5px 2px;
}
.chip { cursor: pointer; transition: all 0.12s; }
.chip:hover { border-color: var(--primary-dim); }
.chip.sel { background: var(--primary); border-color: var(--primary); }
.chip.sel b, .chip.sel i { color: #06231b; }
.chip b { font-size: 0.72rem; color: var(--text-mute); font-weight: 600; }
.chip i { font-style: normal; font-size: 0.8rem; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }

/* 足球计算器悬浮条（固定在视口底部） */
.calc {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
  background: rgba(11, 16, 32, 0.97); backdrop-filter: blur(12px);
  border-top: 1px solid var(--primary-dim); box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.45);
}
.calc-inner { display: flex; gap: 20px; align-items: stretch; padding: 12px 20px; }
.c-main { flex: 1; min-width: 0; }
.c-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.c-title { font-weight: 800; }
.c-type { font-size: 0.72rem; font-weight: 700; color: #06231b; background: var(--accent); padding: 2px 9px; border-radius: 999px; }
.c-count { font-size: 0.76rem; }
.c-clear { margin-left: auto; font-size: 0.76rem; color: var(--text-dim); background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 3px 12px; }
.c-picks { display: flex; flex-wrap: wrap; gap: 6px; max-height: 64px; overflow-y: auto; }
.c-pick {
  display: inline-flex; align-items: center; gap: 5px; font-size: 0.76rem; cursor: pointer;
  background: var(--bg-soft); border: 1px solid var(--border); border-radius: 6px; padding: 3px 8px;
}
.c-pick b { color: var(--accent); font-weight: 700; }
.c-pick i { font-style: normal; color: var(--primary); font-weight: 700; }
.c-pick em { font-style: normal; color: var(--text-mute); }
.c-pick:hover { border-color: var(--danger); }

.c-calc { display: flex; align-items: center; gap: 18px; border-left: 1px solid var(--border); padding-left: 20px; }
.c-hero { display: flex; align-items: center; gap: 8px; }
.c-hero-num { font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1; }
.c-hero-lbl { font-size: 0.78rem; color: var(--text-dim); }
.c-hero-lbl small { font-size: 0.66rem; color: var(--text-mute); }
.c-money { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; }
.c-money label { display: flex; align-items: center; gap: 6px; color: var(--text-dim); }
.c-money input { width: 56px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 3px 6px; font-size: 0.82rem; }
.c-line { display: flex; justify-content: space-between; gap: 14px; }
.c-line span { color: var(--text-mute); }
.c-line.hl b { color: var(--accent); }

@media (max-width: 760px) {
  .orow-main { grid-template-columns: 1fr; gap: 10px; }
  .info { flex-direction: row; align-items: center; gap: 8px; }
  .chips, .chips.ttg, .chips.hafu { grid-template-columns: repeat(4, 1fr); }
  .calc-inner { flex-direction: column; gap: 10px; padding: 10px 14px; }
  .c-calc { border-left: none; border-top: 1px solid var(--border); padding-left: 0; padding-top: 10px; justify-content: space-between; }
}
</style>
