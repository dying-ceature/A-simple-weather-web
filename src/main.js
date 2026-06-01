/**
 * @file src/main.js
 * @description Vue 应用入口 — 挂载 App 并加载全局样式
 */
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.mount('#app')
