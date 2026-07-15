<template>
  <div class="submit-page">
    <p class="desc">
      在此填写坐标信息，点击按钮后将通过 URL 参数自动填充
      <strong>GitHub Issue 模板</strong>，在新标签页中打开。
      也可把整段坐标描述贴进下方「智能解析」一键拆分。
    </p>

    <div class="form-card">
      <!-- 智能解析入口 -->
      <div class="smart-box" data-name="submit-smart-box">
        <div class="smart-head">
          <span class="smart-title">🧠 智能解析</span>
          <span class="smart-tip">粘贴如「大叔牌沼泽刷怪塔X2725 Y64 Z5950」</span>
        </div>
        <textarea
          ref="smartRef"
          v-model="smartText"
          data-name="submit-smart-input"
          class="smart-input"
          rows="2"
          placeholder="大叔牌沼泽刷怪塔X2725 Y64 Z5950&#10;或：猪人塔 x: -120 y: 80 z: 340 下界"
          @keydown.ctrl.enter.prevent="openParseDialog"
          @keydown.meta.enter.prevent="openParseDialog"
        />
        <button
          type="button"
          data-name="submit-smart-parse-btn"
          class="smart-btn"
          :disabled="!smartText.trim()"
          @click="openParseDialog"
        >
          解析这段文字…
        </button>
      </div>

      <div class="form-grid">
        <!-- 名称 -->
        <label class="field-full">
          <span class="label-text">名称 <em class="req">*</em></span>
          <input ref="nameRef" v-model="form.name" data-name="submit-name" placeholder="我家" @keydown.enter.prevent="focusNext(0)" />
        </label>

        <!-- 坐标：单输入框，空格或逗号分隔 -->
        <label class="field-full">
          <span class="label-text">坐标 <em class="req">*</em></span>
          <input
            ref="coordsRef"
            v-model="form.coordsRaw"
            data-name="submit-coords"
            placeholder="-512 64 1024  或  -512,64,1024"
            :class="{ 'input-err': form.coordsRaw && coordError }"
            @keydown.enter.prevent="focusNext(1)"
          />
          <span v-if="coordError" class="field-hint field-hint--err">{{ coordError }}</span>
          <span v-else-if="parsedCoords" class="field-hint field-hint--ok">
            X={{ parsedCoords.x }} Y={{ parsedCoords.y }} Z={{ parsedCoords.z }}
          </span>
        </label>

        <!-- 维度 -->
        <label class="field-half">
          <span class="label-text">维度 <em class="req">*</em></span>
          <select ref="dimensionRef" v-model="form.dimension" data-name="submit-dimension" @keydown.enter.prevent="focusNext(2)">
            <option value="overworld">主世界</option>
            <option value="nether">下界</option>
            <option value="end">末地</option>
          </select>
        </label>

        <!-- 备注 -->
        <label class="field-half">
          <span class="label-text">备注</span>
          <input ref="noteRef" v-model="form.note" data-name="submit-note" placeholder="可选说明…" @keydown.enter.prevent="focusNext(3)" />
        </label>
      </div>

      <!-- 预览 -->
      <div v-if="parsedCoords && form.name" class="preview-box">
        <div class="preview-header">Issue 预览</div>
        <div class="preview-body">
          <div><strong>标题：</strong>{{ previewTitle }}</div>
          <div><strong>坐标：</strong>{{ parsedCoords.x }} {{ parsedCoords.y }} {{ parsedCoords.z }}</div>
          <div><strong>维度：</strong>{{ dimLabel(form.dimension) }}</div>
          <div v-if="form.note"><strong>备注：</strong>{{ form.note }}</div>
        </div>
      </div>

      <div class="action-row">
        <button
          type="button"
          data-name="submit-clear-btn"
          class="clear-btn"
          :disabled="!hasAnyValue"
          @click="showClearDialog = true"
        >
          🗑 清空
        </button>
        <button
          ref="submitBtnRef"
          type="button"
          data-name="submit-github-btn"
          class="submit-btn"
          :disabled="!canSubmit"
          @click="openIssue"
          @keydown.enter.prevent="openIssue"
        >
          🚀 通过 URL 发起 GitHub Issue
        </button>
      </div>
      <p v-if="!repoConfigured" class="hint-warn">
        ⚠️ 请先在 <code>config.json</code> 中配置 <code>github_repo</code> 字段
      </p>
    </div>

    <!-- 清空确认对话框 -->
    <div
      v-if="showClearDialog"
      class="modal-overlay"
      data-name="submit-clear-dialog"
      @click.self="showClearDialog = false"
      @keydown.esc="showClearDialog = false"
    >
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="clear-dialog-title">
        <h3 id="clear-dialog-title" class="modal-title">确认清空？</h3>
        <p class="modal-body">将清空名称、坐标、维度、备注以及智能解析框中的内容。此操作不可撤销。</p>
        <div class="modal-actions">
          <button type="button" data-name="submit-clear-cancel" class="btn-ghost" @click="showClearDialog = false">取消</button>
          <button type="button" data-name="submit-clear-confirm" class="btn-danger" @click="confirmClear">确认清空</button>
        </div>
      </div>
    </div>

    <!-- 智能解析确认对话框 -->
    <div
      v-if="showParseDialog"
      class="modal-overlay"
      data-name="submit-parse-dialog"
      @click.self="closeParseDialog"
      @keydown.esc="closeParseDialog"
    >
      <div class="modal-card modal-card--wide" role="dialog" aria-modal="true" aria-labelledby="parse-dialog-title">
        <h3 id="parse-dialog-title" class="modal-title">解析结果 · 选择覆盖项</h3>

        <p v-if="!parseResult?.coords" class="parse-fail">
          ❌ 未能识别 XYZ 坐标。请确认文本中含有类似
          <code>X2725 Y64 Z5950</code> 或 <code>x:1 y:2 z:3</code> 的片段。
        </p>

        <template v-else>
          <p class="parse-src">原文：<span>{{ smartText.trim() }}</span></p>

          <div class="parse-fields">
            <label class="parse-row" :class="{ 'parse-row--disabled': !parseResult.name }">
              <input
                v-model="applyFlags.name"
                type="checkbox"
                data-name="parse-apply-name"
                :disabled="!parseResult.name"
              />
              <span class="parse-key">名称</span>
              <span class="parse-val">{{ parseResult.name || '（未识别）' }}</span>
              <span v-if="form.name && parseResult.name && form.name !== parseResult.name" class="parse-cur">
                当前：{{ form.name }}
              </span>
            </label>

            <label class="parse-row">
              <input v-model="applyFlags.coords" type="checkbox" data-name="parse-apply-coords" />
              <span class="parse-key">坐标</span>
              <span class="parse-val mono">
                {{ parseResult.coords.x }} {{ parseResult.coords.y }} {{ parseResult.coords.z }}
              </span>
              <span v-if="form.coordsRaw && form.coordsRaw !== coordsText(parseResult.coords)" class="parse-cur mono">
                当前：{{ form.coordsRaw }}
              </span>
            </label>

            <label class="parse-row" :class="{ 'parse-row--disabled': !parseResult.dimension }">
              <input
                v-model="applyFlags.dimension"
                type="checkbox"
                data-name="parse-apply-dimension"
                :disabled="!parseResult.dimension"
              />
              <span class="parse-key">维度</span>
              <span class="parse-val">
                {{ parseResult.dimension ? dimLabel(parseResult.dimension) : '（未识别，保持现状）' }}
              </span>
              <span v-if="parseResult.dimension && form.dimension !== parseResult.dimension" class="parse-cur">
                当前：{{ dimLabel(form.dimension) }}
              </span>
            </label>

            <label class="parse-row" :class="{ 'parse-row--disabled': !parseResult.note }">
              <input
                v-model="applyFlags.note"
                type="checkbox"
                data-name="parse-apply-note"
                :disabled="!parseResult.note"
              />
              <span class="parse-key">备注</span>
              <span class="parse-val">{{ parseResult.note || '（无剩余文本）' }}</span>
              <span v-if="form.note && parseResult.note && form.note !== parseResult.note" class="parse-cur">
                当前：{{ form.note }}
              </span>
            </label>
          </div>
        </template>

        <div class="modal-actions">
          <button type="button" data-name="submit-parse-cancel" class="btn-ghost" @click="closeParseDialog">取消</button>
          <button
            type="button"
            data-name="submit-parse-apply"
            class="btn-primary"
            :disabled="!canApplyParse"
            @click="applyParse"
          >
            应用到表单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, inject, ref, nextTick, watch } from 'vue'

