<template>
  <div>
    <!-- 工具栏 -->
    <div class="toolbar" data-name="waypoint-toolbar">
      <input
        v-model="searchText"
        data-name="waypoint-search"
        class="search-input"
        type="text"
        placeholder="搜索名称、备注…"
      />

      <!-- 维度筛选：收折为「维度」弹出层，checkbox 复选，默认全选 -->
      <div class="dim-filter" data-name="dimension-filter" ref="dimFilterRoot">
        <button
          type="button"
          data-name="dimension-filter-toggle"
          class="dim-filter__toggle"
          :class="{ 'dim-filter__toggle--open': dimMenuOpen, 'dim-filter__toggle--partial': !dimAllSelected }"
          :aria-expanded="dimMenuOpen"
          aria-haspopup="listbox"
          @click.stop="dimMenuOpen = !dimMenuOpen"
        >
          <span class="dim-filter__label">维度</span>
          <span class="dim-filter__summary">{{ dimFilterSummary }}</span>
          <span class="dim-filter__caret" aria-hidden="true">{{ dimMenuOpen ? '▴' : '▾' }}</span>
        </button>
        <div
          v-if="dimMenuOpen"
          class="dim-filter__menu"
          data-name="dimension-filter-menu"
          role="listbox"
          aria-multiselectable="true"
          @click.stop
        >
          <label
            v-for="d in dimOptions"
            :key="d.value"
            class="dim-filter__option"
            :data-name="`dimension-filter-${d.value}`"
          >
            <input
              v-model="selectedDims"
              type="checkbox"
              :value="d.value"
            />
            <span>{{ d.label }}</span>
          </label>
          <div class="dim-filter__footer">
            <button type="button" data-name="dimension-filter-all" class="dim-filter__link" @click="selectAllDims">全选</button>
            <button type="button" data-name="dimension-filter-none" class="dim-filter__link" @click="clearDims">清空</button>
          </div>
        </div>
      </div>

    </div>

    <!-- 窄屏/手机：引导切换首页视图（写入 localStorage，可由关于页再改） -->
    <div class="mobile-view-banner" data-name="mobile-view-banner">
      <div class="mobile-view-banner__text">
        <strong>屏幕较窄？</strong>
        <span>表格可能显示不全，可改用手机卡片首页。</span>
      </div>
      <button
        type="button"
        data-name="open-mobile-list-btn"
        class="mobile-view-banner__btn"
        @click="showHomeViewDialog = true"
      >📱 卡片列表</button>
    </div>

    <!-- 切换首页视图 · 拟态确认 -->
    <div
      v-if="showHomeViewDialog"
      class="modal-overlay"
      data-name="home-view-switch-dialog"
      @click.self="showHomeViewDialog = false"
      @keydown.esc="showHomeViewDialog = false"
    >
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="home-view-dialog-title">
        <h3 id="home-view-dialog-title" class="modal-title">切换到手机卡片首页？</h3>
        <p class="modal-body">
          确认后，「首页」将默认打开卡片列表，并记住你的选择。
          之后可在 <strong>关于</strong> 页随时改回电脑表格视图。
        </p>
        <div class="modal-actions">
          <button type="button" data-name="home-view-cancel" class="btn-ghost" @click="showHomeViewDialog = false">取消</button>
          <button type="button" data-name="home-view-confirm" class="btn-primary" @click="confirmSwitchToMobile">切换并记住</button>
        </div>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-wrap">
      <table v-if="filtered.length" data-name="waypoint-table" class="waypoint-table">
        <thead>
          <tr>
            <th class="col-name">[维度]名称</th>
            <th class="col-coords">坐标 (X / Y / Z)</th>
            <th class="col-note">备注</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="wp in filtered"
            :key="wp.id"
            data-name="waypoint-row"
          >
            <td class="col-name">
              <span class="name-with-dim" :class="dimClass(wp.dimension)" :title="dimLabel(wp.dimension)">
                <span class="dim-dot" aria-hidden="true">{{ dimEmoji(wp.dimension) }}</span>{{ wp.name }}
              </span>
            </td>
            <td class="col-coords">
              <code>{{ wp.x }} / {{ wp.y }} / {{ wp.z }}</code>
            </td>
            <td class="col-note">
              <span v-if="hasNote(wp.note)" class="note-text">{{ wp.note }}</span>
              <span v-else class="note-placeholder" title="无备注">—</span>
            </td>
            <td class="col-actions">
              <div class="actions-cell">
              <!-- 宽屏：三按钮横排 -->
              <div class="actions-inline" data-name="actions-inline">
                <button
                  data-name="copy-coord-btn"
                  class="copy-btn"
                  title="复制坐标"
                  :class="{ 'copy-btn--ok': copiedId === `${wp.id}-coord` }"
                  @click="doCopy(`${wp.x} ${wp.y} ${wp.z}`, `${wp.id}-coord`)"
                >{{ copiedId === `${wp.id}-coord` ? '✓' : '📋' }}</button>
                <button
                  data-name="copy-tp-btn"
                  class="copy-btn"
                  title="复制 /tp 指令"
                  :class="{ 'copy-btn--ok': copiedId === `${wp.id}-tp` }"
                  @click="doCopy(`/tp ${wp.x} ${wp.y} ${wp.z}`, `${wp.id}-tp`)"
                >{{ copiedId === `${wp.id}-tp` ? '✓' : '/tp' }}</button>
                <button
                  data-name="detail-waypoint-btn"
                  class="copy-btn detail-btn"
                  title="查看详情 / 报错"
                  @click="openDetail(wp)"
                >ℹ️</button>
              </div>

              <!-- 窄屏：… 折叠菜单（点击开关；点外部关闭；不用 mouseleave，避免移入菜单时误关） -->
              <div
                class="actions-compact"
                data-name="actions-compact"
              >
                <button
                  type="button"
                  data-name="actions-more-btn"
                  class="copy-btn more-btn"
                  title="更多操作"
                  :aria-expanded="openMenuId === wp.id"
                  @click.stop="toggleActionsMenu(wp.id, $event)"
                >⋯</button>
              </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div v-else data-name="empty-state" class="state-box">
        <p v-if="searchText || !dimAllSelected">🔍 没有匹配的坐标点，试试调整筛选条件</p>
        <p v-else>📭 还没有坐标点</p>
      </div>
    </div>

    <!-- 操作菜单：挂到 body，避免被 table overflow 裁切 -->
    <Teleport to="body">
      <div
        v-if="openMenuId && openMenuWp"
        class="actions-dropdown actions-dropdown--portal"
        data-name="actions-dropdown"
        role="menu"
        :style="menuStyle"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          data-name="copy-coord-btn"
          class="copy-btn dropdown-item"
          :class="{ 'copy-btn--ok': copiedId === `${openMenuWp.id}-coord` }"
          @click="onMenuCopy(`${openMenuWp.x} ${openMenuWp.y} ${openMenuWp.z}`, `${openMenuWp.id}-coord`)"
        >{{ copiedId === `${openMenuWp.id}-coord` ? '✓ 已复制' : '📋 复制坐标' }}</button>
        <button
          type="button"
          role="menuitem"
          data-name="copy-tp-btn"
          class="copy-btn dropdown-item"
          :class="{ 'copy-btn--ok': copiedId === `${openMenuWp.id}-tp` }"
          @click="onMenuCopy(`/tp ${openMenuWp.x} ${openMenuWp.y} ${openMenuWp.z}`, `${openMenuWp.id}-tp`)"
        >{{ copiedId === `${openMenuWp.id}-tp` ? '✓ 已复制' : '/tp 复制指令' }}</button>
        <button
          type="button"
          role="menuitem"
          data-name="detail-waypoint-btn"
          class="copy-btn detail-btn dropdown-item"
          @click="onMenuDetail(openMenuWp)"
        >ℹ️ 详情</button>
      </div>
    </Teleport>

    <!-- 底部提交链接 -->
    <div class="footer-bar">
      <router-link
        to="/submit"
        data-name="submit-waypoint-btn"
        class="submit-link submit-link--primary"
      >✍️ 填写表单提交新坐标</router-link>
      <a
        v-if="config.github_issues_url"
        :href="config.github_issues_url"
        target="_blank"
        data-name="submit-waypoint-link"
        class="submit-link"
      >➕ 直接通过 GitHub Issue 提交</a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClipboard } from '../composables/useClipboard.js'
