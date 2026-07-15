<template>
  <div class="tools-page" data-name="tools-page">
    <p class="tools-intro">
      常用小工具集中在一页，向下滚动即可；后续可在此继续加模块。
    </p>

    <!-- 模块导航（页内锚点，非二级路由 tab） -->
    <nav class="module-nav" data-name="tools-module-nav" aria-label="小工具模块">
      <a
        v-for="m in modules"
        :key="m.id"
        :href="`#${m.id}`"
        :data-name="`tools-nav-${m.id}`"
        class="module-nav-link"
        @click.prevent="scrollTo(m.id)"
      >{{ m.icon }} {{ m.title }}</a>
    </nav>

    <!-- 公告 -->
    <section
      id="tool-announcement"
      class="tool-module"
      data-name="tool-module-announcement"
    >
      <header class="tool-module__head">
        <h2 class="tool-module__title">📢 公告</h2>
        <p class="tool-module__desc">服务器维护说明与重要通知</p>
      </header>
      <div class="tool-module__body">
        <Announcement />
      </div>
    </section>

    <!-- 下界换算 -->
    <section
      id="tool-converter"
      class="tool-module"
      data-name="tool-module-converter"
    >
      <header class="tool-module__head">
        <h2 class="tool-module__title">🔢 下界换算</h2>
        <p class="tool-module__desc">主世界 ⇄ 下界 8:1，避免传送门串线</p>
      </header>
      <div class="tool-module__body">
        <Converter />
      </div>
    </section>

    <!-- 后续模块占位 -->
    <section
      id="tool-more"
      class="tool-module tool-module--placeholder"
      data-name="tool-module-more"
    >
      <header class="tool-module__head">
        <h2 class="tool-module__title">🧩 后续模块</h2>
        <p class="tool-module__desc">预留扩展位（例如种子工具、生物群系速查等）</p>
      </header>
      <div class="tool-module__body tool-module__placeholder-body">
        <p>暂无更多工具。有想法可以提 Issue / 直接改本页加一节。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Announcement from './Announcement.vue'
import Converter from './Converter.vue'

const route = useRoute()

const modules = [
  { id: 'tool-announcement', icon: '📢', title: '公告' },
  { id: 'tool-converter', icon: '🔢', title: '下界换算' },
  { id: 'tool-more', icon: '🧩', title: '后续模块' }
]

function scrollTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 兼容旧链接 ?tab=converter / #tool-converter */
function scrollFromRoute() {
  const tab = String(route.query.tab || route.query.module || '').toLowerCase()
  let id = ''
  if (tab === 'converter' || tab === 'nether' || tab === 'convert') id = 'tool-converter'
  else if (tab === 'announcement' || tab === 'ann') id = 'tool-announcement'
  else if (tab === 'more' || tab === 'future') id = 'tool-more'
  if (id) nextTick(() => scrollTo(id))
}

onMounted(() => {
  scrollFromRoute()
})
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;

.tools-page {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.tools-intro {
  margin: 0;
  font-size: 0.85rem;
  color: $text-soft;
  line-height: 1.5;
}

.module-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  position: sticky;
  top: 0.4rem;
  z-index: 20;
  padding: 0.4rem 0;
  background: linear-gradient(
    to bottom,
    var(--bg-page) 70%,
    transparent
  );
}

.module-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid $border-strong;
  border-radius: 999px;
  background: $bg-panel;
  color: $text-dim;
  font-size: 0.8rem;
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s, background 0.15s;

  &:hover {
    border-color: $accent;
    color: $accent;
    background: $accent-bg;
  }
}

.tool-module {
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
  overflow: hidden;
  /* 锚点滚动时不被顶栏挡住一点 */
  scroll-margin-top: 3.2rem;
}

.tool-module__head {
  padding: 0.75rem 1rem 0.55rem;
  border-bottom: 1px solid $border;
  background: $bg-panel-alt;
}

.tool-module__title {
  margin: 0;
  font-size: 1rem;
  color: $text-bright;
  font-weight: 700;
}

.tool-module__desc {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: $text-ghost;
  line-height: 1.4;
}

.tool-module__body {
  padding: 0.85rem 1rem 1rem;
}

.tool-module--placeholder {
  border-style: dashed;
  opacity: 0.92;
}

.tool-module__placeholder-body {
  color: $text-faint;
  font-size: 0.88rem;
  line-height: 1.55;
  min-height: 3.5rem;
  display: flex;
  align-items: center;

  p { margin: 0; }
}
</style>
