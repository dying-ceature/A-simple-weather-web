<script setup lang="ts">
/**
 * ThemeToggle.vue — 主题切换按钮
 *
 * 使用 Element Plus ElButton + 原生 SVG 图标。
 * 替换原来手写的 <button>。
 */

import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <el-button
    class="theme-toggle-btn"
    :title="themeStore.isDark ? '切换亮色模式' : '切换暗色模式'"
    circle
    @click="themeStore.toggleTheme()"
  >
    <!-- 太阳图标（暗色模式时显示，点击后切换到亮色） -->
    <svg
      v-if="themeStore.isDark"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
    <!-- 月亮图标（亮色模式时显示，点击后切换到暗色） -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </el-button>
</template>

<style scoped>
.theme-toggle-btn {
  --el-button-bg-color: transparent;
  --el-button-border-color: var(--color-border);
  --el-button-text-color: var(--color-text-primary);
}

.theme-toggle-btn:hover {
  --el-button-bg-color: var(--color-bg-hover);
}
</style>
