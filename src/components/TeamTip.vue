<script setup>
// 球队名 hover 卡片：鼠标停留 2 秒后，浮层显示该队在小组内的比赛与比分；没有比赛则显示「待赛」。
import { ref, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'

const props = defineProps({
  code: { type: String, required: true },
  showFlag: { type: Boolean, default: true }
})
const store = useDataStore()
const { t, locale } = useI18n()

const team = computed(() => store.getTeam(props.code))
// 队名按当前语言显示（store 统一映射英文名）
const selfName = computed(() => store.dispName(props.code) || props.code)

// 该队所有小组赛（按时间）
const games = computed(() => {
  const g = team.value?.group
  return store.matches
    .filter((m) => m.stage === 'group' && (m.home === props.code || m.away === props.code))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((m) => {
      const isHome = m.home === props.code
      const opp = store.getTeam(isHome ? m.away : m.home)
      const played = (m.status === 'finished' || m.status === 'live') && m.homeGoals != null
      const gf = isHome ? m.homeGoals : m.awayGoals
      const ga = isHome ? m.awayGoals : m.homeGoals
      const res = played ? (gf > ga ? 'w' : gf === ga ? 'd' : 'l') : null
      const time = new Date(m.date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit' })
      return { id: m.id, opp: store.dispName(isHome ? m.away : m.home) || '?', oppFlag: opp?.flag || '', played, gf, ga, res, time, live: m.status === 'live' }
    })
})

const wrapText = (r) => (r.res === 'w' ? t('common.win') : r.res === 'd' ? t('common.draw') : t('common.loss'))

// 显示控制：进入 2 秒后显示；移出立即隐藏。fixed 定位避免被表格 overflow 裁剪。
const open = ref(false)
const pos = ref({ top: 0, left: 0 })
let timer = null
const elRef = ref(null)

function onEnter() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    const el = elRef.value
    if (!el) return
    const r = el.getBoundingClientRect()
    // 默认显示在下方；靠近视口底部时显示在上方
    const below = r.bottom + 8
    const top = below + 240 > window.innerHeight ? Math.max(8, r.top - 8 - 240) : below
    pos.value = { top, left: Math.min(r.left, window.innerWidth - 280) }
    open.value = true
  }, 2000)
}
function onLeave() {
  clearTimeout(timer)
  open.value = false
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span ref="elRef" class="tt-name" @mouseenter="onEnter" @mouseleave="onLeave">
    <span v-if="showFlag" class="flag">{{ team?.flag }}</span>{{ selfName }}
    <Teleport to="body">
      <div v-if="open" class="tt-card" :style="{ top: pos.top + 'px', left: pos.left + 'px' }">
        <div class="tt-head"><span class="flag">{{ team?.flag }}</span>{{ selfName }}<small v-if="team?.group"> · {{ team.group }} {{ t('common.group') }}</small></div>
        <div class="tt-sub">{{ t('teamTip.groupGames') }}</div>
        <ul class="tt-list">
          <li v-for="g in games" :key="g.id">
            <span class="opp"><span class="flag">{{ g.oppFlag }}</span>{{ g.opp }}</span>
            <span v-if="g.played" class="sc" :class="g.res">
              <b>{{ g.gf }}-{{ g.ga }}</b> {{ wrapText(g) }}
            </span>
            <span v-else class="tbd">{{ g.time }} · {{ t('teamTip.tbd') }}</span>
          </li>
          <li v-if="!games.length" class="tbd">{{ t('teamTip.tbd') }}</li>
        </ul>
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.tt-name { cursor: help; }
.flag { margin-right: 5px; }
.tt-card {
  position: fixed; z-index: 200; width: 272px;
  background: var(--bg-soft, #141b30); border: 1px solid var(--border); border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.45); padding: 12px 14px;
  animation: ttin 0.12s ease;
}
@keyframes ttin { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.tt-head { font-weight: 800; font-size: 0.92rem; margin-bottom: 2px; }
.tt-head small { color: var(--text-mute); font-weight: 600; }
.tt-sub { font-size: 0.7rem; color: var(--text-mute); margin: 6px 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
.tt-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.tt-list li { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.8rem; }
.opp { color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc { flex-shrink: 0; font-size: 0.76rem; }
.sc b { font-variant-numeric: tabular-nums; }
.sc.w { color: var(--primary); }
.sc.l { color: #ef6b6b; }
.sc.d { color: var(--text-dim); }
.tbd { flex-shrink: 0; font-size: 0.74rem; color: var(--text-mute); }
</style>
