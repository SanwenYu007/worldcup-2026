<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const filter = ref('all') // all | upcoming | finished

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

const statusText = { finished: '完场', live: '进行中', scheduled: '未开赛' }
const weekday = (d) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(d).getDay()]
const fmtDay = (d) => new Date(d).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
const fmtTime = (d) => new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
const stageLabel = (m) => m.group ? `${m.group}组` : (m.stageName || '淘汰赛')

function isToday(d) {
  return new Date(d).toDateString() === store.now.toDateString()
}
</script>

<template>
  <div class="view">
    <div class="head">
      <h2>赛程时间表</h2>
      <div class="filters">
        <button :class="{ on: filter === 'all' }" @click="filter = 'all'">全部</button>
        <button :class="{ on: filter === 'upcoming' }" @click="filter = 'upcoming'">未赛</button>
        <button :class="{ on: filter === 'finished' }" @click="filter = 'finished'">已赛</button>
      </div>
    </div>

    <div v-for="day in dayGroups" :key="day.date" class="day">
      <div class="day-head" :class="{ today: isToday(day.date) }">
        <span class="d-date">{{ fmtDay(day.date) }}</span>
        <span class="d-wd">{{ weekday(day.date) }}</span>
        <span class="d-badge" v-if="isToday(day.date)">今天</span>
        <span class="d-count muted">{{ day.matches.length }} 场</span>
      </div>

      <div class="rows card">
        <div v-for="m in day.matches" :key="m.id" class="row" :class="m.status">
          <span class="time mono">{{ fmtTime(m.date) }}</span>
          <span class="stage">{{ stageLabel(m) }}</span>
          <span class="t home">
            <span class="nm">{{ store.getTeam(m.home)?.name || m.homeLabel || '待定' }}</span>
            <span class="fl">{{ store.getTeam(m.home)?.flag || '🏳️' }}</span>
          </span>
          <span class="sc mono" v-if="m.homeGoals != null">{{ m.homeGoals }}:{{ m.awayGoals }}</span>
          <span class="sc vs" v-else>vs</span>
          <span class="t away">
            <span class="fl">{{ store.getTeam(m.away)?.flag || '🏳️' }}</span>
            <span class="nm">{{ store.getTeam(m.away)?.name || m.awayLabel || '待定' }}</span>
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

.day { margin-bottom: 20px; }
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
