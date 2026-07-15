<template>
  <div>
    <!-- 有公告数据时渲染 -->
    <div v-if="config.announcements && config.announcements.length" data-name="announcement-list" class="ann-list">
      <div
        v-for="(ann, i) in config.announcements"
        :key="i"
        data-name="announcement-item"
        class="ann-card"
      >
        <div class="ann-header">
          <span class="ann-date">{{ ann.date || '' }}</span>
          <span class="ann-author" v-if="ann.author">— {{ ann.author }}</span>
        </div>
        <p class="ann-body">{{ ann.content }}</p>
      </div>
    </div>

    <!-- 占位 -->
    <div v-else data-name="empty-state" class="state-box">
      <p>📢 暂无公告</p>
      <p class="hint">服务器维护者可通过 CI 在 config.json 中添加公告</p>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
const config = inject('config')
</script>

<style scoped lang="scss">
@use '../styles/tokens' as *;
.ann-list { display: flex; flex-direction: column; gap: 0.8rem; }
.ann-card {
  background: $bg-panel;
  border: 1px solid $border;
  border-left: 3px solid $info;
  border-radius: 0 6px 6px 0;
  padding: 0.8rem 1rem;
}
.ann-header { font-size: 0.8rem; color: $text-faint; margin-bottom: 0.3rem; }
.ann-date { color: $info; }
.ann-body { color: $text-muted; line-height: 1.5; }
.hint { font-size: 0.82rem; color: $text-ghost; margin-top: 0.4rem; }
</style>
