## 说明

1. 重点在于前端开发框架的应用，一般建议使用 VUE，如对相似技术，如 React, Angular 等有特别兴趣也可以。页面要做到响应式布局，支持 PC+移动端。
2. 后端可以选用公共 API 服务（如天气预报，新闻等），也可以自建 Node 服务。
3. 前后端接口必须规范，建议符合 RESTful API 接口规范。

---

# 1. 天气查询与城市管理应用

## 前端技术要求

- 使用 Vue 3 Composition API
- 状态管理：Pinia
- 路由：Vue Router（支持城市详情页）
- UI 组件库可选（Element Plus / Vant / Naive UI）
- 支持响应式布局（PC+移动端）

## 功能要求

- 支持搜索城市天气（接入免费天气 API，如 OpenWeatherMap 或和风天气）
- 展示当前天气、未来 5 天预报、湿度/风速等指标
- 用户可添加/删除“我的城市”列表（保存到 localStorage 或后端）
- 城市列表支持拖拽排序
- 点击城市进入详情页，展示更详细的天气趋势图表（可用 ECharts）

## API 要求

- 公共天气 API（需处理跨域或通过代理）
- 若自建 Node 服务：提供 `/api/cities`（GET/POST/DELETE）和缓存天气数据

## 加分项

- 增加主题切换（深色/浅色模式）
- 错误处理（城市不存在、API 限流提示）
- 使用 TypeScript