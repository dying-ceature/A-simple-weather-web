<script setup lang="ts">
/**
 * App.vue — 根组件
 *
 * Phase 2 完全重写：
 * - Tab 标签切换城市（类似 iOS 天气 App）
 * - Vue Router 与 activeCityId 双向同步
 * - Pinia stores 驱动所有状态
 * - Element Plus 组件用于 UI
 */

import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWeatherStore } from '@/stores/weather'
import { useThemeStore } from '@/stores/theme'

import ThemeToggle from '@/components/ThemeToggle.vue'
import CityTabs from '@/components/CityTabs.vue'
import AddCityDialog from '@/components/AddCityDialog.vue'
import CurrentWeather from '@/components/CurrentWeather.vue'
import ForecastList from '@/components/ForecastList.vue'
import HourlyChart from '@/components/HourlyChart.vue'
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

/** URL 参数变化 → 切换活跃城市 */
watch(
  () => route.params.locationId,
  (id) => {
    if (id && typeof id === 'string' && id !== weatherStore.activeCityId) {
      weatherStore.setActiveCity(id)
    }
  }
)

/** 活跃城市变化 → 更新 URL */
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
         城市 Tab 标签栏（包含 "+" 按钮）
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
         ================================================================ -->
    <main v-if="weatherStore.activeCity && weatherStore.activeCity.currentWeather && !weatherStore.loading" class="app-main">
      <CurrentWeather
        :city-info="weatherStore.activeCity.cityInfo"
        :now-data="weatherStore.activeCity.currentWeather"
      />
      <HourlyChart :hourly-data="weatherStore.activeCity.hourlyForecast" />
      <ForecastList :daily-data="weatherStore.activeCity.forecast" />
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

/* 页头 */
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

/* 加载 & 错误 */
.loading-area {
  padding: 20px 0;
}

.error-alert {
  margin-bottom: 16px;
}

/* 主内容区域 */
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
