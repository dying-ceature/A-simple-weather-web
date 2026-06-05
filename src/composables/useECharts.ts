/**
 * @file src/composables/useECharts.ts
 * @description ECharts 图表共享逻辑
 *
 * 提取并封装 HourlyChart + TemperatureChart 共有的：
 *   - chartContainer ref
 *   - chartInstance 初始化和销毁
 *   - ResizeObserver 自适应大小
 *   - 数据 + 主题变化时自动重新渲染
 */

import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import * as echarts from 'echarts'

export interface UseEChartsOptions {
  /** 图表配置项工厂函数（在数据/主题变化时重新调用） */
  optionsFactory: () => echarts.EChartsOption | null
}

export function useECharts(optionsFactory: () => echarts.EChartsOption | null) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const chartContainer = ref<HTMLElement | null>(null)
  let chartInstance: echarts.ECharts | null = null
  let resizeObserver: ResizeObserver | null = null

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /** 初始化或重新渲染图表 */
  function initChart(): void {
    if (!chartContainer.value) return

    const options = optionsFactory()
    if (!options) return

    if (!chartInstance) {
      chartInstance = echarts.init(chartContainer.value)
    }

    chartInstance.setOption(options, { notMerge: true })
  }

  /** 销毁图表实例并断开 ResizeObserver */
  function disposeChart(): void {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
  }

  /** 手动触发图表 resize（Tab 切换后调用） */
  function resizeChart(): void {
    if (chartInstance && chartContainer.value) {
      chartInstance.resize()
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  onMounted(() => {
    initChart()

    // 监听容器大小变化
    if (chartContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        if (chartInstance) {
          chartInstance.resize()
        }
      })
      resizeObserver.observe(chartContainer.value)
    }
  })

  onUnmounted(() => {
    disposeChart()
  })

  // 监听 options 工厂函数返回结果的变化
  watch(
    optionsFactory,
    () => {
      initChart()
    },
    { deep: true }
  )

  return {
    chartContainer,
    initChart,
    disposeChart,
    resizeChart,
  }
}