import { useHomeView } from '../composables/useHomeView.js'

const waypoints = inject('waypoints')
const config = inject('config')
const router = useRouter()
const { copy, copiedId } = useClipboard()
const { setHomeView } = useHomeView()
const showHomeViewDialog = ref(false)

function confirmSwitchToMobile() {
  setHomeView('mobile')
  showHomeViewDialog.value = false
  router.push({ name: 'waypoints-mobile' })
}

watch(showHomeViewDialog, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

// 窄屏操作菜单：同一时间只开一行；Teleport + fixed，避免 overflow 裁切 / mouseleave 误关
const openMenuId = ref(null)
const menuStyle = ref({})

const openMenuWp = computed(() => {
  const id = openMenuId.value
  if (!id) return null
  return (waypoints.value || []).find(w => String(w.id) === String(id)) || null
})

function closeActionsMenu() {
  openMenuId.value = null
  menuStyle.value = {}
}

function placeMenu(anchorEl) {
  if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return
  const rect = anchorEl.getBoundingClientRect()
  const menuEl = document.querySelector('[data-name="actions-dropdown"]')
  const menuW = menuEl?.offsetWidth || 168
  const menuH = menuEl?.offsetHeight || 140
  const gap = 6
  const pad = 8
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < menuH + gap + pad

  let top
  if (openUp) {
    top = Math.max(pad, rect.top - gap - menuH)
  } else {
    top = rect.bottom + gap
    if (top + menuH > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - menuH - pad)
    }
  }

  // 右对齐按钮右缘，并钳制在视口内
  let left = rect.right - menuW
  left = Math.min(Math.max(pad, left), window.innerWidth - menuW - pad)

  menuStyle.value = {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    right: 'auto',
    visibility: 'visible',
    zIndex: 300
  }
}

