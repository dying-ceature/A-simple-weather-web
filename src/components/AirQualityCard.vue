<script setup lang="ts">
/**
 * AirQualityCard.vue — 空气质量展示卡片
 *
 * 显示 AQI 数字（带颜色指示）、等级分类、主要污染物、健康建议和 6 项污染物浓度。
 */

import { computed } from 'vue'
import type { AirQualityData, AirQualityIndex } from '@/types/weather'

const props = defineProps<{
  aqi: AirQualityData | null | undefined
}>()

/** 主 AQI 指标 */
const primaryIndex = computed<AirQualityIndex | null>(() => {
  if (!props.aqi?.indexes?.length) return null
  return props.aqi.indexes[0]
})

/** 根据 AQI 数值返回颜色（中国标准） */
function aqiColorFromValue(value: number): string {
  if (value <= 50) return '#22c55e'
  if (value <= 100) return '#eab308'
  if (value <= 150) return '#f97316'
  if (value <= 200) return '#ef4444'
  if (value <= 300) return '#a855f7'
  return '#800000'
}

/** 从 RGBA 对象生成 CSS 颜色字符串 */
function rgbaToString(color: { red: number; green: number; blue: number; alpha: number } | undefined): string {
  if (!color) return '#9ca3af'
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`
}

/** AQI 主颜色 */
const aqiColor = computed(() => {
  if (!primaryIndex.value) return '#9ca3af'
  const v = parseFloat(primaryIndex.value.aqi)
  return isNaN(v) ? '#9ca3af' : aqiColorFromValue(v)
})

/** AQI 值（安全解析） */
const aqiValue = computed(() => {
  if (!primaryIndex.value) return '--'
  return primaryIndex.value.aqi || '--'
})
</script>

<template>
  <el-card v-if="aqi && primaryIndex" class="aqi-section" shadow="hover">
    <template #header>
      <h3 class="section-title">空气质量</h3>
    </template>

    <!-- 主 AQI 展示区 -->
    <div class="aqi-main" :style="{ backgroundColor: aqiColor + '18' }">
      <div class="aqi-circle" :style="{ borderColor: aqiColor, color: aqiColor }">
        <span class="aqi-value">{{ aqiValue }}</span>
        <span class="aqi-label">{{ primaryIndex.category }}</span>
      </div>
      <div class="aqi-meta">
        <div v-if="primaryIndex.primaryPollutant" class="aqi-pollutant">
          <span class="meta-label">首要污染物</span>
          <span class="meta-value">{{ primaryIndex.primaryPollutant }}</span>
        </div>
        <div class="aqi-level">
          <span class="meta-label">等级</span>
          <span class="meta-value">{{ primaryIndex.level }}</span>
        </div>
      </div>
    </div>

    <!-- 健康建议 -->
    <div v-if="primaryIndex.health.effect || primaryIndex.health.advice" class="aqi-health">
      <p v-if="primaryIndex.health.effect">
        <strong>影响：</strong>{{ primaryIndex.health.effect }}
      </p>
      <p v-if="primaryIndex.health.advice">
        <strong>建议：</strong>{{ primaryIndex.health.advice }}
      </p>
    </div>

    <!-- 污染物浓度网格 -->
    <div v-if="aqi.pollutants.length > 0" class="pollutant-grid">
      <div v-for="p in aqi.pollutants" :key="p.code" class="pollutant-item">
        <span class="pollutant-name">{{ p.name }}</span>
        <span class="pollutant-value">{{ p.concentration }}</span>
        <span class="pollutant-unit">{{ p.unit }}</span>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.aqi-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 主 AQI 展示区 */
.aqi-main {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 14px;
}

.aqi-circle {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 4px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.aqi-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.aqi-label {
  font-size: 12px;
  font-weight: 500;
  margin-top: 2px;
}

.aqi-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-label {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 健康建议 */
.aqi-health {
  padding: 10px 14px;
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
}

.aqi-health p {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 4px;
}

.aqi-health p:last-child {
  margin-bottom: 0;
}

/* 污染物网格 */
.pollutant-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pollutant-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
}

.pollutant-name {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.pollutant-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.pollutant-unit {
  font-size: 10px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .pollutant-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .aqi-main {
    gap: 16px;
    padding: 12px 16px;
  }

  .aqi-circle {
    width: 72px;
    height: 72px;
  }

  .aqi-value {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .pollutant-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
