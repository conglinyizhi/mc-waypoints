import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './styles/index.scss'
import { useHomeView } from './composables/useHomeView.js'

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

const { preference } = useHomeView()

/**
 * 首页视图：localStorage 偏好 + 守卫
 * - 偏好 mobile：访问 / → /m
 * - 偏好 desktop：访问 /m → /
 * 关于页可随时改偏好；详情 /report 不拦截
 */
router.beforeEach((to) => {
  const mode = preference.value
  if (mode === 'mobile' && to.name === 'waypoints') {
    return { name: 'waypoints-mobile', replace: true }
  }
  if (mode === 'desktop' && to.name === 'waypoints-mobile') {
    return { name: 'waypoints', replace: true }
  }
  return true
})

const app = createApp(App)
app.use(router)
app.mount('#app')