function toggleActionsMenu(id, event) {
  if (openMenuId.value === id) {
    closeActionsMenu()
    return
  }
  openMenuId.value = id
  const anchor = event?.currentTarget
  // 先落到锚点下方再测真实尺寸，必要时翻到上方
  menuStyle.value = {
    position: 'fixed',
    top: '-9999px',
    left: '0',
    visibility: 'hidden',
    zIndex: 300
  }
  nextTick(() => {
    placeMenu(anchor)
    // 第二次确保用最终尺寸（字体/换行后）
    nextTick(() => placeMenu(anchor))
  })
}

function onDocPointerDown(e) {
  if (!openMenuId.value) return
  const el = e.target
  if (el && typeof el.closest === 'function') {
    if (el.closest('[data-name="actions-compact"]')) return
    if (el.closest('[data-name="actions-dropdown"]')) return
  }
  closeActionsMenu()
}

function onWinReposition() {
  if (!openMenuId.value) return
  // 滚动/缩放时关掉，避免错位（比错误悬停更可预期）
  closeActionsMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('pointerdown', onDimFilterDocDown)
  window.addEventListener('resize', onWinReposition)
  window.addEventListener('scroll', onWinReposition, true)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('pointerdown', onDimFilterDocDown)
  window.removeEventListener('resize', onWinReposition)
  window.removeEventListener('scroll', onWinReposition, true)
})

// --- 搜索与筛选 ---
const searchText = ref('')

const ALL_DIMS = ['overworld', 'nether', 'end']
const dimOptions = [
  { label: '🟢 主世界', value: 'overworld' },
  { label: '🔴 下界/地狱', value: 'nether' },
  { label: '🟣 末地', value: 'end' }
]
/** 默认全选；checkbox 复选 */
const selectedDims = ref([...ALL_DIMS])
const dimMenuOpen = ref(false)
const dimFilterRoot = ref(null)

const dimAllSelected = computed(() =>
  ALL_DIMS.every(d => selectedDims.value.includes(d)) && selectedDims.value.length > 0
)

const dimFilterSummary = computed(() => {
  if (!selectedDims.value.length) return '无'
  if (dimAllSelected.value) return '全部'
  const map = { overworld: '主世界', nether: '下界', end: '末地' }
  return selectedDims.value.map(d => map[d] || d).join('、')
})

function selectAllDims() {
  selectedDims.value = [...ALL_DIMS]
}

function clearDims() {
  selectedDims.value = []
}

function onDimFilterDocDown(e) {
  if (!dimMenuOpen.value) return
  const root = dimFilterRoot.value
  if (root && typeof root.contains === 'function' && root.contains(e.target)) return
  dimMenuOpen.value = false
}

