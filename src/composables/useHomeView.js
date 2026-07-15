import { computed, ref } from 'vue'

const STORAGE_KEY = 'mc-waypoints-home-view'

/** @type {import('vue').Ref<'desktop' | 'mobile'>} */
const preference = ref(load())

function load() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'mobile' || v === 'desktop') return v
  } catch {
    /* ignore */
  }
  // 窄屏默认卡片，宽屏默认表格（仅首次无记录时）
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop'
  }
  return 'desktop'
}

function save(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

/**
 * @param {'desktop' | 'mobile'} mode
 */
function setHomeView(mode) {
  if (mode !== 'desktop' && mode !== 'mobile') return
  preference.value = mode
  save(mode)
}

function toggleHomeView() {
  setHomeView(preference.value === 'mobile' ? 'desktop' : 'mobile')
}

const homePath = computed(() => (preference.value === 'mobile' ? '/m' : '/'))
const homeRouteName = computed(() =>
  preference.value === 'mobile' ? 'waypoints-mobile' : 'waypoints'
)
const isMobileHome = computed(() => preference.value === 'mobile')
const homeViewLabel = computed(() =>
  preference.value === 'mobile' ? '手机卡片' : '电脑表格'
)
/** 与当前首页形态一致的图标（顶栏 / 关于卡标题同步用） */
const homeViewIcon = computed(() => (preference.value === 'mobile' ? '📱' : '🖥️'))
const homeNavLabel = computed(() => `${homeViewIcon.value} 首页`)
const homeViewCardTitle = computed(() => `${homeViewIcon.value} 首页视图`)

export function useHomeView() {
  return {
    preference,
    homePath,
    homeRouteName,
    isMobileHome,
    homeViewLabel,
    homeViewIcon,
    homeNavLabel,
    homeViewCardTitle,
    setHomeView,
    toggleHomeView,
    STORAGE_KEY
  }
}
