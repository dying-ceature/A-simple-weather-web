<!--
  @file App.vue
  @description 天气查询应用根组件 — 布局编排与数据驱动
-->
<script setup>
import { onMounted } from 'vue'
import { useWeather } from '@/composables/useWeather.js'

import ThemeToggle from '@/components/ThemeToggle.vue'
import SearchBar from '@/components/SearchBar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'
import CurrentWeather from '@/components/CurrentWeather.vue'
import ForecastList from '@/components/ForecastList.vue'
import HourlyChart from '@/components/HourlyChart.vue'
import TemperatureChart from '@/components/TemperatureChart.vue'

const {
  cityInfo,
  currentWeather,
  forecast,
  hourlyForecast,
  loading,
  error,
  searchCity,
  clearError,
  initDefaultCity,
} = useWeather()

/** 用户触发城市搜索 */
function onSearch(cityName) {
  searchCity(cityName)
}

// 首次加载：自动查询默认城市（北京 或 上次查询的城市）
onMounted(() => {
  initDefaultCity()
})
</script>

<template>
  <div class="app-root">
    <!-- ================================================================
         页头：标题 + 主题切换
         ================================================================ -->
    <header class="app-header">
      <h1 class="app-title">🌤 天气查询</h1>
      <ThemeToggle />
    </header>

    <!-- ================================================================
         搜索栏
         ================================================================ -->
    <SearchBar :loading="loading" @search="onSearch" />

    <!-- ================================================================
         状态提示：加载中 / 错误
         ================================================================ -->
    <LoadingSpinner :visible="loading" text="正在获取天气数据..." />

    <ErrorMessage
      :visible="!!error"
      :message="error || ''"
      type="error"
    />

    <!-- ================================================================
         天气数据展示
         ================================================================ -->
    <main v-if="currentWeather && !loading" class="app-main">
      <!-- 实时天气卡片 -->
      <CurrentWeather
        :city-info="cityInfo"
        :now-data="currentWeather"
      />

      <!-- 24 小时温度趋势 -->
      <HourlyChart :hourly-data="hourlyForecast" />

      <!-- 7 天预报 -->
      <ForecastList :daily-data="forecast" />

      <!-- 温度趋势图 -->
      <TemperatureChart
        v-if="forecast.length > 0"
        :daily-data="forecast"
      />
    </main>

    <!-- ================================================================
         空状态：首次加载前
         ================================================================ -->
    <div v-if="!currentWeather && !loading && !error" class="app-empty">
      <p>👆 在上方输入城市名称，查询天气信息</p>
    </div>
  </div>
</template>

<style scoped>
.app-root {
  max-width: 960px;
  margin: 0 auto;
}

/* 页头 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--color-border);
  transition: border-color var(--transition-normal);
}

.app-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 1px;
}

/* 主内容区域 */
.app-main {
  margin-top: 8px;
}

/* 空状态 */
.app-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
  font-size: 16px;
}

@media (max-width: 768px) {
  .app-title {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 18px;
  }

  .app-empty {
    padding: 40px 16px;
    font-size: 14px;
  }
}
</style>
