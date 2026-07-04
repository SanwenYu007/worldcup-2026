<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { topScorers, groupStrength } from '../composables/useStats'
import StrengthScatter from '../components/charts/StrengthScatter.vue'
import GroupRadar from '../components/charts/GroupRadar.vue'
import GoalBar from '../components/charts/GoalBar.vue'
import GoalTimeline from '../components/charts/GoalTimeline.vue'

const store = useDataStore()
const { t } = useI18n()
const scorers = computed(() => topScorers(store.finishedMatches, store.getTeam, 8))
const deathGroups = computed(() => groupStrength(store.groups).slice(0, 3))
</script>

<template>
  <div class="view">
  <div class="section-title" style="margin-top:24px">{{ t('stats.strengthTitle') }}</div>
  <p class="lead muted">{{ t('stats.strengthLead') }}</p>
  <div class="card pad"><StrengthScatter /></div>

  <div class="grid two">
    <div>
      <div class="section-title">{{ t('stats.radarTitle') }}</div>
      <div class="card pad"><GroupRadar /></div>
    </div>
    <div>
      <div class="section-title">{{ t('stats.deathTitle') }}</div>
      <div class="death-list">
        <div v-for="(g, i) in deathGroups" :key="g.group" class="death card">
          <div class="rank">#{{ i + 1 }}</div>
          <div class="dg-body">
            <div class="dg-head"><b>{{ g.group }} {{ t('common.group') }}</b><span class="muted">{{ t('stats.avgStrength') }} {{ g.avgRating }}</span></div>
            <div class="dg-teams">
              <span v-for="tm in g.teams" :key="tm.code">{{ tm.flag }} {{ store.dispName(tm.code) || tm.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid two">
    <div>
      <div class="section-title">{{ t('stats.goalBar') }}</div>
      <div class="card pad"><GoalBar /></div>
    </div>
    <div>
      <div class="section-title">{{ t('stats.goalTiming') }}</div>
      <div class="card pad"><GoalTimeline /></div>
      <div class="section-title">{{ t('stats.scorers') }}</div>
      <div class="card scorers">
        <div v-for="(s, i) in scorers" :key="s.team.code" class="scorer">
          <span class="idx">{{ i + 1 }}</span>
          <span class="flag">{{ s.team.flag }}</span>
          <span class="nm">{{ store.dispName(s.team.code || s.team.id) || s.team.name }}</span>
          <span class="bar"><span :style="{ width: (s.goals / scorers[0].goals * 100) + '%' }" /></span>
          <span class="g mono">{{ s.goals }}</span>
        </div>
        <div v-if="!scorers.length" class="empty muted">{{ t('common.goals') }}</div>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
.lead { font-size: 0.86rem; margin: -6px 0 12px; }
.card.pad { padding: 16px; }
.two { grid-template-columns: 1fr 1fr; align-items: start; }
.death-list { display: flex; flex-direction: column; gap: 12px; }
.death { display: flex; gap: 14px; padding: 14px 16px; align-items: center; }
.rank { font-size: 1.6rem; font-weight: 900; color: var(--accent); min-width: 40px; }
.dg-head { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; }
.dg-teams { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 0.8rem; color: var(--text-dim); }
.scorers { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.scorer { display: grid; grid-template-columns: 20px 24px 1fr 100px 28px; align-items: center; gap: 8px; font-size: 0.85rem; }
.scorer .idx { color: var(--text-mute); font-weight: 700; }
.scorer .bar { background: var(--bg-soft); height: 8px; border-radius: 6px; overflow: hidden; }
.scorer .bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--primary-dim), var(--primary)); }
.scorer .g { text-align: right; font-weight: 800; color: var(--primary); }
.empty { text-align: center; padding: 18px; font-size: 0.85rem; }
@media (max-width: 860px) {
  .two { grid-template-columns: 1fr; }
}
</style>
