<script setup lang="ts">
/**
 * ForecastList.vue — 7 天天气预报列表
 *
 * 横向滚动卡片，每张卡片展示：日期、天气预报、温度、风力信息。
 * 使用 ElCard + ElScrollbar 替代手写卡片和滚动条。
 */

import { computed } from 'vue'
import { getWeatherIconUrl } from '@/api/weather'
import { formatDate, getWeekday, isToday } from '@/utils/date'
import type { DailyForecast } from '@/types/weather'

const props = defineProps<{
  dailyData: DailyForecast[]
}>()

interface FormattedDay extends DailyForecast {
  dateText: string
  weekdayText: string
  iconDayUrl: string
  iconNightUrl: string
}

/** 格式化后的预报列表 */
const formattedList = computed<FormattedDay[]>(() => {
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
  <el-card v-if="dailyData.length > 0" class="forecast-section" shadow="hover">
    <template #header>
      <h3 class="section-title">未来 7 天预报</h3>
    </template>

    <el-scrollbar>
      <div class="forecast-scroll">
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
    </el-scrollbar>
  </el-card>
</template>

<style scoped>
.forecast-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.forecast-scroll {
  display: flex;
  gap: 12px;
  padding-bottom: 4px;
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
