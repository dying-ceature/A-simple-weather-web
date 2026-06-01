/**
 * @file src/composables/useTheme.js
 * @description 主题切换组合式函数（共享单例）
 *
 * 使用 Plain Vue ref + localStorage 实现，不依赖第三方库。
 * 所有调用 useTheme() 的组件共享同一份响应式状态。
 * 支持 light / dark 两种模式。
 */

import { ref, watchEffect } from 'vue'

/** localStorage 存储键 */
const STORAGE_KEY = 'weather-theme'

/** 单例共享的响应式主题状态 */
const theme = ref(loadTheme())

/**
 * 从 localStorage 读取持久化的主题设置
 * @returns {'light' | 'dark'}
 */
function loadTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
  } catch {
    // localStorage 不可用或读取失败时忽略
  }
  return 'light'
}

/**
 * 将主题值写入 localStorage
 * @param {'light' | 'dark'} value
 */
function saveTheme(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // 静默忽略写入失败
  }
}

// 副作用：当 theme 值变化时同步到 DOM 和 localStorage
// 使用 watchEffect 自动追踪 theme 的读取
watchEffect(() => {
  const current = theme.value
  document.documentElement.setAttribute('data-theme', current)
  saveTheme(current)
})

/**
 * @description 主题切换组合式函数（共享单例）
 *
 * @returns {{
 *   theme: import('vue').Ref<'light' | 'dark'>,
 *   isDark: import('vue').ComputedRef<boolean>,
 *   toggleTheme: () => void,
 *   setTheme: (t: 'light' | 'dark') => void,
 * }}
 */
export function useTheme() {
  /** 是否为暗色模式 */
  const isDark = {
    get value() {
      return theme.value === 'dark'
    },
  }

  /** 在亮色 / 暗色之间切换 */
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  /** 直接设置主题 */
  function setTheme(t) {
    if (t === 'light' || t === 'dark') {
      theme.value = t
    }
  }

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
