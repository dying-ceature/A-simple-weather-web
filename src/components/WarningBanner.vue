<script setup lang="ts">
/**
 * WarningBanner.vue — 天气预警横幅
 *
 * 按严重等级（白/蓝/黄/橙/红）着色左边框，堆叠展示多条预警。
 * 位于天气展示区域最顶部，是最醒目的信息组件。
 */

import { computed } from 'vue'
import { formatWarningTime } from '@/utils/date'
import type { WeatherWarning } from '@/types/weather'

const props = defineProps<{
  warnings: WeatherWarning[] | null | undefined
}>()

/** 严重等级 → CSS class 后缀 */
function severityClass(code: string): string {
  const map: Record<string, string> = {
    White: 'white',
    Blue: 'blue',
    Yellow: 'yellow',
    Orange: 'orange',
    Red: 'red',
  }
  return map[code] || 'white'
}

/** 严重等级 → 颜色值 */
function severityColor(code: string): string {
  const map: Record<string, string> = {
    White: '#9ca3af',
    Blue: '#3b82f6',
    Yellow: '#f59e0b',
    Orange: '#f97316',
    Red: '#ef4444',
  }
  return map[code] || '#9ca3af'
}

/** 严重等级 → 中文标签 */
function severityLabel(code: string): string {
  const map: Record<string, string> = {
    White: '白色预警',
    Blue: '蓝色预警',
    Yellow: '黄色预警',
    Orange: '橙色预警',
    Red: '红色预警',
  }
  return map[code] || code
}

/** 格式化预警有效时间段 */
function formatPeriod(w: WeatherWarning): string {
  const from = formatWarningTime(w.effectiveTime)
  const to = formatWarningTime(w.expireTime)
  return `${from} — ${to}`
}
</script>

<template>
  <div v-if="warnings && warnings.length > 0" class="warning-banner">
    <div
      v-for="w in warnings"
      :key="w.id"
      class="warning-item"
      :class="'warning--' + severityClass(w.color.code)"
      :style="{ borderLeftColor: severityColor(w.color.code) }"
    >
      <div class="warning-header">
        <el-icon :size="18"><WarningFilled /></el-icon>
        <span class="warning-event">{{ w.eventType.name }}</span>
        <el-tag
          :color="severityColor(w.color.code)"
          size="small"
          effect="dark"
          class="warning-tag"
        >
          {{ severityLabel(w.color.code) }}
        </el-tag>
      </div>
      <div class="warning-headline">{{ w.headline }}</div>
      <div class="warning-body">{{ w.description }}</div>
      <div v-if="w.instruction" class="warning-instruction">
        <el-icon :size="14"><InfoFilled /></el-icon>
        {{ w.instruction }}
      </div>
      <div class="warning-time">{{ formatPeriod(w) }}</div>
    </div>
  </div>
</template>

<style scoped>
.warning-banner {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warning-item {
  padding: 14px 18px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-left: 4px solid;
  transition: background-color var(--transition-normal);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--color-text-primary);
}

.warning-event {
  font-size: 16px;
  font-weight: 700;
}

.warning-tag {
  margin-left: 4px;
}

.warning-headline {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.warning-body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 6px;
}

.warning-instruction {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  padding: 6px 10px;
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
}

.warning-time {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* 不同等级的背景色微调 */
.warning--red {
  background-color: rgba(239, 68, 68, 0.06);
}
.warning--orange {
  background-color: rgba(249, 115, 22, 0.05);
}
.warning--yellow {
  background-color: rgba(245, 158, 11, 0.05);
}
</style>
