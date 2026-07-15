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

      <!-- 维度筛选 -->
      <div class="filter-group">
        <button
          v-for="d in dimFilters"
          :key="d.value"
          :data-name="`dimension-filter-${d.value}`"
          class="filter-btn"
          :class="{ 'filter-btn--active': dimFilter === d.value }"
          @click="dimFilter = d.value"
        >{{ d.label }}</button>
      </div>

    </div>

    <!-- 表格区域 -->
    <div class="table-wrap">
      <table v-if="filtered.length" data-name="waypoint-table" class="waypoint-table">
        <thead>
          <tr>
            <th>[维度]名称</th>
            <th>坐标 (X / Y / Z)</th>
            <th>备注</th>
            <th>贡献者</th>
            <th>操作</th>
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
            <td class="col-note">{{ wp.note || '—' }}</td>
            <td class="col-contributor">{{ wp.contributor || '—' }}</td>
            <td class="col-actions">
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
                  data-name="report-waypoint-btn"
                  class="copy-btn report-btn"
                  title="发起报错 Issue"
                  :disabled="!repoConfigured"
                  @click="openReportIssue(wp)"
                >⚠️ 报错</button>
              </div>

              <!-- 窄屏：… 折叠菜单 -->
              <div
                class="actions-compact"
                data-name="actions-compact"
                @mouseleave="closeActionsMenu"
              >
                <button
                  type="button"
                  data-name="actions-more-btn"
                  class="copy-btn more-btn"
                  title="更多操作"
                  :aria-expanded="openMenuId === wp.id"
                  @click.stop="toggleActionsMenu(wp.id)"
                >⋯</button>
                <div
                  v-if="openMenuId === wp.id"
                  class="actions-dropdown"
                  data-name="actions-dropdown"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    data-name="copy-coord-btn"
                    class="copy-btn dropdown-item"
                    :class="{ 'copy-btn--ok': copiedId === `${wp.id}-coord` }"
                    @click="onMenuCopy(`${wp.x} ${wp.y} ${wp.z}`, `${wp.id}-coord`)"
                  >{{ copiedId === `${wp.id}-coord` ? '✓ 已复制' : '📋 复制坐标' }}</button>
                  <button
                    type="button"
                    role="menuitem"
                    data-name="copy-tp-btn"
                    class="copy-btn dropdown-item"
                    :class="{ 'copy-btn--ok': copiedId === `${wp.id}-tp` }"
                    @click="onMenuCopy(`/tp ${wp.x} ${wp.y} ${wp.z}`, `${wp.id}-tp`)"
                  >{{ copiedId === `${wp.id}-tp` ? '✓ 已复制' : '/tp 复制指令' }}</button>
                  <button
                    type="button"
                    role="menuitem"
                    data-name="report-waypoint-btn"
                    class="copy-btn report-btn dropdown-item"
                    :disabled="!repoConfigured"
                    @click="onMenuReport(wp)"
                  >⚠️ 报错</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div v-else data-name="empty-state" class="state-box">
        <p v-if="searchText || dimFilter">🔍 没有匹配的坐标点，试试调整筛选条件</p>
        <p v-else>📭 还没有坐标点</p>
      </div>
    </div>

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
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '../composables/useClipboard.js'

const waypoints = inject('waypoints')
const config = inject('config')
const { copy, copiedId } = useClipboard()

const repoConfigured = computed(() => {
  return !!(config.value?.github_repo && config.value.github_repo !== 'yourname/yourrepo')
})

// 窄屏操作菜单：同一时间只开一行
const openMenuId = ref(null)

function toggleActionsMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeActionsMenu() {
  openMenuId.value = null
}

function onDocPointerDown(e) {
  if (!openMenuId.value) return
  const el = e.target
  if (el && typeof el.closest === 'function' && el.closest('[data-name="actions-compact"]')) return
  closeActionsMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
})

// --- 搜索与筛选 ---
const searchText = ref('')
const dimFilter = ref('')

const dimFilters = [
  { label: '全部', value: '' },
  { label: '🟢 主世界', value: 'overworld' },
  { label: '🔴 下界/地狱', value: 'nether' },
  { label: '🟣 末地', value: 'end' }
]


