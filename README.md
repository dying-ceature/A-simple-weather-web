# 天气查询应用

基于 **Vue 3 + Vite + ECharts** 的天气查询 SPA，集成和风天气（QWeather）API，提供城市搜索、实时天气、7 天预报、逐时温度趋势与暗色/亮色主题切换。

## 功能概览

| 功能 | 说明 |
|------|------|
| 🔍 城市搜索 | 输入城市名模糊搜索，按 Enter 或点击按钮查询，loading 状态 + 错误提示 |
| 🌡 实时天气 | 当前温度、体感温度、天气描述、图标、湿度、风向风力、气压、能见度、更新时间 |
| 📅 7 天预报 | 每日白天/夜间天气、最高/最低温、风力风向，横向滚动卡片（移动端纵向排列） |
| 📈 温度折线图 | ECharts 绘制 7 天最高温/最低温双线图，图例右上角，暗色/亮色自适应 |
| 🕐 逐时趋势 | 168 小时逐时温度趋势图，默认显示前 24 小时，底部 slider 可滑动查看 7 天 |
| 🌙 主题切换 | 亮色/暗色模式一键切换，localStorage 持久化，卡片/图表/文字全部适配 |
| 📱 响应式 | 移动端自适应布局，图表自动 resize |

## 技术栈

- **Vue 3** — Composition API（`<script setup>`）
- **Vite 6** — 构建工具，`@` 路径别名
- **Axios** — HTTP 请求，`X-QW-Api-Key` Header 认证
- **ECharts 5** — 图表渲染（dataZoom、markLine、暗色/亮色主题自适应）
- **CSS Variables** — 主题系统（`:root` / `[data-theme='dark']`）
- **localStorage** — 主题偏好 + 最近搜索城市持久化

## 项目结构

```
07-weather-app/
├── .env.example              # 环境变量模板
├── .env                      # 本地环境变量（不提交）
├── vite.config.js            # Vite 配置 (@ 别名)
├── index.html                # HTML 入口
└── src/
    ├── main.js               # Vue 应用入口
    ├── App.vue                # 根组件 — 布局编排
    ├── style.css              # 全局样式 + CSS 变量主题
    ├── api/
    │   └── weather.js         # 和风天气 API 封装层
    ├── utils/
    │   └── date.js            # 日期/星期格式化工具
    ├── composables/
    │   ├── useTheme.js        # 主题切换（共享单例）
    │   └── useWeather.js     # 天气数据状态管理（共享单例）
    └── components/
        ├── SearchBar.vue      # 城市搜索输入框
        ├── CurrentWeather.vue # 实时天气卡片
        ├── ForecastList.vue   # 7 天预报列表
        ├── HourlyChart.vue    # 168h 逐时温度趋势图 (dataZoom)
        ├── TemperatureChart.vue # 7 天温度折线图 (最高/最低)
        ├── ThemeToggle.vue    # 暗色/亮色切换按钮
        ├── ErrorMessage.vue   # 错误/提示消息条
        └── LoadingSpinner.vue # 加载动画
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
# 免费用户可删除此行，默认使用 devapi.qweather.com
VITE_QWEATHER_HOST=你的专属Host
```

### 2. 安装 & 启动

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`，首次打开自动查询"北京"天气。

### 3. 构建

```bash
npm run build    # 输出到 dist/
npm run preview  # 预览构建产物
```

## API 接口

所有接口通过 HTTP Header `X-QW-Api-Key` 认证，统一使用同一个 API Host。

| 接口 | 路径 | 说明 |
|------|------|------|
| 城市搜索 | `GET /geo/v2/city/lookup` | 获取城市 locationId |
| 实时天气 | `GET /v7/weather/now` | 当前温湿度风力等 |
| 7 天预报 | `GET /v7/weather/7d` | 每日白天/夜间预报 |
| 逐时预报 | `GET /v7/weather/168h` | 168 小时逐时温度 |

## 数据流

```
SearchBar ──emit search──▶ App.vue ──call──▶ useWeather().searchCity()
                                                  │
                            ┌─────────────────────┤
                            ▼                     ▼
                    api.searchCity()    Promise.all([
                            │              getNowWeather(),
                            ▼              get7dForecast(),
                      cityInfo            getHourlyForecast(),
                            │            ])
                            ▼
                    reactive state ──props──▶ CurrentWeather
                                           ▶ ForecastList
                                           ▶ TemperatureChart
                                           ▶ HourlyChart

ThemeToggle ←── useTheme() ──→ TemperatureChart / HourlyChart (图表配色)
```

## 浏览器支持

支持所有现代浏览器（Chrome、Firefox、Safari、Edge）。