const config = inject('config')

const repoConfigured = computed(() => {
  return !!(config.value.github_repo && config.value.github_repo !== 'yourname/yourrepo')
})

// 输入框引用，用于 Enter 跳转
const nameRef = ref(null)
const coordsRef = ref(null)
const dimensionRef = ref(null)
const noteRef = ref(null)
const submitBtnRef = ref(null)
const smartRef = ref(null)

const fieldRefs = [nameRef, coordsRef, dimensionRef, noteRef, submitBtnRef]

function focusNext(index) {
  const next = fieldRefs[index + 1]
  if (next?.value) {
    nextTick(() => {
      next.value.focus()
      if (typeof next.value.select === 'function' && next.value.tagName !== 'SELECT') {
        next.value.select()
      }
    })
  }
}

const form = reactive({
  name: '',
  coordsRaw: '',
  dimension: 'overworld',
  note: ''
})

const smartText = ref('')
const showClearDialog = ref(false)
const showParseDialog = ref(false)
const parseResult = ref(null)
const applyFlags = reactive({
  name: true,
  coords: true,
  dimension: false,
  note: false
})

const hasAnyValue = computed(() => {
  return !!(
    form.name.trim() ||
    form.coordsRaw.trim() ||
    form.note.trim() ||
    smartText.value.trim() ||
    form.dimension !== 'overworld'
  )
})

