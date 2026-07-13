import { ref } from 'vue'

/**
 * 复制文本到剪贴板，双降级策略：
 * 1. Clipboard API（HTTPS / localhost）
 * 2. execCommand('copy')（HTTP 兼容）
 *
 * 用法：
 *   const { copy, copiedId } = useClipboard()
 *   await copy('some text', 'btn-1')
 *   // copiedId.value === 'btn-1' 持续 1.5s 后重置为 null
 */
export function useClipboard() {
  const copiedId = ref(null)
  let timer = null

  async function copy(text, id) {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        ok = true
      } catch {
        // 最终降级：alert
        window.prompt('请手动复制：', text)
        ok = true
      }
    }

    if (ok && id) {
      copiedId.value = id
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { copiedId.value = null }, 1500)
    }

    return ok
  }

  return { copy, copiedId }
}
