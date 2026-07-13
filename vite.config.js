import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, 'public/data')
const WAYPOINTS_PATH = resolve(DATA_DIR, 'waypoints.jsonl')

// 从 git 获取版本号：优先 tag，其次 commit hash
let gitHash = 'unknown'
try { gitHash = execSync('git describe --tags --always', { cwd: __dirname }).toString().trim() } catch {}

// 开发中间件：JSONL CRUD API
function waypointsMiddleware(req, res, next) {
  if (!req.url.startsWith('/api/waypoints')) return next()

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const id = url.searchParams.get('id')

  // 确保 data 目录和文件存在
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(WAYPOINTS_PATH)) writeFileSync(WAYPOINTS_PATH, '')

  const raw = readFileSync(WAYPOINTS_PATH, 'utf-8')
  const lines = raw.split('\n').filter(Boolean)

  if (req.method === 'GET') {
    const data = []
    for (const line of lines) {
      try { data.push(JSON.parse(line)) } catch { /* skip malformed */ }
    }
    res.end(JSON.stringify(data))
    return
  }

  if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      try {
        const item = JSON.parse(body)
        item.id = item.id || `dev-${Date.now()}`
        item.createdAt = item.createdAt || new Date().toISOString()
        const newLine = JSON.stringify(item)
        const newContent = lines.length
          ? raw.trimEnd() + '\n' + newLine + '\n'
          : newLine + '\n'
        writeFileSync(WAYPOINTS_PATH, newContent)
        res.statusCode = 201
        res.end(JSON.stringify({ ok: true, item }))
      } catch (e) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  if (req.method === 'PUT') {
    if (!id) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: '缺少 id 参数' }))
      return
    }
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      try {
        const updated = JSON.parse(body)
        const newLines = []
        let found = false
        for (const line of lines) {
          const obj = JSON.parse(line)
          if (obj.id === id) {
            newLines.push(JSON.stringify({ ...obj, ...updated }))
            found = true
          } else {
            newLines.push(line)
          }
        }
        if (!found) {
          res.statusCode = 404
          res.end(JSON.stringify({ error: '未找到该坐标点' }))
          return
        }
        writeFileSync(WAYPOINTS_PATH, newLines.join('\n') + '\n')
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  if (req.method === 'DELETE') {
    if (!id) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: '缺少 id 参数' }))
      return
    }
    const newLines = []
    let found = false
    for (const line of lines) {
      const obj = JSON.parse(line)
      if (obj.id === id) {
        found = true
        continue
      }
      newLines.push(line)
    }
    if (!found) {
      res.statusCode = 404
      res.end(JSON.stringify({ error: '未找到该坐标点' }))
      return
    }
    writeFileSync(WAYPOINTS_PATH, newLines.join('\n') + (newLines.length ? '\n' : ''))
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.statusCode = 405
  res.end(JSON.stringify({ error: 'Method not allowed' }))
}

export default defineConfig({
  define: {
    __GIT_HASH__: JSON.stringify(gitHash)
  },
  plugins: [
    vue(),
    {
      name: 'waypoints-dev-api',
      configureServer(server) {
        server.middlewares.use(waypointsMiddleware)
      }
    }
  ]
})
