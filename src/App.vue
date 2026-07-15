<template>
  <div class="app-shell">
    <!-- 右上角固定：GitHub + 主题 -->
    <div class="header-tools" data-name="header-tools">
      <a
        v-if="githubRepoUrl"
        :href="githubRepoUrl"
        target="_blank"
        rel="noopener noreferrer"
        data-name="github-repo-link"
        class="tool-btn github-link"
        title="在 GitHub 上查看本项目"
        aria-label="GitHub 仓库"
      >
        <img
          v-show="!githubIconFailed"
          class="github-favicon"
          src="https://github.com/favicon.ico"
          width="18"
          height="18"
          alt=""
          decoding="async"
          @error="githubIconFailed = true"
        />
        <svg
          v-show="githubIconFailed"
          class="github-icon"
          viewBox="0 0 16 16"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
          />
        </svg>
      </a>

      <button
        type="button"
        data-name="theme-toggle"
        class="tool-btn theme-toggle"
        :title="themeTitle"
        :aria-label="themeTitle"
        @click="cycleTheme"
      >
        <span class="theme-icon" aria-hidden="true">{{ themeIcon }}</span>
        <span class="theme-label">{{ themeLabel }}</span>
      </button>
    </div>

    <header class="app-header">
      <div class="app-title-row">
        <h1 class="app-title">⛏ Minecraft 坐标簿</h1>
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
      <div v-if="loading" data-name="loading-state" class="state-box">
        <p>⏳ 正在加载数据…</p>
      </div>

      <div v-else-if="error" data-name="error-state" class="state-box state-error">
        <p>⚠️ 加载失败，请刷新重试</p>
        <button @click="reload" data-name="error-reload-btn">🔄 重新加载</button>
      </div>

      <router-view v-else />
    </main>
  </div>
</template>

<script setup>
import { computed, provide, ref } from 'vue'
import { useDataFetch } from './composables/useDataFetch.js'
import { useTheme } from './composables/useTheme.js'

const tabs = [
  { to: '/', label: '🗺️ 坐标点' },
  { to: '/submit', label: '➕ 提交' },
  { to: '/server', label: '📋 待办' },
  { to: '/announcement', label: '📢 公告' },
  { to: '/converter', label: '🔢 下界换算' },
  { to: '/about', label: 'ℹ️ 关于' }
]

const { waypoints, config, loading, error, reload } = useDataFetch()
const { themeLabel, themeIcon, themeTitle, cycleTheme } = useTheme()

const githubIconFailed = ref(false)

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

<style lang="scss">
@use './styles/tokens' as *;

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  /* 给右上角固定工具条留空，避免标题/导航被挡 */
  padding-right: max(1rem, 9.5rem);
}

/* 右上角固定工具条 */
.header-tools {
  position: fixed;
  top: 0.7rem;
  right: 0.7rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: var(--header-tools-bg);
  box-shadow: var(--header-tools-shadow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  min-width: 2rem;
  min-height: 2rem;
  padding: 0.28rem 0.45rem;
  border: 1px solid transparent;
  border-radius: $radius-md;
  background: transparent;
  color: $text-dim;
  font: inherit;
  font-size: 0.78rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s, transform 0.15s;
}

.tool-btn:hover {
  color: $text-bright;
  background: $bg-elevated;
  border-color: $border-strong;
  transform: translateY(-1px);
}

.github-link {
  text-decoration: none;
}

.github-favicon {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  object-fit: contain;
}

.github-icon {
  display: block;
}

.theme-toggle .theme-icon {
  font-size: 0.95rem;
  line-height: 1;
}

.theme-toggle .theme-label {
  color: $text-soft;
  white-space: nowrap;
}

.app-header {
  padding: 1rem 0;
  border-bottom: 2px solid $border;
}

.app-title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.6rem;
  min-height: 1.8rem;
}

.app-title {
  font-size: 1.4rem;
  color: $text-bright;
  margin: 0;
  line-height: 1.2;
}

.app-nav {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.nav-tab {
  padding: 0.4rem 0.9rem;
  border-radius: $radius-md $radius-md 0 0;
  font-size: 0.9rem;
  color: $text-faint;
  transition: background 0.15s, color 0.15s;
}

.nav-tab:hover {
  background: $border;
  color: $text-muted;
}

.nav-tab--active {
  background: $border;
  color: $accent;
  font-weight: 600;
}

.app-main {
  padding: 1.2rem 0;
}

.state-box {
  text-align: center;
  padding: 3rem 1rem;
  color: $text-soft;
}

.state-error {
  color: $danger;
}

.state-error button {
  margin-top: 0.8rem;
  padding: 0.4rem 1rem;
  background: $danger-bg-strong;
  border: 1px solid $danger;
  color: $danger;
  border-radius: $radius;
  cursor: pointer;
}

@media (max-width: 520px) {
  .app-shell {
    padding-right: 1rem;
    /* 标题行给固定条留高，避免重叠 */
  }

  .app-title-row {
    padding-right: 0;
    min-height: 2.4rem;
  }

  .theme-toggle .theme-label {
    display: none;
  }

  .header-tools {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.2rem;
  }
}
</style>
