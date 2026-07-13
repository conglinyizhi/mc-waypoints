import { ref, readonly } from 'vue'

/**
 * 并行 fetch JSONL 和 JSON 配置文件，解析并返回响应式数据
 * 单行解析失败自动跳过，任一文件失败不影响其他
 */
export function useDataFetch() {
  const waypoints = ref([])
  const config = ref({})
  const loading = ref(true)
  const error = ref(null)

  async function fetchData() {
    loading.value = true
    error.value = null

    const results = await Promise.allSettled([
      fetch('data/waypoints.jsonl').then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      }),
      fetch('data/config.json').then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
    ])

    // 解析 waypoints.jsonl
    if (results[0].status === 'fulfilled') {
      const lines = results[0].value.split('\n').filter(Boolean)
      const parsed = []
      for (const line of lines) {
        try { parsed.push(JSON.parse(line)) }
        catch (e) { console.warn('JSONL 解析行失败:', line.slice(0, 50), e.message) }
      }
      waypoints.value = parsed
    } else {
      console.error('坐标数据加载失败:', results[0].reason)
      error.value = { type: 'waypoints', message: '坐标数据加载失败' }
    }

    // 解析 config.json
    if (results[1].status === 'fulfilled') {
      config.value = results[1].value
    } else {
      console.error('配置加载失败:', results[1].reason)
      if (!error.value) error.value = { type: 'config', message: '服务器配置加载失败' }
    }

    loading.value = false
  }

  fetchData()

  return {
    waypoints: readonly(waypoints),
    config: readonly(config),
    loading: readonly(loading),
    error: readonly(error),
    reload: fetchData
  }
}
