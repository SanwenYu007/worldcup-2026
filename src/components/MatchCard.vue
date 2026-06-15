<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'

const props = defineProps({
  match: { type: Object, required: true }
})
const store = useDataStore()

const home = computed(() => store.getTeam(props.match.home))
const away = computed(() => store.getTeam(props.match.away))

const dateLabel = computed(() => {
  const d = new Date(props.match.date)
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
})
const statusLabel = { finished: '完场', live: '进行中', scheduled: '未开始' }
const hasScore = computed(() => props.match.homeGoals != null)
function won(side) {
  if (!hasScore.value || props.match.status === 'scheduled') return false
  return side === 'home'
    ? props.match.homeGoals > props.match.awayGoals
    : props.match.awayGoals > props.match.homeGoals
}
</script>

<template>
  <div class="match card" :class="match.status">
    <div class="meta">
      <span class="badge" :class="match.status">{{ statusLabel[match.status] }}
        <template v-if="match.status === 'live'"> · {{ match.minute }}'</template>
      </span>
      <span class="when">{{ match.group ? `${match.group} 组` : (match.stageName || '') }} · {{ dateLabel }}</span>
    </div>
    <div class="teams">
      <div class="team" :class="{ win: won('home') }">
        <span class="flag">{{ home?.flag || '🏳️' }}</span>
        <span class="name">{{ home?.name || match.homeLabel || '待定' }}</span>
      </div>
      <div class="score mono" v-if="hasScore">
        {{ match.homeGoals }}<span class="sep">:</span>{{ match.awayGoals }}
      </div>
      <div class="score vs" v-else>VS</div>
      <div class="team away" :class="{ win: won('away') }">
        <span class="name">{{ away?.name || match.awayLabel || '待定' }}</span>
        <span class="flag">{{ away?.flag || '🏳️' }}</span>
      </div>
    </div>
    <div class="venue muted" v-if="match.venue">📍 {{ match.venue }}</div>
  </div>
</template>

<style scoped>
.match { padding: 14px 16px; transition: transform 0.15s, border-color 0.15s; }
.match:hover { transform: translateY(-2px); border-color: var(--primary-dim); }
.match.live { border-color: rgba(255, 71, 87, 0.5); }
.meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; }
.when { font-size: 0.74rem; color: var(--text-mute); }
.teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; }
.team { display: flex; align-items: center; gap: 8px; min-width: 0; }
.team.away { justify-content: flex-end; }
.flag { font-size: 1.5rem; }
.name { font-weight: 600; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.team.win .name { color: var(--primary); }
.score { font-size: 1.45rem; font-weight: 800; letter-spacing: 1px; }
.score .sep { color: var(--text-mute); margin: 0 3px; }
.score.vs { font-size: 0.9rem; color: var(--text-mute); font-weight: 700; }
.venue { font-size: 0.72rem; margin-top: 10px; }
</style>
