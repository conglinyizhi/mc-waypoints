<template>
  <div data-name="about-page">
    <!-- 首页视图优先展示 -->
    <div class="about-card about-card--priority" data-name="home-view-card">
      <h2>📱 首页视图</h2>
      <p class="hint">
        当前：<strong class="hl">{{ homeViewLabel }}</strong>。
        「首页」会按此偏好打开电脑表格或手机卡片；可随时切换。
      </p>
      <button
        type="button"
        data-name="toggle-home-view-btn"
        class="label-btn label-btn--util home-view-btn"
        @click="onToggleHomeView"
      >
        {{ isMobileHome ? '🖥️ 切换为电脑表格首页' : '📱 切换为手机卡片首页' }}
      </button>
    </div>

    <div class="about-card">
      <h2>ℹ️ 关于</h2>

      <dl class="info-list">
        <dt>项目</dt>
        <dd>Minecraft 坐标簿</dd>

        <dt>版本</dt>
        <dd><code>{{ gitHash }}</code></dd>

        <dt>协议</dt>
        <dd>MIT</dd>

        <dt>仓库</dt>
        <dd>
          <a v-if="repo" :href="repo" target="_blank" class="link">{{ repoText }}</a>
          <span v-else>—</span>
        </dd>
      </dl>
    </div>

    <div class="about-card" data-name="dev-tools-entry">
      <h2>🛠️ 开发者工具</h2>
      <p class="hint">CI 标签速查、急停变量等维护者入口已单独成页。</p>
      <router-link
        to="/dev"
        data-name="open-dev-tools-btn"
        class="label-btn label-btn--util home-view-btn"
      >打开开发者工具 →</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useHomeView } from '../composables/useHomeView.js'

// 编译时注入的 git hash
const gitHash = __GIT_HASH__

const config = inject('config')
const router = useRouter()
const { isMobileHome, homeViewLabel, setHomeView, homeRouteName } = useHomeView()

function onToggleHomeView() {
  const next = isMobileHome.value ? 'desktop' : 'mobile'
  setHomeView(next)
  const n = router.currentRoute.value.name
  if (n === 'waypoints' || n === 'waypoints-mobile') {
    router.replace({ name: homeRouteName.value })
  }
}

const repo = computed(() => {
  const r = config.value?.github_repo
  return r && r !== 'yourname/yourrepo' ? `https://github.com/${r}` : null
})
const repoText = computed(() => config.value?.github_repo || '—')
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;

.about-card {
  background: $bg-panel;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1rem;
}

.about-card--priority {
  border-color: $info-border;
  background: $info-bg;
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.12);
}

.about-card h2 {
  font-size: 1rem;
  margin-bottom: 0.8rem;
  color: $text-bright;
}

.info-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1rem;
}
.info-list dt {
  color: $text-faint;
  font-size: 0.85rem;
}
.info-list dd {
  color: $text;
  font-size: 0.9rem;
}
.info-list dd code {
  font-family: $font-mono;
  background: $bg-code;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  color: $gold;
  font-size: 0.82rem;
}

.link {
  color: $info;
}
.link:hover {
  text-decoration: underline;
}

.hint {
  color: $text-ghost;
  font-size: 0.8rem;
  margin-bottom: 0.6rem;
  line-height: 1.5;
}

.hl {
  color: $accent;
  font-weight: 600;
}

.label-btn {
  display: inline-block;
  padding: 0.3rem 0.65rem;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.78rem;
  transition: background 0.15s;
  text-decoration: none;
}
.label-btn:hover {
  opacity: 0.85;
}
.label-btn--util {
  border-color: $warn-amber-border;
  color: $warn-amber;
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
}
.home-view-btn {
  cursor: pointer;
  font: inherit;
  width: 100%;
  text-align: center;
  margin-top: 0.35rem;
  background: transparent;
  box-sizing: border-box;
}
</style>
