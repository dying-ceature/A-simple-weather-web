/**
 * @file src/api/weather.ts
 * @description 和风天气（QWeather）API 封装层
 *
 * 接口文档：https://dev.qweather.com/docs/api/
 * 身份认证：API KEY（HTTP Header X-QW-Api-Key）
 *
 * 使用前请在项目根目录 .env 文件中设置：
 *   VITE_QWEATHER_KEY=你的和风天气API密钥
 *   VITE_QWEATHER_HOST=你的API Host（在控制台-设置中查看，默认 devapi.qweather.com）
 *
 * API 端点路径（统一使用同一个 Host）：
 *   城市搜索： /geo/v2/city/lookup
 *   实时天气： /v7/weather/now
 *   7 天预报： /v7/weather/7d
 *   168h 逐时：/v7/weather/168h
 */

import axios from 'axios'
import type {
  CityInfo, CurrentWeather, DailyForecast, HourlyForecast, CitySearchResult,
  LifeIndex, AirQualityData, MinutelyPrecipitation, TopCity,
} from '@/types/weather'

// =============================================================================
// 配置
// =============================================================================

/** 和风天气 API Key */
const API_KEY: string = import.meta.env.VITE_QWEATHER_KEY

/**
 * API Host — 所有服务（Geo + Weather）共用同一个 Host。
 * 付费用户请在控制台-设置中查看你的专属 Host。
 */
const API_HOST: string = import.meta.env.VITE_QWEATHER_HOST || 'devapi.qweather.com'

const BASE_URL = `https://${API_HOST}`

// =============================================================================
// Axios 实例
// =============================================================================

/** 统一的 Axios 实例，所有 API 共用同一个 Host + 认证头 */
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'X-QW-Api-Key': API_KEY },
})

// =============================================================================
// 内部工具
// =============================================================================

interface ApiResponse {
  code: string
  location?: unknown[]
  now?: Record<string, string>
  daily?: Record<string, string>[]
  hourly?: Record<string, string>[]
  updateTime?: string
}

/** 判断和风天气响应是否成功 */
function isOk(responseData: ApiResponse): boolean {
  return responseData && responseData.code === '200'
}

/** 判断和风天气响应是否成功或为空（204 = 无数据但非错误，v2 格式无 code 字段 = 成功） */
function isOkOrEmpty(responseData: ApiResponse): boolean {
  if (!responseData) return false
  // v2 API Host 在成功时不返回 code 字段（HTTP 2xx 已由 axios 验证）
  if (responseData.code === undefined) return true
  return responseData.code === '200' || responseData.code === '204'
}

/** 错误码 → 中文消息 */
function apiErrorMessage(code: string): string {
  const map: Record<string, string> = {
    '204': '请求成功，但该地区没有你需要的数据',
    '400': '请求错误 — 可能缺少必要参数',
    '401': 'API Key 错误或未激活',
    '402': '超过每日访问量限制',
    '403': '无权限访问该资源',
    '404': '请求的资源不存在',
    '429': '超过每分钟访问量限制',
    '500': '服务器内部错误',
  }
  return map[code] || `API 请求失败 (错误码: ${code})`
}

// =============================================================================
// 公开 API
// =============================================================================

/**
 * 根据城市名称搜索城市信息（获取 locationId）。
 * 接口：/geo/v2/city/lookup
 *
 * @param keyword - 城市名称，例如 "北京"、"上海"
 * @param returnAll - 是否返回全部搜索结果（默认 false，仅返回第一个）
 * @returns 城市信息（单个或数组）
 * @throws {Error} 当城市不存在或 API 请求失败时抛出
 */
export async function searchCity(keyword: string, returnAll?: false): Promise<CityInfo>
export async function searchCity(keyword: string, returnAll: true): Promise<CitySearchResult[]>
export async function searchCity(
  keyword: string,
  returnAll = false
): Promise<CityInfo | CitySearchResult[]> {
  if (!keyword || !keyword.trim()) {
    throw new Error('请输入城市名称')
  }

  const { data } = await client.get<ApiResponse>('/geo/v2/city/lookup', {
    params: {
      location: keyword.trim(),
      number: 10,
    },
  })

  if (!isOk(data)) {
    throw new Error(apiErrorMessage(data.code))
  }

  const locations = (data.location || []) as Record<string, string>[]
  if (locations.length === 0) {
    throw new Error(`未找到城市 "${keyword}"，请检查城市名称是否正确`)
  }

  if (returnAll) {
    return locations.map((city) => ({
      id: city.id || '',
      name: city.name || '',
      adm1: city.adm1 || '',
      adm2: city.adm2 || '',
      country: city.country || '',
      lat: city.lat || '',
      lon: city.lon || '',
    })) as CitySearchResult[]
  }

  const city = locations[0]
  return {
    id: city.id || '',
    name: city.name || '',
    adm1: city.adm1 || '',
    adm2: city.adm2 || '',
    country: city.country || '',
    lat: city.lat || '',
    lon: city.lon || '',
  } as CityInfo
}

