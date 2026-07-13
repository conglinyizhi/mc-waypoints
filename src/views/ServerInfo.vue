<template>
  <div>
    <div class="todo-header">
      <h2>📋 待办事项</h2>
      <p class="todo-hint">💡 数据仅保存在当前浏览器中，不会同步到服务器。换设备或清除浏览器数据后需重新添加。</p>
      <div class="todo-actions">
        <input
          v-model="newTodo"
          data-name="todo-input"
          class="todo-input"
          placeholder="新增待办…"
          @keydown.enter.prevent="addTodo"
        />
        <button data-name="todo-add-btn" class="todo-add-btn" @click="addTodo">➕</button>
      </div>
    </div>

    <div v-if="todos.length" data-name="todo-list" class="todo-list">
      <div
        v-for="(item, i) in todos"
        :key="i"
        data-name="todo-item"
        class="todo-item"
        :class="{ 'todo-item--done': item.done }"
      >
        <button
          data-name="todo-check"
          class="todo-check"
          @click="toggle(i)"
        >{{ item.done ? '✅' : '⬜' }}</button>
        <span class="todo-text">{{ item.text }}</span>
        <button
          data-name="todo-delete-btn"
          class="todo-del"
          @click="remove(i)"
        >✕</button>
      </div>
    </div>

    <div v-else data-name="empty-state" class="state-box">
      <p>📭 暂无待办事项</p>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, watch } from 'vue'

const config = inject('config')
const STORAGE_KEY = 'mc-waypoints-todos'

const newTodo = ref('')
const todos = ref([])

// 从 config 初始数据 + localStorage 合并
onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try { todos.value = JSON.parse(stored) } catch { /* ignore */ }
  }
  // 合并 config 中的预设项（仅新增，不覆盖已有）
  if (config.value.todos) {
    for (const item of config.value.todos) {
      if (!todos.value.some(t => t.text === item.text)) {
        todos.value.push({ text: item.text, done: false })
      }
    }
    save()
  }
})

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
}

function addTodo() {
  const text = newTodo.value.trim()
  if (!text) return
  todos.value.push({ text, done: false })
  newTodo.value = ''
  save()
}

function toggle(i) {
  todos.value[i].done = !todos.value[i].done
  save()
}

function remove(i) {
  todos.value.splice(i, 1)
  save()
}
</script>

<style scoped>
.todo-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.todo-header h2 { font-size: 1.1rem; color: #fff; }
.todo-hint { color: #666; font-size: 0.78rem; margin-top: 0.3rem; }

.todo-actions { display: flex; gap: 0.4rem; }
.todo-input {
  padding: 0.45rem 0.7rem;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  background: #12122a;
  color: #e0e0e0;
  font-size: 0.88rem;
  outline: none;
  width: 220px;
}
.todo-input:focus { border-color: #5fdc5f; }
.todo-add-btn {
  padding: 0.45rem 0.75rem;
  border: 1px solid #5fdc5f;
  border-radius: 6px;
  background: #1a3a1a;
  color: #5fdc5f;
  font-size: 0.9rem;
  cursor: pointer;
}

.todo-list { display: flex; flex-direction: column; gap: 0.4rem; }

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.8rem;
  background: #12122a;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  transition: background .15s;
}
.todo-item:hover { background: #1a1a30; }
.todo-item--done { opacity: 0.5; }

.todo-check {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
}
.todo-text {
  flex: 1;
  font-size: 0.9rem;
  color: #e0e0e0;
}
.todo-item--done .todo-text { text-decoration: line-through; color: #666; }

.todo-del {
  background: none;
  border: none;
  color: #666;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
  border-radius: 3px;
}
.todo-del:hover { color: #f87171; background: #2a1a1a; }
</style>
