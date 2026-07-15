<template>
  <div class="report-page" data-name="report-page">
    <!-- 无目标 id -->
    <div v-if="!targetId" data-name="report-missing-id" class="state-box">
      <p>⚠️ 未指定坐标点</p>
      <router-link to="/" class="submit-link">← 返回坐标列表</router-link>
    </div>

    <div v-else-if="loadingList" class="state-box"><p>⏳ 加载坐标数据…</p></div>
    <div v-else-if="!target" data-name="report-not-found" class="state-box state-error">
      <p>❌ 未找到记录 <code>{{ targetId }}</code></p>
      <router-link to="/" class="submit-link">← 返回坐标列表</router-link>
    </div>

    <template v-else>
      <div class="page-head">
        <router-link to="/" data-name="report-back-top" class="back-link">← 返回列表</router-link>
        <h1 class="page-title">
          <span class="dim-dot" aria-hidden="true">{{ dimEmoji(target.dimension) }}</span>
          {{ target.name || '未命名' }}
        </h1>
        <p class="page-sub">坐标详情</p>
      </div>

      <!-- 详情（默认展示） -->
      <section class="form-card" data-name="report-current">
        <h2 class="card-title">记录信息</h2>
        <dl class="current-grid">
          <div>
            <dt>名称</dt>
            <dd>{{ target.name || '—' }}</dd>
          </div>
          <div>
            <dt>坐标</dt>
            <dd class="mono">{{ target.x }} {{ target.y }} {{ target.z }}</dd>
          </div>
          <div>
            <dt>维度</dt>
            <dd>{{ dimLabel(target.dimension) }}</dd>
          </div>
          <div>
            <dt>备注</dt>
            <dd>{{ displayNote(target.note) }}</dd>
          </div>
          <div>
            <dt>贡献者</dt>
            <dd>{{ target.contributor || '—' }}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd class="faint">{{ formatTime(target.createdAt) }}</dd>
          </div>
          <div v-if="target.updatedAt">
            <dt>更新时间</dt>
            <dd class="faint">{{ formatTime(target.updatedAt) }}</dd>
          </div>
          <div class="full">
            <dt>ID</dt>
            <dd class="mono faint">{{ target.id }}</dd>
          </div>
        </dl>

        <div class="detail-actions">
          <button
            type="button"
            data-name="detail-copy-coord"
            class="chip-btn"
            :class="{ 'chip-btn--ok': copiedId === 'detail-coord' }"
            @click="doCopy(`${target.x} ${target.y} ${target.z}`, 'detail-coord')"
          >
            {{ copiedId === 'detail-coord' ? '✓ 已复制' : '📋 复制坐标' }}
          </button>
          <button
            type="button"
            data-name="detail-copy-tp"
            class="chip-btn"
            :class="{ 'chip-btn--ok': copiedId === 'detail-tp' }"
            @click="doCopy(`/tp ${target.x} ${target.y} ${target.z}`, 'detail-tp')"
          >
            {{ copiedId === 'detail-tp' ? '✓ 已复制' : '/tp 复制指令' }}
          </button>
          <button
            type="button"
            data-name="detail-to-converter"
            class="chip-btn chip-btn--converter"
            :title="converterBtnTitle"
            @click="sendToConverter"
          >
            🔢 写入换算器
          </button>
        </div>
      </section>

      <!-- 报错区：默认折叠 -->
      <section class="form-card report-fold" data-name="report-fold" :class="{ 'report-fold--open': reportOpen }">
        <button
          type="button"
          data-name="report-fold-toggle"
          class="fold-toggle"
          :aria-expanded="reportOpen"
          @click="toggleReport"
        >
          <span class="fold-icon" aria-hidden="true">{{ reportOpen ? '▾' : '▸' }}</span>
          <span class="fold-title">⚠️ 发现错误？提交修正</span>
          <span class="fold-hint">{{ reportOpen ? '收起' : '展开报错表单' }}</span>
        </button>

        <div v-show="reportOpen" class="fold-body" data-name="report-fold-body">
          <p class="desc">
            勾选需要修改的字段并填写新值，确认后会打开 GitHub Issue。
            维护者回复 <code>通过</code> / <code>ok</code> 后，CI 会自动改 data 分支。
          </p>

          <div class="sub-block" data-name="report-action">
            <h3 class="sub-title">操作类型</h3>
            <div class="action-toggle">
              <label class="toggle-opt" :class="{ 'toggle-opt--on': action === 'update' }">
                <input v-model="action" type="radio" value="update" data-name="report-action-update" />
                修正字段
              </label>
              <label class="toggle-opt" :class="{ 'toggle-opt--on': action === 'delete' }">
                <input v-model="action" type="radio" value="delete" data-name="report-action-delete" />
                删除整条
              </label>
            </div>
            <p v-if="action === 'delete'" class="hint-warn">将请求删除该坐标点，请在说明里写清原因。</p>
          </div>

          <div v-if="action === 'update'" class="sub-block" data-name="report-fields">
            <h3 class="sub-title">要修改的字段</h3>
            <p class="field-hint">勾选后填写新值；未勾选的字段保持不变。</p>

            <label class="field-row" :class="{ 'field-row--on': flags.name }">
              <input v-model="flags.name" type="checkbox" data-name="report-flag-name" />
              <span class="field-key">名称</span>
              <input
                v-model="draft.name"
                type="text"
                data-name="report-new-name"
                class="field-input"
                :disabled="!flags.name"
                :placeholder="target.name"
              />
            </label>

            <label class="field-row" :class="{ 'field-row--on': flags.coords }">
              <input v-model="flags.coords" type="checkbox" data-name="report-flag-coords" />
              <span class="field-key">坐标</span>
              <input
                v-model="draft.coordsRaw"
                type="text"
                data-name="report-new-coords"
                class="field-input mono"
                :disabled="!flags.coords"
                :placeholder="`${target.x} ${target.y} ${target.z}`"
              />
            </label>
            <p v-if="flags.coords && coordsError" class="field-hint field-hint--err">{{ coordsError }}</p>

            <label class="field-row" :class="{ 'field-row--on': flags.dimension }">
              <input v-model="flags.dimension" type="checkbox" data-name="report-flag-dimension" />
              <span class="field-key">维度</span>
              <select
                v-model="draft.dimension"
                data-name="report-new-dimension"
                class="field-input"
                :disabled="!flags.dimension"
              >
                <option value="overworld">🟢 主世界（Overworld）</option>
                <option value="nether">🔴 下界 / 地狱（Nether）</option>
                <option value="end">🟣 末地（The End）</option>
              </select>
            </label>

            <label class="field-row" :class="{ 'field-row--on': flags.note }">
              <input v-model="flags.note" type="checkbox" data-name="report-flag-note" />
              <span class="field-key">备注</span>
              <input
                v-model="draft.note"
                type="text"
                data-name="report-new-note"
                class="field-input"
                :disabled="!flags.note"
                :placeholder="target.note || '（空备注）'"
              />
            </label>
            <p v-if="flags.note" class="field-hint">若要清空备注，可填 <code>-</code></p>
          </div>

          <div class="sub-block" data-name="report-detail">
            <h3 class="sub-title">问题说明 <span class="req">*</span></h3>
            <textarea
              v-model="detail"
              data-name="report-detail-input"
              class="detail-input"
              rows="4"
              placeholder="例如：实际坐标偏了约 30 格；该建筑已拆除，建议删除。"
            />
          </div>

          <div class="sub-block preview" data-name="report-preview">
            <h3 class="sub-title">变更预览</h3>
            <ul class="preview-list">
              <li v-if="action === 'delete'" class="preview-del">将删除整条记录</li>
              <template v-else>
                <li v-if="!hasAnyFlag" class="preview-empty">尚未勾选任何字段</li>
                <li v-if="flags.name">
                  名称：{{ target.name }} → <strong>{{ draft.name || '（空）' }}</strong>
                </li>
                <li v-if="flags.coords">
                  坐标：
                  <span class="mono">{{ target.x }} {{ target.y }} {{ target.z }}</span>
                  →
                  <strong class="mono">{{ draft.coordsRaw || '（空）' }}</strong>
                </li>
                <li v-if="flags.dimension">
                  维度：{{ dimLabel(target.dimension) }} →
                  <strong>{{ dimLabel(draft.dimension) }}</strong>
                </li>
                <li v-if="flags.note">
                  备注：{{ displayNote(target.note) }} →
                  <strong>{{ draft.note === '-' ? '（清空）' : (draft.note || '（空）') }}</strong>
                </li>
              </template>
            </ul>
          </div>

          <div class="action-row">
            <button
              type="button"
              data-name="report-submit"
              class="btn-primary"
              :disabled="!canSubmit"
              @click="openIssue"
            >
              通过 GitHub Issue 提交报错
            </button>
            <div class="action-row-right">
              <button
                type="button"
                data-name="report-fold-cancel"
                class="btn-ghost"
                @click="reportOpen = false"
              >
                收起
              </button>
              <button
                type="button"
                data-name="report-clear-btn"
                class="btn-danger-ghost"
                :disabled="!hasReportDraft"
                @click="showClearDialog = true"
              >
                清空表单
              </button>
            </div>
          </div>
          <p v-if="!repoConfigured" class="hint-warn">未配置 github_repo，无法发起 Issue。</p>
        </div>
      </section>

      <!-- 清空报错表单 · 拟态确认 -->
      <div
        v-if="showClearDialog"
        class="modal-overlay"
        data-name="report-clear-dialog"
        @click.self="showClearDialog = false"
        @keydown.esc="showClearDialog = false"
      >
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="report-clear-title">
          <h3 id="report-clear-title" class="modal-title">确认清空报错表单？</h3>
          <p class="modal-body">
            将清空已勾选的修正项、新填写内容与问题说明，并重置为「修正字段」。此操作不可撤销。
          </p>
          <div class="modal-actions">
            <button
              type="button"
              data-name="report-clear-cancel"
              class="btn-ghost"
              @click="showClearDialog = false"
            >取消</button>
            <button
              type="button"
              data-name="report-clear-confirm"
              class="btn-danger"
              @click="confirmClearReport"
            >确认清空</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '../composables/useClipboard.js'