// 解析坐标：支持空格或逗号分隔，不可混用
const parsedCoords = computed(() => {
  const raw = form.coordsRaw.trim()
  if (!raw) return null

  const hasComma = raw.includes(',')
  const hasSpace = /\s/.test(raw)

  if (hasComma && hasSpace) {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length === 3) {
      const nums = parts.map(Number)
      if (nums.every(n => !isNaN(n))) return { x: nums[0], y: nums[1], z: nums[2] }
    }
    return null
  }

  let parts
  if (hasComma) {
    parts = raw.split(',').filter(Boolean)
  } else {
    parts = raw.split(/\s+/).filter(Boolean)
  }

  if (parts.length !== 3) return null
  const nums = parts.map(Number)
  if (nums.some(n => isNaN(n))) return null
  return { x: nums[0], y: nums[1], z: nums[2] }
})

const coordError = computed(() => {
  const raw = form.coordsRaw.trim()
  if (!raw) return ''
  if (parsedCoords.value) return ''

  const hasComma = raw.includes(',')
  const parts = hasComma
    ? raw.split(',').filter(Boolean)
    : raw.split(/\s+/).filter(Boolean)

  if (hasComma && /\s/.test(raw) && parts.length === 3) {
    const testParts = raw.split(',').map(s => s.trim()).filter(Boolean)
    if (testParts.length === 3 && testParts.every(s => !isNaN(Number(s)))) {
      return ''
    }
  }

  if (parts.length === 0) return ''
  if (parts.length < 3) return `只检测到 ${parts.length} 个数字，需要 X Y Z 三个`
  if (parts.length > 3) return `检测到 ${parts.length} 个数字，只需要 X Y Z 三个`
  if (parts.some(s => isNaN(Number(s)))) return '坐标必须为数字'
  return '格式不正确，请用空格或英文逗号分隔'
})

const canSubmit = computed(() => {
  return repoConfigured.value &&
    form.name.trim() &&
    parsedCoords.value &&
    !coordError.value
})

const canApplyParse = computed(() => {
  if (!parseResult.value?.coords) return false
  return applyFlags.name || applyFlags.coords || applyFlags.dimension || applyFlags.note
})

const previewTitle = computed(() => {
  const name = form.name.trim() || '未命名'
  return `[坐标] ${name}`
})

function dimLabel(d) {
  const map = { overworld: '主世界', nether: '下界', end: '末地' }
  return map[d] || d
}

function coordsText(c) {
  return `${c.x} ${c.y} ${c.z}`
}

/**
 * 从自由文本中拆出名称 / XYZ / 维度 / 备注
 * 支持：
 *   大叔牌沼泽刷怪塔X2725 Y64 Z5950
 *   猪人塔 x: -120 y: 80 z: 340 下界
 *   X=1, Y=2, Z=3 主世界 我家门口
 *   末地船 100 70 -200
 */
