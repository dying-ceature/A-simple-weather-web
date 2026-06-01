<!--
  @file ForecastList.vue
  @description 7 天天气预报列表 — 横向滚动卡片（移动端自适应）
-->
<script setup>
import { computed } from 'vue'
import { getWeatherIconUrl } from '@/api/weather.js'
import { formatDate, getWeekday, isToday } from '@/utils/date.js'

const props = defineProps({
  /** 7 天预报数组 */
  dailyData: {
    type: Array,
    default: () => [],
  },
})

/** 格式化后的预报列表 */
const formattedList = computed(() => {
  if (!props.dailyData || props.dailyData.length === 0) return []

  return props.dailyData.map((day) => ({
    ...day,
    dateText: formatDate(day.fxDate),
    weekdayText: isToday(day.fxDate) ? '今天' : getWeekday(day.fxDate),
    iconDayUrl: getWeatherIconUrl(day.iconDay),
    iconNightUrl: getWeatherIconUrl(day.iconNight),
  }))
})
</script>

<template>
  <div class="forecast-section card">
    <h3 class="section-title">未来 7 天预报</h3>

    <div v-if="formattedList.length === 0" class="forecast-empty">
      暂无预报数据
    </div>

    <!-- 横向滚动容器 -->
    <div v-else class="forecast-scroll">
      <div
        v-for="(day, idx) in formattedList"
        :key="day.fxDate || idx"
        class="forecast-card"
      >
        <!-- 日期 / 星期 -->
        <div class="fc-date">
          <span class="fc-date-text">{{ day.dateText }}</span>
          <span class="fc-weekday">{{ day.weekdayText }}</span>
        </div>

        <!-- 白天天气 -->
        <div class="fc-daypart">
          <img
            :src="day.iconDayUrl"
            :alt="day.textDay"
            class="weather-icon"
          />
          <span class="fc-weather-text">{{ day.textDay }}</span>
        </div>

        <!-- 夜间天气 -->
        <div class="fc-daypart fc-daypart--night">
          <img
            :src="day.iconNightUrl"
            :alt="day.textNight"
            class="weather-icon"
          />
          <span class="fc-weather-text">{{ day.textNight }}</span>
        </div>

        <!-- 温度 -->
        <div class="fc-temps">
          <span class="fc-temp-high">{{ day.tempMax }}°</span>
          <span class="fc-temp-sep">/</span>
          <span class="fc-temp-low">{{ day.tempMin }}°</span>
        </div>

        <!-- 风力风向（白天） -->
        <div class="fc-wind">
          {{ day.windDirDay || '--' }} {{ day.windScaleDay || '--' }} 级
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forecast-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--color-text-primary);
}

.forecast-empty {
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
}

/* 横向滚动 */
.forecast-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  /* 滚动条在暗色模式下适配 */
  scrollbar-color: var(--color-border) transparent;
  scrollbar-width: thin;
}

.forecast-scroll::-webkit-scrollbar {
  height: 6px;
}

.forecast-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.forecast-scroll::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 3px;
}

/* 每张预报卡片 */
.forecast-card {
  flex: 0 0 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 12px;
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-normal);
  text-align: center;
}

.fc-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.fc-date-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.fc-weekday {
  font-size: 12px;
  color: var(--color-text-muted);
}

.fc-daypart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.fc-daypart--night {
  opacity: 0.7;
}

.fc-weather-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.fc-temps {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  font-weight: 600;
}

.fc-temp-high {
  color: var(--color-temp-high);
}

.fc-temp-sep {
  color: var(--color-text-muted);
  font-weight: 400;
}

.fc-temp-low {
  color: var(--color-temp-low);
}

.fc-wind {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* 移动端：纵向排列 */
@media (max-width: 768px) {
  .forecast-scroll {
    flex-wrap: wrap;
    justify-content: center;
  }

  .forecast-card {
    flex: 0 0 calc(50% - 6px);
    min-width: 140px;
  }
}

@media (max-width: 480px) {
  .forecast-card {
    flex: 0 0 100%;
  }
}
</style>
