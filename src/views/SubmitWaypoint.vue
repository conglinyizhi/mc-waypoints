<template>
  <div class="submit-page">
    <p class="desc">
      在此填写坐标信息，点击按钮后将通过 URL 参数自动填充
      <strong>GitHub Issue 模板</strong>，在新标签页中打开。
    </p>

    <div class="form-card">
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

      <button
        ref="submitBtnRef"
        data-name="submit-github-btn"
        class="submit-btn"
        :disabled="!canSubmit"
        @click="openIssue"
        @keydown.enter.prevent="openIssue"
      >
        🚀 通过 URL 发起 GitHub Issue
      </button>
      <p v-if="!repoConfigured" class="hint-warn">
        ⚠️ 请先在 <code>config.json</code> 中配置 <code>github_repo</code> 字段
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, inject, ref, nextTick } from 'vue'

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

const fieldRefs = [nameRef, coordsRef, dimensionRef, noteRef, submitBtnRef]

function focusNext(index) {
  const next = fieldRefs[index + 1]
  if (next?.value) {
    nextTick(() => {
      next.value.focus()
      // input 全选文本方便覆盖；select 不处理
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

// 解析坐标：支持空格或逗号分隔，不可混用
const parsedCoords = computed(() => {
  const raw = form.coordsRaw.trim()
  if (!raw) return null

  // 检测分隔符类型
  const hasComma = raw.includes(',')
  const hasSpace = /\s/.test(raw)

  if (hasComma && hasSpace) {
    // 混用了逗号和空格，但可能是 "X, Y, Z" 格式（逗号+可选空格）
    // 先尝试用逗号分割后 trim
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length === 3) {
      const nums = parts.map(Number)
      if (nums.every(n => !isNaN(n))) return { x: nums[0], y: nums[1], z: nums[2] }
    }
    return null // 解析失败由 coordError 处理
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
  const hasSpace = /\s/.test(raw)
  const parts = hasComma
    ? raw.split(',').filter(Boolean)
    : raw.split(/\s+/).filter(Boolean)

  if (hasComma && hasSpace && parts.length === 3) {
    // 逗号分隔但混入了额外空格，检查是否是数字
    const testParts = raw.split(',').map(s => s.trim()).filter(Boolean)
    if (testParts.length === 3 && testParts.every(s => !isNaN(Number(s)))) {
      return '' // parsedCoords 应该已经成功了
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

const previewTitle = computed(() => {
  const name = form.name.trim() || '未命名'
  return `[坐标] ${name}`
})

function dimLabel(d) {
  const map = { overworld: '主世界', nether: '下界', end: '末地' }
  return map[d] || d
}

function openIssue() {
  if (!canSubmit.value) return

  const repo = config.value.github_repo
  const title = encodeURIComponent(previewTitle.value)
  const name = encodeURIComponent(form.name.trim())
  const { x, y, z } = parsedCoords.value
  const coords = encodeURIComponent(`${x} ${y} ${z}`)
  const dimensionValue = { overworld: '主世界 (overworld)', nether: '下界 (nether)', end: '末地 (end)' }[form.dimension]
  const dimension = encodeURIComponent(dimensionValue)
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
  max-width: 520px;
  width: 100%;
}

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

/* 按钮 */
.submit-btn {
  margin-top: 1rem;
  width: 100%;
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
</style>
