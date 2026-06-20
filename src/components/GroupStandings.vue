<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { groupStandings } from '../composables/useStats'
import TeamTip from './TeamTip.vue'

const props = defineProps({ group: { type: String, required: true } })
const store = useDataStore()
const { t } = useI18n()

const rows = computed(() =>
  groupStandings(props.group, store.groups[props.group], store.matches)
)
</script>

<template>
  <div class="standings card">
    <div class="head">{{ group }} {{ t('common.group') }}</div>
    <table>
      <thead>
        <tr><th>{{ t('standings.rank') }}</th><th class="l">{{ t('standings.team') }}</th><th>{{ t('standings.played') }}</th><th>{{ t('standings.win') }}</th><th>{{ t('standings.draw') }}</th><th>{{ t('standings.loss') }}</th><th>{{ t('standings.gd') }}</th><th>{{ t('standings.pts') }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="r.team.code" :class="{ qualify: i < 2 }">
          <td>{{ i + 1 }}</td>
          <td class="l"><TeamTip :code="r.team.code" /></td>
          <td>{{ r.played }}</td>
          <td>{{ r.win }}</td>
          <td>{{ r.draw }}</td>
          <td>{{ r.loss }}</td>
          <td class="mono">{{ r.gd > 0 ? '+' + r.gd : r.gd }}</td>
          <td class="pts">{{ r.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.standings { padding: 14px 16px; }
.head { font-weight: 700; margin-bottom: 10px; color: var(--accent); }
table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
th { color: var(--text-mute); font-weight: 600; padding: 6px 4px; text-align: center; }
td { padding: 7px 4px; text-align: center; border-top: 1px solid var(--border); }
th.l, td.l { text-align: left; }
.flag { margin-right: 6px; }
.pts { font-weight: 800; color: var(--primary); }
tr.qualify td:first-child { box-shadow: inset 3px 0 0 var(--primary); }
.mono { color: var(--text-dim); }
</style>
