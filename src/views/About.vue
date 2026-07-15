<template>
  <div data-name="settings-page">
    <!-- 首页视图优先展示：双骨架预览切换 -->
    <div class="about-card about-card--priority" data-name="home-view-card">
      <h2 class="home-view-heading">
        <span class="home-view-heading__icon" :key="homeViewIcon" aria-hidden="true">{{ homeViewIcon }}</span>
        首页视图
      </h2>
      <p class="hint">
        点选下方预览切换「首页」默认打开方式；选择会记住在本机。
      </p>

      <div class="view-picker" data-name="home-view-picker" role="listbox" aria-label="选择首页视图">
        <!-- 电脑表格 -->
        <button
          type="button"
          role="option"
          data-name="home-view-desktop"
          class="view-option"
          :class="{ 'view-option--active': !isMobileHome }"
          :aria-selected="!isMobileHome"
          @click="pickHomeView('desktop')"
        >
          <div class="view-option__head">
            <span class="view-option__title">🖥️ 电脑表格</span>
            <span v-if="!isMobileHome" class="view-option__badge">当前</span>
          </div>
          <!-- 表格骨架 -->
          <div class="skel skel-table" aria-hidden="true">
            <div class="skel-table__toolbar">
              <span class="skel-bar skel-bar--search" />
              <span class="skel-chip" />
              <span class="skel-chip" />
            </div>
            <div class="skel-table__head">
              <span class="skel-cell" />
              <span class="skel-cell skel-cell--sm" />
              <span class="skel-cell" />
              <span class="skel-cell skel-cell--xs" />
            </div>
            <div v-for="n in 4" :key="`tr-${n}`" class="skel-table__row">
              <span class="skel-cell skel-cell--name" />
              <span class="skel-cell skel-cell--coord" />
              <span class="skel-cell skel-cell--note" />
              <span class="skel-dot" />
            </div>
          </div>
          <span class="view-option__caption">信息密度高，适合宽屏</span>
        </button>

        <!-- 手机卡片 -->
        <button
          type="button"
          role="option"
          data-name="home-view-mobile"
          class="view-option"
          :class="{ 'view-option--active': isMobileHome }"
          :aria-selected="isMobileHome"
          @click="pickHomeView('mobile')"
        >
          <div class="view-option__head">
            <span class="view-option__title">📱 手机卡片</span>
            <span v-if="isMobileHome" class="view-option__badge">当前</span>
          </div>
          <!-- 卡片列表骨架 -->
          <div class="skel skel-cards" aria-hidden="true">
            <div class="skel-cards__search">
              <span class="skel-bar" />
            </div>
            <div class="skel-cards__chips">
              <span class="skel-chip" />
              <span class="skel-chip" />
              <span class="skel-chip" />
            </div>
            <div v-for="n in 2" :key="`card-${n}`" class="skel-card">
              <span class="skel-bar skel-bar--title" />
              <span class="skel-bar skel-bar--coord" />
              <span class="skel-bar skel-bar--note" />
              <div class="skel-card__btns">
                <span class="skel-btn" />
                <span class="skel-btn" />
                <span class="skel-btn" />
              </div>
            </div>
          </div>
          <span class="view-option__caption">一卡一条，适合窄屏</span>
        </button>
      </div>
    </div>

    <div class="about-card">
      <h2>ℹ️ 关于本站</h2>

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
const { isMobileHome, homeViewIcon, setHomeView, homeRouteName } = useHomeView()

function pickHomeView(mode) {
  if (mode !== 'desktop' && mode !== 'mobile') return
  if ((mode === 'mobile') === isMobileHome.value) {
    // 已是当前视图：若在首页则确保路由一致
    const n = router.currentRoute.value.name
    if (n === 'waypoints' || n === 'waypoints-mobile') {
      router.replace({ name: homeRouteName.value })
    }
    return
  }
  setHomeView(mode)
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
  margin-bottom: 0.55rem;
  color: $text-bright;
}

