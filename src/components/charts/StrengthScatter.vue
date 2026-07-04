<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../../stores/data'
import BaseChart from './BaseChart.vue'
import { baseGrid, axisStyle, tooltipStyle } from './echarts'

const store = useDataStore()
const { t } = useI18n()

// 按大洲分系列，x=组别，y=实力(rating)，气泡大小=rating。
const CONF_COLOR = {
  UEFA: '#5b8def', CONMEBOL: '#2dd4a7', CONCACAF: '#ffd166',
  CAF: '#ff5d73', AFC: '#a78bfa', OFC: '#4ecdc4'
}
const groupOrder = 'ABCDEFGHIJKL'.split('')

const option = computed(() => {
  const byConf = {}
  store.teams.forEach((t) => {
    ;(byConf[t.conf] ||= []).push({
      value: [groupOrder.indexOf(t.group), t.rating, (t.rating - 1380) / 40 + 9],
      name: store.dispName(t.code || t.id) || t.name, flag: t.flag, conf: t.conf
    })
  })
  const GROUP = t('common.group')
  const RATING = t('stats.rating')
  return {
    tooltip: {
      ...tooltipStyle,
      formatter: (p) =>
        `${p.data.flag} <b>${p.data.name}</b><br/>${groupOrder[p.data.value[0]]} ${GROUP} · ${p.data.conf}<br/>${RATING} <b>${p.data.value[1]}</b>`
    },
    legend: { top: 0, textStyle: { color: '#9aa6c4' }, icon: 'circle' },
    grid: { ...baseGrid, top: 56, bottom: 16 },
    xAxis: {
      type: 'category', data: groupOrder, name: GROUP, nameTextStyle: { color: '#647093' },
      ...axisStyle, boundaryGap: true
    },
    yAxis: {
      type: 'value', name: RATING, min: 1300, max: 2300, interval: 200,
      nameTextStyle: { color: '#647093' }, ...axisStyle
    },
    series: Object.entries(byConf).map(([conf, data]) => ({
      name: conf, type: 'scatter', data,
      symbolSize: (v) => v[2],
      itemStyle: { color: CONF_COLOR[conf] || '#999', opacity: 0.82, borderColor: 'rgba(255,255,255,0.25)' },
      emphasis: { scale: 1.3 }
    }))
  }
})
</script>

<template>
  <BaseChart :option="option" height="380px" />
</template>