const route = useRoute()
const router = useRouter()
const waypoints = inject('waypoints')
const config = inject('config')
const loadingList = inject('loading')
const { copy, copiedId } = useClipboard()

const targetId = computed(() => String(route.query.id || '').trim())

const target = computed(() => {
  const id = targetId.value
  if (!id) return null
  return (waypoints.value || []).find(w => String(w.id) === id) || null
})

/** 报错表单默认折叠 */
const reportOpen = ref(false)
const showClearDialog = ref(false)

const action = ref('update')
const detail = ref('')
const flags = reactive({
  name: false,
  coords: false,
  dimension: false,
  note: false
})
const draft = reactive({
  name: '',
  coordsRaw: '',
  dimension: 'overworld',
  note: ''
})

function resetReportForm(wp) {
  const t = wp || target.value
  draft.name = t?.name || ''
  draft.coordsRaw = t ? `${t.x} ${t.y} ${t.z}` : ''
  draft.dimension = t?.dimension || 'overworld'
  draft.note = t?.note || ''
  flags.name = false
  flags.coords = false
  flags.dimension = false
  flags.note = false
  action.value = 'update'
  detail.value = ''
}

watch(target, (wp) => {
  if (!wp) return
  resetReportForm(wp)
  reportOpen.value = false
  showClearDialog.value = false
}, { immediate: true })