function smartParseText(text) {
  const raw = String(text || '').trim()
  if (!raw) {
    return { name: '', coords: null, dimension: null, note: '' }
  }

  let work = raw.replace(/\u00a0/g, ' ')
  let dimension = null
  let name = ''
  let note = ''
  let coords = null

  // 维度词摘取策略（避免「末地船」被切碎）：
  // 1) 独立词：两侧为边界（空白/标点/串端）→ 记维度并从文本中移除
  // 2) 名称前缀：串首「下界要塞」「主世界基地」等（维度词+常见后缀）→ 记维度但保留全名
  // 3) 不匹配无边界粘连（「末地船」只当名称）
  const dimTokenRe = [
    { re: /(主\s*世界|overworld)/i, dim: 'overworld' },
    { re: /(下\s*界|地\s*狱|nether)/i, dim: 'nether' },
    { re: /(末\s*地|the\s*end|\bend\b)/i, dim: 'end' }
  ]
  const placeSuffix = /^(要塞|门|传送门|门户|基地|家|城|村|塔|矿|洞|港|站|点|农场|交易所|刷怪|刷铁|仓库|中枢|枢纽)/
  const isBoundary = (ch) => !ch || /[\s,，、:：;；|｜\-_/（）()【】\[\]]/.test(ch)
  for (const { re, dim } of dimTokenRe) {
    const m = work.match(re)
    if (!m) continue
    const start = m.index
    const end = start + m[0].length
    const before = start === 0 ? '' : work[start - 1]
    const after = end >= work.length ? '' : work[end]
    const independent = isBoundary(before) && isBoundary(after)
    const rest = work.slice(end)
    const namePrefix = start === 0 && !isBoundary(after) && placeSuffix.test(rest)
    if (independent) {
      dimension = dim
      work = work.slice(0, start) + ' ' + work.slice(end)
      break
    }
    if (namePrefix) {
      // 只记录维度，不从名称中删除（「下界要塞」保持完整）
      dimension = dim
      break
    }
  }

  // 模式 A：带轴标签 X… Y… Z…（X2725 / X:2725 / x = 1 等）
  const labeled = work.match(
    /[xX]\s*[:=：]?\s*(-?\d+(?:\.\d+)?)\s*[,，\s]*[yY]\s*[:=：]?\s*(-?\d+(?:\.\d+)?)\s*[,，\s]*[zZ]\s*[:=：]?\s*(-?\d+(?:\.\d+)?)/
  )

  let matchSpan = null
  if (labeled) {
    coords = {
      x: Number(labeled[1]),
      y: Number(labeled[2]),
      z: Number(labeled[3])
    }
    matchSpan = { start: labeled.index, end: labeled.index + labeled[0].length }
  } else {
    // 模式 B：三个连续数字（空格/逗号分隔）
    const triple = work.match(/(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)/)
    if (triple) {
      coords = {
        x: Number(triple[1]),
        y: Number(triple[2]),
        z: Number(triple[3])
      }
      matchSpan = { start: triple.index, end: triple.index + triple[0].length }
    }
  }

  if (coords && matchSpan) {
    const before = work.slice(0, matchSpan.start)
    const after = work.slice(matchSpan.end)
    // 名称优先取坐标前的文本；坐标后的进备注
    name = before.replace(/[,，、:：\-\s]+$/g, '').replace(/^[,，、:：\-\s]+/g, '').trim()
    note = after.replace(/^[,，、:：\-\s]+/g, '').replace(/[,，、:：\-\s]+$/g, '').trim()

    // 先清掉占位词「坐标/coords」，再决定 name/note 归属
    name = name.replace(/(?:^|\s)(?:坐标|coords?)(?=\s|$)/ig, ' ').replace(/\s+/g, ' ').trim()
    note = note.replace(/(?:^|\s)(?:坐标|coords?)(?=\s|$)/ig, ' ').replace(/\s+/g, ' ').trim()

    // 若名称空而 after 像名字（无数字主导），互换
    if (!name && note && !/-?\d/.test(note)) {
      name = note
      note = ''
    }
  } else {
    // 完全没坐标：整段当名称（不剥「坐标」二字，避免误伤）
    name = work.replace(/\s+/g, ' ').trim()
  }

  return { name, coords, dimension, note }
}

