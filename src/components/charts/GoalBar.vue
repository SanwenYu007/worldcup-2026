<script setup>
import { computed } from 'vue'
import { useDataStore } from '../../stores/data'
import { teamGoalStats } from '../../composables/useStats'
import BaseChart from './BaseChart.vue'
import { baseGrid, axisStyle, tooltipStyle } from './echarts'

const store = useDataStore()

// 进球榜 Top12（含失球对比）的横向柱状。
const option = computed(() => {
  const stats = teamGoalStats(store.finishedMatches, store.teams)
    .filter((s) => s.gf > 0 || s.ga > 0)
    .sort((a, b) => b.gf - a.gf)
    .slice(0, 12)
    .reverse()
  return {
    tooltip: { ...tooltipStyle, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: '#9aa6c4' }, data: ['进球', '失球'] },
    grid: { ...baseGrid, top: 34, left: 4 },
    xAxis: { type: 'value', ...axisStyle },
    yAxis: {
      type: 'category',
      data: stats.map((s) => `${s.team.flag} ${s.team.name}`),
      ...axisStyle, axisLabel: { color: '#eef2ff' }
    },
    series: [
      { name: '进球', type: 'bar', stack: 'a', data: stats.map((s) => s.gf), itemStyle: { color: '#2dd4a7', borderRadius: [0, 4, 4, 0] }, barWidth: 14 },
      { name: '失球', type: 'bar', data: stats.map((s) => -s.ga), itemStyle: { color: 'rgba(255,93,115,0.55)', borderRadius: [4, 0, 0, 4] }, barWidth: 14,
        tooltip: { valueFormatter: (v) => Math.abs(v) } }
    ]
  }
})
</script>

<template>
  <BaseChart :option="option" height="400px" />
</template>
