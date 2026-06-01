<!--
  @file LoadingSpinner.vue
  @description 通用加载动画组件
-->
<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  /** 加载文字，如 "搜索中..." */
  text: {
    type: String,
    default: '加载中...',
  },
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <div class="spinner"></div>
      <span class="loading-text">{{ text }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  margin-bottom: 12px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
