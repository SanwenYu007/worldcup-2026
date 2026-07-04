<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const { t, locale } = useI18n()
const filter = ref('all') // all | upcoming | finished
const lc = () => (locale.value === 'en' ? 'en-GB' : 'zh-CN')

// 进入页面自动定位到「今天」那一天，无需手动下滑。
const root = ref(null) // .timeline-view 根元素
// 用户一旦自己滚动/切换筛选，就交还控制权，不再自动定位。
let userTook = false
const yieldToUser = () => { userTook = true }

// 全部比赛按日期分组、组内按时间排序。
const dayGroups = computed(() => {
  let list = [...store.matches]
  if (filter.value === 'upcoming') list = list.filter((m) => m.status !== 'finished')
  else if (filter.value === 'finished') list = list.filter((m) => m.status === 'finished')
  list.sort((a, b) => new Date(a.date) - new Date(b.date))

  const days = {}
  list.forEach((m) => {
    const key = new Date(m.date).toISOString().slice(0, 10)
    ;(days[key] ||= []).push(m)
  })
  return Object.entries(days).map(([date, matches]) => ({ date, matches }))
})

const statusText = computed(() => ({ finished: t('common.finished'), live: t('common.inplay'), scheduled: t('common.upcoming') }))
const weekday = (d) => new Date(d).toLocaleDateString(lc(), { weekday: 'short' })
const fmtDay = (d) => new Date(d).toLocaleDateString(lc(), { month: 'long', day: 'numeric' })
const fmtTime = (d) => new Date(d).toLocaleTimeString(lc(), { hour: '2-digit', minute: '2-digit' })
const KO = ['r32', 'r16', 'qf', 'sf', 'third', 'final']
const stageLabel = (m) => m.group ? `${m.group}${t('common.group')}` : (KO.includes(m.stage) ? t('overview.stages.' + m.stage) : (m.stageName || t('schedule.knockoutTab')))

function isToday(d) {
  return new Date(d).toDateString() === store.now.toDateString()
}

// 定位目标：优先「今天」；今天无比赛则取最近的未来一天，再不行取最后一天。
const focusDate = computed(() => {
  const days = dayGroups.value
  if (!days.length) return null
  const today = days.find((d) => isToday(d.date))
  if (today) return today.date
  const future = days.find((d) => new Date(d.date).getTime() >= store.now.getTime())
  return (future || days[days.length - 1]).date
})

// 定位到目标日（直接按 DOM 查询，避开模板 ref 与数据切换重渲染的时序问题）。
// 数据会从示例切换到真实(live.json) 导致列表重排、滚动被重置，因此在挂载后短时间内
// 反复校正到目标日置顶为止；用户一旦滚动或切换筛选即停止，交还控制权。
let scrollTimer = null
function alignToFocus() {
  if (userTook) return
  const el = root.value?.querySelector('.day-head.focus')?.closest('.day')
  if (el) el.scrollIntoView({ block: 'start' })
}

onMounted(() => {
  window.addEventListener('wheel', yieldToUser, { passive: true, once: true })
  window.addEventListener('touchstart', yieldToUser, { passive: true, once: true })
  let tries = 0
  const tick = () => {
    if (userTook || tries++ > 16) return // 最多校正约 2.4s
    alignToFocus()
    scrollTimer = setTimeout(tick, 150)
  }
  nextTick(tick)
})
onBeforeUnmount(() => {
  clearTimeout(scrollTimer)
  window.removeEventListener('wheel', yieldToUser)
  window.removeEventListener('touchstart', yieldToUser)
})
// 用户切换筛选即视为接管，避免被自动定位打断。
watch(filter, yieldToUser)
</script>

