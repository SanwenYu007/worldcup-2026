<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const props = defineProps({ match: { type: Object, required: true } })
const store = useDataStore()
const { t, locale } = useI18n()
const expanded = ref(false)

const home = computed(() => store.getTeam(props.match.home))
const away = computed(() => store.getTeam(props.match.away))
const odds = computed(() => props.match.odds)
// 需求1：未开赛显示赔率；完赛 1 天内保留；超过 1 天关闭
const showOdds = computed(() => store.shouldShowOdds(props.match))
// AI 预测
const pred = computed(() => store.getPrediction(props.match))
const outcomeLabel = computed(() => ({ home: t('result.home'), draw: t('result.draw'), away: t('result.away') }))

const dateLabel = computed(() => {
  const d = new Date(props.match.date)
  return d.toLocaleString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
})
const statusText = computed(() => ({ finished: t('common.finished'), live: t('common.inplay'), scheduled: t('common.upcoming') }))
// 阶段标签：小组赛「X组」，淘汰赛用 i18n 轮次名
const KO = ['r32', 'r16', 'qf', 'sf', 'third', 'final']
const stageLabel = computed(() => props.match.group
  ? props.match.group + t('common.group')
  : (KO.includes(props.match.stage) ? t('overview.stages.' + props.match.stage) : (props.match.stageName || 'WC')))
const hasScore = computed(() => props.match.homeGoals != null)

// 实际结果命中的项（用于高亮）
const hadHit = computed(() => {
  if (!hasScore.value || props.match.status === 'scheduled') return null
  const { homeGoals: h, awayGoals: a } = props.match
  return h > a ? 'h' : h === a ? 'd' : 'a'
})
const hhadHit = computed(() => {
  if (!hasScore.value || props.match.status === 'scheduled' || !odds.value) return null
  const eff = props.match.homeGoals + odds.value.hhad.goalLine
  const a = props.match.awayGoals
  return eff > a ? 'h' : eff === a ? 'd' : 'a'
})
const crsHit = computed(() =>
  hasScore.value ? `${props.match.homeGoals}:${props.match.awayGoals}` : null
)
const lineLabel = computed(() => {
  const l = odds.value?.hhad.goalLine ?? 0
  if (locale.value === 'en') return l === 0 ? 'Level' : (l > 0 ? `+${l}` : `${l}`)
  if (l === 0) return '平手'
  return l > 0 ? `受让${l}球` : `让${-l}球`
})
</script>

<template>
  <div class="odds-row card" :class="match.status">
    <!-- 头部：场次编号 / 赛事 / 时间 / 状态 -->
    <div class="row-head">
      <span class="num">{{ match.matchNum }}</span>
      <span class="league">{{ stageLabel }}</span>
      <span class="time">{{ dateLabel }}</span>
      <span class="status" :class="match.status">
        {{ statusText[match.status] }}
        <template v-if="match.status === 'live'"> {{ match.minute }}'</template>
      </span>
    </div>

    <!-- 对阵 + 比分（点击进入比赛详情） -->
    <router-link class="teams" :to="`/match/${match.id}`">
      <div class="t home">
        <span class="flag">{{ home?.flag || '🏳️' }}</span>
        <span class="nm">{{ store.dispName(match.home) || match.homeLabel || t('common.tbd') }}</span>
        <span class="hcap" v-if="showOdds">{{ lineLabel }}</span>
      </div>
      <div class="score" v-if="hasScore" :class="match.status">
        {{ match.homeGoals }} <span>:</span> {{ match.awayGoals }}
      </div>
      <div class="score vs" v-else>VS</div>
      <div class="t away">
        <span class="flag">{{ away?.flag || '🏳️' }}</span>
        <span class="nm">{{ store.dispName(match.away) || match.awayLabel || t('common.tbd') }}</span>
      </div>
    </router-link>

    <!-- AI 预测 -->
    <div class="ai-pred" v-if="pred" :class="{ done: match.status === 'finished' }">
      <span class="ai-tag">AI</span>
      <span class="ai-score mono">{{ pred.score.home }}:{{ pred.score.away }}</span>
      <span class="ai-out">{{ outcomeLabel[pred.outcome] }}</span>
      <span class="ai-conf">{{ t('common.confidence') }} {{ Math.round(pred.confidence * 100) }}%</span>
      <span class="ai-result" v-if="match.status === 'finished'">
        {{ (match.homeGoals === pred.score.home && match.awayGoals === pred.score.away) ? '✓ ' + t('predictions.scoreHit')
          : (hadHit === pred.outcome ? '✓ ' + t('predictions.outcomeHit') : '✗ ' + t('predictions.miss')) }}
      </span>
    </div>

    <!-- 赔率：胜平负 + 让球胜平负 -->
    <template v-if="showOdds">
      <div class="odds-grid">
        <div class="play-label">{{ t('schedule.oddsTitle') }}</div>
        <div class="box" :class="{ hit: hadHit === 'h' }"><b>{{ t('common.win') }}</b><i>{{ odds.had.h }}</i></div>
        <div class="box" :class="{ hit: hadHit === 'd' }"><b>{{ t('common.draw') }}</b><i>{{ odds.had.d }}</i></div>
        <div class="box" :class="{ hit: hadHit === 'a' }"><b>{{ t('common.loss') }}</b><i>{{ odds.had.a }}</i></div>
      </div>
      <div class="odds-grid">
        <div class="play-label">{{ t('odds.handicap') }}<small>{{ odds.hhad.goalLine > 0 ? '+' + odds.hhad.goalLine : odds.hhad.goalLine }}</small></div>
        <div class="box" :class="{ hit: hhadHit === 'h' }"><b>{{ t('common.win') }}</b><i>{{ odds.hhad.h }}</i></div>
        <div class="box" :class="{ hit: hhadHit === 'd' }"><b>{{ t('common.draw') }}</b><i>{{ odds.hhad.d }}</i></div>
        <div class="box" :class="{ hit: hhadHit === 'a' }"><b>{{ t('common.loss') }}</b><i>{{ odds.hhad.a }}</i></div>
      </div>

      <button class="more-btn" @click="expanded = !expanded">
        {{ expanded ? t('common.back') : t('odds.moreplay') }} · {{ t('odds.totalGoals') }} / {{ t('odds.score') }}
        <span :class="{ flip: expanded }">▾</span>
      </button>

      <div class="more" v-if="expanded">
        <div class="more-title">{{ t('odds.totalGoals') }}</div>
        <div class="ttg">
          <div v-for="tg in odds.ttg" :key="tg.goals" class="mini">
            <b>{{ tg.goals }}</b><i>{{ tg.odds }}</i>
          </div>
        </div>
        <div class="more-title">{{ t('odds.score') }}</div>
        <div class="crs">
          <div v-for="c in odds.crs" :key="c.score" class="mini" :class="{ hit: crsHit === c.score }">
            <b>{{ c.score }}</b><i>{{ c.odds }}</i>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="no-odds muted">
      {{ match.status === 'finished' ? t('schedule.oddsClosed') : '' }}
    </div>
  </div>
