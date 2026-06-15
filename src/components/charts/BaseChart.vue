<script setup>
// 统一的 ECharts 容器：自适应尺寸 + 深色主题。
import './echarts'
import VChart from 'vue-echarts'

defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '320px' }
})
</script>

<template>
  <div class="chart-wrap" :style="{ height }">
    <VChart :option="option" autoresize />
  </div>
</template>

<style scoped>
.chart-wrap { width: 100%; }
</style>
