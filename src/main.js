import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './styles/index.scss'

// 懒加载路由
const Waypoints = () => import('./views/Waypoints.vue')
const ServerInfo = () => import('./views/ServerInfo.vue')
const Announcement = () => import('./views/Announcement.vue')
const Converter = () => import('./views/Converter.vue')
const SubmitWaypoint = () => import('./views/SubmitWaypoint.vue')
const About = () => import('./views/About.vue')

const routes = [
  { path: '/', name: 'waypoints', component: Waypoints },
  { path: '/submit', name: 'submit', component: SubmitWaypoint },
  { path: '/server', name: 'server', component: ServerInfo },
  { path: '/announcement', name: 'announcement', component: Announcement },
  { path: '/converter', name: 'converter', component: Converter },
  { path: '/about', name: 'about', component: About }
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
