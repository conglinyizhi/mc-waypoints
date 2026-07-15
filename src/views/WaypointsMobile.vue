<template>
  <div class="m-page" data-name="waypoints-mobile-page">
    <div class="m-head">
      <h1 class="m-title">坐标列表 · 卡片</h1>
    </div>

    <div class="m-toolbar" data-name="m-toolbar">
      <input
        v-model="searchText"
        data-name="m-search"
        class="m-search"
        type="search"
        enterkeyhint="search"
        placeholder="搜索名称、备注…"
      />
      <div class="m-filters" role="group" aria-label="维度筛选">
        <button
          v-for="d in dimOptions"
          :key="d.value"
          type="button"
          :data-name="`m-dim-${d.value}`"
          class="m-filter"
          :class="{ 'm-filter--on': selectedDims.includes(d.value) }"
          :aria-pressed="selectedDims.includes(d.value)"
          @click="toggleDim(d.value)"
        >{{ d.label }}</button>
      </div>
    </div>

    <p v-if="filtered.length" class="m-count">共 {{ filtered.length }} 条</p>

    <div v-if="filtered.length" class="m-list" data-name="m-card-list">
      <article
        v-for="wp in filtered"
        :key="wp.id"
        class="m-card"
        data-name="m-waypoint-card"
        :class="dimClass(wp.dimension)"
      >
        <button
          type="button"
          class="m-card-main"
          data-name="m-card-open-detail"
          @click="openDetail(wp)"
        >
          <div class="m-card-top">
            <span class="m-name">
              <span class="m-dot" aria-hidden="true">{{ dimEmoji(wp.dimension) }}</span>
              {{ wp.name || '未命名' }}
            </span>
            <span class="m-dim-tag">{{ dimLabel(wp.dimension) }}</span>
          </div>
          <div class="m-coords mono">{{ wp.x }} / {{ wp.y }} / {{ wp.z }}</div>
          <div v-if="hasNote(wp.note)" class="m-note">{{ wp.note }}</div>
          <div v-else class="m-note m-note--empty">无备注</div>
        </button>

        <div class="m-card-actions" data-name="m-card-actions">
          <button
            type="button"
            data-name="m-copy-coord"
            class="m-act"
            :class="{ 'm-act--ok': copiedId === `${wp.id}-coord` }"
            @click="doCopy(`${wp.x} ${wp.y} ${wp.z}`, `${wp.id}-coord`)"
          >{{ copiedId === `${wp.id}-coord` ? '✓' : '📋' }} 坐标</button>
          <button
            type="button"
            data-name="m-copy-tp"
            class="m-act"
            :class="{ 'm-act--ok': copiedId === `${wp.id}-tp` }"
            @click="doCopy(`/tp ${wp.x} ${wp.y} ${wp.z}`, `${wp.id}-tp`)"
          >{{ copiedId === `${wp.id}-tp` ? '✓' : '/tp' }}</button>
          <button
            type="button"
            data-name="m-open-detail"
            class="m-act m-act--detail"
            @click="openDetail(wp)"
          >ℹ️ 详情</button>
        </div>
      </article>
    </div>

    <div v-else data-name="m-empty" class="m-empty">
      <p v-if="searchText || !dimAllSelected">🔍 没有匹配的坐标点</p>
      <p v-else>📭 还没有坐标点</p>
    </div>

    <div class="m-footer">
      <router-link to="/submit" data-name="m-submit" class="m-submit">✍️ 提交新坐标</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClipboard } from '../composables/useClipboard.js'
const waypoints = inject('waypoints')
const router = useRouter()
const { copy, copiedId } = useClipboard()

const searchText = ref('')
const ALL_DIMS = ['overworld', 'nether', 'end']
const dimOptions = [
  { label: '🟢 主世界', value: 'overworld' },
  { label: '🔴 下界', value: 'nether' },
  { label: '🟣 末地', value: 'end' }
]
/** 默认全选；checkbox 复选 */
const selectedDims = ref([...ALL_DIMS])

const dimAllSelected = computed(() =>
  ALL_DIMS.every(d => selectedDims.value.includes(d)) && selectedDims.value.length > 0
)

function toggleDim(value) {
  const set = new Set(selectedDims.value)
  if (set.has(value)) set.delete(value)
  else set.add(value)
  selectedDims.value = ALL_DIMS.filter(d => set.has(d))
}

