<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useDataStore } from '../stores/data'
import { keyNumbers } from '../composables/useStats'
import StatCard from '../components/StatCard.vue'
import MatchCard from '../components/MatchCard.vue'
import DataStatus from '../components/DataStatus.vue'
import StrengthScatter from '../components/charts/StrengthScatter.vue'
import GoalTimeline from '../components/charts/GoalTimeline.vue'

const store = useDataStore()

const stages = [
  { key: 'group', name: '小组赛', start: '2026-06-11' },
  { key: 'r32', name: '32 强', start: '2026-06-28' },
  { key: 'r16', name: '16 强', start: '2026-07-04' },
  { key: 'qf', name: '1/4', start: '2026-07-09' },
  { key: 'sf', name: '半决赛', start: '2026-07-14' },
  { key: 'final', name: '决赛', start: '2026-07-19' }
]
const currentStageIdx = computed(() => {
  const now = store.now.getTime()
  let idx = 0
  stages.forEach((s, i) => { if (now >= new Date(s.start).getTime()) idx = i })
  return idx
})

const kn = computed(() => keyNumbers(store.matches))

// 今日 / 进行中 / 临近的比赛
const spotlightMatches = computed(() => {
  const now = store.now.getTime()
  return [...store.matches]
    .filter((m) => m.stage === 'group')
    .sort((a, b) => Math.abs(new Date(a.date) - now) - Math.abs(new Date(b.date) - now))
    .slice(0, 6)
})

const recentResults = computed(() =>
  [...store.finishedMatches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4)
)

const biggest = computed(() => kn.value.biggest)
</script>

<template>
  <div class="view">
  <!-- Hero -->
  <section class="hero card">
    <div class="hero-main">
      <div class="badge live" style="margin-bottom:12px">小组赛进行中</div>
      <h1>2026 FIFA 世界杯</h1>
      <p class="muted">{{ store.meta.host }} · {{ store.meta.teamCount }} 支球队 · {{ store.meta.totalMatches }} 场比赛</p>
      <div class="progress">
        <div v-for="(s, i) in stages" :key="s.key" class="stage" :class="{ done: i < currentStageIdx, active: i === currentStageIdx }">
          <span class="dot" />
          <span class="stage-name">{{ s.name }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 数据状态：来源 + 更新时间 -->
  <DataStatus />

  <!-- 关键数字 -->
  <div class="grid stats-grid">
    <StatCard icon="⚽" :value="kn.totalGoals" label="总进球数" :sub="`已赛 ${kn.playedCount} 场`" />
    <StatCard icon="📊" :value="kn.avgGoals" label="场均进球" accent="var(--accent)" />
    <StatCard icon="🤝" :value="kn.draws" label="平局场次" accent="#5b8def" />
    <StatCard icon="💥" :value="biggest ? `${biggest.homeGoals}:${biggest.awayGoals}` : '-'"
      label="最大分差" :sub="biggest ? `${store.getTeam(biggest.home)?.name} vs ${store.getTeam(biggest.away)?.name}` : ''" accent="var(--danger)" />
  </div>

  <!-- 焦点比赛 -->
  <div class="section-title">焦点比赛
    <RouterLink to="/schedule" class="more">全部赛程 →</RouterLink>
  </div>
  <div class="grid match-grid">
    <MatchCard v-for="m in spotlightMatches" :key="m.id" :match="m" />
  </div>

  <!-- 图表概览 -->
  <div class="grid two-col">
    <div>
      <div class="section-title">球队实力分布
        <RouterLink to="/stats" class="more">详情 →</RouterLink>
      </div>
      <div class="card pad"><StrengthScatter /></div>
    </div>
    <div>
      <div class="section-title">进球时段分布</div>
      <div class="card pad"><GoalTimeline /></div>
      <div class="section-title">最新战报</div>
      <div class="grid recent">
        <MatchCard v-for="m in recentResults" :key="m.id" :match="m" />
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
.hero { padding: 32px; margin-top: 24px; position: relative; overflow: hidden;
  background: linear-gradient(135deg, var(--card), var(--bg-soft)); }
.hero h1 { font-size: 2.1rem; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 6px; }
.progress { display: flex; gap: 4px; margin-top: 24px; flex-wrap: wrap; }
.stage { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 54px; position: relative; }
.stage::after { content: ''; position: absolute; top: 6px; left: 50%; width: 100%; height: 2px; background: var(--border); z-index: 0; }
.stage:last-child::after { display: none; }
.stage .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--border); border: 2px solid var(--bg-soft); z-index: 1; }
.stage.done .dot { background: var(--primary-dim); }
.stage.done::after { background: var(--primary-dim); }
.stage.active .dot { background: var(--primary); box-shadow: 0 0 0 4px rgba(45,212,167,0.25); }
.stage-name { font-size: 0.72rem; color: var(--text-mute); }
.stage.active .stage-name { color: var(--primary); font-weight: 700; }

.stats-grid { grid-template-columns: repeat(4, 1fr); margin-top: 24px; }
.match-grid { grid-template-columns: repeat(3, 1fr); }
.two-col { grid-template-columns: 1.05fr 1fr; align-items: start; }
.recent { grid-template-columns: 1fr 1fr; }
.card.pad { padding: 16px; }
.more { margin-left: auto; font-size: 0.8rem; font-weight: 600; color: var(--primary); }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .match-grid { grid-template-columns: 1fr 1fr; }
  .two-col { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .hero { padding: 22px; }
  .hero h1 { font-size: 1.6rem; }
  .match-grid, .recent { grid-template-columns: 1fr; }
}
</style>
