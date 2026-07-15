<template>
  <div class="hub-page" data-name="tools-page">
    <div class="sub-tabs" data-name="tools-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        data-name="tools-tab-announcement"
        class="sub-tab"
        :class="{ 'sub-tab--on': tab === 'announcement' }"
        :aria-selected="tab === 'announcement'"
        @click="setTab('announcement')"
      >📢 公告</button>
      <button
        type="button"
        role="tab"
        data-name="tools-tab-converter"
        class="sub-tab"
        :class="{ 'sub-tab--on': tab === 'converter' }"
        :aria-selected="tab === 'converter'"
        @click="setTab('converter')"
      >🔢 下界换算</button>
    </div>
    <div class="hub-body">
      <Announcement v-if="tab === 'announcement'" />
      <Converter v-else />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Announcement from './Announcement.vue'
import Converter from './Converter.vue'

const route = useRoute()
const router = useRouter()

function tabFromQuery() {
  const q = String(route.query.tab || '').toLowerCase()
  if (q === 'converter' || q === 'nether' || q === 'convert') return 'converter'
  return 'announcement'
}

const tab = ref(tabFromQuery())

watch(() => route.query.tab, () => {
  tab.value = tabFromQuery()
})

function setTab(next) {
  tab.value = next
  router.replace({ name: 'tools', query: { tab: next } })
}
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;

.sub-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid $border;
}

.sub-tab {
  padding: 0.4rem 0.85rem;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  background: $bg-panel;
  color: $text-dim;
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &--on {
    border-color: $accent;
    background: $accent-bg;
    color: $accent;
    font-weight: 600;
  }

  &:hover:not(.sub-tab--on) {
    color: $text-muted;
    border-color: $text-ghost;
  }
}
</style>
