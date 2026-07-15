<template>
  <div>
    <div class="about-card">
      <h2>ℹ️ 关于</h2>

      <dl class="info-list">
        <dt>项目</dt>
        <dd>Minecraft 坐标簿</dd>

        <dt>版本</dt>
        <dd><code>{{ gitHash }}</code></dd>

        <dt>协议</dt>
        <dd>MIT</dd>

        <dt>仓库</dt>
        <dd>
          <a v-if="repo" :href="repo" target="_blank" class="link">{{ repoText }}</a>
          <span v-else>—</span>
        </dd>
      </dl>
    </div>

    <div class="about-card">
      <h2>🏷️ CI 标签速查</h2>
      <p class="hint">点击按钮在新标签页搜索对应状态的 Issue</p>
      <div class="label-btns">
        <a
          v-for="l in ciLabels"
          :key="l.name"
          :href="searchUrl(l.name)"
          target="_blank"
          class="label-btn"
          :style="{ borderColor: l.color, color: l.color }"
        >{{ l.name }}</a>
      </div>
      <a :href="searchAllUrl" target="_blank" class="label-btn label-btn--all">
        📋 查看全部 CI Issue
      </a>
      <div class="status-btns">
        <a :href="searchOpenUrl" target="_blank" class="label-btn label-btn--status">📂 仅未关闭</a>
        <a :href="searchClosedUrl" target="_blank" class="label-btn label-btn--status">📁 仅已关闭</a>
      </div>
    </div>

    <div v-if="repo" class="about-card">
      <h2>🛑 CI 控制</h2>
      <p class="hint">CI_DISABLED=true → 全部停摆；false → 正常运行</p>
      <a :href="`${repo}/settings/variables/actions`" target="_blank" class="label-btn label-btn--util">
        ⚙️ 打开 Variables 设置
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

// 编译时注入的 git hash
const gitHash = __GIT_HASH__

const config = inject('config')
const repo = computed(() => {
  const r = config.value.github_repo
  return r && r !== 'yourname/yourrepo' ? `https://github.com/${r}` : null
})
const repoText = computed(() => config.value.github_repo || '—')

const ciLabels = [
  { name: 'ci:add_waypoint', color: '#5fdc5f' },
  { name: 'ci:pending', color: '#f0ad4e' },
  { name: 'ci:review', color: '#60a5fa' },
  { name: 'ci:approved', color: '#2ea043' },
  { name: 'ci:processed', color: '#8250df' },
  { name: 'ci:invalid', color: '#f87171' },
  { name: 'ci:rejected', color: '#f87171' }
]

function searchUrl(label) {
  return repo.value
    ? `${repo.value}/issues?q=${encodeURIComponent(`label:${label}`)}`
    : '#'
}

const searchAllUrl = computed(() => {
  if (!repo.value) return '#'
  const q = ciLabels.map(l => `label:${l.name}`).join(' ')
  return `${repo.value}/issues?q=${encodeURIComponent(q)}`
})

const searchOpenUrl = computed(() => {
  if (!repo.value) return '#'
  const q = `is:open ${ciLabels.map(l => `label:${l.name}`).join(' ')}`
  return `${repo.value}/issues?q=${encodeURIComponent(q)}`
})

const searchClosedUrl = computed(() => {
  if (!repo.value) return '#'
  const q = `is:closed ${ciLabels.map(l => `label:${l.name}`).join(' ')}`
  return `${repo.value}/issues?q=${encodeURIComponent(q)}`
})
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;
.about-card {
  background: $bg-panel;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1rem;
}
.about-card h2 { font-size: 1rem; margin-bottom: 0.8rem; color: $text-bright; }

.info-list { display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1rem; }
.info-list dt { color: $text-faint; font-size: 0.85rem; }
.info-list dd { color: $text; font-size: 0.9rem; }
.info-list dd code {
  font-family: $font-mono;
  background: $bg-code;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  color: $gold;
  font-size: 0.82rem;
}

.link { color: $info; }
.link:hover { text-decoration: underline; }

.hint { color: $text-ghost; font-size: 0.8rem; margin-bottom: 0.6rem; }

.label-btns { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.8rem; }
.label-btn {
  display: inline-block;
  padding: 0.3rem 0.65rem;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.78rem;
  transition: background .15s;
}
.label-btn:hover { opacity: 0.8; }
.label-btn--all {
  display: inline-block;
  margin-top: 0.4rem;
  border-color: $text-faint;
  color: $text-muted;
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
}

.status-btns {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.label-btn--status {
  border-color: $text-subtle;
  color: $text-dim;
  font-size: 0.8rem;
  padding: 0.3rem 0.7rem;
}
.label-btn--util {
  display: inline-block;
  border-color: $warn-amber-border;
  color: $warn-amber;
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
}
</style>
