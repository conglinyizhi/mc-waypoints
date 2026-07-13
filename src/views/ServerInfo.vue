<template>
  <div>
    <div v-if="config.server_name || config.server_seed || config.minecraft_version" data-name="server-info" class="info-card">
      <h2>⚙️ 服务器信息</h2>
      <dl class="info-list">
        <template v-if="config.server_name">
          <dt>服务器名称</dt>
          <dd>{{ config.server_name }}</dd>
        </template>
        <template v-if="config.server_seed">
          <dt>世界种子</dt>
          <dd><code>{{ config.server_seed }}</code></dd>
        </template>
        <template v-if="config.minecraft_version">
          <dt>Minecraft 版本</dt>
          <dd>{{ config.minecraft_version }}</dd>
        </template>
      </dl>
    </div>
    <div v-else data-name="empty-state" class="state-box">
      <p>📭 暂无服务器配置信息</p>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
const config = inject('config')
</script>

<style scoped>
.info-card {
  background: #12122a;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 1.2rem 1.5rem;
}
.info-card h2 { font-size: 1.1rem; margin-bottom: 1rem; color: #fff; }

.info-list { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1.2rem; }
.info-list dt { color: #888; font-weight: 600; }
.info-list dd { color: #e0e0e0; }
.info-list dd code {
  font-family: 'Fira Code', monospace;
  background: #1a1a30;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  color: #ffd700;
}
</style>
