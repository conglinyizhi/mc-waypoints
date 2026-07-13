<template>
  <div class="app-shell">
    <header class="app-header">
      <h1 class="app-title">⛏ Minecraft 坐标簿</h1>
      <nav data-name="app-nav" class="app-nav">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          data-name="nav-tab"
          class="nav-tab"
          active-class="nav-tab--active"
        >
          {{ tab.label }}
        </router-link>
      </nav>
    </header>

    <main class="app-main">
      <!-- 加载中 -->
      <div v-if="loading" data-name="loading-state" class="state-box">
        <p>⏳ 正在加载数据…</p>
      </div>

      <!-- 全局错误 -->
      <div v-else-if="error" data-name="error-state" class="state-box state-error">
        <p>⚠️ 加载失败，请刷新重试</p>
        <button @click="reload" data-name="error-reload-btn">🔄 重新加载</button>
      </div>

      <!-- 正常渲染 -->
      <router-view v-else />
    </main>
  </div>
</template>

<script setup>
import { provide } from 'vue'
import { useDataFetch } from './composables/useDataFetch.js'

const tabs = [
  { to: '/', label: '🗺️ 坐标点' },
  { to: '/submit', label: '➕ 提交' },
  { to: '/server', label: '⚙️ 服务器' },
  { to: '/announcement', label: '📢 公告' },
  { to: '/converter', label: '🔢 下界换算' }
]

const { waypoints, config, loading, error, reload } = useDataFetch()

provide('waypoints', waypoints)
provide('config', config)
provide('loading', loading)
provide('error', error)
provide('reload', reload)
</script>

<style>
/* ===== 全局重置 ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 15px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
body { background: #1a1a2e; color: #e0e0e0; min-height: 100vh; }
a { color: inherit; text-decoration: none; }

/* ===== Shell 布局 ===== */
.app-shell { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.app-header { padding: 1rem 0; border-bottom: 2px solid #2a2a4a; }
.app-title { font-size: 1.4rem; color: #fff; margin-bottom: 0.6rem; }

/* ===== 导航 ===== */
.app-nav { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.nav-tab {
  padding: 0.4rem 0.9rem;
  border-radius: 6px 6px 0 0;
  font-size: 0.9rem;
  color: #888;
  transition: background .15s, color .15s;
}
.nav-tab:hover { background: #2a2a4a; color: #ccc; }
.nav-tab--active { background: #2a2a4a; color: #5fdc5f; font-weight: 600; }

/* ===== 主区域 ===== */
.app-main { padding: 1.2rem 0; }

/* ===== 状态框 ===== */
.state-box { text-align: center; padding: 3rem 1rem; color: #999; }
.state-error { color: #f87171; }
.state-error button {
  margin-top: 0.8rem;
  padding: 0.4rem 1rem;
  background: #3a1a1a;
  border: 1px solid #f87171;
  color: #f87171;
  border-radius: 4px;
  cursor: pointer;
}
</style>
