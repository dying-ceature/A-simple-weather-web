<!--
  @file SearchBar.vue
  @description 城市搜索输入组件 — 输入框 + 搜索按钮 + Enter 触发
-->
<script setup>
import { ref } from 'vue'

defineProps({
  /** 是否正在加载（禁用交互） */
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['search'])

/** 双向绑定的输入值 */
const keyword = ref('')

/** 触发搜索事件 */
function doSearch() {
  const trimmed = keyword.value.trim()
  if (trimmed) {
    emit('search', trimmed)
  }
}
</script>

<template>
  <div class="search-bar">
    <input
      v-model="keyword"
      type="text"
      class="input search-input"
      placeholder="请输入城市名称，如：北京、上海、广州…"
      :disabled="loading"
      @keyup.enter="doSearch"
    />
    <button
      type="button"
      class="btn btn-primary search-btn"
      :disabled="loading || !keyword.trim()"
      @click="doSearch"
    >
      {{ loading ? '搜索中...' : '搜索' }}
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto 20px;
}

.search-input {
  flex: 1;
  min-width: 0;
}

.search-btn {
  min-width: 80px;
}

@media (max-width: 480px) {
  .search-bar {
    flex-direction: column;
    gap: 8px;
  }

  .search-btn {
    width: 100%;
  }
}
</style>
