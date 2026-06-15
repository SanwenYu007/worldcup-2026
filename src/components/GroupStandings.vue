<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { groupStandings } from '../composables/useStats'

const props = defineProps({ group: { type: String, required: true } })
const store = useDataStore()

const rows = computed(() =>
  groupStandings(props.group, store.groups[props.group], store.matches)
)
</script>

<template>
  <div class="standings card">
    <div class="head">{{ group }} 组</div>
    <table>
      <thead>
        <tr><th>#</th><th class="l">球队</th><th>赛</th><th>胜</th><th>平</th><th>负</th><th>净</th><th>分</th></tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="r.team.code" :class="{ qualify: i < 2 }">
          <td>{{ i + 1 }}</td>
          <td class="l"><span class="flag">{{ r.team.flag }}</span>{{ r.team.name }}</td>
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
