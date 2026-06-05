import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import App from '@/App.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    // 首页与城市详情共用同一个组件（Tab 布局中，路由参数驱动城市切换）
    component: App,
  },
  {
    path: '/city/:locationId',
    name: 'city',
    component: App,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
