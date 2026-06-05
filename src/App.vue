<script setup lang="ts">
/**
 * App.vue — 根组件（Phase 3 布局重排）
 *
 * 自上而下内容顺序：
 *   1. CurrentWeather（实时天气）
 *   2. MinutelyRainChart（仅在有降水时显示）
 *   3. HourlyChart（168h 温度趋势）
 *   4. ForecastList（7 天预报，含日出日落）
 *   5. LifeIndices（生活指数）
 *   6. AirQualityCard（空气质量）
 *   7. TemperatureChart（7 天温度趋势）
 */

import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWeatherStore } from '@/stores/weather'
import { useThemeStore } from '@/stores/theme'

import ThemeToggle from '@/components/ThemeToggle.vue'
import CityTabs from '@/components/CityTabs.vue'
import AddCityDialog from '@/components/AddCityDialog.vue'
import CurrentWeather from '@/components/CurrentWeather.vue'
import MinutelyRainChart from '@/components/MinutelyRainChart.vue'
import HourlyChart from '@/components/HourlyChart.vue'
import ForecastList from '@/components/ForecastList.vue'
import LifeIndices from '@/components/LifeIndices.vue'
import AirQualityCard from '@/components/AirQualityCard.vue'
import TemperatureChart from '@/components/TemperatureChart.vue'
import EmptyState from '@/components/EmptyState.vue'

// =============================================================================
// Stores & Router
// =============================================================================

const route = useRoute()
const router = useRouter()
const weatherStore = useWeatherStore()
const themeStore = useThemeStore()

// =============================================================================
// Local State
// =============================================================================

const showAddDialog = ref(false)

// =============================================================================
// Router ↔ Store 双向同步
// =============================================================================

watch(
  () => route.params.locationId,
  (id) => {
    if (id && typeof id === 'string' && id !== weatherStore.activeCityId) {
      weatherStore.setActiveCity(id)
    }
  }
)

watch(
  () => weatherStore.activeCityId,
  (id) => {
    if (id && route.name === 'city' && route.params.locationId !== id) {
      router.replace({ name: 'city', params: { locationId: id } })
    } else if (id && route.name === 'home') {
      router.replace({ name: 'city', params: { locationId: id } })
    }
  }
)

// =============================================================================
// Lifecycle
// =============================================================================

onMounted(() => {
  themeStore.initTheme()
  weatherStore.initFromStorage()
  weatherStore.fetchHotCities()
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
         城市 Tab 标签栏
         ================================================================ -->
    <CityTabs
      v-if="weatherStore.cityCount > 0"
      :cities="weatherStore.orderedCityList"
      :active-id="weatherStore.activeCityId"
      @select-city="(id) => weatherStore.setActiveCity(id)"
      @add-city="showAddDialog = true"
    />

    <!-- ================================================================
         加载 / 错误状态
         ================================================================ -->
    <div v-if="weatherStore.loading" class="loading-area">
      <el-skeleton :rows="6" animated />
    </div>

    <el-alert
      v-if="weatherStore.error"
      :title="weatherStore.error"
      type="error"
      show-icon
      closable
      class="error-alert"
      @close="weatherStore.error = null"
    />

    <!-- ================================================================
         天气数据展示（活跃城市）
         布局顺序：实时天气 → 降水 → 逐时 → 预报 → 指数 → AQI → 温度趋势
         ================================================================ -->
    <main
      v-if="weatherStore.activeCity && weatherStore.activeCity.currentWeather && !weatherStore.loading"
      class="app-main"
    >
      <!-- 1. 实时天气卡片 -->
      <CurrentWeather
        :city-info="weatherStore.activeCity.cityInfo"
        :now-data="weatherStore.activeCity.currentWeather"
      />

      <!-- 2. 分钟级降水图表（仅在有实际降水时显示） -->
      <MinutelyRainChart
        v-if="weatherStore.activeCity.minutelyPrecipitation"
        :minutely-data="weatherStore.activeCity.minutelyPrecipitation"
      />

      <!-- 3. 168h 逐时温度趋势 -->
      <HourlyChart :hourly-data="weatherStore.activeCity.hourlyForecast" />

      <!-- 4. 7 天预报（含日出日落） -->
      <ForecastList :daily-data="weatherStore.activeCity.forecast" />

      <!-- 5. 生活指数 -->
      <LifeIndices :indices="weatherStore.activeCity.lifeIndices" />

      <!-- 6. 空气质量 -->
      <AirQualityCard :aqi="weatherStore.activeCity.airQuality" />

      <!-- 7. 7 天温度趋势图 -->
      <TemperatureChart
        v-if="weatherStore.activeCity.forecast.length > 0"
        :daily-data="weatherStore.activeCity.forecast"
      />
    </main>

    <!-- ================================================================
         空状态引导
         ================================================================ -->
    <EmptyState
      v-if="weatherStore.cityCount === 0 && !weatherStore.loading"
      @add-city="showAddDialog = true"
    />

    <!-- ================================================================
         添加城市弹窗
         ================================================================ -->
    <AddCityDialog
      v-model:visible="showAddDialog"
      @city-added="(id) => weatherStore.setActiveCity(id)"
    />
  </div>
</template>

<style scoped>
.app-root {
  max-width: 960px;
  margin: 0 auto;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--color-border);
  transition: border-color var(--transition-normal);
}

.app-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 1px;
  margin: 0;
}

.loading-area {
  padding: 20px 0;
}

.error-alert {
  margin-bottom: 16px;
}

.app-main {
  margin-top: 8px;
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
}
</style>
