// 按需注册 ECharts 模块，减小打包体积。
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, ScatterChart, RadarChart, HeatmapChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  TitleComponent,
  DatasetComponent,
  GraphicComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart, ScatterChart, RadarChart, HeatmapChart, LineChart,
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent,
  TitleComponent, DatasetComponent, GraphicComponent
])

// 统一深色主题色板
export const PALETTE = ['#2dd4a7', '#ffd166', '#5b8def', '#ff5d73', '#a78bfa', '#4ecdc4', '#f78c6b']

export const baseGrid = { left: 8, right: 16, top: 24, bottom: 8, containLabel: true }

export const axisStyle = {
  axisLine: { lineStyle: { color: '#2a3654' } },
  axisLabel: { color: '#9aa6c4' },
  splitLine: { lineStyle: { color: 'rgba(42,54,84,0.5)' } }
}

export const tooltipStyle = {
  backgroundColor: '#1a2238',
  borderColor: '#2a3654',
  textStyle: { color: '#eef2ff' }
}