.home-view-heading {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.home-view-heading__icon {
  display: inline-block;
  min-width: 1.25em;
  text-align: center;
  animation: home-icon-pop 0.28s ease;
}

@keyframes home-icon-pop {
  0% { transform: scale(0.7); opacity: 0.35; }
  55% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
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
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

/* ===== 双预览切换 ===== */
.view-picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  align-items: stretch; /* 两卡等高 */
}

/* 窄屏仍各占约 50%，不改单列，便于左右对比 */
@media (max-width: 560px) {
  .view-picker {
    gap: 0.45rem;
  }
}

.view-option {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  height: 100%;
  min-width: 0;
  padding: 0.65rem 0.7rem 0.55rem;
  border: 1px solid $border-strong;
  border-radius: $radius-lg;
  background: $bg-panel;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s, transform 0.12s;

  &:hover {
    border-color: $info;
    background: $bg-panel-alt;
  }

  &--active {
    border-color: $accent;
    background: $accent-bg;
    box-shadow: 0 0 0 1px rgba(95, 220, 95, 0.25);

    .view-option__title {
      color: $accent;
    }
  }

  &:active {
    transform: scale(0.99);
  }
}

.view-option__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.view-option__title {
  font-size: 0.88rem;
  font-weight: 700;
  color: $text-bright;
}

.view-option__badge {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.12rem 0.4rem;
  border-radius: 999px;
  background: $accent;
  color: $bg-deep;
}

.view-option__caption {
  margin-top: auto;
  font-size: 0.72rem;
  color: $text-ghost;
  line-height: 1.35;
}

/* ===== 骨架通用 ===== */
.skel {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 7.5rem; /* 两卡预览区同高 */
  border-radius: $radius-md;
  background: $bg-deep;
  border: 1px solid $border;
  padding: 0.45rem;
  pointer-events: none;
}

.skel-bar,
.skel-cell,
.skel-chip,
.skel-btn,
.skel-dot {
  display: block;
  border-radius: 3px;
  /* 静态示意块，不做加载动画，避免被当成真骨架屏 */
  background: $border-strong;
  opacity: 0.85;
}

/* 表格骨架 */
.skel-table {
  justify-content: flex-start;
}

.skel-table__toolbar {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin-bottom: 0.35rem;
}

.skel-bar--search {
  flex: 1;
  height: 0.55rem;
}

.skel-chip {
  width: 1.4rem;
  height: 0.5rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.skel-table__head,
.skel-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.1fr 0.35fr;
  gap: 0.28rem;
  align-items: center;
  margin-bottom: 0.28rem;
}

.skel-table__head .skel-cell {
  height: 0.4rem;
  opacity: 0.55;
}

.skel-cell {
  height: 0.48rem;
}

.skel-cell--sm { width: 70%; }
.skel-cell--xs { width: 40%; justify-self: end; }
.skel-cell--name { width: 85%; }
.skel-cell--coord { width: 90%; }
.skel-cell--note { width: 75%; }

.skel-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  justify-self: end;
}

/* 卡片骨架 */
.skel-cards {
  justify-content: flex-start;
  gap: 0;
}

.skel-cards__search {
  margin-bottom: 0.35rem;
}
.skel-cards__search .skel-bar {
  height: 0.55rem;
  width: 100%;
}

.skel-cards__chips {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.4rem;
}
.skel-cards__chips .skel-chip {
  width: 1.8rem;
}

.skel-card {
  border: 1px solid $border;
  border-radius: $radius;
  padding: 0.4rem 0.45rem;
  margin-bottom: 0.35rem;
  background: $bg-panel;
}
.skel-card:last-child {
  margin-bottom: 0;
}

.skel-bar--title {
  height: 0.5rem;
  width: 55%;
  margin-bottom: 0.28rem;
}
.skel-bar--coord {
  height: 0.42rem;
  width: 70%;
  margin-bottom: 0.22rem;
  opacity: 0.85;
}
.skel-bar--note {
  height: 0.38rem;
  width: 88%;
  margin-bottom: 0.35rem;
  opacity: 0.65;
}

.skel-card__btns {
  display: flex;
  gap: 0.25rem;
}
.skel-btn {
  flex: 1;
  height: 0.7rem;
  border-radius: 4px;
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