const filtered = computed(() => {
  let list = waypoints.value || []

  // 搜索
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(wp =>
      (wp.name || '').toLowerCase().includes(q) ||
      (wp.category || '').toLowerCase().includes(q) ||
      (wp.note || '').toLowerCase().includes(q)
    )
  }

  // 维度复选：未勾选任何维度 → 空列表；全选 → 不过滤
  if (!dimAllSelected.value) {
    const set = new Set(selectedDims.value)
    list = list.filter(wp => set.has(wp.dimension))
  }

  return list
})

// --- 辅助 ---

/** 备注是否有真实内容（排除空串与 GitHub 表单占位 _No response_） */
function hasNote(note) {
  const s = String(note ?? '').trim()
  if (!s) return false
  if (/^_?No\s*response_?$/i.test(s)) return false
  return true
}

function dimLabel(d) {
  const map = {
    overworld: '主世界',
    nether: '下界/地狱',
    end: '末地'
  }
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

async function onMenuCopy(text, id) {
  await doCopy(text, id)
  closeActionsMenu()
}

function openDetail(wp) {
  // 详情页默认只展示记录；报错表单在页内按需展开
  if (!wp?.id) return
  router.push({ name: 'report', query: { id: wp.id } })
}

function onMenuDetail(wp) {
  openDetail(wp)
  closeActionsMenu()
}
</script>


<style scoped lang="scss">
@use '../styles/tokens' as *;
@use '../styles/mixins' as *;
@use '../styles/shared' as shared;
/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1 1 200px;
  min-width: 180px;
  padding: 0.45rem 0.75rem;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  background: $bg-panel;
  color: $text;
  font-size: 0.9rem;
  outline: none;

  &:focus { border-color: $accent; }
}

/* 维度过滤器（收折 + 复选） */
.dim-filter {
  position: relative;
  flex-shrink: 0;
}

.dim-filter__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 14rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  background: $bg-panel;
  color: $text-soft;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;

  &:hover {
    border-color: $accent;
    color: $text-muted;
  }

  &--open {
    border-color: $accent;
    color: $accent;
    background: $accent-bg;
  }

  &--partial:not(.dim-filter__toggle--open) {
    border-color: $info-border;
    color: $info-soft;
  }
}

.dim-filter__label {
  font-weight: 700;
  color: inherit;
  flex-shrink: 0;
}

.dim-filter__summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  color: $text-faint;
  font-weight: 400;
}

.dim-filter__toggle--open .dim-filter__summary,
.dim-filter__toggle--partial .dim-filter__summary {
  color: inherit;
}

.dim-filter__caret {
  flex-shrink: 0;
  font-size: 0.7rem;
  opacity: 0.75;
}

.dim-filter__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 50;
  min-width: 10.5rem;
  padding: 0.4rem;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  background: $bg-panel-alt;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dim-filter__option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.45rem;
  border-radius: $radius;
  color: $text-muted;
  font-size: 0.84rem;
  cursor: pointer;
  user-select: none;

  &:hover { background: $bg-elevated; }

  input {
    width: 0.95rem;
    height: 0.95rem;
    accent-color: $accent;
    flex-shrink: 0;
  }
}

.dim-filter__footer {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.25rem;
  padding-top: 0.35rem;
  border-top: 1px solid $border;
}

.dim-filter__link {
  border: none;
  background: transparent;
  color: $info-soft;
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.15rem 0.2rem;

  &:hover { color: $accent; text-decoration: underline; }
}

/* ===== 表格 =====
 * th/td 共用列 class，保证表头与表行列宽一致。
 * 名称/坐标/操作收缩贴内容；备注吃剩余宽度。
 * 注意：不要在 td 上直接 display:flex，会打乱 table 列对齐。
 */
.table-wrap { overflow-x: auto; }
.waypoint-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  table-layout: auto;
}
.waypoint-table th,
.waypoint-table td {
  padding: 0.42rem 0.5rem;
  vertical-align: middle;
  white-space: nowrap;
}
.waypoint-table th {
  text-align: left;
  padding-top: 0.45rem;
  padding-bottom: 0.45rem;
  border-bottom: 2px solid $border;
  color: $text-dim;
  font-weight: 600;
}
.waypoint-table td {
  border-bottom: 1px solid $bg-elevated;
}
.waypoint-table tbody tr:hover { background: $bg-elevated; }

/* 收缩列：贴内容（th/td 同 class） */
.col-name,
.col-coords {
  width: 1%;
  white-space: nowrap;
}

.col-name { font-weight: 600; color: $text-bright; }
th.col-name { font-weight: 600; color: $text-dim; }

