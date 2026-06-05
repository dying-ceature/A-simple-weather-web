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
  /** 上次拉取数据的时间戳 (Date.now()) */
  lastFetchTime: number
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
