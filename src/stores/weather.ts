import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  searchCity as apiSearchCity,
  getNowWeather,
  get7dForecast,
  getHourlyForecast,
  getWeatherIconUrl,
} from '@/api/weather'
import type {
  CityInfo,
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  CityWeatherCache,
  StoredCityEntry,
  CitySearchResult,
} from '@/types/weather'

// =============================================================================
// localStorage Keys
// =============================================================================

const STORAGE_CITY_ORDER = 'weather-city-order'
const STORAGE_CITIES_META = 'weather-cities-meta'
const STORAGE_ACTIVE_CITY = 'weather-active-city'

/** 天气缓存有效期（30 分钟） */
const CACHE_TTL_MS = 30 * 60 * 1000

// =============================================================================
// Weather Pinia Store
// =============================================================================

/**
 * 天气 Pinia Store（多城市支持）
 *
 * 核心数据结构变化（相比 Phase 1）：
 *   单城市 ref → 多城市 Map + 有序数组 + 活跃城市指针
 *
 * 替换原 src/composables/useWeather.js。
 */
export const useWeatherStore = defineStore('weather', () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** 所有城市的天气缓存，key 为 locationId */
  const cities = ref<Record<string, CityWeatherCache>>({})

  /** 城市 locationId 有序列表（决定 Tab 排序） */
  const cityOrder = ref<string[]>([])

  /** 当前活跃（展示）的城市 locationId */
  const activeCityId = ref<string | null>(null)

  /** 全局加载状态 */
  const loading = ref(false)

  /** 全局错误信息 */
  const error = ref<string | null>(null)

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  /** 当前活跃城市的完整缓存数据 */
  const activeCity = computed<CityWeatherCache | null>(() => {
    if (!activeCityId.value) return null
    return cities.value[activeCityId.value] ?? null
  })

  /** 城市总数 */
  const cityCount = computed(() => cityOrder.value.length)

  /** 按 cityOrder 排列的缓存数组（用于渲染 Tab） */
  const orderedCityList = computed<(CityWeatherCache & { id: string })[]>(() => {
    return cityOrder.value
      .map((id) => ({ id, ...cities.value[id] }))
      .filter((c) => c.cityInfo !== undefined)
  })

  /**
   * 有序的城市元信息列表（用于持久化和 Tab 展示）。
   * 即使某个城市的天气数据尚未加载，只要在 cityOrder 中就会尝试从缓存读取。
   */
  const cityMetaList = computed<StoredCityEntry[]>(() => {
    return cityOrder.value
      .filter((id) => cities.value[id])
      .map((id) => {
        const c = cities.value[id].cityInfo
        return { id: c.id, name: c.name, adm1: c.adm1, country: c.country }
      })
  })

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * 添加城市到"我的城市"列表。
   * 流程：搜索 → 获取天气 → 缓存 → 加入有序列表 → 设为活跃 → 持久化。
   *
   * @param cityName - 城市名称关键字
   * @returns 添加成功后的 locationId；如果城市已存在则返回 null
   */
  async function addCity(cityName: string): Promise<string | null> {
    error.value = null
    loading.value = true
    try {
      // 1. 搜索城市
      const cityInfo = await apiSearchCity(cityName)

      // 2. 检查是否已存在
      if (cityOrder.value.includes(cityInfo.id)) {
        // 已存在 → 直接切换到该城市
        setActiveCity(cityInfo.id)
        return null
      }

      // 3. 并行拉取三种天气数据
      const [currentWeather, forecast, hourlyForecast] = await Promise.all([
        getNowWeather(cityInfo.id),
        get7dForecast(cityInfo.id),
        getHourlyForecast(cityInfo.id),
      ])

      // 4. 存入缓存
      cities.value[cityInfo.id] = {
        cityInfo,
        currentWeather,
        forecast,
        hourlyForecast,
        lastFetchTime: Date.now(),
      }

      // 5. 加入有序列表
      cityOrder.value.push(cityInfo.id)
      activeCityId.value = cityInfo.id

      // 6. 持久化
      persistCityList()
      persistActiveCity()

      return cityInfo.id
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '添加城市失败，请稍后重试'
      error.value = msg
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 从"我的城市"列表中删除指定城市。
   *
   * @param locationId - 要删除的城市 locationId
   */
  function removeCity(locationId: string): void {
    // 1. 从缓存中删除
    delete cities.value[locationId]

    // 2. 从有序列表中移除
    const index = cityOrder.value.indexOf(locationId)
    if (index !== -1) {
      cityOrder.value.splice(index, 1)
    }

    // 3. 如果删除的是当前活跃城市，切换到下一个（或置空）
    if (activeCityId.value === locationId) {
      if (cityOrder.value.length > 0) {
        // 优先切换到被删除城市的邻居（靠近的）
        const newIndex = Math.min(index, cityOrder.value.length - 1)
        activeCityId.value = cityOrder.value[newIndex]
      } else {
        activeCityId.value = null
      }
      persistActiveCity()
    }

    // 4. 持久化
    persistCityList()
  }

  /**
   * 重新排序城市列表（拖拽后调用）。
   *
   * @param newOrder - 新的 locationId 顺序数组
   */
  function reorderCities(newOrder: string[]): void {
    // 验证：新顺序必须包含所有已有城市
    if (newOrder.length !== cityOrder.value.length) return
    cityOrder.value = newOrder
    persistCityList()
  }

  /**
   * 设置当前活跃城市。
   * 如果该城市缓存过期（>30min），自动刷新天气数据。
   *
   * @param locationId - 目标城市 locationId
   */
  async function setActiveCity(locationId: string): Promise<void> {
    if (!cities.value[locationId]) return

    activeCityId.value = locationId
    persistActiveCity()

    // 如果缓存过期，静默刷新
    const cache = cities.value[locationId]
    if (Date.now() - cache.lastFetchTime > CACHE_TTL_MS) {
      await refreshCity(locationId)
    }
  }

  /**
   * 刷新指定城市的天气数据。
   *
   * @param locationId - 目标城市 locationId
   */
  async function refreshCity(locationId: string): Promise<void> {
    if (!cities.value[locationId]) return

    try {
      const [currentWeather, forecast, hourlyForecast] = await Promise.all([
        getNowWeather(locationId),
        get7dForecast(locationId),
        getHourlyForecast(locationId),
      ])

      cities.value[locationId].currentWeather = currentWeather
      cities.value[locationId].forecast = forecast
      cities.value[locationId].hourlyForecast = hourlyForecast
      cities.value[locationId].lastFetchTime = Date.now()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '刷新天气数据失败'
      error.value = msg
      // 不抛出错误——使用旧的缓存数据
    }
  }

  /**
   * 从 localStorage 恢复城市列表。
   * 应在 App.vue onMounted 中调用。
   * - 恢复成功 → 自动拉取活跃城市天气数据
   * - 从未使用过 → 默认添加"北京"
   */
  async function initFromStorage(): Promise<void> {
    try {
      const storedOrder = localStorage.getItem(STORAGE_CITY_ORDER)
      const storedMeta = localStorage.getItem(STORAGE_CITIES_META)
      const storedActive = localStorage.getItem(STORAGE_ACTIVE_CITY)

      if (storedOrder && storedMeta) {
        const order: string[] = JSON.parse(storedOrder)
        const metaList: StoredCityEntry[] = JSON.parse(storedMeta)

        // 重建城市缓存（先用空壳占位，后续按需加载）
        for (const meta of metaList) {
          if (!cities.value[meta.id]) {
            cities.value[meta.id] = createEmptyCache(meta)
          }
        }

        cityOrder.value = order.filter((id) => metaList.some((m) => m.id === id))

        // 恢复活跃城市
        if (storedActive && order.includes(storedActive)) {
          await setActiveCity(storedActive)
          // 如果缓存为空壳，加载数据
          const cache = cities.value[storedActive]
          if (cache && cache.lastFetchTime === 0) {
            loading.value = true
            error.value = null
            try {
              const [currentWeather, forecast, hourlyForecast] = await Promise.all([
                getNowWeather(storedActive),
                get7dForecast(storedActive),
                getHourlyForecast(storedActive),
              ])
              cache.currentWeather = currentWeather
              cache.forecast = forecast
              cache.hourlyForecast = hourlyForecast
              cache.lastFetchTime = Date.now()
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : '加载天气数据失败'
              error.value = msg
            } finally {
              loading.value = false
            }
          }
        } else if (order.length > 0) {
          await setActiveCity(order[0])
        }
      } else {
        // 首次使用，默认添加北京
        await addCity('北京')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '初始化失败'
      error.value = msg
    }
  }

  /**
   * 搜索城市（不添加，仅返回结果列表）
   * 用于 AddCityDialog 中的即时搜索。
   *
   * @param keyword - 搜索关键字
   * @returns 城市搜索结果列表
   */
  async function searchCities(keyword: string): Promise<CitySearchResult[]> {
    return await apiSearchCity(keyword, true)
  }

  // ---------------------------------------------------------------------------
  // 内部方法
  // ---------------------------------------------------------------------------

  /** 创建一个空的天气缓存壳（用于从 localStorage 恢复） */
  function createEmptyCache(meta: StoredCityEntry): CityWeatherCache {
    return {
      cityInfo: {
        id: meta.id,
        name: meta.name,
        adm1: meta.adm1,
        adm2: '',
        country: meta.country,
        lat: '',
        lon: '',
      },
      currentWeather: null,
      forecast: [],
      hourlyForecast: [],
      lastFetchTime: 0, // 0 表示从未加载
    }
  }

  /** 持久化城市有序列表和元信息到 localStorage */
  function persistCityList(): void {
    localStorage.setItem(STORAGE_CITY_ORDER, JSON.stringify(cityOrder.value))
    localStorage.setItem(STORAGE_CITIES_META, JSON.stringify(cityMetaList.value))
  }

  /** 持久化当前活跃城市到 localStorage */
  function persistActiveCity(): void {
    if (activeCityId.value) {
      localStorage.setItem(STORAGE_ACTIVE_CITY, activeCityId.value)
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_CITY)
    }
  }

  return {
    // State
    cities,
    cityOrder,
    activeCityId,
    loading,
    error,
    // Getters
    activeCity,
    cityCount,
    orderedCityList,
    cityMetaList,
    // Actions
    addCity,
    removeCity,
    reorderCities,
    setActiveCity,
    refreshCity,
    initFromStorage,
    searchCities,
  }
})
