<!--
  @file CurrentWeather.vue
  @description 实时天气卡片 — 展示当前温度、天气描述、体感、湿度、风等
-->
<script setup>
import { computed } from 'vue'
import { getWeatherIconUrl } from '@/api/weather.js'
import { formatUpdateTime } from '@/utils/date.js'

const props = defineProps({
  /** 城市信息 { name, adm1, country } */
  cityInfo: {
    type: Object,
    default: null,
  },
  /** 实时天气数据 */
  nowData: {
    type: Object,
    default: null,
  },
})

/** 是否有数据可展示 */
const hasData = computed(() => props.nowData && props.cityInfo)

/** 城市显示名称 */
const cityDisplayName = computed(() => {
  if (!props.cityInfo) return '--'
  const { name, adm1, country } = props.cityInfo
  const region = [adm1, country !== '中国' ? country : ''].filter(Boolean).join('，')
  return region ? `${name}（${region}）` : name
})

/** 天气图标完整 URL */
const iconUrl = computed(() => {
  return props.nowData?.icon ? getWeatherIconUrl(props.nowData.icon) : ''
})

/** 数据更新时间 */
const updateTime = computed(() => formatUpdateTime(props.nowData?.updateTime))
</script>

<template>
  <div v-if="hasData" class="current-weather card">
    <!-- 顶部：城市 + 更新时间 -->
    <div class="cw-header">
      <h2 class="cw-city">{{ cityDisplayName }}</h2>
      <span class="cw-update">更新于 {{ updateTime }}</span>
    </div>

    <!-- 中部：温度 + 天气描述 + 图标 -->
    <div class="cw-main">
      <div class="cw-temp-block">
        <span class="cw-temp">{{ nowData.temp }}</span>
        <span class="cw-temp-unit">°C</span>
      </div>
      <div class="cw-desc-block">
        <img
          v-if="iconUrl"
          :src="iconUrl"
          :alt="nowData.text"
          class="weather-icon weather-icon--large"
        />
        <span class="cw-text">{{ nowData.text }}</span>
      </div>
    </div>

    <!-- 底部：详细指标网格 -->
    <div class="cw-details">
      <div class="cw-detail-item">
        <span class="cw-detail-label">体感温度</span>
        <span class="cw-detail-value">{{ nowData.feelsLike }}°C</span>
      </div>
      <div class="cw-detail-item">
        <span class="cw-detail-label">湿度</span>
        <span class="cw-detail-value">{{ nowData.humidity }}%</span>
      </div>
      <div class="cw-detail-item">
        <span class="cw-detail-label">风向</span>
        <span class="cw-detail-value">{{ nowData.windDir }}</span>
      </div>
      <div class="cw-detail-item">
        <span class="cw-detail-label">风力</span>
        <span class="cw-detail-value">{{ nowData.windScale }} 级</span>
      </div>
      <div class="cw-detail-item">
        <span class="cw-detail-label">气压</span>
        <span class="cw-detail-value">{{ nowData.pressure }} hPa</span>
      </div>
      <div class="cw-detail-item">
        <span class="cw-detail-label">能见度</span>
        <span class="cw-detail-value">{{ nowData.vis }} km</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.current-weather {
  margin-bottom: 20px;
}

.cw-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.cw-city {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.cw-update {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 温度 + 描述区域 */
.cw-main {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}

.cw-temp-block {
  display: flex;
  align-items: flex-start;
  line-height: 1;
}

.cw-temp {
  font-size: 56px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.cw-temp-unit {
  font-size: 24px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.cw-desc-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.cw-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* 详细指标网格 */
.cw-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.cw-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-normal);
}

.cw-detail-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.cw-detail-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

@media (max-width: 768px) {
  .cw-temp {
    font-size: 42px;
  }

  .cw-temp-unit {
    font-size: 18px;
  }

  .cw-main {
    gap: 16px;
  }

  .cw-details {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .cw-details {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
