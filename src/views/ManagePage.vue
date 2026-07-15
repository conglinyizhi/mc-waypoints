<template>
  <div>
    <div class="manage-header">
      <h2>🛠️ 数据管理（仅开发模式）</h2>
      <button data-name="manage-add-btn" class="add-btn" @click="showAddForm = true">➕ 添加坐标点</button>
    </div>

    <!-- 添加 / 编辑表单 -->
    <div v-if="showAddForm" class="form-overlay" @click.self="closeForm">
      <div class="form-card">
        <h3>{{ editingId ? '编辑坐标点' : '添加坐标点' }}</h3>
        <div class="form-grid">
          <label>名称 <input v-model="form.name" placeholder="我家" /></label>
          <label>X <input v-model.number="form.x" type="number" placeholder="-512" /></label>
          <label>Y <input v-model.number="form.y" type="number" placeholder="64" /></label>
          <label>Z <input v-model.number="form.z" type="number" placeholder="1024" /></label>
          <label>维度
            <select v-model="form.dimension">
              <option value="overworld">🟢 主世界（Overworld）</option>
              <option value="nether">🔴 下界 / 地狱（Nether）</option>
              <option value="end">🟣 末地（The End）</option>
            </select>
          </label>
          <label>分类 <input v-model="form.category" placeholder="家 / 农场 / 交易中心…" /></label>
          <label>备注 <input v-model="form.note" placeholder="可选" /></label>
          <label>贡献者 <input v-model="form.contributor" placeholder="可选" /></label>
        </div>
        <div class="form-actions">
          <button @click="submitForm" class="save-btn">{{ editingId ? '💾 保存' : '✅ 添加' }}</button>
          <button @click="closeForm" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 当前数据列表 -->
    <div class="table-wrap">
      <table v-if="localWaypoints.length" class="waypoint-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>X / Y / Z</th>
            <th>维度</th>
            <th>分类</th>
            <th>备注</th>
            <th>贡献者</th>
            <th>ID</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="wp in localWaypoints" :key="wp.id">
            <td>{{ wp.name }}</td>
            <td><code>{{ wp.x }} {{ wp.y }} {{ wp.z }}</code></td>
            <td>{{ wp.dimension }}</td>
            <td>{{ wp.category }}</td>
            <td>{{ wp.note || '—' }}</td>
            <td>{{ wp.contributor || '—' }}</td>
            <td class="col-id">{{ wp.id }}</td>
            <td>
              <button @click="editItem(wp)" class="action-btn">✏️</button>
              <button @click="deleteItem(wp.id)" class="action-btn action-btn--danger">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="state-box">
        <p>暂无数据，点击「添加坐标点」开始</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const API = '/api/waypoints'
const localWaypoints = ref([])

// 加载当前数据
async function load() {
  try {
    const res = await fetch(API)
    localWaypoints.value = await res.json()
  } catch (e) {
    console.error('加载失败', e)
  }
}

onMounted(load)

// --- 表单 ---
const showAddForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
  name: '', x: null, y: null, z: null,
  dimension: 'overworld', category: '', note: '', contributor: ''
})

const form = reactive(emptyForm())

function editItem(wp) {
  editingId.value = wp.id
  Object.assign(form, {
    name: wp.name, x: wp.x, y: wp.y, z: wp.z,
    dimension: wp.dimension, category: wp.category || '',
    note: wp.note || '', contributor: wp.contributor || ''
  })
  showAddForm.value = true
}

function closeForm() {
  showAddForm.value = false
  editingId.value = null
  Object.assign(form, emptyForm())
}

async function submitForm() {
  const body = {
    name: form.name,
    x: form.x,
    y: form.y,
    z: form.z,
    dimension: form.dimension,
    category: form.category,
    note: form.note,
    contributor: form.contributor
  }

  try {
    let res
    if (editingId.value) {
      body.id = editingId.value
      res = await fetch(`${API}?id=${editingId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    } else {
      res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }
    const json = await res.json()
    if (json.ok) {
      closeForm()
      await load()
    } else {
      alert('操作失败: ' + (json.error || '未知错误'))
    }
  } catch (e) {
    alert('请求失败: ' + e.message)
  }
}

async function deleteItem(id) {
  if (!confirm('确定删除该坐标点？')) return
  try {
    const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      await load()
    } else {
      alert('删除失败: ' + (json.error || '未知错误'))
    }
  } catch (e) {
    alert('请求失败: ' + e.message)
  }
}
</script>

<style scoped>
.manage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.manage-header h2 { font-size: 1.1rem; color: #ffd700; }

.add-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #5fdc5f;
  border-radius: 4px;
  background: #1a3a1a;
  color: #5fdc5f;
  font-size: 0.85rem;
  cursor: pointer;
}

/* 表单弹层 */
.form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.form-card {
  background: #1a1a2e;
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 480px;
}
.form-card h3 { margin-bottom: 1rem; color: #fff; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.form-grid label { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: #888; }
.form-grid input, .form-grid select {
  padding: 0.35rem 0.5rem;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  background: #0a0a1e;
  color: #e0e0e0;
  font-size: 0.85rem;
  outline: none;
}
.form-grid input:focus, .form-grid select:focus { border-color: #5fdc5f; }
.form-actions { margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end; }
.save-btn, .cancel-btn {
  padding: 0.35rem 0.9rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}
.save-btn { border: 1px solid #5fdc5f; background: #1a3a1a; color: #5fdc5f; }
.cancel-btn { border: 1px solid #3a3a5a; background: #12122a; color: #aaa; }

/* 表格 */
.table-wrap { overflow-x: auto; }
.waypoint-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.waypoint-table th, .waypoint-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #1e1e3a;
  text-align: left;
}
.waypoint-table th { color: #aaa; border-bottom: 2px solid #2a2a4a; }
.waypoint-table code { color: #ffd700; font-family: monospace; }
.col-id { font-family: monospace; font-size: 0.72rem; color: #666; }

.action-btn {
  padding: 0.2rem 0.4rem;
  border: 1px solid #3a3a5a;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
}
.action-btn:hover { border-color: #5fdc5f; }
.action-btn--danger:hover { border-color: #f87171; }
</style>
