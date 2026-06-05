import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  searchCity as apiSearchCity,
  getNowWeather,
  get7dForecast,
  getHourlyForecast,
  getWeatherWarnings,
  getLifeIndices,
  getAirQuality,
  getMinutelyPrecipitation,
  getTopCities,
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
  WeatherWarning,
  LifeIndex,
  AirQualityData,
  MinutelyPrecipitation,
  TopCity,
} from '@/types/weather'

// =============================================================================
// localStorage Keys
// =============================================================================

const STORAGE_CITY_ORDER = 'weather-city-order'
const STORAGE_CITIES_META = 'weather-cities-meta'
const STORAGE_ACTIVE_CITY = 'weather-active-city'

// =============================================================================
// Cache TTLs（毫秒）
// =============================================================================

/** 基础天气（实时 + 7 天 + 168 小时）— 30 分钟 */
const TTL_BASE = 30 * 60 * 1000
/** 天气预警 — 15 分钟 */
const TTL_WARNINGS = 15 * 60 * 1000
/** 生活指数 — 60 分钟 */
const TTL_INDICES = 60 * 60 * 1000
/** 空气质量 — 15 分钟 */
const TTL_AQI = 15 * 60 * 1000
/** 分钟级降水 — 10 分钟 */
const TTL_MINUTELY = 10 * 60 * 1000

// =============================================================================
// 内部工具
// =============================================================================

/**
 * 安全获取：捕获异常并返回 fallback，不抛出错误。
 * 用于可选 API（预警/指数/AQI/降水），失败时不影响核心天气数据。
 */
async function safeFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

