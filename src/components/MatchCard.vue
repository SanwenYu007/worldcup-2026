<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const props = defineProps({
  match: { type: Object, required: true }
})
const store = useDataStore()
const { t, locale } = useI18n()

const home = computed(() => store.getTeam(props.match.home))
const away = computed(() => store.getTeam(props.match.away))

const dateLabel = computed(() => {
  const d = new Date(props.match.date)
  return d.toLocaleString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
})
const statusLabel = computed(() => ({ finished: t('common.finished'), live: t('common.inplay'), scheduled: t('common.upcoming') }))
// 阶段标签：小组赛显示「X 组」，淘汰赛用 i18n 轮次名
const KO = ['r32', 'r16', 'qf', 'sf', 'third', 'final']
const stageLabel = computed(() => props.match.group
  ? `${props.match.group} ${t('common.group')}`
  : (KO.includes(props.match.stage) ? t('overview.stages.' + props.match.stage) : (props.match.stageName || '')))
const hasScore = computed(() => props.match.homeGoals != null)
function won(side) {
  if (!hasScore.value || props.match.status === 'scheduled') return false
  return side === 'home'
    ? props.match.homeGoals > props.match.awayGoals
    : props.match.awayGoals > props.match.homeGoals
}
</script>

<template>
  <router-link class="match card" :to="`/match/${match.id}`" :class="match.status">
    <div class="meta">
      <span class="badge" :class="match.status">{{ statusLabel[match.status] }}
        <template v-if="match.status === 'live'"> · {{ match.minute }}'</template>
      </span>
      <span class="when">{{ stageLabel }} · {{ dateLabel }}</span>
    </div>
    <div class="teams">
      <div class="team" :class="{ win: won('home') }">
        <span class="flag">{{ home?.flag || '🏳️' }}</span>
        <span class="name">{{ store.dispName(match.home) || match.homeLabel || t('common.tbd') }}</span>
      </div>
      <div class="score mono" v-if="hasScore">
        {{ match.homeGoals }}<span class="sep">:</span>{{ match.awayGoals }}
      </div>
      <div class="score vs" v-else>VS</div>
      <div class="team away" :class="{ win: won('away') }">
        <span class="name">{{ store.dispName(match.away) || match.awayLabel || t('common.tbd') }}</span>
        <span class="flag">{{ away?.flag || '🏳️' }}</span>
      </div>
    </div>
    <div class="venue muted" v-if="match.venue">📍 {{ match.venue }}</div>
  </router-link>
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
