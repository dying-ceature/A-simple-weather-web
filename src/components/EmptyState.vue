<script setup lang="ts">
/**
 * EmptyState.vue — 空状态引导组件
 *
 * 当用户没有添加任何城市时显示，引导用户添加第一个城市。
 */

defineEmits<{
  addCity: []
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
           opacity="0.3">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
      </svg>
    </div>
    <h2 class="empty-state__title">还没有添加城市</h2>
    <p class="empty-state__desc">点击下方按钮，搜索并添加你关注的城市天气</p>
    <el-button type="primary" size="large" @click="$emit('addCity')">
      <el-icon><Plus /></el-icon>
      添加城市
    </el-button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 300px;
}

.empty-state__icon {
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.empty-state__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-state__desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 28px;
  max-width: 280px;
}
</style>
