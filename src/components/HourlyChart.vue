<script setup lang="ts">
/**
 * HourlyChart.vue — 7 天逐时温度趋势图（168 小时）
 *
 * 使用共享 useECharts composable 管理图表生命周期。
 * 默认显示前 24 小时，通过 ECharts dataZoom 滑块滑动查看后续数据。
 */

import { computed } from 'vue'
import * as echarts from 'echarts'
import { useThemeStore } from '@/stores/theme'
import { useECharts } from '@/composables/useECharts'
import type { HourlyForecast } from '@/types/weather'

const props = defineProps<{
  hourlyData: HourlyForecast[]
}>()

const themeStore = useThemeStore()

/** 从 fxTime 格式化横轴标签 "M/D HH:00" */
function formatLabel(isoString: string): string {
  if (!isoString) return '--'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '--'
    const M = d.getMonth() + 1
    const D = d.getDate()
    const hh = String(d.getHours()).padStart(2, '0')
    return `${M}/${D} ${hh}:00`
  } catch {
    return '--'
  }
}

/** 构建 ECharts 配置 */
const chartOption = computed<echarts.EChartsOption | null>(() => {
  const data = props.hourlyData || []
  if (data.length === 0) return null

  const xLabels = data.map((h) => formatLabel(h.fxTime))
  const temps = data.map((h) => {
    const v = parseFloat(h.temp)
    return isNaN(v) ? null : v
  })

  const count = data.length
  const defaultEnd = count > 0 ? Math.min(100, Math.round((24 / count) * 100)) : 100

  const isDark = themeStore.theme === 'dark'
  const textColor = isDark ? '#cbd5e0' : '#4a5568'
  const axisColor = isDark ? '#4a5568' : '#e2e8f0'
  const splitColor = isDark ? '#2d3748' : '#edf2f7'
  const lineColor = '#f6ad55'

  const labelInterval = count > 100 ? 12 : count > 48 ? 6 : 3

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#2d3748' : '#fff',
      borderColor: isDark ? '#4a5568' : '#e2e8f0',
      textStyle: { color: textColor, fontSize: 13 },
      formatter(params: unknown) {
        const p = (params as { dataIndex: number; marker: string }[])[0]
        if (!p) return ''
        const idx = p.dataIndex
        const val = temps[idx]
        const label = xLabels[idx]
        const txt = data[idx]?.text || ''
        if (val == null) return `<strong>${label}</strong><br/>暂无数据`
        return `<strong>${label}</strong><br/>${p.marker} 温度: ${val}°C<br/>天气: ${txt}`
      },
    },
    grid: {
      left: 44,
      right: 24,
      top: 16,
      bottom: 56,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: axisColor } },
      axisTick: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        interval: labelInterval,
      },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameTextStyle: { color: textColor, fontSize: 12 },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: '{value}°',
      },
      splitLine: { lineStyle: { color: splitColor } },
    },
    dataZoom: [
      {
        type: 'slider',
        start: 0,
        end: defaultEnd,
        height: 24,
        bottom: 4,
        borderColor: axisColor,
        backgroundColor: isDark ? '#2d3748' : '#e2e8f0',
        fillerColor: isDark ? 'rgba(99, 179, 237, 0.2)' : 'rgba(49, 130, 206, 0.15)',
        handleStyle: { color: '#3182ce' },
        textStyle: { color: textColor, fontSize: 10 },
        moveHandleSize: 6,
      },
      {
        type: 'inside',
        start: 0,
        end: defaultEnd,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: false,
      },
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        data: temps,
        connectNulls: true,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: lineColor, width: 2 },
        itemStyle: { color: lineColor },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(246, 173, 85, 0.25)' },
            { offset: 1, color: 'rgba(246, 173, 85, 0.02)' },
          ]),
        },
      },
    ],
  }
})

const { chartContainer } = useECharts(() => chartOption.value)
</script>

<template>
  <el-card v-if="hourlyData.length > 0" class="chart-section" shadow="hover">
    <template #header>
      <h3 class="section-title">7 天逐时温度趋势</h3>
    </template>
    <div ref="chartContainer" class="chart-container" />
  </el-card>
</template>

<style scoped>
.chart-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.chart-container {
  width: 100%;
  height: 340px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 280px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    height: 240px;
  }
}
</style>
