import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('useThemeStore', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts with light theme by default', () => {
    const store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(store.isDark).toBe(false)
  })

  it('toggleTheme switches between light and dark', () => {
    const store = useThemeStore()
    store.toggleTheme()
    expect(store.theme).toBe('dark')
    expect(store.isDark).toBe(true)

    store.toggleTheme()
    expect(store.theme).toBe('light')
    expect(store.isDark).toBe(false)
  })

  it('setTheme changes theme and persists', () => {
    const store = useThemeStore()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
    expect(localStorage.getItem('weather-theme')).toBe('dark')

    store.setTheme('light')
    expect(store.theme).toBe('light')
    expect(localStorage.getItem('weather-theme')).toBe('light')
  })

  it('initTheme restores from localStorage', () => {
    localStorage.setItem('weather-theme', 'dark')
    const store = useThemeStore()
    store.initTheme()
    expect(store.theme).toBe('dark')
  })

  it('toggleTheme persists to localStorage', () => {
    const store = useThemeStore()
    store.toggleTheme() // light → dark
    expect(localStorage.getItem('weather-theme')).toBe('dark')
  })

  it('initTheme syncs data-theme on html element', () => {
    const store = useThemeStore()
    store.setTheme('dark')
    store.initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
