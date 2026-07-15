#!/usr/bin/env node
/**
 * CI 坐标提交辅助脚本
 *
 * 用法:
 *   node ci-waypoint.mjs parse                # 解析 issue body → 输出 JSON
 *   node ci-waypoint.mjs deepcheck <jsonl>     # 深度查重 → 输出 JSON
 *   node ci-waypoint.mjs write <jsonl> <json>  # 追加一条记录
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

// ====================== 入口 ======================

const mode = process.argv[2]

switch (mode) {
  case 'parse':
    doParse()
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

  default:
    console.error(`Usage: node ci-waypoint.mjs [parse|deepcheck|write] ...`)
    process.exit(1)
}