const filtered = computed(() => {
  let list = waypoints.value

  // 搜索
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(wp =>
      (wp.name || '').toLowerCase().includes(q) ||
      (wp.category || '').toLowerCase().includes(q) ||
      (wp.note || '').toLowerCase().includes(q)
    )
  }

  // 维度
  if (dimFilter.value) {
    list = list.filter(wp => wp.dimension === dimFilter.value)
  }


  return list
})

// --- 辅助 ---
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

function openReportIssue(wp) {
  if (!repoConfigured.value) return
  const repo = config.value.github_repo
  const title = encodeURIComponent(`[报错] ${wp.name || '未命名'}`)
  const waypoint_id = encodeURIComponent(wp.id || '')
  const name = encodeURIComponent(wp.name || '')
  const coords = encodeURIComponent(`${wp.x} ${wp.y} ${wp.z}`)
  const dimension = encodeURIComponent(wp.dimension || '')
  // problem_type / detail 留给用户在 GitHub 表单里选填
  let url = `https://github.com/${repo}/issues/new?template=report-waypoint.yml&labels=waypoint-report&title=${title}`
  if (waypoint_id) url += `&waypoint_id=${waypoint_id}`
  if (name) url += `&name=${name}`
  if (coords) url += `&coords=${coords}`
  if (dimension) url += `&dimension=${dimension}`
  window.open(url, '_blank')
}

function onMenuReport(wp) {
  openReportIssue(wp)
  closeActionsMenu()
}
</script>

<style scoped>
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
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  background: #12122a;
  color: #e0e0e0;
  font-size: 0.9rem;
  outline: none;
}
.search-input:focus { border-color: #5fdc5f; }

.filter-group { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.filter-btn {
  padding: 0.3rem 0.65rem;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  background: #12122a;
  color: #999;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.filter-btn:hover { border-color: #5fdc5f; color: #ccc; }
.filter-btn--active { background: #1a3a1a; border-color: #5fdc5f; color: #5fdc5f; }

/* ===== 表格 ===== */
.table-wrap { overflow-x: auto; }
.waypoint-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.waypoint-table th {
  text-align: left;
  padding: 0.55rem 0.6rem;
  border-bottom: 2px solid #2a2a4a;
  color: #aaa;
  font-weight: 600;
  white-space: nowrap;
}
.waypoint-table td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #1e1e3a;
  white-space: nowrap;
}
.waypoint-table tbody tr:hover { background: #1e1e3a; }

.col-name { font-weight: 600; color: #fff; }
.name-with-dim {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  max-width: 100%;
}
.dim-dot { flex-shrink: 0; font-size: 0.85em; line-height: 1; }
.col-coords code {
  font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace;
  font-size: 0.82rem;
  color: #ffd700;
  background: #12121e;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}
.col-note {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #999;
}
.col-contributor { color: #888; }
.col-actions {
  position: relative;
  display: flex;
  gap: 0.3rem;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  overflow: visible;
}
.actions-inline {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  flex-wrap: wrap;
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
.actions-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 40;
  min-width: 9.5rem;
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: #16162c;
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
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
  .col-note { max-width: 120px; }
}

/* ===== 维度着色（名称前缀） ===== */
.name-with-dim.dim-ow { color: #86efac; }
.name-with-dim.dim-nether { color: #fca5a5; }
.name-with-dim.dim-end { color: #d8b4fe; }


/* ===== 复制按钮 ===== */
.copy-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  background: #12122a;
  color: #aaa;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all .15s;
  min-width: 2.3em;
}
.copy-btn:hover { border-color: #5fdc5f; color: #5fdc5f; }
.copy-btn--ok { border-color: #5fdc5f; color: #5fdc5f; background: #1a3a1a; }
.copy-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.report-btn { color: #fbbf24; min-width: auto; white-space: nowrap; }
.report-btn:hover:not(:disabled) { border-color: #fbbf24; color: #fbbf24; background: #2a2210; }

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
  border: 1px dashed #3a3a5a;
  border-radius: 6px;
  color: #5fdc5f;
  font-size: 0.85rem;
  transition: background .15s;
}
.submit-link:hover { background: #1a3a1a; }
.submit-link--primary {
  border-style: solid;
  border-color: #5fdc5f;
  background: #1a3a1a;
  color: #5fdc5f;
  font-weight: 600;
}
.submit-link--primary:hover { background: #2a4a2a; }
</style>