// =============================================================================
// Weather Pinia Store（Phase 3 — 多端点 + 分 TTL + 7 路并行）
// =============================================================================

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

  // ---- Phase 3 新增 State ----

  /** 热门城市列表（全局，非按城市） */
  const hotCities = ref<TopCity[]>([])

  /** 热门城市加载状态 */
  const hotCitiesLoading = ref(false)

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
   * Phase 3：包含 lat/lon 以支持从 localStorage 恢复后调用 AQI/降水 API。
   */
  const cityMetaList = computed<StoredCityEntry[]>(() => {
    return cityOrder.value
      .filter((id) => cities.value[id])
      .map((id) => {
        const c = cities.value[id].cityInfo
        return {
          id: c.id,
          name: c.name,
          adm1: c.adm1,
          country: c.country,
          lat: c.lat,
          lon: c.lon,
        }
      })
  })

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * 添加城市到"我的城市"列表。
   * Phase 3：7 路并行获取（3 核心 + 4 可选），可选 API 失败不影响核心数据。
   */
  async function addCity(cityName: string): Promise<string | null> {
    error.value = null
    loading.value = true
    try {
      // 1. 搜索城市
      const cityInfo = await apiSearchCity(cityName)

      // 2. 检查是否已存在
      if (cityOrder.value.includes(cityInfo.id)) {
        setActiveCity(cityInfo.id)
        return null
      }

      // 3. 7 路并行获取（核心 3 路 throw on fail，可选 4 路 safeFetch）
      const now = Date.now()
      const [
        currentWeather,
        forecast,
        hourlyForecast,
        warnings,
        indices,
        aqi,
        minutely,
      ] = await Promise.all([
        getNowWeather(cityInfo.id),
        get7dForecast(cityInfo.id),
        getHourlyForecast(cityInfo.id),
        safeFetch(
          cityInfo.lat && cityInfo.lon
            ? getWeatherWarnings(cityInfo.lat, cityInfo.lon)
            : Promise.resolve([]),
          [] as WeatherWarning[]
        ),
        safeFetch(getLifeIndices(cityInfo.id), [] as LifeIndex[]),
        safeFetch(
          cityInfo.lat && cityInfo.lon
            ? getAirQuality(cityInfo.lat, cityInfo.lon)
            : Promise.resolve(null),
          null as AirQualityData | null
        ),
        safeFetch(
          cityInfo.lon && cityInfo.lat
            ? getMinutelyPrecipitation(cityInfo.lon, cityInfo.lat)
            : Promise.resolve(null),
          null as MinutelyPrecipitation | null
        ),
      ])

      // 4. 存入缓存（含分端点 fetchTime）
      cities.value[cityInfo.id] = {
        cityInfo,
        currentWeather,
        forecast,
        hourlyForecast,
        lastFetchTime: now,
        warnings,
        warningsFetchTime: now,
        lifeIndices: indices,
        indicesFetchTime: now,
        airQuality: aqi,
        aqiFetchTime: now,
        minutelyPrecipitation: minutely,
        minutelyFetchTime: now,
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

  /** 从"我的城市"列表中删除指定城市 */
  function removeCity(locationId: string): void {
    delete cities.value[locationId]

    const index = cityOrder.value.indexOf(locationId)
    if (index !== -1) {
      cityOrder.value.splice(index, 1)
    }

    if (activeCityId.value === locationId) {
      if (cityOrder.value.length > 0) {
        const newIndex = Math.min(index, cityOrder.value.length - 1)
        activeCityId.value = cityOrder.value[newIndex]
      } else {
        activeCityId.value = null
      }
      persistActiveCity()
    }

    persistCityList()
  }

  /** 重新排序城市列表（拖拽后调用） */
  function reorderCities(newOrder: string[]): void {
    if (newOrder.length !== cityOrder.value.length) return
    cityOrder.value = newOrder
    persistCityList()
  }

  /**
   * 设置当前活跃城市。
   * Phase 3：按分端点 TTL 条件刷新。
   */
  async function setActiveCity(locationId: string): Promise<void> {
    if (!cities.value[locationId]) return

    activeCityId.value = locationId
    persistActiveCity()

    // 按 TTL 条件刷新
    await refreshCity(locationId)
  }

  /**
   * 刷新指定城市的天气数据。
   * Phase 3：按分端点 TTL 独立判断是否刷新，safeFetch 保护可选 API。
   */
  async function refreshCity(locationId: string): Promise<void> {
    const cache = cities.value[locationId]
    if (!cache) return

    const now = Date.now()

    // 判断各端点是否过期
    const baseExpired = now - cache.lastFetchTime > TTL_BASE
    const warningsExpired = !cache.warningsFetchTime || (now - cache.warningsFetchTime > TTL_WARNINGS)
    const indicesExpired = !cache.indicesFetchTime || (now - cache.indicesFetchTime > TTL_INDICES)
    const aqiExpired = !cache.aqiFetchTime || (now - cache.aqiFetchTime > TTL_AQI)
    const minutelyExpired = !cache.minutelyFetchTime || (now - cache.minutelyFetchTime > TTL_MINUTELY)

    try {
      // 并行获取：基础天气（如过期）+ 可选端点（如过期）
      const [
        baseResult,
        warnings,
        indices,
        aqi,
        minutely,
      ] = await Promise.all([
        baseExpired
          ? Promise.all([
              getNowWeather(locationId),
              get7dForecast(locationId),
              getHourlyForecast(locationId),
            ])
          : Promise.resolve(null),
        warningsExpired && cache.cityInfo.lat && cache.cityInfo.lon
          ? safeFetch(
              getWeatherWarnings(cache.cityInfo.lat, cache.cityInfo.lon),
              cache.warnings ?? []
            )
          : Promise.resolve(null),
        indicesExpired
          ? safeFetch(getLifeIndices(locationId), cache.lifeIndices ?? [])
          : Promise.resolve(null),
        aqiExpired && cache.cityInfo.lat && cache.cityInfo.lon
          ? safeFetch(
              getAirQuality(cache.cityInfo.lat, cache.cityInfo.lon),
              cache.airQuality ?? null
            )
          : Promise.resolve(null),
        minutelyExpired && cache.cityInfo.lon && cache.cityInfo.lat
          ? safeFetch(
              getMinutelyPrecipitation(cache.cityInfo.lon, cache.cityInfo.lat),
              cache.minutelyPrecipitation ?? null
            )
          : Promise.resolve(null),
      ])

      // 应用基础天气更新
      if (baseResult) {
        const [cw, fc, hf] = baseResult
        cache.currentWeather = cw
        cache.forecast = fc
        cache.hourlyForecast = hf
        cache.lastFetchTime = now
      }

      // 应用可选数据更新（仅在实际获取到新数据时更新）
      if (warnings !== null) {
        cache.warnings = warnings
        cache.warningsFetchTime = now
      }
      if (indices !== null) {
        cache.lifeIndices = indices
        cache.indicesFetchTime = now
      }
      if (aqi !== null) {
        cache.airQuality = aqi
        cache.aqiFetchTime = now
      }
      if (minutely !== null) {
        cache.minutelyPrecipitation = minutely
        cache.minutelyFetchTime = now
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '刷新天气数据失败'
      error.value = msg
      // 不抛出——使用旧的缓存数据
    }
  }

  /**
   * 从 localStorage 恢复城市列表。
   * Phase 3：恢复后使用 refreshCity（含 7 路并行 + 分端点 TTL）。
   */
  async function initFromStorage(): Promise<void> {
    try {
      const storedOrder = localStorage.getItem(STORAGE_CITY_ORDER)
      const storedMeta = localStorage.getItem(STORAGE_CITIES_META)
      const storedActive = localStorage.getItem(STORAGE_ACTIVE_CITY)

      if (storedOrder && storedMeta) {
        const order: string[] = JSON.parse(storedOrder)
        const metaList: StoredCityEntry[] = JSON.parse(storedMeta)

        // 重建城市缓存（空壳占位）
        for (const meta of metaList) {
          if (!cities.value[meta.id]) {
            cities.value[meta.id] = createEmptyCache(meta)
          }
        }

        cityOrder.value = order.filter((id) => metaList.some((m) => m.id === id))

        // 批量并行刷新所有城市（确保 Tab 显示天气图标和温度）
        const idsToRefresh = cityOrder.value.filter(
          (id) => cities.value[id] && cities.value[id].lastFetchTime === 0
        )

        if (idsToRefresh.length > 0) {
          loading.value = true
          error.value = null
          try {
            await Promise.all(idsToRefresh.map((id) => refreshCity(id)))
          } catch (e: unknown) {
            // refreshCity 内部已 catch，这里仅兜底
          } finally {
            loading.value = false
          }
        }

        // 恢复活跃城市（数据已由批量刷新获取，setActiveCity 中 refreshCity 命中 TTL 跳过）
        if (storedActive && cityOrder.value.includes(storedActive)) {
          activeCityId.value = storedActive
          persistActiveCity()
        } else if (cityOrder.value.length > 0) {
          activeCityId.value = cityOrder.value[0]
          persistActiveCity()
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

  /** 搜索城市（不添加，仅返回结果列表），用于 AddCityDialog */
  async function searchCities(keyword: string): Promise<CitySearchResult[]> {
    return await apiSearchCity(keyword, true)
  }

  // ---- Phase 3 新增 Actions ----

  /** 获取热门城市列表（非关键，失败静默忽略） */
  async function fetchHotCities(): Promise<void> {
    hotCitiesLoading.value = true
    try {
      hotCities.value = await getTopCities()
    } catch {
      // 热门城市非关键，静默忽略
    } finally {
      hotCitiesLoading.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // 内部方法
  // ---------------------------------------------------------------------------

  /** 创建一个空的天气缓存壳（Phase 3：含 lat/lon + 新字段初始值） */
  function createEmptyCache(meta: StoredCityEntry): CityWeatherCache {
    return {
      cityInfo: {
        id: meta.id,
        name: meta.name,
        adm1: meta.adm1,
        adm2: '',
        country: meta.country,
        lat: meta.lat || '',
        lon: meta.lon || '',
      },
      currentWeather: null,
      forecast: [],
      hourlyForecast: [],
      lastFetchTime: 0,
      // Phase 3 新字段：全部初始化为 null（未获取状态）
      warnings: null,
      warningsFetchTime: undefined,
      lifeIndices: null,
      indicesFetchTime: undefined,
      airQuality: null,
      aqiFetchTime: undefined,
      minutelyPrecipitation: null,
      minutelyFetchTime: undefined,
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
    hotCities,
    hotCitiesLoading,
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
    fetchHotCities,
  }
})
