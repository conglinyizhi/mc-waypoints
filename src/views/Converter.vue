<template>
  <div class="converter-page" data-name="converter-page">
    <p class="desc">
      主世界与
      <strong>下界 / 地狱</strong>
      （Nether，同一维度的不同叫法）坐标比为
      <strong>8:1</strong>（Y 高度不变）。
      用于对齐传送门，减少串线。
      点击方向条可切换计算方向，<strong>输入坐标会保留</strong>。
    </p>
    <p class="alias-tip" data-name="converter-alias-tip">
      💡 文中的「下界」「地狱」「Nether」指同一个维度，不是三个地方。
    </p>

    <div class="conv-panel" data-name="converter-panel">
      <button
        type="button"
        class="dir-switch"
        data-name="converter-dir-switch"
        :title="dirHint"
        :aria-label="dirHint"
        @click="toggleDir"
      >
        <span class="dir-from">
          <span class="dir-emoji" aria-hidden="true">{{ fromMeta.emoji }}</span>
          {{ fromMeta.label }}
        </span>
        <span class="dir-arrow" aria-hidden="true">⇄</span>
        <span class="dir-to">
          <span class="dir-emoji" aria-hidden="true">{{ toMeta.emoji }}</span>
          {{ toMeta.label }}
        </span>
        <span class="dir-tip">点击切换方向（坐标保留）</span>
      </button>

      <div class="section-label">输入（{{ fromMeta.label }}）</div>
      <div class="input-row">
        <label>
          X
          <input
            v-model.number="inX"
            data-name="converter-in-x"
            type="number"
            step="any"
            placeholder="0"
          />
        </label>
        <label title="Y 不参与维度换算，复制 /tp 时沿用">
          Y
          <input
            v-model.number="inY"
            data-name="converter-in-y"
            type="number"
            step="any"
            placeholder="64"
          />
        </label>
        <label>
          Z
          <input
            v-model.number="inZ"
            data-name="converter-in-z"
            type="number"
            step="any"
            placeholder="0"
          />
        </label>
      </div>
      <p class="chunk-line" data-name="converter-in-chunk">
        输入所在区块：
        <template v-if="inChunk">
          <code>{{ inChunk.cx }}</code> , <code>{{ inChunk.cz }}</code>
          <span class="chunk-hint">（区块 = ⌊坐标 / 16⌋）</span>
        </template>
        <span v-else class="chunk-empty">—</span>
      </p>

      <div class="section-label">换算结果（{{ toMeta.label }}）</div>
      <div class="result-row">
        <output data-name="converter-result">
          <template v-if="hasResult">
            <code>{{ outX }}</code>
            /
            <code>{{ outYDisplay }}</code>
            /
            <code>{{ outZ }}</code>
          </template>
          <span v-else class="result-placeholder">输入 X、Z 后显示</span>
        </output>
      </div>
      <div v-if="hasResult" class="result-actions">
        <button
          type="button"
          data-name="converter-copy-coord"
          class="copy-btn"
          :class="{ 'copy-btn--ok': copiedId === 'conv-coord' }"
          @click="doCopy(resultCoordText, 'conv-coord')"
        >{{ copiedId === 'conv-coord' ? '✓ 已复制' : '📋 复制坐标' }}</button>
        <button
          type="button"
          data-name="converter-copy-tp"
          class="copy-btn"
          :class="{ 'copy-btn--ok': copiedId === 'conv-tp' }"
          @click="doCopy(resultTpText, 'conv-tp')"
        >{{ copiedId === 'conv-tp' ? '✓ 已复制' : '/tp 复制指令' }}</button>
      </div>
      <p class="chunk-line" data-name="converter-out-chunk">
        目标所在区块：
        <template v-if="outChunk">
          <code>{{ outChunk.cx }}</code> , <code>{{ outChunk.cz }}</code>
        </template>
        <span v-else class="chunk-empty">—</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useClipboard } from '../composables/useClipboard.js'

const route = useRoute()
const { copy, copiedId } = useClipboard()

/** 'ow2nether' | 'nether2ow' */
const dir = ref('ow2nether')

const inX = ref(null)
const inY = ref(null)
const inZ = ref(null)

const fromMeta = computed(() =>
  dir.value === 'ow2nether'
    ? { emoji: '🟢', label: '主世界' }
    : { emoji: '🔴', label: '下界/地狱' }
)

const toMeta = computed(() =>
  dir.value === 'ow2nether'
    ? { emoji: '🔴', label: '下界/地狱' }
    : { emoji: '🟢', label: '主世界' }
)

const dirHint = computed(
  () => `当前：${fromMeta.value.label} → ${toMeta.value.label}。点击切换方向，输入坐标保留`
)

function isNum(v) {
  return v != null && v !== '' && !Number.isNaN(Number(v))
}

const hasXZ = computed(() => isNum(inX.value) && isNum(inZ.value))

const outX = computed(() => {
  if (!hasXZ.value) return null
  const x = Number(inX.value)
  return dir.value === 'ow2nether' ? Math.round(x / 8) : x * 8
})

const outZ = computed(() => {
  if (!hasXZ.value) return null
  const z = Number(inZ.value)
  return dir.value === 'ow2nether' ? Math.round(z / 8) : z * 8
})

/** Y 不换算：有输入 Y 则沿用，否则复制时用 ~ */
const outY = computed(() => (isNum(inY.value) ? Number(inY.value) : null))

const outYDisplay = computed(() => (outY.value != null ? outY.value : 'Y 不变'))