watch(showClearDialog, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

/** 表单是否有可清空内容（勾选 / 说明 / 非默认操作） */
const hasReportDraft = computed(() => {
  if (action.value === 'delete') return true
  if (detail.value.trim()) return true
  if (flags.name || flags.coords || flags.dimension || flags.note) return true
  return false
})

function confirmClearReport() {
  resetReportForm(target.value)
  showClearDialog.value = false
}

const repoConfigured = computed(() => {
  const r = config.value?.github_repo
  return !!(r && r !== 'yourname/yourrepo')
})

function dimLabel(d) {
  const map = {
    overworld: '🟢 主世界（Overworld）',
    nether: '🔴 下界 / 地狱（Nether）',
    end: '🟣 末地（The End）'
  }
  return map[d] || d || '—'
}

function dimEmoji(d) {
  const map = { overworld: '🟢', nether: '🔴', end: '🟣' }
  return map[d] || '⚪'
}

function displayNote(note) {
  const s = String(note ?? '').trim()
  if (!s || /^_?No\s*response_?$/i.test(s)) return '—'
  return s
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch {
    return String(iso)
  }
}

function parseCoords(raw) {
  const s = String(raw || '').trim()
  if (!s) return { error: '坐标为空' }
  const hasComma = s.includes(',')
  let parts
  if (hasComma) parts = s.split(',').map(p => p.trim()).filter(Boolean)
  else parts = s.split(/\s+/).filter(Boolean)
  if (parts.length !== 3) return { error: `需要 3 个数字，当前 ${parts.length} 个` }
  const nums = parts.map(Number)
  if (nums.some(n => Number.isNaN(n))) return { error: '坐标必须为数字' }
  return { x: nums[0], y: nums[1], z: nums[2] }
}

const coordsError = computed(() => {
  if (!flags.coords) return ''
  const r = parseCoords(draft.coordsRaw)
  return r.error || ''
})

const hasAnyFlag = computed(() => flags.name || flags.coords || flags.dimension || flags.note)

const canSubmit = computed(() => {
  if (!repoConfigured.value || !target.value) return false
  if (!detail.value.trim()) return false
  if (action.value === 'delete') return true
  if (!hasAnyFlag.value) return false
  if (flags.name && !draft.name.trim()) return false
  if (flags.coords && coordsError.value) return false
  if (flags.dimension && !['overworld', 'nether', 'end'].includes(draft.dimension)) return false
  return true
})

function toggleReport() {
  reportOpen.value = !reportOpen.value
}

async function doCopy(text, id) {
  await copy(text, id)
}

const converterBtnTitle = computed(() => {
  const d = target.value?.dimension
  if (d === 'nether') return '将下界坐标写入换算器（可切换为主世界）'
  if (d === 'overworld') return '将主世界坐标写入换算器（可切换为下界）'
  if (d === 'end') return '将坐标写入换算器（末地无 8:1，默认按主世界方向）'
  return '写入下界/主世界坐标换算器'
})

/** 带着当前点 X/Y/Z 与维度跳到小工具·换算器 */
function sendToConverter() {
  const wp = target.value
  if (!wp) return
  const from = wp.dimension === 'nether' ? 'nether' : 'overworld'
  router.push({
    name: 'tools',
    query: {
      tab: 'converter',
      x: String(wp.x),
      y: String(wp.y),
      z: String(wp.z),
      from
    }
  })
}

function openIssue() {
  if (!canSubmit.value) return
  const wp = target.value
  const repo = config.value.github_repo
  const title = encodeURIComponent(`[报错] ${wp.name || '未命名'}`)
  const waypoint_id = encodeURIComponent(wp.id)
  const current_name = encodeURIComponent(wp.name || '')
  const current_coords = encodeURIComponent(`${wp.x} ${wp.y} ${wp.z}`)
  const current_dimension = encodeURIComponent(wp.dimension || '')
  const current_note = encodeURIComponent(wp.note || '')
  const act = encodeURIComponent(action.value)
  const detailEnc = encodeURIComponent(detail.value.trim())

  let url = `https://github.com/${repo}/issues/new?template=report-waypoint.yml&labels=ci:report_waypoint&title=${title}`
  url += `&waypoint_id=${waypoint_id}`
  url += `&current_name=${current_name}`
  url += `&current_coords=${current_coords}`
  url += `&current_dimension=${current_dimension}`
  if (current_note) url += `&current_note=${current_note}`
  url += `&action=${act}`
  url += `&detail=${detailEnc}`

  if (action.value === 'update') {
    if (flags.name) url += `&new_name=${encodeURIComponent(draft.name.trim())}`
    if (flags.coords) url += `&new_coords=${encodeURIComponent(draft.coordsRaw.trim())}`
    if (flags.dimension) url += `&new_dimension=${encodeURIComponent(draft.dimension)}`
    if (flags.note) {
      const n = draft.note.trim() || '-'
      url += `&new_note=${encodeURIComponent(n)}`
    }
  }

  window.open(url, '_blank')
}
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;
@use '../styles/mixins' as *;

.page-head {
  margin-bottom: 0.9rem;
}

.back-link {
  display: inline-block;
  font-size: 0.82rem;
  color: $text-faint;
  margin-bottom: 0.45rem;
  transition: color 0.15s;

  &:hover { color: $accent; }
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 1.25rem;
  color: $text-bright;
  line-height: 1.3;
  word-break: break-word;
}

.dim-dot { flex-shrink: 0; font-size: 0.9em; }

.page-sub {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: $text-ghost;
}

.form-card {
  @include panel-card;
  padding: 1rem 1.1rem;
  margin-bottom: 0.85rem;
}

.card-title {
  color: $text-bright;
  font-size: 0.95rem;
  margin-bottom: 0.7rem;
}

.req { color: $danger; }

.current-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 1rem;

  dt {
    color: $text-faint;
    font-size: 0.75rem;
    margin-bottom: 0.1rem;
  }
  dd {
    color: $text;
    font-size: 0.9rem;
    word-break: break-word;
  }
  .full { grid-column: 1 / -1; }
  .faint { color: $text-ghost; font-size: 0.8rem; }
  .mono { font-family: $font-mono; color: $gold; }
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid $border;
}