/**
 * 获取指定城市的实时天气。
 * 接口：/v7/weather/now
 *
 * @param locationId - 城市 locationId（来自 searchCity）
 */
export async function getNowWeather(locationId: string): Promise<CurrentWeather> {
  const { data } = await client.get<ApiResponse>('/v7/weather/now', {
    params: { location: locationId },
  })

  if (!isOk(data)) {
    throw new Error(apiErrorMessage(data.code))
  }

  const now = data.now || {}
  return {
    temp: now.temp ?? '--',
    feelsLike: now.feelsLike ?? '--',
    text: now.text ?? '--',
    icon: now.icon ?? '100',
    windDir: now.windDir ?? '--',
    windScale: now.windScale ?? '--',
    humidity: now.humidity ?? '--',
    pressure: now.pressure ?? '--',
    vis: now.vis ?? '--',
    updateTime: data.updateTime || '',
  }
}

/**
 * 获取指定城市未来 7 天天气预报。
 * 接口：/v7/weather/7d
 *
 * @param locationId - 城市 locationId
 */
export async function get7dForecast(locationId: string): Promise<DailyForecast[]> {
  const { data } = await client.get<ApiResponse>('/v7/weather/7d', {
    params: { location: locationId },
  })

  if (!isOk(data)) {
    throw new Error(apiErrorMessage(data.code))
  }

  const daily = data.daily || []
  return daily.map((d: Record<string, string>) => ({
    fxDate: d.fxDate || '',
    tempMax: d.tempMax ?? '--',
    tempMin: d.tempMin ?? '--',
    textDay: d.textDay ?? '--',
    textNight: d.textNight ?? '--',
    iconDay: d.iconDay ?? '100',
    iconNight: d.iconNight ?? '150',
    windDirDay: d.windDirDay ?? '--',
    windScaleDay: d.windScaleDay ?? '--',
    windDirNight: d.windDirNight ?? '--',
    windScaleNight: d.windScaleNight ?? '--',
    sunrise: d.sunrise || '',
    sunset: d.sunset || '',
  })) as DailyForecast[]
}

/**
 * 获取指定城市逐小时天气预报（168 小时）。
 * 接口：/v7/weather/168h
 *
 * @param locationId - 城市 locationId
 */
export async function getHourlyForecast(locationId: string): Promise<HourlyForecast[]> {
  const { data } = await client.get<ApiResponse>('/v7/weather/168h', {
    params: { location: locationId },
  })

  if (!isOk(data)) {
    throw new Error(apiErrorMessage(data.code))
  }

  const hourly = data.hourly || []
  return hourly.map((h: Record<string, string>) => ({
    fxTime: h.fxTime || '',
    temp: h.temp ?? '--',
    text: h.text ?? '--',
    icon: h.icon ?? '100',
    windDir: h.windDir ?? '--',
    windScale: h.windScale ?? '--',
  })) as HourlyForecast[]
}

/**
 * 获取指定城市的生活指数。
 * 接口：/v7/indices/1d
 *
 * type=0 获取全部可用指数（不可与其他 type 混合）。
 * QWeather 指数类型对照：
 *   1-运动  2-洗车  3-穿衣  4-钓鱼  5-紫外线  6-旅游  8-舒适度  9-感冒  10-空气污染扩散
 *
 * @param locationId - 城市 locationId
 * @returns 生活指数列表
 */
export async function getLifeIndices(locationId: string): Promise<LifeIndex[]> {
  const { data } = await client.get<ApiResponse>('/v7/indices/1d', {
    params: { location: locationId, type: '0' },
  })

  if (!isOkOrEmpty(data)) throw new Error(apiErrorMessage(data.code))
  if (data.code === '204') return []

  const daily = (data as unknown as Record<string, unknown>).daily as Record<string, string>[] || []
  return daily.map((d) => ({
    date: d.date || '',
    type: d.type || '',
    name: d.name || '',
    level: d.level || '',
    category: d.category || '',
    text: d.text || '',
  }))
}

