/**
 * @file src/composables/useWeather.js
 * @description 天气数据获取与状态管理组合式函数（共享单例）
 *
 * 集中管理：城市搜索、实时天气、7 天预报、loading / error 状态。
 * 所有调用 useWeather() 的组件共享同一份数据，避免重复请求。
 */

import { ref, shallowRef } from 'vue'
import {
  searchCity as apiSearchCity,
  getNowWeather,
  get7dForecast,
} from '@/api/weather.js'

// ---------------------------------------------------------------------------
// 共享单例状态
// ---------------------------------------------------------------------------

const LAST_CITY_KEY = 'weather-last-city'

/** 当前城市信息（含 locationId） */
const cityInfo = ref(null)

/** 实时天气数据 */
const currentWeather = ref(null)

/** 7 天预报数据 */
const forecast = ref([])

/** 是否正在请求中 */
const loading = ref(false)

/** 错误信息（null 表示无错误） */
const error = ref(null)

/** 是否已完成首次自动查询（用于默认城市加载控制） */
const initialized = ref(false)

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

/**
 * 从 localStorage 读取上次查询的城市名称
 * @returns {string | null}
 */
function loadLastCity() {
  try {
    return localStorage.getItem(LAST_CITY_KEY)
  } catch {
    return null
  }
}

/**
 * 将城市名称写入 localStorage
 * @param {string} name
 */
function saveLastCity(name) {
  try {
    localStorage.setItem(LAST_CITY_KEY, name)
  } catch {
    // 静默忽略
  }
}

/**
 * 从错误对象中提取人类可读的消息
 * @param {unknown} err
 * @returns {string}
 */
function normalizeError(err) {
  if (!err) return '发生未知错误'
  // Axios 网络错误
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return '网络连接失败，请检查网络后重试'
  }
  // Axios 超时
  if (err.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试'
  }
  // 已有友好信息的 Error
  if (err.message) return err.message
  return String(err)
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/**
 * @description 天气数据管理组合式函数（共享单例）
 */
export function useWeather() {
  /**
   * 清除错误状态
   */
  function clearError() {
    error.value = null
  }

  /**
   * 搜索城市并加载该城市的全部天气数据
   * @param {string} cityName - 城市名称（用户输入）
   */
  async function searchCity(cityName) {
    const trimmed = cityName?.trim()
    if (!trimmed) {
      error.value = '请输入城市名称'
      return
    }

    clearError()
    loading.value = true

    try {
      // 1. 城市搜索 → 获取 locationId
      const city = await apiSearchCity(trimmed)
      cityInfo.value = city
      saveLastCity(trimmed)

      // 2. 并行请求实时天气 + 7 天预报（节省时间）
      const [nowData, dailyData] = await Promise.all([
        getNowWeather(city.id),
        get7dForecast(city.id),
      ])

      currentWeather.value = nowData
      forecast.value = dailyData
    } catch (err) {
      error.value = normalizeError(err)
      // 发生错误时不清空已有数据，让用户仍能看到上次成功的查询结果
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  /**
   * 初始化：自动查询默认城市或上次查询的城市
   * 在 App.vue onMounted 中调用一次
   */
  function initDefaultCity() {
    if (initialized.value) return
    const lastCity = loadLastCity()
    searchCity(lastCity || '北京')
  }

  return {
    // 状态
    cityInfo,
    currentWeather,
    forecast,
    loading,
    error,
    initialized,

    // 方法
    searchCity,
    clearError,
    initDefaultCity,
  }
}