</template>

<style scoped>
.odds-row { padding: 12px 14px; }
.odds-row.live { border-color: rgba(255, 71, 87, 0.45); }

.row-head { display: flex; align-items: center; gap: 8px; font-size: 0.74rem; margin-bottom: 10px; }
.num { font-weight: 800; color: var(--accent); letter-spacing: 0.5px; }
.league { color: var(--text-dim); background: var(--bg-soft); padding: 1px 7px; border-radius: 5px; }
.time { color: var(--text-mute); }
.status { margin-left: auto; color: var(--text-mute); font-weight: 600; }
.status.finished { color: var(--primary); }
.status.live { color: var(--live); }

.teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; margin-bottom: 12px; border-radius: 8px; padding: 4px; transition: background 0.15s; }
.teams:hover { background: var(--bg-soft); }
.t { display: flex; align-items: center; gap: 7px; min-width: 0; }
.t.away { justify-content: flex-end; text-align: right; }
.flag { font-size: 1.3rem; }
.nm { font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hcap { font-size: 0.66rem; color: var(--accent); border: 1px solid rgba(255,209,102,0.4); border-radius: 4px; padding: 0 4px; flex-shrink: 0; }
.score { font-size: 1.4rem; font-weight: 800; letter-spacing: 1px; }
.score span { color: var(--text-mute); }
.score.live { color: var(--live); }
.score.vs { font-size: 0.85rem; color: var(--text-mute); font-weight: 700; }

.odds-grid { display: grid; grid-template-columns: 56px 1fr 1fr 1fr; gap: 6px; margin-bottom: 6px; }
.play-label { display: flex; flex-direction: column; justify-content: center; font-size: 0.74rem; color: var(--text-dim); font-weight: 600; }
.play-label small { color: var(--accent); font-size: 0.66rem; }
.box {
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
  background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px;
  padding: 7px 11px; transition: all 0.15s; cursor: default;
}
.box:hover { border-color: var(--primary-dim); }
.box b { font-size: 0.76rem; color: var(--text-mute); font-weight: 600; }
.box i { font-style: normal; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text); }
.box.hit { background: rgba(45, 212, 167, 0.16); border-color: var(--primary); }
.box.hit i, .box.hit b { color: var(--primary); }

.more-btn {
  width: 100%; margin-top: 4px; padding: 6px; background: transparent;
  border: 1px dashed var(--border); border-radius: 8px; color: var(--text-dim);
  font-size: 0.76rem; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.more-btn span { transition: transform 0.2s; }
.more-btn span.flip { transform: rotate(180deg); }
.more-title { font-size: 0.72rem; color: var(--text-mute); margin: 12px 0 6px; }
.ttg { display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; }
.crs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
.mini {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: var(--bg-soft); border: 1px solid var(--border); border-radius: 6px; padding: 5px 2px;
}
.mini b { font-size: 0.72rem; color: var(--text-mute); font-weight: 600; }
.mini i { font-style: normal; font-size: 0.78rem; font-weight: 700; color: var(--text); }
.mini.hit { background: rgba(45, 212, 167, 0.16); border-color: var(--primary); }
.mini.hit b, .mini.hit i { color: var(--primary); }
.no-odds { font-size: 0.78rem; text-align: center; padding: 6px; }

.ai-pred {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: rgba(91, 141, 239, 0.1); border: 1px solid rgba(91, 141, 239, 0.3);
  border-radius: 8px; padding: 7px 11px; margin-bottom: 10px; font-size: 0.8rem;
}
.ai-tag { font-size: 0.68rem; font-weight: 800; color: #fff; background: #5b8def; padding: 2px 7px; border-radius: 5px; }
.ai-score { font-weight: 800; color: #5b8def; font-size: 0.95rem; }
.ai-out { color: var(--text); font-weight: 600; }
.ai-conf { color: var(--text-mute); font-size: 0.72rem; }
.ai-result { margin-left: auto; font-weight: 700; font-size: 0.74rem; color: var(--text-dim); }
.ai-pred.done .ai-result { color: var(--primary); }

@media (max-width: 560px) {
  .ttg { grid-template-columns: repeat(4, 1fr); }
}
</style>