.name-with-dim {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  max-width: 12rem;
}
.dim-dot { flex-shrink: 0; font-size: 0.85em; line-height: 1; }
.col-coords code {
  font-family: $font-mono;
  font-size: 0.82rem;
  color: $gold;
  background: $coords-bg;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  white-space: nowrap;
}

/* 备注：吃掉剩余横向空间 */
.col-note {
  width: auto;
  max-width: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-soft;
}
th.col-note { color: $text-dim; }
.note-text {
  color: $text-soft;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
.note-placeholder {
  color: $text-ghost;
  user-select: none;
}

/* 操作列：td 保持 table-cell；内部再 flex，避免表头/表行列宽错位 */
.col-actions {
  width: 1%;
  white-space: nowrap;
  text-align: right;
  padding-left: 0.35rem;
}
.actions-cell {
  display: inline-flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  vertical-align: middle;
}
.actions-inline {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  flex-wrap: nowrap;
}
.actions-compact {
  display: none;
  position: relative;
}
.more-btn {
  min-width: 2.2em;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1;
}
/* 菜单 Teleport 到 body + fixed，避免 table overflow 裁切 */
.actions-dropdown {
  min-width: 10.5rem;
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: $bg-panel-alt;
  border: 1px solid $border-strong;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  box-sizing: border-box;
}
.dropdown-item {
  width: 100%;
  min-width: 0;
  justify-content: flex-start;
  text-align: left;
  white-space: nowrap;
}

/* 窄屏折叠为 … 菜单 */
@media (max-width: 720px) {
  .actions-inline { display: none; }
  .actions-compact { display: block; }
  .name-with-dim { max-width: 9rem; }
}

/* ===== 维度着色（名称前缀） ===== */
.name-with-dim.dim-ow { color: $dim-ow; }
.name-with-dim.dim-nether { color: $dim-nether; }
.name-with-dim.dim-end { color: $dim-end; }


/* ===== 操作按钮 ===== */
@include shared.copy-btn-block;

.detail-btn {
  color: $info;
  min-width: auto;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: $info;
    color: $info;
    background: $info-bg-hover;
  }
}

/* ===== 手机版入口 ===== */
.mobile-view-banner {
  display: none; /* 默认宽屏隐藏，窄屏再显示 */
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin: 0 0 0.85rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid $info-border;
  border-radius: $radius-md;
  background: $info-bg;
}

.mobile-view-banner__text {
  font-size: 0.8rem;
  color: $text-soft;
  line-height: 1.45;
  min-width: 0;

  strong {
    color: $info-soft;
    margin-right: 0.25rem;
  }
}

.mobile-view-banner__btn {
  flex-shrink: 0;
  padding: 0.4rem 0.7rem;
  border: 1px solid $info;
  border-radius: $radius-md;
  background: $info-bg-deep;
  color: $info-soft;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: $info-bg-hover; }
}

@media (max-width: 720px) {
  .mobile-view-banner {
    display: flex;
    flex-wrap: wrap;
  }
}

/* 宽屏也可在工具栏旁用小号入口（可选可见）— 统一在 ≤900 显示提示 */
@media (max-width: 900px) and (min-width: 721px) {
  .mobile-view-banner {
    display: flex;
  }
}


/* 拟态对话框（首页视图切换） */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
  backdrop-filter: blur(2px);
}
.modal-card {
  background: $bg-panel-alt;
  border: 1px solid $border-strong;
  border-radius: $radius-xl;
  padding: 1.25rem 1.35rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}
.modal-title {
  color: $text-bright;
  font-size: 1.05rem;
  margin-bottom: 0.7rem;
}
.modal-body {
  color: $text-dim;
  font-size: 0.88rem;
  line-height: 1.55;
  margin-bottom: 1.1rem;

  strong { color: $accent; }
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.btn-ghost {
  @include btn-ghost;
}
.btn-primary {
  @include btn-primary;
  padding: 0.45rem 0.95rem;
  font-size: 0.88rem;
}

/* ===== 底部 ===== */
.footer-bar {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.submit-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px dashed $border-strong;
  border-radius: 6px;
  color: $accent;
  font-size: 0.85rem;
  transition: background .15s;
}
.submit-link:hover { background: $accent-bg; }
.submit-link--primary {
  border-style: solid;
  border-color: $accent;
  background: $accent-bg;
  color: $accent;
  font-weight: 600;
}
.submit-link--primary:hover { background: $accent-bg-hover; }
</style>