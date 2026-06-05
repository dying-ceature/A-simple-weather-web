import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'weather-theme'

/**
 * 主题 Pinia Store
 *
 * 管理深色/浅色模式切换，状态持久化到 localStorage。
 * 替换原 src/composables/useTheme.js。
 */
export const useThemeStore = defineStore('theme', () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const theme = ref<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'light')

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  const isDark = computed(() => theme.value === 'dark')

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** 切换深色/浅色模式 */
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    persistTheme()
    syncDOMTheme()
  }

  /** 设置指定主题 */
  function setTheme(t: ThemeMode): void {
    theme.value = t
    persistTheme()
    syncDOMTheme()
  }

  /**
   * 初始化主题：从 localStorage 读取并同步到 DOM。
   * 应在 App.vue onMounted 中调用。
   */
  function initTheme(): void {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    }
    syncDOMTheme()
  }

  // ---------------------------------------------------------------------------
  // 内部方法
  // ---------------------------------------------------------------------------

  /** 持久化到 localStorage */
  function persistTheme(): void {
    localStorage.setItem(STORAGE_KEY, theme.value)
  }

  /** 同步 data-theme 属性到 <html> */
  function syncDOMTheme(): void {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return {
    // State
    theme,
    // Getters
    isDark,
    // Actions
    toggleTheme,
    setTheme,
    initTheme,
  }
})
