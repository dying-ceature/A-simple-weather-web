<script setup lang="ts">
/**
 * CityTabs.vue — 城市 Tab 标签栏
 *
 * 类似 iOS 天气 App 的横向滚动 Tab 栏。
 * 每个 Tab 卡片：天气图标 + 温度 + 城市名。
 * 最后有一个 "+" 按钮添加城市。
 * 支持 HTML5 拖拽排序 + 右键删除菜单。
 */

import { ref, computed } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import { getWeatherIconUrl } from '@/api/weather'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { CityWeatherCache } from '@/types/weather'

// =============================================================================
// Props & Emits
// =============================================================================

defineProps<{
  cities: (CityWeatherCache & { id: string })[]
  activeId: string | null
}>()

const emit = defineEmits<{
  selectCity: [locationId: string]
  addCity: []
}>()

// =============================================================================
// Store
// =============================================================================

const weatherStore = useWeatherStore()

// =============================================================================
// Drag-and-Drop State
// =============================================================================

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dragMode = ref<'left' | 'right' | null>(null)

// =============================================================================
// Methods
// =============================================================================

/** 获取 Tab 上的天气图标 */
function tabIcon(city: CityWeatherCache & { id: string }): string {
  if (city.currentWeather?.icon) {
    return getWeatherIconUrl(city.currentWeather.icon)
  }
  return getWeatherIconUrl('100') // 默认晴天图标
}

/** 获取 Tab 上的温度文字 */
function tabTemp(city: CityWeatherCache & { id: string }): string {
  if (city.currentWeather?.temp && city.currentWeather.temp !== '--') {
    return `${city.currentWeather.temp}°`
  }
  return '--°'
}

// =============================================================================
// Drag-and-Drop Handlers
// =============================================================================

function onDragStart(e: DragEvent, index: number): void {
  draggedIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
  // 添加拖拽视觉样式
  const el = e.target as HTMLElement
  requestAnimationFrame(() => {
    el.classList.add('dragging')
  })
}

function onDragOver(e: DragEvent, index: number): void {
  e.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) return

  dragOverIndex.value = index

  // 判断光标在目标元素的左侧还是右侧
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  dragMode.value = x < rect.width / 2 ? 'left' : 'right'
}

function onDragLeave(): void {
  dragOverIndex.value = null
  dragMode.value = null
}

function onDrop(e: DragEvent, index: number): void {
  e.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) {
    resetDragState()
    return
  }

  // 计算新的插入位置
  let targetIndex = index
  if (dragMode.value === 'right') {
    targetIndex = index + 1
  }

  // 生成新顺序
  const newOrder = [...weatherStore.cityOrder]
  const [movedId] = newOrder.splice(draggedIndex.value, 1)
  // 如果 dragMode 是 'right' 且原位置在插入点之前，插入点需要 -1
  const adjustedTarget = draggedIndex.value < targetIndex ? targetIndex - 1 : targetIndex
  newOrder.splice(adjustedTarget, 0, movedId)

  weatherStore.reorderCities(newOrder)
  resetDragState()
}

function onDragEnd(e: DragEvent): void {
  (e.target as HTMLElement).classList.remove('dragging')
  resetDragState()
}

function resetDragState(): void {
  draggedIndex.value = null
  dragOverIndex.value = null
  dragMode.value = null
}

// =============================================================================
// Context Menu / Delete Handler
// =============================================================================

async function handleDeleteCity(locationId: string, cityName: string): Promise<void> {
  try {
    if (weatherStore.cityCount <= 1) {
      await ElMessageBox.confirm(
        `这是你最后一个城市了。确定要删除"${cityName}"吗？`,
        '删除城市',
        { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
      )
    }
    weatherStore.removeCity(locationId)
    ElMessage.success(`已删除 ${cityName}`)
  } catch {
    // 用户取消
  }
}

function onContextMenu(e: MouseEvent, locationId: string): void {
  e.preventDefault()
  const city = weatherStore.cities[locationId]
  if (!city) return
  handleDeleteCity(locationId, city.cityInfo.name)
}
</script>

<template>
  <div class="city-tabs">
    <div class="tabs-scroll" @dragleave="onDragLeave">
      <!-- 城市 Tab 卡片 -->
      <div
        v-for="(city, index) in cities"
        :key="city.id"
        class="tab-card"
        :class="{
          active: city.id === activeId,
          'drag-over-left': dragOverIndex === index && dragMode === 'left',
          'drag-over-right': dragOverIndex === index && dragMode === 'right',
        }"
        draggable="true"
        @click="emit('selectCity', city.id)"
        @contextmenu="(e) => onContextMenu(e, city.id)"
        @dragstart="(e) => onDragStart(e, index)"
        @dragover="(e) => onDragOver(e, index)"
        @dragleave="onDragLeave"
        @drop="(e) => onDrop(e, index)"
        @dragend="onDragEnd"
      >
        <img
          :src="tabIcon(city)"
          :alt="city.currentWeather?.text || '天气'"
          class="tab-icon"
        />
        <span class="tab-temp">{{ tabTemp(city) }}</span>
        <span class="tab-name">{{ city.cityInfo.name }}</span>
      </div>

      <!-- "+" 添加按钮 -->
      <div class="tab-card tab-add" @click="emit('addCity')">
        <el-icon :size="20"><Plus /></el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.city-tabs {
  margin-bottom: 16px;
}

.tabs-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.tabs-scroll::-webkit-scrollbar {
  height: 4px;
}

.tabs-scroll::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 2px;
}

/* =========================================================================
   Tab 卡片
   ========================================================================= */

.tab-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 80px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-card);
  border: 2px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.tab-card:hover {
  background-color: var(--color-bg-hover);
  box-shadow: var(--shadow-card);
}

.tab-card.active {
  border-color: var(--color-primary);
  background-color: var(--color-bg-hover);
}

/* 拖拽状态 */
.tab-card.dragging {
  opacity: 0.4;
  transform: scale(0.95);
}

/* 拖拽插入指示器 */
.tab-card.drag-over-left {
  border-left: 3px solid var(--color-primary);
}

.tab-card.drag-over-right {
  border-right: 3px solid var(--color-primary);
}

.tab-icon {
  width: 28px;
  height: 28px;
}

.tab-temp {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.tab-name {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 72px;
}

/* =========================================================================
   "+" 按钮
   ========================================================================= */

.tab-add {
  justify-content: center;
  min-width: 56px;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  background-color: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-add:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background-color: var(--color-bg-card);
}

/* =========================================================================
   响应式
   ========================================================================= */

@media (max-width: 480px) {
  .tab-card {
    min-width: 68px;
    padding: 8px 10px;
  }

  .tab-icon {
    width: 22px;
    height: 22px;
  }

  .tab-temp {
    font-size: 13px;
  }

  .tab-name {
    font-size: 10px;
    max-width: 56px;
  }

  .tab-add {
    min-width: 44px;
  }
}
</style>