/**
 * 获取指定经纬度的实时空气质量。
 * 接口：/airquality/v1/current/{lat}/{lon}
 *
 * @param lat - 纬度
 * @param lon - 经度
 * @returns 空气质量数据，无数据时返回 null
 */
export async function getAirQuality(lat: string, lon: string): Promise<AirQualityData | null> {
  const { data } = await client.get<Record<string, unknown>>(
    `/airquality/v1/current/${lat}/${lon}`
  )

  if (!isOkOrEmpty(data as unknown as ApiResponse)) {
    throw new Error(apiErrorMessage((data as unknown as ApiResponse).code))
  }
  if ((data as unknown as ApiResponse).code === '204') return null

  const aqi = data
  return {
    indexes: ((aqi.indexes || []) as Record<string, unknown>[]).map((idx) => ({
      code: (idx.code as string) || '',
      aqi: (idx.aqiDisplay as string) || (idx.aqi != null ? String(idx.aqi) : ''),
      level: (idx.level as string) || '',
      category: (idx.category as string) || '',
      color: (idx.color as { red: number; green: number; blue: number; alpha: number }) || { red: 0, green: 0, blue: 0, alpha: 1 },
      primaryPollutant: ((idx.primaryPollutant as Record<string, string>)?.name) || null,
      health: {
        effect: ((idx.health as Record<string, string>)?.effect) || '',
        advice: ((idx.health as Record<string, unknown>)?.advice as Record<string, string>)?.generalPopulation || '',
      },
    })),
    pollutants: ((aqi.pollutants || []) as Record<string, unknown>[]).map((p) => {
      const conc = (p.concentration as Record<string, unknown>) || {}
      return {
        code: (p.code as string) || '',
        name: (p.name as string) || '',
        fullName: (p.fullName as string) || '',
        concentration: conc.value != null ? String(conc.value) : '',
        unit: (conc.unit as string) || '',
      }
    }),
    stations: ((aqi.stations || []) as Record<string, string>[]).map((s) => ({
      name: s.name || '',
      id: s.id || '',
    })),
    updateTime: (aqi.updateTime as string) || '',
  }
}

/**
 * 获取指定经纬度的分钟级降水预报（未来 2 小时，每 5 分钟）。
 * 接口：/v7/minutely/5m
 * ⚠️ 仅支持中国城市。
 *
 * @param lon - 经度
 * @param lat - 纬度
 * @returns 分钟级降水数据，无数据时返回 null
 */
export async function getMinutelyPrecipitation(
  lon: string,
  lat: string
): Promise<MinutelyPrecipitation | null> {
  const { data } = await client.get<Record<string, unknown>>('/v7/minutely/5m', {
    params: { location: `${lon},${lat}` },
  })

  if (!isOkOrEmpty(data as unknown as ApiResponse)) {
    throw new Error(apiErrorMessage((data as unknown as ApiResponse).code))
  }
  if ((data as unknown as ApiResponse).code === '204') return null

  return {
    summary: (data.summary as string) || '',
    minutely: ((data.minutely || []) as Record<string, string>[]).map((item) => ({
      fxTime: item.fxTime || '',
      precip: item.precip || '0',
      type: item.type || 'rain',
    })),
  }
}

/**
 * 获取中国热门城市列表。
 * 接口：/geo/v2/city/top
 *
 * @returns 热门城市列表
 */
export async function getTopCities(): Promise<TopCity[]> {
  const { data } = await client.get<ApiResponse>('/geo/v2/city/top', {
    params: { range: 'cn', number: 10 },
  })

  if (!isOk(data)) throw new Error(apiErrorMessage(data.code))

  const topCityList = (data as unknown as Record<string, unknown>).topCityList as Record<string, string>[] || []
  return topCityList.map((c) => ({
    name: c.name || '',
    id: c.id || '',
    adm1: c.adm1 || '',
    adm2: c.adm2 || '',
    country: c.country || '',
    lat: c.lat || '',
    lon: c.lon || '',
  }))
}

/**
 * 获取天气图标 CDN 地址。
 * @param iconCode - 图标代码，如 "100"、"305"
 * @returns 完整的图标 URL
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://icons.qweather.com/assets/icons/${iconCode}.svg`
}
