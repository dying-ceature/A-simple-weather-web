<!--
  @file HourlyChart.vue
  @description 7 天逐时温度趋势图（168 小时）
  默认显示前 24 小时，通过 ECharts dataZoom 滑动查看后续数据
-->
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useTheme } from '@/composables/useTheme.js'

const props = defineProps({
  /** 逐时预报数组（来自 /v7/weather/168h） */
  hourlyData: {
    type: Array,
    default: () => [],
  },
})

const { theme } = useTheme()

const chartContainer = ref(null)
let chartInstance = null
let resizeObserver = null

/** 从 fxTime 格式化横轴标签 "M/D HH:00" */
function formatLabel(isoString) {
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
const chartOption = computed(() => {
  const data = props.hourlyData || []
  const xLabels = data.map((h) => formatLabel(h.fxTime))
  const temps = data.map((h) => {
    const v = parseFloat(h.temp)
    return isNaN(v) ? null : v
  })

  const count = data.length
  // 默认显示窗口：约 24 小时（24 / count * 100%），最少显示全部
  const defaultEnd = count > 0 ? Math.min(100, Math.round((24 / count) * 100)) : 100

  const isDark = theme.value === 'dark'
  const textColor = isDark ? '#cbd5e0' : '#4a5568'
  const axisColor = isDark ? '#4a5568' : '#e2e8f0'
  const splitColor = isDark ? '#2d3748' : '#edf2f7'
  const lineColor = '#f6ad55'

  // 横轴标签间隔：总数多时隔得远一些
  const labelInterval = count > 100 ? 12 : count > 48 ? 6 : 3

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#2d3748' : '#fff',
      borderColor: isDark ? '#4a5568' : '#e2e8f0',
      textStyle: { color: textColor, fontSize: 13 },
      formatter(params) {
        const p = params[0]
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
      bottom: 56,  // 为底部 slider 留空间
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
      // 底部滑动条
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
      // 鼠标/触摸手势控制
      {
        type: 'inside',
        start: 0,
        end: defaultEnd,
        zoomOnMouseWheel: false,   // 滚轮平移
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
        symbol: 'none',           // 数据点多时不显示 symbol 避免遮挡
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

watch(
  [() => props.hourlyData, theme],
  () => initChart(),
  { deep: true }
)

onMounted(() => {
  initChart()
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => chartInstance?.resize())
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
  <div v-if="hourlyData.length > 0" class="chart-section card">
    <h3 class="section-title">7 天逐时温度趋势</h3>
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
