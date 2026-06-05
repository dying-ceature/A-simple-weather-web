# 🌤 天气查询应用

基于 **Vue 3 + TypeScript + Pinia + Vue Router + Element Plus + ECharts** 的天气查询 SPA，集成[和风天气（QWeather）](https://dev.qweather.com/) API，提供多城市管理、实时天气、7 天预报、逐时温度趋势、AQI 空气质量、生活指数、分钟级降水预报、天气预警与暗色/亮色主题切换。

## 功能概览

| 功能 | 说明 |
| ---- | ---- |
| 🏙️ **多城市管理** | 搜索添加城市，Tab 标签切换，HTML5 拖拽排序，右键删除，localStorage 持久化 |
| 🌡 **实时天气** | 当前温度、体感温度、天气描述、图标、湿度、风向风力、气压、能见度、数据更新时间 |
| 📅 **7 天预报** | 每日白天/夜间天气、最高/最低温、风力风向、日出日落时间，横向滚动卡片 |
| 🕐 **168h 逐时趋势** | 7 天逐时温度折线图，ECharts dataZoom 滑块滑动缩放，支持鼠标滚轮平移 |
| 📈 **温度趋势图** | 7 天最高温/最低温双线面积图，带图例和极值标记点，暗色/亮色自适应 |
| 🌧 **分钟级降水** | 未来 2 小时每 5 分钟降水量柱状图，仅在有实际降水时显示，区分雨/雪配色 |
| 🫁 **空气质量** | AQI 圆环指示器（带国标 6 级颜色），首要污染物、健康影响与建议、6 项污染物浓度网格 |
| 🏃 **生活指数** | 8 项常用生活指数（舒适度/穿衣/洗车/感冒/运动/旅游/紫外线/空气污染扩散），emoji 图标 + 等级着色 |
| ⚠️ **天气预警** | 顶部醒目横幅展示，按白/蓝/黄/橙/红五级着色左边框，含标题、描述、防范指引和有效时段 |
| 🌙 **主题切换** | 一键切换暗色/亮色模式，localStorage 持久化，CSS 变量 + Element Plus 变量全部适配 |
| 📱 **响应式布局** | 移动端自适应，图表自动 resize，卡片网格重排 |
| 🔄 **智能缓存** | 分端点独立 TTL（base 30min / 预警 15min / 指数 60min / AQI 15min / 降水 10min），条件刷新避免重复请求 |
| 🧪 **单元测试** | Vitest + Vue Test Utils 覆盖 Store、API 层、组件和工具函数 |

## 技术栈

| 技术 | 版本 | 用途 |
| ---- | ---- | ---- |
| [Vue 3](https://vuejs.org/) | ^3.5 | Composition API（`<script setup lang="ts">`） |
| [TypeScript](https://www.typescriptlang.org/) | ^6.0 | 全量类型定义，严格模式 |
| [Vite](https://vitejs.dev/) | ^6.0 | 构建工具，`@` 路径别名，Vitest 集成 |
| [Pinia](https://pinia.vuejs.org/) | ^3.0 | 全局状态管理（weather + theme 双 Store） |
| [Vue Router](https://router.vuejs.org/) | ^4.6 | 城市路由（`/city/:locationId`），路由 ↔ Store 双向同步 |
| [Element Plus](https://element-plus.org/) | ^2.14 | UI 组件库（el-card, el-tag, el-dialog, el-scrollbar, el-skeleton, el-alert 等） |
| [ECharts](https://echarts.apache.org/) | ^5.5 | 图表渲染（dataZoom、tooltip、areaStyle、暗色/亮色自适应） |
| [Axios](https://axios-http.com/) | ^1.7 | HTTP 请求，`X-QW-Api-Key` Header 认证，10s 超时 |
| [Vitest](https://vitest.dev/) | ^4.1 | 单元测试框架，jsdom 环境 |

## 项目结构

```text
07-weather-app/
├── .env.example                  # 环境变量模板
├── .env                          # 本地环境变量（不提交）
├── vite.config.ts                # Vite 配置（@ 别名 + Vitest）
├── tsconfig.json                 # TypeScript 配置
├── index.html                    # HTML 入口
├── package.json
└── src/
    ├── main.ts                   # Vue 应用入口（Pinia + Router + Element Plus）
    ├── App.vue                   # 根组件 — 布局编排，路由同步
    ├── style.css                 # 全局样式 + CSS 变量亮/暗主题 + Element Plus 变量映射
    ├── api/
    │   └── weather.ts            # 和风天气 API 封装层（8 个端点 + isOk/isOkOrEmpty 兼容 v1/v2）
    ├── types/
    │   ├── weather.ts            # 全部 TypeScript 接口（13 个类型）
    │   └── global.d.ts           # 全局类型声明
    ├── stores/
    │   ├── weather.ts            # 天气 Pinia Store（多城市缓存、分端点 TTL、7 路并行、localStorage 持久化）
    │   └── theme.ts              # 主题 Pinia Store（亮/暗切换、localStorage 持久化、DOM 同步）
    ├── router/
    │   └── index.ts              # Vue Router 路由配置（/ + /city/:locationId）
    ├── composables/
    │   └── useECharts.ts         # ECharts 共享逻辑（实例管理、ResizeObserver、主题自适应）
    ├── utils/
    │   ├── date.ts               # 日期/时间/星期格式化工具（6 个纯函数）
    │   └── __tests__/
    │       └── date.test.ts      # 日期工具单元测试
    └── components/
        ├── CityTabs.vue          # 城市 Tab 标签栏（拖拽排序 + 右键删除 + 天气图标/温度显示）
        ├── AddCityDialog.vue     # 城市搜索与添加弹窗（搜索 + 热门城市快捷标签）
        ├── WarningBanner.vue     # 天气预警横幅（五级着色左边框、堆叠展示）
        ├── CurrentWeather.vue    # 实时天气卡片（大号温度 + 6 项指标网格）
        ├── MinutelyRainChart.vue # 分钟级降水柱状图（仅在有雨雪时显示）
        ├── HourlyChart.vue       # 168h 逐时温度趋势图（dataZoom 滑块 + 内置平移）
        ├── ForecastList.vue      # 7 天预报列表（横向滚动卡片、含日出日落）
        ├── LifeIndices.vue       # 生活指数横向滚动卡片（8 项、emoji 图标 + 等级着色）
        ├── AirQualityCard.vue    # 空气质量卡片（AQI 圆环 + 健康建议 + 污染物浓度）
        ├── TemperatureChart.vue  # 7 天温度趋势图（最高/最低双线面积图 + 极值标记）
        ├── ThemeToggle.vue       # 主题切换按钮（太阳/月亮 SVG 图标）
        ├── EmptyState.vue        # 空状态引导（SVG 天气插图 + 添加城市按钮）
        └── __tests__/
            └── EmptyState.test.ts # EmptyState 组件单元测试
```

## 快速开始

### 1. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 和风天气 API Key（在 https://console.qweather.com/ 获取）
VITE_QWEATHER_KEY=你的真实Key

# API Host（在控制台-设置中查看）
# 免费/测试用户可保留默认值
VITE_QWEATHER_HOST=devapi.qweather.com
```

### 2. 安装 & 启动

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`，首次打开自动添加"北京"天气。

### 3. 构建 & 预览

```bash
npm run build    # 输出到 dist/
npm run preview  # 预览构建产物
```

### 4. 运行测试

```bash
npm run test          # 运行全部测试
npm run test:watch    # 监听模式
```

## API 接口

所有接口通过 HTTP Header `X-QW-Api-Key` 认证，统一使用同一个 API Host。v2 API Host 的响应不包含 `code` 字段（HTTP 2xx 即为成功），代码通过 `isOkOrEmpty()` 兼容 v1/v2 两种格式。

| 接口 | 路径 | 参数 | 说明 |
| ---- | ---- | ---- | ---- |
| 城市搜索 | `GET /geo/v2/city/lookup` | `location`, `number` | 根据城市名模糊搜索，返回 locationId + 经纬度 |
| 热门城市 | `GET /geo/v2/city/top` | `range`, `number` | 获取中国热门城市列表 |
| 实时天气 | `GET /v7/weather/now` | `location` | 当前温度、体感温度、风力、湿度、气压、能见度 |
| 7 天预报 | `GET /v7/weather/7d` | `location` | 每日白天/夜间天气、最高/最低温、风力风向、日出日落 |
| 168h 逐时 | `GET /v7/weather/168h` | `location` | 7 天共 168 小时逐时温度、天气文字和图标 |
| 天气预警 | `GET /weatheralert/v1/current/{lat}/{lon}` | 路径参数 | 当前经纬度的气象预警（白/蓝/黄/橙/红五级） |
| 生活指数 | `GET /v7/indices/1d` | `location`, `type=0` | 全部 8 项生活指数（舒适度/穿衣/洗车/感冒等） |
| 空气质量 | `GET /airquality/v1/current/{lat}/{lon}` | 路径参数 | 实时 AQI、污染物浓度、监测站信息 |
| 分钟级降水 | `GET /v7/minutely/5m` | `location` | 未来 2 小时每 5 分钟降水预报（仅中国城市） |

## 架构与数据流

### 整体架构

```text
┌─────────────────────────────────────────────────────────┐
│  main.ts                                                 │
│  ├─ createPinia()        → weather + theme 双 Store       │
│  ├─ createRouter()       → /  + /city/:locationId         │
│  ├─ ElementPlus + Icons  → 全局 UI 组件                   │
│  └─ style.css            → CSS 变量亮/暗主题系统            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  App.vue (根组件)                                        │
│  ├─ onMounted: initTheme() + initFromStorage() +          │
│  │             fetchHotCities()                           │
│  ├─ watch(route.params) ↔ watch(activeCityId)             │
│  │   → 路由与 Store 双向同步                               │
│  └─ 条件渲染:                                              │
│      ├─ CityTabs (城市 > 0)                               │
│      ├─ el-skeleton (loading)                             │
│      ├─ el-alert (error)                                  │
│      ├─ 8 个天气组件 (有数据)                               │
│      └─ EmptyState (城市 = 0 且非加载中)                    │
└─────────────────────────────────────────────────────────┘
```

### 组件树与数据传递

```text
App.vue
├─ CityTabs          ← orderedCityList (含 currentWeather 图标+温度)
├─ WarningBanner     ← activeCity.warnings
├─ CurrentWeather    ← activeCity.cityInfo + currentWeather
├─ MinutelyRainChart ← activeCity.minutelyPrecipitation (v-if 有降水)
├─ HourlyChart       ← activeCity.hourlyForecast
├─ ForecastList      ← activeCity.forecast (含 sunrise/sunset)
├─ LifeIndices       ← activeCity.lifeIndices
├─ AirQualityCard    ← activeCity.airQuality
├─ TemperatureChart  ← activeCity.forecast (v-if 有数据)
├─ EmptyState        ← cityCount === 0
├─ AddCityDialog     ← v-model:visible + hotCities
└─ ThemeToggle       ← useThemeStore()
```

### 核心数据流：添加城市

```text
用户输入城市名
  → AddCityDialog.selectCity()
    → weatherStore.addCity(name)
      → apiSearchCity(name)           // 1. 搜索城市获取 locationId
      → Promise.all([                 // 2. 7 路并行获取
          getNowWeather(id),          //    核心 — throw on fail
          get7dForecast(id),          //    核心 — throw on fail
          getHourlyForecast(id),      //    核心 — throw on fail
          safeFetch(getWeatherWarnings(lat,lon)),   // 可选 — 静默忽略
          safeFetch(getLifeIndices(id)),             // 可选
          safeFetch(getAirQuality(lat,lon)),         // 可选
          safeFetch(getMinutelyPrecipitation(lon,lat)), // 可选
        ])
      → cities[id] = { ...all data, fetchTime }   // 3. 存入缓存
      → cityOrder.push(id)                          // 4. 加入有序列表
      → persistCityList() + persistActiveCity()    // 5. localStorage 持久化
```

### 核心数据流：切换城市

```text
用户点击 Tab
  → App.vue: weatherStore.setActiveCity(id)
    → activeCityId = id
    → persistActiveCity()
    → refreshCity(id)
      → 检查 5 个端点各自 TTL 是否过期
      → Promise.all([               // 仅获取过期端点
          baseExpired ? [now, 7d, 168h] : null,
          warningsExpired ? safeFetch(getWeatherWarnings) : null,
          indicesExpired ? safeFetch(getLifeIndices) : null,
          aqiExpired ? safeFetch(getAirQuality) : null,
          minutelyExpired ? safeFetch(getMinutelyPrecipitation) : null,
        ])
      → 更新缓存中对应字段（未过期数据保持不变）
  → 所有组件通过 activeCity getter 自动响应式更新
```

### 分端点 TTL 策略

| 端点 | TTL | 理由 |
| ---- | --- | ---- |
| 实时 + 7d + 168h | 30 分钟 | 基础数据，更新频率适中 |
| 天气预警 | 15 分钟 | 预警具有时效性，需及时更新 |
| 空气质量 | 15 分钟 | 空气质量变化较慢，但用户关注度高 |
| 分钟级降水 | 10 分钟 | 降水数据更新频繁，短 TTL 保证准确性 |
| 生活指数 | 60 分钟 | 指数按天计算，变化极慢 |

## 主题系统

基于 CSS 变量（`:root` / `[data-theme='dark']`）实现，通过 `data-theme` 属性在 `<html>` 上切换。Element Plus 组件通过映射 CSS 变量（`--el-bg-color`、`--el-text-color-primary` 等）同步主题。

```text
useThemeStore()
  ├─ toggleTheme() → theme = 'light' ↔ 'dark'
  ├─ persistTheme() → localStorage.setItem('weather-theme')
  └─ syncDOMTheme() → document.documentElement.setAttribute('data-theme', theme)
```

所有 ECharts 图表通过 `theme === 'dark'` 计算属性动态切换配色方案（`textColor`、`axisColor`、`splitColor` 等）。

## 浏览器支持

支持所有现代浏览器（Chrome、Firefox、Safari、Edge）。
