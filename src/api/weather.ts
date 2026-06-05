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
import type { CityInfo, CurrentWeather, DailyForecast, HourlyForecast, CitySearchResult } from '@/types/weather'

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
 * 获取天气图标 CDN 地址。
 * @param iconCode - 图标代码，如 "100"、"305"
 * @returns 完整的图标 URL
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://icons.qweather.com/assets/icons/${iconCode}.svg`
}