function openParseDialog() {
  const result = smartParseText(smartText.value)
  parseResult.value = result

  // 默认勾选策略：
  // - 坐标：有则勾选
  // - 名称：解析出名称时勾选；若表单已有不同名称仍默认勾选（用户可取消）
  // - 维度：仅当解析出维度时默认勾选
  // - 备注：有剩余文本才默认勾选；若表单已有备注则默认不勾，避免误覆盖
  applyFlags.coords = !!result.coords
  applyFlags.name = !!result.name
  applyFlags.dimension = !!result.dimension
  applyFlags.note = !!result.note && !form.note.trim()

  showParseDialog.value = true
}

function closeParseDialog() {
  showParseDialog.value = false
}

function applyParse() {
  const r = parseResult.value
  if (!r) return

  if (applyFlags.name && r.name) form.name = r.name
  if (applyFlags.coords && r.coords) form.coordsRaw = coordsText(r.coords)
  if (applyFlags.dimension && r.dimension) form.dimension = r.dimension
  if (applyFlags.note && r.note) form.note = r.note

  showParseDialog.value = false
}

function confirmClear() {
  form.name = ''
  form.coordsRaw = ''
  form.dimension = 'overworld'
  form.note = ''
  smartText.value = ''
  parseResult.value = null
  showClearDialog.value = false
}

// 对话框打开时锁滚动
watch([showClearDialog, showParseDialog], ([a, b]) => {
  document.body.style.overflow = a || b ? 'hidden' : ''
})

function openIssue() {
  if (!canSubmit.value) return

  const repo = config.value.github_repo
  const title = encodeURIComponent(previewTitle.value)
  const name = encodeURIComponent(form.name.trim())
  const { x, y, z } = parsedCoords.value
  const coords = encodeURIComponent(`${x} ${y} ${z}`)
  // 维度模板字段已改为 input（非 dropdown），URL query 可稳定预填纯键。
  const dimension = encodeURIComponent(form.dimension)
  const note = form.note.trim() ? encodeURIComponent(form.note.trim()) : ''
  const labels = 'ci:add_waypoint'

  let url = `https://github.com/${repo}/issues/new?template=add-waypoint.yml&labels=${labels}&title=${title}&name=${name}&coords=${coords}&dimension=${dimension}`
  if (note) url += `&note=${note}`

  window.open(url, '_blank')
}
</script>

