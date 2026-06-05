<script setup lang="ts">
/**
 * MinutelyRainChart.vue — 分钟级降水预报
 *
 * ECharts 柱状图，展示未来 2 小时每 5 分钟的降水量。
 * ⚠️ 仅在有实际降水（precip > 0）时才显示，无降水或数据为空时自动隐藏。
 */

import { computed } from 'vue'
import * as echarts from 'echarts'
import { useThemeStore } from '@/stores/theme'
import { useECharts } from '@/composables/useECharts'
import type { MinutelyPrecipitation } from '@/types/weather'

const props = defineProps<{
  minutelyData: MinutelyPrecipitation | null | undefined
}>()

const themeStore = useThemeStore()

/** 是否有实际降水数据需要展示 */
const hasRain = computed(() => {
  const data = props.minutelyData
  if (!data || !data.minutely || data.minutely.length === 0) return false
  return data.minutely.some((item) => parseFloat(item.precip) > 0)
})

/** 从 fxTime 提取 HH:mm */
function formatTimeLabel(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '--'
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return '--'
  }
}

/** ECharts 配置 */
const chartOption = computed<echarts.EChartsOption | null>(() => {
  const data = props.minutelyData?.minutely || []
  if (data.length === 0) return null

  const xLabels = data.map((item) => formatTimeLabel(item.fxTime))
  const precipValues = data.map((item) => {
    const v = parseFloat(item.precip)
    return isNaN(v) ? 0 : v
  })
  // 降水类型（用于着色）：rain → 蓝色，snow → 浅蓝
  const hasSnow = data.some((item) => item.type === 'snow')
  const barColor = hasSnow ? '#93c5fd' : '#3b82f6'

  const isDark = themeStore.theme === 'dark'
  const textColor = isDark ? '#cbd5e0' : '#4a5568'
  const splitColor = isDark ? '#2d3748' : '#edf2f7'

  // 横轴间隔：总共 24 个点（2h × 12/5min），每 6 个标一个（30 分钟）
  const labelInterval = 5

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#2d3748' : '#fff',
      borderColor: isDark ? '#4a5568' : '#e2e8f0',
      textStyle: { color: textColor, fontSize: 13 },
      formatter(params: unknown) {
        const p = (params as { dataIndex: number; value: number }[])[0]
        if (!p) return ''
        const idx = p.dataIndex
        const label = xLabels[idx]
        const val = precipValues[idx]
        return `<strong>${label}</strong><br/>降水量: ${val} mm`
      },
    },
    grid: { left: 44, right: 16, top: 12, bottom: 24 },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: {
        color: textColor,
        fontSize: 10,
        interval: labelInterval,
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: splitColor } },
    },
    yAxis: {
      type: 'value',
      name: 'mm',
      nameTextStyle: { color: textColor, fontSize: 11 },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        formatter: '{value}',
      },
      splitLine: { lineStyle: { color: splitColor } },
    },
    series: [
      {
        type: 'bar',
        data: precipValues,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: barColor },
            { offset: 1, color: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)' },
          ]),
          borderRadius: [2, 2, 0, 0],
        },
        barWidth: '70%',
      },
    ],
  }
})

const { chartContainer } = useECharts(() => chartOption.value)
</script>

<template>
  <el-card v-if="hasRain" class="rain-chart-section" shadow="hover">
    <template #header>
      <h3 class="section-title">未来降水预报</h3>
    </template>
    <p v-if="minutelyData?.summary" class="minutely-summary">
      {{ minutelyData.summary }}
    </p>
    <div ref="chartContainer" class="chart-container" />
  </el-card>
</template>

<style scoped>
.rain-chart-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.minutely-summary {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.chart-container {
  width: 100%;
  height: 200px;
}

@media (max-width: 480px) {
  .chart-container {
    height: 170px;
  }
}
</style>
