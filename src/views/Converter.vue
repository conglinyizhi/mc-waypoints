<template>
  <div class="converter-page" data-name="converter-page">
    <p class="desc">
      主世界与下界坐标比为 <strong>8:1</strong>（Y 高度不变）。用于对齐传送门，减少串线。
    </p>

    <!-- 单一面板：点击方向条切换计算方式 -->
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
        <span class="dir-tip">点击切换方向</span>
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
        <label class="label-disabled" title="Y 不参与维度换算">
          Y
          <input disabled value="—" />
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
            <code class="dim">Y 不变</code>
            /
            <code>{{ outZ }}</code>
          </template>
          <span v-else class="result-placeholder">输入 X、Z 后显示</span>
        </output>
        <button
          v-if="hasResult"
          type="button"
          data-name="converter-copy-btn"
          class="copy-btn"
          :class="{ 'copy-btn--ok': copiedId === 'conv-result' }"
          @click="doCopy(`${outX} ${outZ}`, 'conv-result')"
        >{{ copiedId === 'conv-result' ? '✓ 已复制' : '📋 复制 X Z' }}</button>
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
import { computed, ref } from 'vue'
import { useClipboard } from '../composables/useClipboard.js'

const { copy, copiedId } = useClipboard()

/** 'ow2nether' | 'nether2ow' */
const dir = ref('ow2nether')

const inX = ref(null)
const inZ = ref(null)

const fromMeta = computed(() =>
  dir.value === 'ow2nether'
    ? { emoji: '🟢', label: '主世界' }
    : { emoji: '🔴', label: '下界' }
)

const toMeta = computed(() =>
  dir.value === 'ow2nether'
    ? { emoji: '🔴', label: '下界' }
    : { emoji: '🟢', label: '主世界' }
)

const dirHint = computed(
  () => `当前：${fromMeta.value.label} → ${toMeta.value.label}。点击切换计算方向`
)

const hasInput = computed(
  () => inX.value != null && inX.value !== '' && !Number.isNaN(Number(inX.value))
    && inZ.value != null && inZ.value !== '' && !Number.isNaN(Number(inZ.value))
)

const outX = computed(() => {
  if (!hasInput.value) return null
  const x = Number(inX.value)
  return dir.value === 'ow2nether' ? Math.round(x / 8) : x * 8
})

const outZ = computed(() => {
  if (!hasInput.value) return null
  const z = Number(inZ.value)
  return dir.value === 'ow2nether' ? Math.round(z / 8) : z * 8
})

const hasResult = computed(() => outX.value != null && outZ.value != null)

/** 方块坐标 → 区块坐标（向 -∞ 取整，与 MC Java 一致） */
function toChunk(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return null
  return Math.floor(Number(n) / 16)
}

function chunkPair(x, z) {
  const cx = toChunk(x)
  const cz = toChunk(z)
  if (cx == null || cz == null) return null
  return { cx, cz }
}

const inChunk = computed(() => {
  if (!hasInput.value) return null
  return chunkPair(inX.value, inZ.value)
})

const outChunk = computed(() => {
  if (!hasResult.value) return null
  return chunkPair(outX.value, outZ.value)
})

/**
 * 切换方向时，把当前输入换成「另一侧」坐标，避免数字对不上维度
 * （有结果时用换算值作为新输入；无输入则只改方向）
 */
function toggleDir() {
  if (hasResult.value) {
    const nx = outX.value
    const nz = outZ.value
    dir.value = dir.value === 'ow2nether' ? 'nether2ow' : 'ow2nether'
    inX.value = nx
    inZ.value = nz
  } else {
    dir.value = dir.value === 'ow2nether' ? 'nether2ow' : 'ow2nether'
  }
}

async function doCopy(text, id) {
  await copy(text, id)
}
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;
@use '../styles/mixins' as *;
@use '../styles/shared' as shared;

.desc {
  color: $text-soft;
  font-size: 0.85rem;
  margin-bottom: 0.9rem;
  line-height: 1.6;

  strong { color: $gold; }
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

.label-disabled input { opacity: 0.35; cursor: not-allowed; }

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

.result-row output code.dim {
  color: $text-faint;
  font-style: italic;
  font-size: 0.85rem;
}

.result-placeholder {
  color: $text-ghost;
  font-size: 0.85rem;
}

@include shared.copy-btn-block;
.copy-btn {
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  min-width: auto;
}

@media (max-width: 480px) {
  .input-row input { width: 100%; }
  .input-row label { flex: 1 1 30%; min-width: 5rem; }
}
</style>
