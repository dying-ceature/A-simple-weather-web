<script setup lang="ts">
/**
 * AddCityDialog.vue — 城市搜索与添加弹窗
 *
 * 使用 ElDialog 包裹搜索输入，替换原 SearchBar.vue。
 * 支持搜索多个结果供用户选择。
 */

import { ref, watch } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import { searchCity as apiSearchList } from '@/api/weather'
import { ElMessage } from 'element-plus'
import type { CitySearchResult } from '@/types/weather'

// =============================================================================
// Props & Emits
// =============================================================================

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  cityAdded: [locationId: string]
}>()

// =============================================================================
// State
// =============================================================================

const weatherStore = useWeatherStore()

const keyword = ref('')
const searching = ref(false)
const results = ref<CitySearchResult[]>([])
const searched = ref(false)
const addingCityId = ref<string | null>(null)

// =============================================================================
// Methods
// =============================================================================

/** 搜索城市 */
async function search(): Promise<void> {
  const kw = keyword.value.trim()
  if (!kw) return

  searching.value = true
  searched.value = false
  results.value = []
  try {
    const list = await apiSearchList(kw, true)
    results.value = list
    searched.value = true
    if (list.length === 0) {
      ElMessage.info(`未找到与"${kw}"相关的城市`)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '搜索失败'
    ElMessage.error(msg)
  } finally {
    searching.value = false
  }
}

/** 选择一个城市并添加到我的城市列表 */
async function selectCity(result: CitySearchResult): Promise<void> {
  addingCityId.value = result.id
  try {
    const locationId = await weatherStore.addCity(result.name)
    if (locationId) {
      ElMessage.success(`已添加 ${result.name}`)
      emit('cityAdded', locationId)
    } else {
      ElMessage.warning(`城市"${result.name}"已在列表中`)
    }
    close()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '添加失败'
    ElMessage.error(msg)
  } finally {
    addingCityId.value = null
  }
}

/** 弹窗 visible 变化处理 */
function handleVisibleChange(val: boolean): void {
  if (!val) close()
}

/** 关闭弹窗并重置状态 */
function close(): void {
  emit('update:visible', false)
  keyword.value = ''
  results.value = []
  searched.value = false
}

// 弹窗打开时自动聚焦输入框
watch(() => props.visible, (val) => {
  if (val) {
    keyword.value = ''
    results.value = []
    searched.value = false
  }
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="添加城市"
    width="420px"
    :close-on-click-modal="true"
    @update:model-value="handleVisibleChange"
  >
    <div class="add-city-dialog">
      <!-- 搜索输入 -->
      <el-input
        v-model="keyword"
        placeholder="输入城市名称，如：北京、上海"
        size="large"
        clearable
        :loading="searching"
        @keyup.enter="search"
      >
        <template #append>
          <el-button
            :loading="searching"
            :disabled="!keyword.trim()"
            @click="search"
          >
            搜索
          </el-button>
        </template>
      </el-input>

      <!-- 搜索结果列表 -->
      <div v-if="searched && results.length > 0" class="search-results">
        <div
          v-for="city in results"
          :key="city.id"
          class="search-result-item"
          :class="{ 'is-loading': addingCityId === city.id }"
          @click="selectCity(city)"
        >
          <div class="result-info">
            <span class="result-name">{{ city.name }}</span>
            <span class="result-region">
              {{ city.adm1 }}{{ city.adm2 ? ' · ' + city.adm2 : '' }}，{{ city.country }}
            </span>
          </div>
          <el-icon v-if="addingCityId === city.id" class="is-loading-icon">
            <Loading />
          </el-icon>
          <span v-else class="result-id">ID: {{ city.id }}</span>
        </div>
      </div>

      <!-- 无结果 -->
      <div v-if="searched && results.length === 0 && !searching" class="search-empty">
        <el-empty description="未找到匹配的城市" :image-size="80" />
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.add-city-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  border: 1px solid transparent;
}

.search-result-item:hover:not(.is-loading) {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border);
}

.search-result-item.is-loading {
  opacity: 0.6;
  cursor: wait;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.result-region {
  font-size: 12px;
  color: var(--color-text-muted);
}

.result-id {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: monospace;
}

.search-empty {
  padding: 20px 0;
}
</style>
