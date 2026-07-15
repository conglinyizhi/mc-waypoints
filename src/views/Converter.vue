<template>
  <div class="converter-page">
    <p class="desc">
      Minecraft 中主世界与下界的坐标比例为 <strong>8:1</strong>。Y 坐标（高度）不受影响。
      输入坐标后自动换算对应维度的门位置，避免传送门串线。
    </p>

    <div class="converter-panels">
      <!-- 主世界 → 下界 -->
      <div class="conv-panel">
        <h3>🟢 主世界 → 🔴 下界</h3>
        <div class="input-row">
          <label>X <input v-model.number="owX" data-name="converter-ow-x" type="number" placeholder="0" /></label>
          <label class="label-disabled">Y <input disabled value="—" /></label>
          <label>Z <input v-model.number="owZ" data-name="converter-ow-z" type="number" placeholder="0" /></label>
        </div>
        <div class="result-row">
          <span>下界对应坐标：</span>
          <output data-name="converter-result">
            <code>{{ netherResult.x }}</code> / <code class="dim">{{ netherResult.y }}</code> / <code>{{ netherResult.z }}</code>
          </output>
          <button
            v-if="netherResult.x !== null"
            data-name="converter-copy-btn"
            class="copy-btn"
            :class="{ 'copy-btn--ok': copiedId === 'nether-result' }"
            @click="doCopy(`${netherResult.x} ${netherResult.z}`, 'nether-result')"
          >{{ copiedId === 'nether-result' ? '✓ 已复制' : '📋 复制坐标' }}</button>
        </div>
      </div>

      <!-- 下界 → 主世界 -->
      <div class="conv-panel">
        <h3>🔴 下界 → 🟢 主世界</h3>
        <div class="input-row">
          <label>X <input v-model.number="netherX" data-name="converter-nether-x" type="number" placeholder="0" /></label>
          <label class="label-disabled">Y <input disabled value="—" /></label>
          <label>Z <input v-model.number="netherZ" data-name="converter-nether-z" type="number" placeholder="0" /></label>
        </div>
        <div class="result-row">
          <span>主世界对应坐标：</span>
          <output data-name="converter-result">
            <code>{{ owResult.x }}</code> / <code class="dim">{{ owResult.y }}</code> / <code>{{ owResult.z }}</code>
          </output>
          <button
            v-if="owResult.x !== null"
            data-name="converter-copy-btn"
            class="copy-btn"
            :class="{ 'copy-btn--ok': copiedId === 'ow-result' }"
            @click="doCopy(`${owResult.x} ${owResult.z}`, 'ow-result')"
          >{{ copiedId === 'ow-result' ? '✓ 已复制' : '📋 复制坐标' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useClipboard } from '../composables/useClipboard.js'

const { copy, copiedId } = useClipboard()

const owX = ref(null)
const owZ = ref(null)
const netherX = ref(null)
const netherZ = ref(null)

// 主世界 → 下界：÷8 四舍五入
const netherResult = computed(() => ({
  x: owX.value != null ? Math.round(owX.value / 8) : null,
  y: '不变',
  z: owZ.value != null ? Math.round(owZ.value / 8) : null
}))

// 下界 → 主世界：×8
const owResult = computed(() => ({
  x: netherX.value != null ? netherX.value * 8 : null,
  y: '不变',
  z: netherZ.value != null ? netherZ.value * 8 : null
}))

async function doCopy(text, id) {
  await copy(text, id)
}
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;
@use '../styles/mixins' as *;
@use '../styles/shared' as shared;
.desc { color: $text-soft; font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.6; }
.desc strong { color: $gold; }

.converter-panels { display: flex; flex-wrap: wrap; gap: 1.2rem; }

.conv-panel {
  flex: 1 1 300px;
  background: $bg-panel;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 1.2rem;
}
.conv-panel h3 { font-size: 1rem; margin-bottom: 1rem; color: $text-bright; }

.input-row { display: flex; gap: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap; }
.input-row label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: $text-faint; }
.input-row input {
  width: 100px;
  padding: 0.4rem 0.5rem;
  border: 1px solid $border-strong;
  border-radius: 4px;
  background: $bg-deep;
  color: $text;
  font-family: $font-mono;
  font-size: 0.9rem;
  outline: none;
}
.input-row input:focus { border-color: $accent; }
.label-disabled input { opacity: 0.3; }

.result-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.88rem;
  color: $text-muted;
}
.result-row output code {
  font-family: $font-mono;
  font-size: 1rem;
  color: $gold;
  background: $bg-code;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
}
.result-row output code.dim { color: $text-faint; font-style: italic; }

@include shared.copy-btn-block;
.copy-btn {
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  min-width: auto;
}
</style>
