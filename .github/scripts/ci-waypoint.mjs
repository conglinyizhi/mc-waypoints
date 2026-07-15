#!/usr/bin/env node
/**
 * CI 坐标提交辅助脚本
 *
 * 用法:
 *   node ci-waypoint.mjs parse                # 解析新增 issue body → JSON
 *   node ci-waypoint.mjs parse-report         # 解析报错/纠错 issue body → JSON
 *   node ci-waypoint.mjs deepcheck <jsonl>     # 深度查重 → JSON
 *   node ci-waypoint.mjs write <jsonl> <json>  # 追加一条记录
 *   node ci-waypoint.mjs patch <jsonl> <json>  # 按 id 修正或删除一条记录
 *
 * 环境变量:
 *   BODY         — GitHub issue body (parse 模式需要)
 *   AUTHOR_ASSOC — 提交者权限等级 (parse 模式需要)
 *   NAME, X, Y, Z, DIMENSION, NOTE, DEBUG — 可选覆盖 (deepcheck 模式)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

// ====================== 工具函数 ======================

/** 从 markdown issue form 中提取字段值 */
function parseField(body, fieldName) {
  const re = new RegExp(`### ${fieldName}[\\s\\S]*?(?=### |$)`, 'i')
  const match = body.match(re)
  if (!match) return ''
  return match[0]
    .replace(/^### .*\n?/i, '')
    .replace(/\n### $/, '')
    .trim()
}

/** 解析坐标字符串 → { x, y, z } 或 null + error */
function parseCoords(raw) {
  const s = raw.trim()
  if (!s) return { error: '坐标为空' }

  const hasComma = s.includes(',')
  const hasSpace = /\s/.test(s)

  // 逗号分隔（允许 ", " 格式）
  if (hasComma) {
    const parts = s.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length !== 3) return { error: `逗号分隔检测到 ${parts.length} 个数字，需要 3 个` }
    const nums = parts.map(Number)
    if (nums.some(n => isNaN(n))) return { error: '坐标必须为整数' }
    return { x: nums[0], y: nums[1], z: nums[2] }
  }

  // 空格分隔
  if (hasSpace) {
    const parts = s.split(/\s+/).filter(Boolean)
    if (parts.length !== 3) return { error: `空格分隔检测到 ${parts.length} 个数字，需要 3 个` }
    const nums = parts.map(Number)
    if (nums.some(n => isNaN(n))) return { error: '坐标必须为整数' }
    return { x: nums[0], y: nums[1], z: nums[2] }
  }

  return { error: '请用空格或英文逗号分隔 X Y Z' }
}

/** 判断是否维护者 */
function isMaintainer(authorAssoc) {
  return ['OWNER', 'COLLABORATOR', 'MEMBER'].includes(authorAssoc)
}

/**
 * 归一化维度字段
 * 兼容：overworld | 主世界 (overworld) | 主世界 | nether/下界/地狱 | end/末地
 */
function normalizeDimension(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  const paren = s.match(/\((\w+)\)/)
  if (paren && ['overworld', 'nether', 'end'].includes(paren[1].toLowerCase())) {
    return paren[1].toLowerCase()
  }
  const lower = s.toLowerCase()
  if (['overworld', 'nether', 'end'].includes(lower)) return lower
  if (/主\s*世界|overworld|\bow\b/i.test(s)) return 'overworld'
  if (/下\s*界|地\s*狱|nether/i.test(s)) return 'nether'
  if (/末\s*地|\bend\b/i.test(s)) return 'end'
  return s
}

// ====================== parse 模式 ======================

function doParse() {
  const body = process.env.BODY || ''
  const authorAssoc = process.env.AUTHOR_ASSOC || ''

  const name = parseField(body, '名称')
  const coordsRaw = parseField(body, '坐标')
  const dimensionRaw = parseField(body, '维度')
  let note = parseField(body, '备注')
  // GitHub Issue Form 未填字段会渲染为 _No response_
  if (/^_?No response_?$/i.test(note.trim())) note = ''

  // 维度兼容纯键与历史中文选项
  const dimension = normalizeDimension(dimensionRaw)

  // 检测 ci:review
  const debug = /\[x\].*ci:review/i.test(body)

  const errors = []

  // 校验名称
  if (!name) errors.push('❌ 名称为空')

  // 校验坐标
  const coordsResult = parseCoords(coordsRaw)
  let x = null, y = null, z = null
  if (coordsResult.error) {
    errors.push(`❌ ${coordsResult.error}`)
  } else {
    x = coordsResult.x
    y = coordsResult.y
    z = coordsResult.z
  }

  // 校验维度
  if (!['overworld', 'nether', 'end'].includes(dimension)) {
    errors.push(`❌ 维度无效: '${dimension}'（应为 overworld / nether / end）`)
  }

  const result = {
    valid: errors.length === 0,
    name,
    x, y, z,
    coordsRaw,
    dimension,
    note,
    debug,
    isMaintainer: isMaintainer(authorAssoc),
    errors
  }

  console.log(JSON.stringify(result))
}

// ====================== deepcheck 模式 ======================

function doDeepCheck(jsonlPath, newName, newX, newZ, newDimension) {
  const warnings = []
  const THRESHOLD = 10

  if (!existsSync(jsonlPath)) {
    console.log(JSON.stringify({ warnings }))
    return
  }

  const raw = readFileSync(jsonlPath, 'utf-8')
  const lines = raw.split('\n').filter(Boolean)

  for (const line of lines) {
    let obj
    try { obj = JSON.parse(line) } catch { continue }
    if (!obj.name || !obj.dimension) continue
    if (obj.name === newName && obj.dimension === newDimension) continue // 跳过精确重复

    // 坐标近似（同维度）
    if (obj.dimension === newDimension) {
      const dx = Math.abs((obj.x ?? 0) - (newX ?? 0))
      const dz = Math.abs((obj.z ?? 0) - (newZ ?? 0))
      if (dx <= THRESHOLD && dz <= THRESHOLD) {
        warnings.push({
          type: 'coord',
          msg: `⚠️ **坐标近似**：与「${obj.name}」(${obj.x}, ~, ${obj.z}) 同维度距离过近（ΔX=${dx}, ΔZ=${dz} ≤ ${THRESHOLD}），传送门可能串线`
        })
      }
    }

    // 名称包含
    if (obj.name !== newName) {
      const a = obj.name.toLowerCase()
      const b = newName.toLowerCase()
      if (a.includes(b) || b.includes(a)) {
        warnings.push({
          type: 'name',
          msg: `🔍 **名称相似**：与「${obj.name}」存在包含关系（\`${newName}\` ⇔ \`${obj.name}\`），可能是同一地点的别名或笔误`
        })
      }
    }
  }

  console.log(JSON.stringify({ warnings }))
}

// ====================== write 模式 ======================

function doWrite(jsonlPath, recordJson) {
  const dir = dirname(jsonlPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const line = (typeof recordJson === 'string')
    ? JSON.stringify(JSON.parse(recordJson))
    : JSON.stringify(recordJson)

  const existing = existsSync(jsonlPath) ? readFileSync(jsonlPath, 'utf-8') : ''
  const newContent = existing.trimEnd()
    ? existing.trimEnd() + '\n' + line + '\n'
    : line + '\n'

  writeFileSync(jsonlPath, newContent)
  console.log(JSON.stringify({ ok: true }))
}


/** 空字段 / GitHub 未填占位 */
function emptyField(v) {
  const s = String(v || '').trim()
  if (!s) return true
  if (/^_?No response_?$/i.test(s)) return true
  return false
}

/** 解析坐标，失败返回 { error }，成功 { x,y,z } */
function mustCoords(raw, label = '坐标') {
  if (emptyField(raw)) return { empty: true }
  const r = parseCoords(String(raw).trim())
  if (r.error) return { error: `${label}：${r.error}` }
  return r
}

// ====================== parse-report 模式 ======================

function doParseReport() {
  const body = process.env.BODY || ''
  const authorAssoc = process.env.AUTHOR_ASSOC || ''

  const waypointId = parseField(body, '记录 ID')
  const currentName = parseField(body, '当前名称')
  const currentCoords = parseField(body, '当前坐标')
  const currentDimension = normalizeDimension(parseField(body, '当前维度'))
  let currentNote = parseField(body, '当前备注')
  if (emptyField(currentNote)) currentNote = ''

  let action = parseField(body, '操作类型').trim().toLowerCase()
  if (emptyField(action)) action = 'update'
  // dropdown 可能带说明文字，只取首词
  if (action.startsWith('delete')) action = 'delete'
  else if (action.startsWith('update')) action = 'update'

  let newName = parseField(body, '新名称')
  let newCoordsRaw = parseField(body, '新坐标')
  let newDimensionRaw = parseField(body, '新维度')
  let newNote = parseField(body, '新备注')
  let detail = parseField(body, '问题说明')

  if (emptyField(newName)) newName = ''
  if (emptyField(newCoordsRaw)) newCoordsRaw = ''
  if (emptyField(newDimensionRaw)) newDimensionRaw = ''
  if (emptyField(newNote)) newNote = ''
  if (emptyField(detail)) detail = ''

  const debug = /\[x\].*ci:review/i.test(body)
  const errors = []

  if (emptyField(waypointId)) errors.push('❌ 记录 ID 为空')

  if (!['update', 'delete'].includes(action)) {
    errors.push(`❌ 操作类型无效: '${action}'（应为 update / delete）`)
  }

  const patch = {
    id: String(waypointId || '').trim(),
    action
  }

  if (action === 'update') {
    let any = false
    if (newName) {
      patch.name = newName
      any = true
    }
    if (newCoordsRaw) {
      const c = mustCoords(newCoordsRaw, '新坐标')
      if (c.error) errors.push(`❌ ${c.error}`)
      else if (!c.empty) {
        patch.x = c.x
        patch.y = c.y
        patch.z = c.z
        any = true
      }
    }
    if (newDimensionRaw) {
      const d = normalizeDimension(newDimensionRaw)
      if (!['overworld', 'nether', 'end'].includes(d)) {
        errors.push(`❌ 新维度无效: '${newDimensionRaw}'`)
      } else {
        patch.dimension = d
        any = true
      }
    }
    if (newNote) {
      // 填写 "-" 清空备注
      patch.note = newNote === '-' ? '' : newNote
      any = true
    }
    if (!any) errors.push('❌ 修正操作至少需要填写一项新名称 / 新坐标 / 新维度 / 新备注')
  }

  if (emptyField(detail)) errors.push('❌ 问题说明为空')

  const result = {
    valid: errors.length === 0,
    waypointId: patch.id,
    action,
    patch,
    current: {
      name: emptyField(currentName) ? '' : currentName,
      coords: emptyField(currentCoords) ? '' : currentCoords,
      dimension: currentDimension || '',
      note: currentNote
    },
    detail,
    debug,
    isMaintainer: isMaintainer(authorAssoc),
    errors
  }

  console.log(JSON.stringify(result))
}

// ====================== patch 模式 ======================

function doPatch(jsonlPath, patchJson) {
  const patch = typeof patchJson === 'string' ? JSON.parse(patchJson) : patchJson
  const id = String(patch.id || '').trim()
  if (!id) {
    console.log(JSON.stringify({ ok: false, error: '缺少 id' }))
    process.exitCode = 1
    return
  }

  if (!existsSync(jsonlPath)) {
    console.log(JSON.stringify({ ok: false, error: '数据文件不存在' }))
    process.exitCode = 1
    return
  }

  const raw = readFileSync(jsonlPath, 'utf-8')
  const lines = raw.split('\n').filter(Boolean)
  const out = []
  let found = null
  let updated = null

  for (const line of lines) {
    let obj
    try { obj = JSON.parse(line) } catch {
      out.push(line)
      continue
    }
    if (String(obj.id) !== id) {
      out.push(line)
      continue
    }
    found = obj
    if (patch.action === 'delete') {
      // 跳过 = 删除
      continue
    }
    const next = { ...obj }
    if (patch.name != null) next.name = patch.name
    if (patch.x != null) next.x = patch.x
    if (patch.y != null) next.y = patch.y
    if (patch.z != null) next.z = patch.z
    if (patch.dimension != null) next.dimension = patch.dimension
    if (patch.note != null) next.note = patch.note
    next.updatedAt = new Date().toISOString()
    updated = next
    out.push(JSON.stringify(next))
  }

  if (!found) {
    console.log(JSON.stringify({ ok: false, error: `未找到 id=${id}` }))
    process.exitCode = 1
    return
  }

  writeFileSync(jsonlPath, out.length ? out.join('\n') + '\n' : '')
  console.log(JSON.stringify({
    ok: true,
    action: patch.action || 'update',
    before: found,
    after: patch.action === 'delete' ? null : updated
  }))
}


// ====================== 入口 ======================

const mode = process.argv[2]

switch (mode) {
  case 'parse':
    doParse()
    break

  case 'parse-report':
    doParseReport()
    break

  case 'deepcheck': {
    const jsonlPath = process.argv[3]
    const newName = process.env.NAME || ''
    const newX = parseInt(process.env.X || '0', 10)
    const newZ = parseInt(process.env.Z || '0', 10)
    const newDimension = process.env.DIMENSION || ''
    doDeepCheck(jsonlPath, newName, newX, newZ, newDimension)
    break
  }

  case 'write': {
    const jsonlPath = process.argv[3]
    const recordJson = process.argv[4]
    doWrite(jsonlPath, recordJson)
    break
  }

  case 'patch': {
    const jsonlPath = process.argv[3]
    const patchJson = process.argv[4]
    doPatch(jsonlPath, patchJson)
    break
  }

  default:
    console.error(`Usage: node ci-waypoint.mjs [parse|parse-report|deepcheck|write|patch] ...`)
    process.exit(1)
}
