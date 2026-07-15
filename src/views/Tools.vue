<template>
  <div class="tools-page" data-name="tools-page">
    <!--
    <p class="tools-intro">
      常用小工具集中在一页，向下滚动即可；后续可在此继续加模块。
    </p>
    -->

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

    <!--
      开发侧预留：后续模块占位（不对用户展示）
      恢复时取消注释，并在 modules 数组加回 tool-more 项。

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
    -->
  </div>
</template>

<script setup>
import { nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Announcement from './Announcement.vue'
import Converter from './Converter.vue'

const route = useRoute()

function scrollTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 兼容旧链接 ?tab=converter */
function scrollFromRoute() {
  const tab = String(route.query.tab || route.query.module || '').toLowerCase()
  let id = ''
  if (tab === 'converter' || tab === 'nether' || tab === 'convert') id = 'tool-converter'
  else if (tab === 'announcement' || tab === 'ann') id = 'tool-announcement'
  // else if (tab === 'more' || tab === 'future') id = 'tool-more'
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

/*
.tools-intro {
  margin: 0;
  font-size: 0.85rem;
  color: $text-soft;
  line-height: 1.5;
}
*/

.tool-module {
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
  overflow: hidden;
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

/*
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
*/
</style>