<style scoped>
.desc { color: #999; font-size: 0.85rem; margin-bottom: 1.2rem; line-height: 1.6; }
.desc strong { color: #60a5fa; }

.form-card {
  background: #12122a;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 560px;
  width: 100%;
}

/* 智能解析区 */
.smart-box {
  margin-bottom: 1.1rem;
  padding: 0.85rem;
  border: 1px dashed #3a4a6a;
  border-radius: 8px;
  background: #0e1528;
}
.smart-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 0.75rem;
  margin-bottom: 0.5rem;
}
.smart-title { color: #93c5fd; font-size: 0.88rem; font-weight: 600; }
.smart-tip { color: #666; font-size: 0.75rem; }
.smart-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.6rem;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  background: #0a0a1e;
  color: #e0e0e0;
  font-size: 0.88rem;
  font-family: system-ui, sans-serif;
  line-height: 1.45;
  resize: vertical;
  outline: none;
  min-height: 2.8rem;
}
.smart-input:focus { border-color: #60a5fa; }
.smart-btn {
  margin-top: 0.5rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid #60a5fa;
  border-radius: 4px;
  background: #152238;
  color: #93c5fd;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background .15s;
}
.smart-btn:hover:not(:disabled) { background: #1c2f4a; }
.smart-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.82rem;
  color: #888;
  min-width: 0;
}

.form-grid input,
.form-grid select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.55rem;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  background: #0a0a1e;
  color: #e0e0e0;
  font-size: 0.9rem;
  outline: none;
  font-family: 'Fira Code', monospace;
}
.form-grid input:focus,
.form-grid select:focus { border-color: #5fdc5f; }
.form-grid select { font-family: system-ui, sans-serif; }

.input-err { border-color: #f87171 !important; }

.field-full { grid-column: 1 / -1; }
.field-half { grid-column: span 1; }
.label-text { font-size: inherit; color: inherit; }
.req { color: #f87171; font-style: normal; }

.field-hint { font-size: 0.73rem; margin-top: 0.1rem; }
.field-hint--ok { color: #5fdc5f; font-family: 'Fira Code', monospace; }
.field-hint--err { color: #f87171; }

/* 预览 */
.preview-box {
  margin-top: 1rem;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  overflow: hidden;
}
.preview-header {
  background: #1a2a3a;
  padding: 0.4rem 0.8rem;
  font-size: 0.78rem;
  color: #60a5fa;
}
.preview-body {
  padding: 0.7rem 0.8rem;
  font-size: 0.82rem;
  color: #ccc;
  line-height: 1.7;
}
.preview-body strong { color: #999; }

/* 操作行 */
.action-row {
  margin-top: 1rem;
  display: flex;
  gap: 0.6rem;
  align-items: stretch;
}
.clear-btn {
  flex: 0 0 auto;
  padding: 0.7rem 0.95rem;
  border: 1px solid #5a3a3a;
  border-radius: 6px;
  background: #2a1515;
  color: #f87171;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
}
.clear-btn:hover:not(:disabled) { background: #3a1a1a; }
.clear-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.submit-btn {
  flex: 1 1 auto;
  padding: 0.7rem;
  border: 1px solid #5fdc5f;
  border-radius: 6px;
  background: #1a3a1a;
  color: #5fdc5f;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.submit-btn:hover:not(:disabled) { background: #2a4a2a; }
.submit-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.hint-warn {
  margin-top: 0.6rem;
  font-size: 0.78rem;
  color: #f87171;
  text-align: center;
}
.hint-warn code { color: #ffd700; }

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
  background: #15152c;
  border: 1px solid #3a3a5a;
  border-radius: 10px;
  padding: 1.25rem 1.35rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}
.modal-card--wide { max-width: 520px; }
.modal-title {
  color: #fff;
  font-size: 1.05rem;
  margin-bottom: 0.7rem;
}
.modal-body {
  color: #aaa;
  font-size: 0.88rem;
  line-height: 1.55;
  margin-bottom: 1.1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.1rem;
}
.btn-ghost,
.btn-danger,
.btn-primary {
  padding: 0.42rem 0.95rem;
  border-radius: 5px;
  font-size: 0.86rem;
  cursor: pointer;
  transition: background .15s;
}
.btn-ghost {
  border: 1px solid #3a3a5a;
  background: #12122a;
  color: #bbb;
}
.btn-ghost:hover { background: #1c1c36; }
.btn-danger {
  border: 1px solid #f87171;
  background: #3a1a1a;
  color: #f87171;
}
.btn-danger:hover { background: #4a2020; }
.btn-primary {
  border: 1px solid #5fdc5f;
  background: #1a3a1a;
  color: #5fdc5f;
  font-weight: 600;
}
.btn-primary:hover:not(:disabled) { background: #2a4a2a; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

/* 解析结果 */
.parse-fail {
  color: #f87171;
  font-size: 0.88rem;
  line-height: 1.55;
}
.parse-fail code {
  color: #ffd700;
  font-size: 0.82rem;
}
.parse-src {
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.85rem;
  line-height: 1.45;
  word-break: break-all;
}
.parse-src span { color: #bbb; }
.parse-fields {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.parse-row {
  display: grid;
  grid-template-columns: auto 3.2rem 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.55rem;
  row-gap: 0.1rem;
  align-items: center;
  padding: 0.55rem 0.65rem;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  background: #0e0e22;
  cursor: pointer;
  color: #ccc;
  font-size: 0.84rem;
}
.parse-row:has(input:checked) {
  border-color: #2f5f3a;
  background: #101c14;
}
.parse-row--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.parse-row input {
  grid-row: 1 / span 2;
  width: 1rem;
  height: 1rem;
  accent-color: #5fdc5f;
}
.parse-key { color: #888; font-size: 0.78rem; }
.parse-val { color: #e8e8e8; min-width: 0; word-break: break-word; }
.parse-val.mono,
.parse-cur.mono { font-family: 'Fira Code', monospace; }
.parse-cur {
  grid-column: 3;
  color: #666;
  font-size: 0.74rem;
  min-width: 0;
  word-break: break-word;
}

@media (max-width: 480px) {
  .action-row { flex-direction: column; }
  .clear-btn { width: 100%; }
  .parse-row {
    grid-template-columns: auto 1fr;
  }
  .parse-key { grid-column: 2; }
  .parse-val { grid-column: 2; }
  .parse-cur { grid-column: 2; }
}
</style>
