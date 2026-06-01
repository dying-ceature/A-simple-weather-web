<!--
  @file TemperatureChart.vue
  @description ECharts 温度折线图 — 展示未来 7 天最高温 / 最低温趋势
  支持暗色 / 亮色主题自适应 & 窗口 resize。
-->
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useTheme } from '@/composables/useTheme.js'
import { formatDateShort, getWeekday } from '@/utils/date.js'

const props = defineProps({
  /** 7 天预报数组 */
  dailyData: {
    type: Array,
    default: () => [],
  },
})

// ------------------------------------------------------------------
// 主题
// ------------------------------------------------------------------
const { theme } = useTheme()

// ------------------------------------------------------------------
// 图表容器 ref
// ------------------------------------------------------------------
const chartContainer = ref(null)
let chartInstance = null
let resizeObserver = null

// ------------------------------------------------------------------
// 准备 ECharts 数据
// ------------------------------------------------------------------
const chartOption = computed(() => {
  const data = props.dailyData || []
  const xAxisData = data.map((d) => {
    const short = formatDateShort(d.fxDate)
    const wd = getWeekday(d.fxDate)
    return `${short}\n${wd}`
  })
  const maxTemps = data.map((d) => parseFloat(d.tempMax) || 0)
  const minTemps = data.map((d) => parseFloat(d.tempMin) || 0)

  const isDark = theme.value === 'dark'
  const textColor = isDark ? '#cbd5e0' : '#4a5568'
  const axisColor = isDark ? '#4a5568' : '#e2e8f0'
  const splitColor = isDark ? '#2d3748' : '#edf2f7'

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#2d3748' : '#fff',
      borderColor: isDark ? '#4a5568' : '#e2e8f0',
      textStyle: {
        color: textColor,
        fontSize: 13,
      },
      formatter(params) {
        const dateStr = data[params[0]?.dataIndex]?.fxDate || ''
        let html = `<strong>${formatDateShort(dateStr)} ${getWeekday(dateStr)}</strong><br/>`
        params.forEach((p) => {
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
      textStyle: {
        color: textColor,
        fontSize: 12,
      },
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
      splitLine: {
        lineStyle: { color: splitColor },
      },
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
          data: [
            { type: 'max', name: '最高' },
          ],
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
          data: [
            { type: 'min', name: '最低' },
          ],
          label: { fontSize: 10 },
        },
      },
    ],
  }
})

// ------------------------------------------------------------------
// 初始化 / 更新图表
// ------------------------------------------------------------------
function initChart() {
  if (!chartContainer.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }

  chartInstance.setOption(chartOption.value, { notMerge: true })
}

function disposeChart() {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
}

// 当数据或主题变化时更新图表
watch(
  [() => props.dailyData, theme],
  () => {
    initChart()
  },
  { deep: true }
)

// ------------------------------------------------------------------
// 生命周期
// ------------------------------------------------------------------
onMounted(() => {
  initChart()

  // 监听容器尺寸变化 → 自动 resize
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize()
    })
    resizeObserver.observe(chartContainer.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  disposeChart()
})
</script>

<template>
  <div class="chart-section card">
    <h3 class="section-title">温度趋势</h3>
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<style scoped>
.chart-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 14px;
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