.chip-btn {
  @include btn-chip;
  min-height: 1.85rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;

  &--ok {
    border-color: $accent;
    color: $accent;
    background: $accent-bg;
  }

  &--converter {
    color: $info-soft;
    border-color: $info-border;

    &:hover:not(:disabled) {
      border-color: $info;
      color: $info;
      background: $info-bg-hover;
    }
  }
}

/* 折叠报错 */
.report-fold {
  padding: 0;
  overflow: hidden;

  &--open {
    border-color: $warn-border;
  }
}

.fold-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 1.1rem;
  border: none;
  background: transparent;
  color: $text;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: $warn-bg;
  }
}

.fold-icon {
  color: $warn;
  font-size: 0.85rem;
  width: 0.9rem;
  flex-shrink: 0;
}

.fold-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: $warn;
  flex: 1 1 auto;
}

.fold-hint {
  font-size: 0.75rem;
  color: $text-ghost;
  flex-shrink: 0;
}

.fold-body {
  padding: 0 1.1rem 1.1rem;
  border-top: 1px solid $border;
}

.desc {
  color: $text-soft;
  font-size: 0.85rem;
  margin: 0.85rem 0 0.75rem;
  line-height: 1.6;

  code {
    color: $gold;
    font-family: $font-mono;
    font-size: 0.82rem;
  }
}

