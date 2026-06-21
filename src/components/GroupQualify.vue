<script setup>
// 出线形势：基于本组剩余比赛的全部结果组合，展示各队进入前二的「出线场景占比」与状态。
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { qualificationOutlook } from '../composables/useProjection'
import TeamTip from './TeamTip.vue'

const props = defineProps({ group: { type: String, required: true } })
const store = useDataStore()
const { t } = useI18n()

const rows = computed(() => {
  const gTeams = store.groups[props.group]
  if (!gTeams?.length) return []
  return qualificationOutlook(gTeams, store.matches, props.group)
})
const statusText = (s) => t('qualify.' + s)
</script>

<template>
  <div class="qualify card">
    <div class="head">{{ t('qualify.title') }} · {{ group }}</div>
    <p class="lead muted">{{ t('qualify.lead') }}</p>
    <div v-if="!rows.length" class="muted empty">{{ t('qualify.empty') }}</div>
    <div v-else class="list">
      <div v-for="r in rows" :key="r.team.code" class="qrow" :class="r.status">
        <span class="badge" :class="r.status">{{ statusText(r.status) }}</span>
        <span class="tm"><TeamTip :code="r.team.code" /></span>
        <span class="pts">{{ r.pts }}<i>{{ t('standings.pts') }}</i></span>
        <span class="chance">
          <span class="cbar"><b :class="r.status" :style="{ width: r.qualifyPct + '%' }" /></span>
          <em>{{ r.qualifyPct }}%</em>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qualify { padding: 14px 16px; margin-top: 14px; }
.head { font-weight: 700; margin-bottom: 4px; color: var(--accent); }
.lead { font-size: 0.72rem; margin-bottom: 10px; line-height: 1.4; }
.empty { font-size: 0.82rem; padding: 8px 0; }
.list { display: flex; flex-direction: column; gap: 8px; }
.qrow { display: grid; grid-template-columns: auto 1fr auto; grid-template-areas: 'badge tm pts' 'chance chance chance'; align-items: center; gap: 4px 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.qrow:last-child { border-bottom: none; padding-bottom: 0; }
.badge { grid-area: badge; font-size: 0.66rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--border); white-space: nowrap; }
.badge.clinched { color: var(--primary); border-color: var(--primary-dim); background: rgba(45,212,167,0.1); }
.badge.eliminated { color: var(--text-mute); }
.badge.alive { color: var(--accent); border-color: rgba(255,209,102,0.35); }
.tm { grid-area: tm; font-weight: 600; font-size: 0.86rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.pts { grid-area: pts; font-weight: 800; font-size: 0.9rem; }
.pts i { font-style: normal; font-weight: 400; font-size: 0.7rem; color: var(--text-mute); margin-left: 1px; }
.chance { grid-area: chance; display: flex; align-items: center; gap: 8px; }
.cbar { flex: 1; height: 6px; background: var(--bg-soft); border-radius: 4px; overflow: hidden; }
.cbar b { display: block; height: 100%; background: var(--text-mute); }
.cbar b.clinched { background: linear-gradient(90deg, var(--primary-dim), var(--primary)); }
.cbar b.alive { background: linear-gradient(90deg, #f5c451, var(--accent)); }
.chance em { font-style: normal; font-size: 0.74rem; font-weight: 700; color: var(--text-dim); width: 34px; text-align: right; }
.qrow.eliminated .tm, .qrow.eliminated .pts { color: var(--text-mute); }
</style>
