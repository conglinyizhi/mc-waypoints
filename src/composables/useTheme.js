import { computed, onMounted, onUnmounted, ref } from 'vue'

const STORAGE_KEY = 'mc-waypoints-theme'
/** @type {'system' | 'light' | 'dark'} */
const preference = ref('system')
/** 解析后的实际主题 */
const resolved = ref('dark')

let mql = null
let mqlHandler = null
let started = false

function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme() {
  const next = preference.value === 'system' ? systemTheme() : preference.value
  resolved.value = next
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', next)
  document.documentElement.style.colorScheme = next
}

function loadPreference() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      preference.value = raw
      return
    }
  } catch {
    /* ignore */
  }
  preference.value = 'system'
}

function savePreference(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

function ensureListener() {
  if (typeof window === 'undefined' || !window.matchMedia) return
  if (mql) return
  mql = window.matchMedia('(prefers-color-scheme: dark)')
  mqlHandler = () => {
    if (preference.value === 'system') applyTheme()
  }
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', mqlHandler)
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(mqlHandler)
  }
}

function start() {
  if (started) {
    applyTheme()
    return
  }
  started = true
  loadPreference()
  ensureListener()
  applyTheme()
}

/**
 * 设置主题偏好：system | light | dark
 * @param {'system' | 'light' | 'dark'} mode
 */
function setTheme(mode) {
  if (mode !== 'system' && mode !== 'light' && mode !== 'dark') return
  preference.value = mode
  savePreference(mode)
  applyTheme()
}

/** 在 system → light → dark → system 间循环 */
function cycleTheme() {
  const order = ['system', 'light', 'dark']
  const i = order.indexOf(preference.value)
  setTheme(order[(i + 1) % order.length])
}

const themeLabel = computed(() => {
  if (preference.value === 'system') return '跟随系统'
  if (preference.value === 'light') return '浅色'
  return '深色'
})

const themeIcon = computed(() => {
  if (preference.value === 'system') return '💻'
  if (preference.value === 'light') return '☀️'
  return '🌙'
})

const themeTitle = computed(() => {
  const map = {
    system: `主题：跟随系统（当前${resolved.value === 'dark' ? '深色' : '浅色'}），点击切换`,
    light: '主题：浅色，点击切换',
    dark: '主题：深色，点击切换'
  }
  return map[preference.value] || '切换主题'
})

export function useTheme() {
  onMounted(() => {
    start()
  })

  // 不在 unmount 时移除 mql：主题是全局单例
  onUnmounted(() => {})

  return {
    preference,
    resolved,
    themeLabel,
    themeIcon,
    themeTitle,
    setTheme,
    cycleTheme,
    start
  }
}

// 模块加载时尽早应用，减少闪烁（main.js 也会再调一次）
if (typeof window !== 'undefined') {
  start()
}
