// =============================================================================
// 城市地理信息（来自 /geo/v2/city/lookup）
// =============================================================================

export interface CityInfo {
  /** 城市 LocationID（9 位数字） */
  id: string
  /** 城市名称（中文） */
  name: string
  /** 所属省份 */
  adm1: string
  /** 所属市/区 */
  adm2: string
  /** 所属国家 */
  country: string
  /** 纬度 */
  lat: string
  /** 经度 */
  lon: string
}

// =============================================================================
// 实时天气（来自 /v7/weather/now）
// =============================================================================

export interface CurrentWeather {
  /** 当前温度 (°C) */
  temp: string
  /** 体感温度 (°C) */
  feelsLike: string
  /** 天气状况文字，如"晴"、"多云" */
  text: string
  /** 天气图标代码，如 "100" */
  icon: string
  /** 风向，如"西北风" */
  windDir: string
  /** 风力等级 */
  windScale: string
  /** 相对湿度 (%) */
  humidity: string
  /** 大气压 (hPa) */
  pressure: string
  /** 能见度 (km) */
  vis: string
  /** 数据更新时间 (ISO8601) */
  updateTime: string
}

// =============================================================================
// 逐天预报（来自 /v7/weather/7d）
// =============================================================================

export interface DailyForecast {
  /** 预报日期 yyyy-MM-dd */
  fxDate: string
  /** 最高温度 (°C) */
  tempMax: string
  /** 最低温度 (°C) */
  tempMin: string
  /** 白天天气文字 */
  textDay: string
  /** 夜间天气文字 */
  textNight: string
  /** 白天天气图标代码 */
  iconDay: string
  /** 夜间天气图标代码 */
  iconNight: string
  /** 白天风向 */
  windDirDay: string
  /** 白天风力等级 */
  windScaleDay: string
  /** 夜间风向 */
  windDirNight: string
  /** 夜间风力等级 */
  windScaleNight: string
  /** 日出时间 HH:mm (Phase 3) */
  sunrise: string
  /** 日落时间 HH:mm (Phase 3) */
  sunset: string
}

// =============================================================================
// 逐时预报（来自 /v7/weather/168h）
// =============================================================================

export interface HourlyForecast {
  /** 预报时间 (ISO8601) */
  fxTime: string
  /** 温度 (°C) */
  temp: string
  /** 天气文字 */
  text: string
  /** 天气图标代码 */
  icon: string
  /** 风向 */
  windDir: string
  /** 风力等级 */
  windScale: string
}

// =============================================================================
// 单城市完整天气缓存
// =============================================================================

export interface CityWeatherCache {
  /** 城市地理信息 */
  cityInfo: CityInfo
  /** 实时天气 */
  currentWeather: CurrentWeather | null
  /** 7 天逐日预报 */
  forecast: DailyForecast[]
  /** 168 小时逐时预报 */
  hourlyForecast: HourlyForecast[]
  /** 上次拉取基础天气数据的时间戳 (Date.now()) — 30min TTL */
  lastFetchTime: number

  // ---- Phase 3 新增 ----
  /** 生活指数列表（60min TTL） */
  lifeIndices?: LifeIndex[] | null
  /** 生活指数拉取时间戳 */
  indicesFetchTime?: number
  /** 空气质量数据（15min TTL） */
  airQuality?: AirQualityData | null
  /** 空气质量拉取时间戳 */
  aqiFetchTime?: number
  /** 分钟级降水数据（10min TTL） */
  minutelyPrecipitation?: MinutelyPrecipitation | null
  /** 降水数据拉取时间戳 */
  minutelyFetchTime?: number
}

// =============================================================================
// 持久化到 localStorage 的城市条目（仅元信息，不含天气数据）
// =============================================================================

export interface StoredCityEntry {
  /** 城市 LocationID */
  id: string
  /** 城市名称 */
  name: string
  /** 所属省份 */
  adm1: string
  /** 所属国家 */
  country: string
  /** 纬度 (Phase 3 — 用于 AQI/降水 API) */
  lat: string
  /** 经度 (Phase 3 — 用于 AQI/降水 API) */
  lon: string
}

// =============================================================================
// 城市搜索结果（来自 /geo/v2/city/lookup 多结果场景）
// =============================================================================

export interface CitySearchResult {
  id: string
  name: string
  adm1: string
  adm2: string
  country: string
  lat: string
  lon: string
}

// =============================================================================
// 生活指数（来自 /v7/indices/1d）
// =============================================================================

export interface LifeIndex {
  date: string
  type: string
  name: string
  level: string
  category: string
  text: string
}

// =============================================================================
// 空气质量（来自 /airquality/v1/current/{lat}/{lon}）
// =============================================================================

export interface AirQualityIndex {
  code: string
  aqi: string
  level: string
  category: string
  color: { red: number; green: number; blue: number; alpha: number }
  primaryPollutant: string | null
  health: { effect: string; advice: string }
}

export interface AirPollutant {
  code: string
  name: string
  fullName: string
  concentration: string
  unit: string
}

export interface AirQualityData {
  indexes: AirQualityIndex[]
  pollutants: AirPollutant[]
  stations: { name: string; id: string }[]
  updateTime: string
}

// =============================================================================
// 分钟级降水（来自 /v7/minutely/5m）
// =============================================================================

export interface MinutelyItem {
  fxTime: string
  precip: string
  type: string
}

export interface MinutelyPrecipitation {
  summary: string
  minutely: MinutelyItem[]
}

// =============================================================================
// 热门城市（来自 /geo/v2/city/top）
// =============================================================================

export interface TopCity {
  name: string
  id: string
  adm1: string
  adm2?: string
  country?: string
  lat: string
  lon: string
}
