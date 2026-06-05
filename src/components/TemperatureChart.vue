<script setup lang="ts">
/**
 * TemperatureChart.vue — 7 天最高温/最低温趋势图
 *
 * 使用共享 useECharts composable 管理图表生命周期。
 * 双线面积图，最高温红色、最低温蓝色，带标记点。
 */

import { computed } from 'vue'
import * as echarts from 'echarts'
import { useThemeStore } from '@/stores/theme'
import { useECharts } from '@/composables/useECharts'
import { formatDateShort, getWeekday } from '@/utils/date'
import type { DailyForecast } from '@/types/weather'

const props = defineProps<{
  dailyData: DailyForecast[]
}>()

const themeStore = useThemeStore()

/** 构建 ECharts 配置 */
const chartOption = computed<echarts.EChartsOption | null>(() => {
  const data = props.dailyData || []
  if (data.length === 0) return null

  const xAxisData = data.map((d) => {
    const short = formatDateShort(d.fxDate)
    const wd = getWeekday(d.fxDate)
    return `${short}\n${wd}`
  })
  const maxTemps = data.map((d) => parseFloat(d.tempMax) || 0)
  const minTemps = data.map((d) => parseFloat(d.tempMin) || 0)

  const isDark = themeStore.theme === 'dark'
  const textColor = isDark ? '#cbd5e0' : '#4a5568'
  const axisColor = isDark ? '#4a5568' : '#e2e8f0'
  const splitColor = isDark ? '#2d3748' : '#edf2f7'

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#2d3748' : '#fff',
      borderColor: isDark ? '#4a5568' : '#e2e8f0',
      textStyle: { color: textColor, fontSize: 13 },
      formatter(params: unknown) {
        const items = params as { dataIndex: number; marker: string; seriesName: string; value: number }[]
        const dateStr = data[items[0]?.dataIndex]?.fxDate || ''
        let html = `<strong>${formatDateShort(dateStr)} ${getWeekday(dateStr)}</strong><br/>`
        items.forEach((p) => {
          html += `${p.marker} ${p.seriesName}: ${p.value}°C<br/>`
        })
        return html
      },
    },
    legend: {
      data: ['最高温', '最低温'],
      top: 0,
      right: 0,
      orient: 'horizontal',
      textStyle: { color: textColor, fontSize: 12 },
    },
    grid: {
      left: 40,
      right: 20,
      top: 36,
      bottom: 20,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
      axisLine: { lineStyle: { color: axisColor } },
      axisTick: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        lineHeight: 14,
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
    series: [
      {
        name: '最高温',
        type: 'line',
        data: maxTemps,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#e53e3e', width: 2.5 },
        itemStyle: { color: '#e53e3e' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(229, 62, 62, 0.2)' },
            { offset: 1, color: 'rgba(229, 62, 62, 0.02)' },
          ]),
        },
        markPoint: {
          data: [{ type: 'max', name: '最高' }],
          label: { fontSize: 10 },
        },
      },
      {
        name: '最低温',
        type: 'line',
        data: minTemps,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#3182ce', width: 2.5 },
        itemStyle: { color: '#3182ce' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(49, 130, 206, 0.2)' },
            { offset: 1, color: 'rgba(49, 130, 206, 0.02)' },
          ]),
        },
        markPoint: {
          data: [{ type: 'min', name: '最低' }],
          label: { fontSize: 10 },
        },
      },
    ],
  }
})

const { chartContainer } = useECharts(() => chartOption.value)
</script>

<template>
  <el-card class="chart-section" shadow="hover">
    <template #header>
      <h3 class="section-title">温度趋势</h3>
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
  height: 320px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 260px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    height: 220px;
  }
}
</style>
