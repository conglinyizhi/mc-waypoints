<template>
  <div class="hub-page" data-name="contribute-page">
    <div class="sub-tabs" data-name="contribute-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        data-name="contribute-tab-submit"
        class="sub-tab"
        :class="{ 'sub-tab--on': tab === 'submit' }"
        :aria-selected="tab === 'submit'"
        @click="setTab('submit')"
      >➕ 提交坐标</button>
      <button
        type="button"
        role="tab"
        data-name="contribute-tab-todo"
        class="sub-tab"
        :class="{ 'sub-tab--on': tab === 'todo' }"
        :aria-selected="tab === 'todo'"
        @click="setTab('todo')"
      >📋 待办</button>
    </div>
    <div class="hub-body">
      <SubmitWaypoint v-if="tab === 'submit'" />
      <ServerInfo v-else />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SubmitWaypoint from './SubmitWaypoint.vue'
import ServerInfo from './ServerInfo.vue'

const route = useRoute()
const router = useRouter()

function tabFromQuery() {
  const q = String(route.query.tab || '').toLowerCase()
  if (q === 'todo' || q === 'server' || q === 'todos') return 'todo'
  return 'submit'
}

const tab = ref(tabFromQuery())

watch(() => route.query.tab, () => {
  tab.value = tabFromQuery()
})

function setTab(next) {
  tab.value = next
  router.replace({ name: 'contribute', query: { tab: next } })
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