const hasResult = computed(() => outX.value != null && outZ.value != null)

const resultCoordText = computed(() => {
  if (!hasResult.value) return ''
  if (outY.value != null) return `${outX.value} ${outY.value} ${outZ.value}`
  return `${outX.value} ${outZ.value}`
})

const resultTpText = computed(() => {
  if (!hasResult.value) return ''
  const y = outY.value != null ? outY.value : '~'
  return `/tp ${outX.value} ${y} ${outZ.value}`
})

function toChunk(n) {
  if (!isNum(n)) return null
  return Math.floor(Number(n) / 16)
}

function chunkPair(x, z) {
  const cx = toChunk(x)
  const cz = toChunk(z)
  if (cx == null || cz == null) return null
  return { cx, cz }
}

const inChunk = computed(() => (hasXZ.value ? chunkPair(inX.value, inZ.value) : null))
const outChunk = computed(() => (hasResult.value ? chunkPair(outX.value, outZ.value) : null))

/** 只切换方向，不改动输入坐标（避免从详情带来的点被冲掉） */
function toggleDir() {
  dir.value = dir.value === 'ow2nether' ? 'nether2ow' : 'ow2nether'
}

async function doCopy(text, id) {
  await copy(text, id)
}

function parseQueryNum(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** 从路由 query 灌入：x y z from|dir */
function applyRouteQuery(q) {
  if (!q) return
  const x = parseQueryNum(q.x)
  const y = parseQueryNum(q.y)
  const z = parseQueryNum(q.z)
  if (x != null) inX.value = x
  if (y != null) inY.value = y
  if (z != null) inZ.value = z

  const from = String(q.from || q.dimension || '').toLowerCase()
  const d = String(q.dir || '').toLowerCase()
  if (d === 'nether2ow' || d === 'n2o' || d === 'to_ow') {
    dir.value = 'nether2ow'
  } else if (d === 'ow2nether' || d === 'o2n' || d === 'to_nether') {
    dir.value = 'ow2nether'
  } else if (from === 'nether' || from === 'hell') {
    dir.value = 'nether2ow'
  } else if (from === 'overworld' || from === 'ow' || from === 'end') {
    // 末地无 8:1 换算，默认仍按主世界→下界灌入坐标
    dir.value = 'ow2nether'
  }
}

watch(
  () => route.query,
  (q) => {
    // 仅在带坐标参数时应用，避免空 query 清空用户手输
    if (q && (q.x != null || q.z != null || q.from != null || q.dir != null)) {
      applyRouteQuery(q)
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;
@use '../styles/mixins' as *;
@use '../styles/shared' as shared;

.desc {
  color: $text-soft;
  font-size: 0.85rem;
  margin-bottom: 0.45rem;
  line-height: 1.6;

  strong { color: $gold; }
}

.alias-tip {
  margin: 0 0 0.9rem;
  padding: 0.4rem 0.55rem;
  border-left: 3px solid $warn-border;
  background: $warn-bg;
  color: $text-muted;
  font-size: 0.78rem;
  line-height: 1.45;
  border-radius: 0 $radius $radius 0;
}

.conv-panel {
  background: $bg-deep;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 1rem 1.1rem 1.15rem;
}

.dir-switch {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.45rem 0.65rem;
  margin-bottom: 1rem;
  padding: 0.7rem 0.85rem;
  border: 1px dashed $border-strong;
  border-radius: $radius-md;
  background: $bg-panel-alt;
  color: $text-bright;
  font: inherit;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.12s;

  &:hover {
    border-color: $accent;
    border-style: solid;
    background: $accent-bg;
  }

  &:active {
    transform: scale(0.99);
  }
}

.dir-from,
.dir-to {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.dir-arrow {
  color: $accent;
  font-size: 1.1rem;
  font-weight: 700;
}

.dir-tip {
  flex-basis: 100%;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 400;
  color: $text-ghost;
  letter-spacing: 0.02em;
}

.section-label {
  font-size: 0.78rem;
  color: $text-faint;
  margin-bottom: 0.45rem;
  font-weight: 600;
}

.input-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
  flex-wrap: wrap;
}

.input-row label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: $text-faint;
}

.input-row input {
  width: 7.5rem;
  max-width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1px solid $border-strong;
  border-radius: $radius;
  background: $bg-panel;
  color: $text;
  font-family: $font-mono;
  font-size: 0.9rem;
  outline: none;

  &:focus { border-color: $accent; }
}

.chunk-line {
  margin: 0 0 0.95rem;
  font-size: 0.8rem;
  color: $text-muted;

  code {
    font-family: $font-mono;
    color: $info-soft;
    background: $info-bg;
    padding: 0.08rem 0.35rem;
    border-radius: $radius-sm;
  }
}

.chunk-hint {
  margin-left: 0.25rem;
  color: $text-ghost;
  font-size: 0.72rem;
}

.chunk-empty { color: $text-ghost; }

.result-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-bottom: 0.45rem;
  font-size: 0.88rem;
  color: $text-muted;
}

.result-row output code {
  font-family: $font-mono;
  font-size: 1rem;
  color: $gold;
  background: $bg-code;
  padding: 0.15rem 0.4rem;
  border-radius: $radius-sm;
}

.result-placeholder {
  color: $text-ghost;
  font-size: 0.85rem;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
}

@include shared.copy-btn-block;
.copy-btn {
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  min-width: auto;
}

@media (max-width: 480px) {
  .input-row input { width: 100%; }
  .input-row label { flex: 1 1 28%; min-width: 5rem; }
}
</style>