const filtered = computed(() => {
  let list = waypoints.value || []
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(wp =>
      (wp.name || '').toLowerCase().includes(q) ||
      (wp.category || '').toLowerCase().includes(q) ||
      (wp.note || '').toLowerCase().includes(q)
    )
  }
  if (!dimAllSelected.value) {
    const set = new Set(selectedDims.value)
    list = list.filter(wp => set.has(wp.dimension))
  }
  return list
})

function hasNote(note) {
  const s = String(note ?? '').trim()
  if (!s) return false
  if (/^_?No\s*response_?$/i.test(s)) return false
  return true
}

function dimLabel(d) {
  const map = { overworld: '主世界', nether: '下界/地狱', end: '末地' }
  return map[d] || d || '—'
}

function dimEmoji(d) {
  const map = { overworld: '🟢', nether: '🔴', end: '🟣' }
  return map[d] || '⚪'
}

function dimClass(d) {
  const map = { overworld: 'dim-ow', nether: 'dim-nether', end: 'dim-end' }
  return map[d] || ''
}

async function doCopy(text, id) {
  await copy(text, id)
}

function openDetail(wp) {
  if (!wp?.id) return
  router.push({ name: 'report', query: { id: wp.id } })
}
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;
@use '../styles/mixins' as *;

.m-page {
  max-width: 40rem;
  margin: 0 auto;
}

.m-head {
  margin-bottom: 0.85rem;
}


.m-title {
  margin: 0;
  font-size: 1.15rem;
  color: $text-bright;
}

.m-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 0.65rem;
}

.m-search {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  background: $bg-panel;
  color: $text;
  font-size: 0.95rem;
  outline: none;

  &:focus { border-color: $accent; }
}

.m-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.m-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid $border-strong;
  border-radius: 999px;
  background: $bg-panel;
  color: $text-dim;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  user-select: none;
  /* 无 checkbox：选中态靠颜色暗示 */
  &--on {
    border-color: $accent;
    color: $accent;
    background: $accent-bg;
    font-weight: 600;
  }
}



.m-count {
  margin: 0 0 0.55rem;
  font-size: 0.75rem;
  color: $text-ghost;
}

.m-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.m-card {
  @include panel-card;
  overflow: hidden;
  border-left-width: 3px;
  border-left-style: solid;
  border-left-color: $border-strong;

  &.dim-ow { border-left-color: $dim-ow; }
  &.dim-nether { border-left-color: $dim-nether; }
  &.dim-end { border-left-color: $dim-end; }
}

.m-card-main {
  display: block;
  width: 100%;
  padding: 0.75rem 0.85rem 0.55rem;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:active { background: $bg-elevated; }
}

.m-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.m-name {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 700;
  font-size: 0.98rem;
  color: $text-bright;
  word-break: break-word;
  line-height: 1.3;
}

.m-dot { flex-shrink: 0; }

.m-dim-tag {
  flex-shrink: 0;
  font-size: 0.72rem;
  color: $text-ghost;
  padding-top: 0.15rem;
}

.m-coords {
  font-family: $font-mono;
  font-size: 0.88rem;
  color: $gold;
  background: $coords-bg;
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: $radius-sm;
  margin-bottom: 0.4rem;
}

.m-note {
  font-size: 0.82rem;
  color: $text-soft;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &--empty { color: $text-ghost; }
}

.m-card-actions {
  display: flex;
  gap: 0.35rem;
  padding: 0.45rem 0.65rem 0.65rem;
  border-top: 1px solid $border;
  flex-wrap: wrap;
}

.m-act {
  @include btn-chip;
  flex: 1 1 auto;
  min-width: 4.5rem;
  justify-content: center;
  padding: 0.4rem 0.5rem;
  font-size: 0.8rem;

  &--ok {
    border-color: $accent;
    color: $accent;
    background: $accent-bg;
  }

  &--detail {
    color: $info;
    border-color: $info-border;

    &:hover:not(:disabled) {
      background: $info-bg-hover;
      color: $info;
      border-color: $info;
    }
  }
}

.m-empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: $text-soft;
}

.m-footer {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
}

.m-submit {
  display: inline-block;
  padding: 0.55rem 1rem;
  border: 1px solid $accent;
  border-radius: $radius-md;
  background: $accent-bg;
  color: $accent;
  font-weight: 600;
  font-size: 0.88rem;
}
</style>
