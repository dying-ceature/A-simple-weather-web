<script setup lang="ts">
/**
 * LifeIndices.vue — 生活指数卡片
 *
 * 8 项常用生活指数的横向滚动卡片：
 * 舒适度、洗车、穿衣、感冒、运动、旅游、紫外线、空气污染扩散。
 * 每张卡片：emoji 图标 + 指数名称 + 等级 + 分类标签 + 描述。
 */

import { computed } from 'vue'
import type { LifeIndex } from '@/types/weather'

const props = defineProps<{
  indices: LifeIndex[] | null | undefined
}>()

/** 指数类型 → emoji 图标映射（QWeather API type 编号） */
const INDEX_ICONS: Record<string, string> = {
  '1': '🏃',   // 运动指数
  '2': '🚗',   // 洗车指数
  '3': '👔',   // 穿衣指数
  '4': '🎣',   // 钓鱼指数
  '5': '☀️',   // 紫外线指数
  '6': '📷',   // 旅游指数
  '8': '🌡️',   // 舒适度指数
  '9': '💊',   // 感冒指数
  '10': '🌫️',  // 空气污染扩散条件指数
}

function indexIcon(type: string): string {
  return INDEX_ICONS[type] || '📊'
}

/** 等级数字 → CSS class */
function levelClass(level: string): string {
  const num = parseInt(level, 10)
  if (num <= 1) return 'level--low'
  if (num === 2) return 'level--mid'
  if (num === 3) return 'level--high'
  return 'level--extreme'
}
</script>

<template>
  <el-card v-if="indices && indices.length > 0" class="indices-section" shadow="hover">
    <template #header>
      <h3 class="section-title">生活指数</h3>
    </template>

    <el-scrollbar>
      <div class="indices-scroll">
        <div
          v-for="idx in indices"
          :key="idx.type"
          class="index-card"
          :class="levelClass(idx.level)"
        >
          <span class="index-icon">{{ indexIcon(idx.type) }}</span>
          <span class="index-name">{{ idx.name }}</span>
          <span class="index-category">{{ idx.category }}</span>
          <span v-if="idx.text" class="index-text">{{ idx.text }}</span>
        </div>
      </div>
    </el-scrollbar>
  </el-card>
</template>

<style scoped>
.indices-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.indices-scroll {
  display: flex;
  gap: 10px;
  padding-bottom: 4px;
}

/* 每张指数卡片 */
.index-card {
  flex: 0 0 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
  border-top: 3px solid var(--color-border);
  text-align: center;
  transition: background-color var(--transition-normal);
}

/* 等级着色顶部边框 */
.index-card.level--low {
  border-top-color: #22c55e;
}
.index-card.level--mid {
  border-top-color: #eab308;
}
.index-card.level--high {
  border-top-color: #f97316;
}
.index-card.level--extreme {
  border-top-color: #ef4444;
}

.index-icon {
  font-size: 26px;
  line-height: 1;
}

.index-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.index-category {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
}

.index-text {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .indices-scroll {
    flex-wrap: wrap;
    justify-content: center;
  }

  .index-card {
    flex: 0 0 calc(25% - 8px);
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .index-card {
    flex: 0 0 calc(50% - 5px);
  }
}
</style>