.sub-block {
  margin-bottom: 0.85rem;
}

.sub-title {
  color: $text-bright;
  font-size: 0.88rem;
  margin: 0 0 0.55rem;
  font-weight: 600;
}

.action-toggle {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toggle-opt {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  color: $text-dim;
  cursor: pointer;
  font-size: 0.88rem;

  &--on {
    border-color: $accent;
    background: $accent-bg;
    color: $accent;
  }

  input { accent-color: $accent; }
}

.field-hint {
  font-size: 0.75rem;
  color: $text-ghost;
  margin: 0 0 0.65rem;

  code { color: $gold; font-family: $font-mono; }
  &--err { color: $danger; margin-top: -0.25rem; margin-bottom: 0.55rem; }
}

.field-row {
  display: grid;
  grid-template-columns: auto 3.2rem 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 0.55rem;
  border: 1px solid $border;
  border-radius: $radius-md;
  margin-bottom: 0.45rem;
  background: $bg-input;

  &--on {
    border-color: $accent;
    background: $accent-bg;
  }

  input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    accent-color: $accent;
  }
}

.field-key {
  color: $text-faint;
  font-size: 0.78rem;
}

.field-input {
  @include input-dark;
  width: 100%;
  padding: 0.4rem 0.55rem;
  font-size: 0.88rem;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &.mono { font-family: $font-mono; }
}

.detail-input {
  @include input-dark;
  width: 100%;
  padding: 0.55rem 0.65rem;
  font-size: 0.88rem;
  resize: vertical;
  min-height: 5rem;
  font-family: inherit;
}

.preview-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.88rem;
  color: $text-muted;

  strong { color: $accent; }
  .mono { font-family: $font-mono; color: $gold; }
  .preview-del { color: $danger; font-weight: 600; }
  .preview-empty { color: $text-ghost; }
}

.action-row {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.action-row-right {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  margin-left: auto;
}

.btn-primary {
  @include btn-primary;
  flex: 1 1 12rem;
  min-width: 10rem;
}

.btn-ghost {
  @include btn-ghost;
}

.btn-danger-ghost {
  @include btn-ghost;
  color: $danger;
  border-color: $danger-border;

  &:hover:not(:disabled) {
    border-color: $danger;
    color: $danger;
    background: $danger-bg;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.btn-danger {
  @include btn-danger;
  padding: 0.45rem 0.95rem;
  font-size: 0.88rem;
}

/* 拟态对话框 */
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
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.hint-warn {
  margin-top: 0.55rem;
  font-size: 0.78rem;
  color: $danger;
}

.submit-link {
  display: inline-block;
  margin-top: 0.8rem;
  color: $accent;
}

.state-error code {
  color: $gold;
  font-family: $font-mono;
}

@include mq-xs {
  .current-grid { grid-template-columns: 1fr; }
  .field-row {
    grid-template-columns: auto 1fr;
    .field-key { grid-column: 2; }
    .field-input { grid-column: 1 / -1; }
  }
}
</style>
