<script setup>
import { computed } from 'vue'
import { useDataStore } from '../../stores/data'
import { groupStrength } from '../../composables/useStats'
import BaseChart from './BaseChart.vue'
import { tooltipStyle } from './echarts'

const store = useDataStore()

// 各组平均实力雷达——一眼看出「死亡之组」。
const option = computed(() => {
  const gs = groupStrength(store.groups)
  const byGroup = Object.fromEntries(gs.map((g) => [g.group, g.avgRating]))
  const order = 'ABCDEFGHIJKL'.split('')
  return {
    tooltip: { ...tooltipStyle },
    radar: {
      indicator: order.map((g) => ({ name: `${g} 组`, max: 1900, min: 1450 })),
      radius: '68%',
      axisName: { color: '#9aa6c4', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(42,54,84,0.8)' } },
      splitArea: { areaStyle: { color: ['rgba(45,212,167,0.03)', 'rgba(45,212,167,0.07)'] } },
      axisLine: { lineStyle: { color: 'rgba(42,54,84,0.8)' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: order.map((g) => byGroup[g]),
        name: '小组平均实力',
        areaStyle: { color: 'rgba(45,212,167,0.25)' },
        lineStyle: { color: '#2dd4a7' },
        itemStyle: { color: '#2dd4a7' }
      }]
    }]
  }
})
</script>

<template>
  <BaseChart :option="option" height="380px" />
</template>