<template>
  <div class="view timeline-view" ref="root">
    <div class="head">
      <h2>{{ t('timeline.title') }}</h2>
      <div class="filters">
        <button :class="{ on: filter === 'all' }" @click="filter = 'all'">{{ t('timeline.all') }}</button>
        <button :class="{ on: filter === 'upcoming' }" @click="filter = 'upcoming'">{{ t('timeline.upcoming') }}</button>
        <button :class="{ on: filter === 'finished' }" @click="filter = 'finished'">{{ t('timeline.finished') }}</button>
      </div>
    </div>

    <div v-for="day in dayGroups" :key="day.date" class="day">
      <div class="day-head" :class="{ today: isToday(day.date), focus: day.date === focusDate }">
        <span class="d-date">{{ fmtDay(day.date) }}</span>
        <span class="d-wd">{{ weekday(day.date) }}</span>
        <span class="d-badge" v-if="isToday(day.date)">{{ t('common.today') }}</span>
        <span class="d-count muted">{{ day.matches.length }}</span>
      </div>

      <div class="rows card">
        <div v-for="m in day.matches" :key="m.id" class="row" :class="m.status">
          <span class="time mono">{{ fmtTime(m.date) }}</span>
          <span class="stage">{{ stageLabel(m) }}</span>
          <span class="t home">
            <span class="nm">{{ store.getTeam(m.home)?.name || m.homeLabel || t('common.tbd') }}</span>
            <span class="fl">{{ store.getTeam(m.home)?.flag || '🏳️' }}</span>
          </span>
          <span class="sc mono" v-if="m.homeGoals != null">{{ m.homeGoals }}:{{ m.awayGoals }}</span>
          <span class="sc vs" v-else>vs</span>
          <span class="t away">
            <span class="fl">{{ store.getTeam(m.away)?.flag || '🏳️' }}</span>
            <span class="nm">{{ store.getTeam(m.away)?.name || m.awayLabel || t('common.tbd') }}</span>
          </span>
          <span class="st" :class="m.status">{{ statusText[m.status] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 24px 0 18px; flex-wrap: wrap; }
.head h2 { font-size: 1.4rem; font-weight: 800; }
.filters { display: flex; gap: 6px; }
.filters button {
  padding: 6px 16px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--card); color: var(--text-dim); font-weight: 600; font-size: 0.84rem;
}
.filters button.on { background: var(--primary); color: #06231b; border-color: transparent; }

.day { margin-bottom: 20px; scroll-margin-top: 76px; }
.day-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-left: 2px; }
.d-date { font-weight: 800; font-size: 1rem; }
.d-wd { color: var(--text-dim); font-size: 0.85rem; }
.d-badge { font-size: 0.68rem; font-weight: 700; color: #06231b; background: var(--primary); padding: 1px 8px; border-radius: 999px; }
.day-head.today .d-date { color: var(--primary); }
.d-count { margin-left: auto; font-size: 0.74rem; }

.rows { overflow: hidden; }
.row {
  display: grid;
  grid-template-columns: 56px 60px 1fr 64px 1fr 64px;
  align-items: center; gap: 10px; padding: 11px 16px; border-top: 1px solid var(--border);
}
.row:first-child { border-top: none; }
.row.live { background: rgba(255, 71, 87, 0.06); }
.time { font-weight: 700; color: var(--text); font-size: 0.86rem; }
.stage { font-size: 0.7rem; color: var(--text-dim); background: var(--bg-soft); padding: 2px 6px; border-radius: 5px; text-align: center; }
.t { display: flex; align-items: center; gap: 7px; min-width: 0; }
.t.home { justify-content: flex-end; }
.t .nm { font-weight: 600; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.t .fl { font-size: 1.2rem; }
.sc { text-align: center; font-weight: 800; font-size: 1.05rem; }
.sc.vs { color: var(--text-mute); font-size: 0.8rem; font-weight: 600; }
.st { text-align: right; font-size: 0.74rem; font-weight: 600; color: var(--text-mute); }
.st.finished { color: var(--primary); }
.st.live { color: var(--live); }

@media (max-width: 680px) {
  .row { grid-template-columns: 46px 1fr 54px 1fr; row-gap: 4px; }
  .stage, .st { display: none; }
}
</style>
