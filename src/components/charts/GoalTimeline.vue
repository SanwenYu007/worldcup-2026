<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../../stores/data'
import { goalTimeline } from '../../composables/useStats'
import BaseChart from './BaseChart.vue'
import { baseGrid, axisStyle, tooltipStyle } from './echarts'

const store = useDataStore()
const { t } = useI18n()
const labels = ['1-15', '16-30', '31-45', '46-60', '61-75', '76-90+']

const buckets = computed(() => goalTimeline(store.finishedMatches))
// 真实 API（免费档）不提供进球时间，此时无数据可展示
const hasData = computed(() => buckets.value.some((b) => b > 0))

// 进球时段分布——本届进球更集中在哪个时间段。
const option = computed(() => {
  const data = buckets.value
  const max = Math.max(1, ...data)
  return {
    tooltip: { ...tooltipStyle, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => `${p[0].axisValue} ${t('common.minutes')}<br/>${t('common.goals')} <b>${p[0].data}</b>` },
    grid: { ...baseGrid, top: 18 },
    xAxis: { type: 'category', data: labels, name: t('common.minutes'), nameTextStyle: { color: '#647093' }, ...axisStyle },
    yAxis: { type: 'value', ...axisStyle },
    series: [{
      type: 'bar', data, barWidth: '52%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: (p) => {
          const t = p.data / max
          return `rgba(45,212,167,${0.35 + t * 0.6})`
        }
      },
      label: { show: true, position: 'top', color: '#9aa6c4', fontSize: 11 }
    }]
  }
})
</script>

<template>
  <BaseChart v-if="hasData" :option="option" height="300px" />
  <div v-else class="empty muted">{{ t('stats.noTiming') }}</div>
</template>

<style scoped>
.empty { height: 300px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; text-align: center; }
</style>
