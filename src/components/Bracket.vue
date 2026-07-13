<script setup>
// 淘汰赛对阵树：32强 → 16强 → 1/4 → 半决赛 → 决赛（+季军赛）。
// 真实数据驱动：对阵随赛果逐步揭晓，未定队伍显示「待定」；点击比赛进入详情页。
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const store = useDataStore()
const { t, locale } = useI18n()

const roundKeys = ['r32', 'r16', 'qf', 'sf', 'final', 'third']

// 队名按当前语言显示（store 统一映射英文名）
const dName = (code, label) => store.dispName(code) || label || t('common.tbd')
const flagOf = (code) => (code ? store.getTeam(code)?.flag || '' : '')

const columns = computed(() =>
  roundKeys
    .map((key) => ({
      key,
      name: t('overview.stages.' + key),
      matches: store.knockoutMatches
        .filter((m) => m.stage === key)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    }))
    .filter((c) => c.matches.length)
)

const fmt = (d) => new Date(d).toLocaleString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
// 晋级方：常规比分分胜负；战平看点球
function winner(m, side) {
  if (m.status !== 'finished' || m.homeGoals == null) return false
  if (m.homeGoals !== m.awayGoals) return side === 'home' ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals
  if (m.penHome != null && m.penHome !== m.penAway) return side === 'home' ? m.penHome > m.penAway : m.penAway > m.penHome
  return false
}
</script>

<template>
  <div class="bracket card">
    <div class="bracket-scroll">
      <div v-for="col in columns" :key="col.key" class="col">
        <div class="col-head">{{ col.key === 'final' ? '🏆 ' : '' }}{{ col.name }}</div>
        <div class="col-matches">
          <router-link v-for="m in col.matches" :key="m.id" class="ko-match" :class="m.status" :to="`/match/${m.id}`">
            <div class="ko-meta">
              <span>{{ fmt(m.date) }}</span>
              <span v-if="m.penHome != null" class="pens">{{ t('common.pens') }} {{ m.penHome }}-{{ m.penAway }}</span>
              <span class="st" :class="m.status">
                {{ m.status === 'finished' ? t('common.finished') : m.status === 'live' ? t('common.inplay') : '' }}
              </span>
            </div>
            <div class="ko-team" :class="{ win: winner(m, 'home'), tbd: !m.home }">
              <span class="tm"><i class="fl">{{ flagOf(m.home) || '·' }}</i>{{ dName(m.home, m.homeLabel) }}</span>
              <span class="sc mono">{{ m.homeGoals ?? '-' }}</span>
            </div>
            <div class="ko-team" :class="{ win: winner(m, 'away'), tbd: !m.away }">
              <span class="tm"><i class="fl">{{ flagOf(m.away) || '·' }}</i>{{ dName(m.away, m.awayLabel) }}</span>
              <span class="sc mono">{{ m.awayGoals ?? '-' }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    <p class="hint muted">{{ t('schedule.bracketPending') }}</p>
  </div>
</template>

<style scoped>
.bracket { padding: 18px; }
.bracket-scroll { display: flex; gap: 22px; overflow-x: auto; padding-bottom: 8px; }
.col { display: flex; flex-direction: column; min-width: 205px; }
.col-head {
  text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--accent);
  margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.col-matches { display: flex; flex-direction: column; justify-content: space-around; flex: 1; gap: 10px; }
.ko-match {
  display: block; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px;
  overflow: hidden; transition: border-color 0.15s, transform 0.1s;
}
.ko-match:hover { border-color: var(--primary-dim); transform: translateY(-1px); }
.ko-match.live { border-color: rgba(255, 71, 87, 0.5); }
.ko-meta {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.66rem; color: var(--text-mute); padding: 4px 10px;
  border-bottom: 1px solid var(--border); background: var(--card);
}
.ko-meta .st.finished { color: var(--primary); font-weight: 600; }
.ko-meta .pens { color: var(--accent); font-weight: 600; }
.ko-meta .st.live { color: var(--live); font-weight: 700; }
.ko-team { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 7px 10px; font-size: 0.84rem; }
.ko-team:first-of-type { border-bottom: 1px dashed var(--border); }
.ko-team .tm { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 600; }
.ko-team .fl { font-style: normal; width: 1.2em; text-align: center; flex-shrink: 0; }
.ko-team .sc { color: var(--text-dim); font-weight: 700; flex-shrink: 0; }
.ko-team.win .tm, .ko-team.win .sc { color: var(--primary); }
.ko-team.win { background: rgba(45, 212, 167, 0.07); }
.ko-team.tbd .tm { color: var(--text-mute); font-weight: 400; }
.hint { font-size: 0.74rem; margin-top: 14px; text-align: center; }
</style>
