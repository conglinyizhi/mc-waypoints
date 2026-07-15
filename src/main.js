import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './styles/index.scss'

// 懒加载路由
const Waypoints = () => import('./views/Waypoints.vue')
const WaypointsMobile = () => import('./views/WaypointsMobile.vue')
const Contribute = () => import('./views/Contribute.vue')
const Tools = () => import('./views/Tools.vue')
const About = () => import('./views/About.vue')

const routes = [
  { path: '/', name: 'waypoints', component: Waypoints },
  { path: '/m', name: 'waypoints-mobile', component: WaypointsMobile },
  { path: '/contribute', name: 'contribute', component: Contribute },
  { path: '/tools', name: 'tools', component: Tools },
  { path: '/about', name: 'about', component: About },
  // 旧路径兼容 → 合并页 + tab
  { path: '/submit', redirect: { name: 'contribute', query: { tab: 'submit' } } },
  { path: '/server', redirect: { name: 'contribute', query: { tab: 'todo' } } },
  { path: '/announcement', redirect: { name: 'tools', query: { tab: 'announcement' } } },
  { path: '/converter', redirect: { name: 'tools', query: { tab: 'converter' } } },
  { path: '/report', name: 'report', component: () => import('./views/ReportWaypoint.vue') }
]

// dev 管理页面仅在开发模式下注册
if (import.meta.env.DEV) {
  const Manage = () => import('./views/ManagePage.vue')
  routes.push({ path: '/manage', name: 'manage', component: Manage })
}

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
