<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-title-row">
        <h1 class="app-title">⛏ Minecraft 坐标簿</h1>
        <a
          v-if="githubRepoUrl"
          :href="githubRepoUrl"
          target="_blank"
          rel="noopener noreferrer"
          data-name="github-repo-link"
          class="github-link"
          title="在 GitHub 上查看本项目"
          aria-label="GitHub 仓库"
        >
          <svg class="github-icon" viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
            <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
          </svg>
        </a>
      </div>
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
import { computed, provide } from 'vue'
import { useDataFetch } from './composables/useDataFetch.js'

const tabs = [
  { to: '/', label: '🗺️ 坐标点' },
  { to: '/submit', label: '➕ 提交' },
  { to: '/server', label: '📋 待办' },
  { to: '/announcement', label: '📢 公告' },
  { to: '/converter', label: '🔢 下界换算' },
  { to: '/about', label: 'ℹ️ 关于' }
]

const { waypoints, config, loading, error, reload } = useDataFetch()

const githubRepoUrl = computed(() => {
  const repo = config.value?.github_repo
  if (!repo || repo === 'yourname/yourrepo') return ''
  return `https://github.com/${repo}`
})

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
.app-title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.6rem;
}
.app-title { font-size: 1.4rem; color: #fff; margin: 0; line-height: 1.2; }
.github-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: color .15s, transform .15s;
  flex-shrink: 0;
}
.github-link:hover { color: #fff; transform: translateY(-1px); }
.github-icon { display: block; }

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
