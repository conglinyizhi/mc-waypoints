# ⛏ Minecraft 坐标簿

[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-222?logo=github)](https://conglinyizhi.github.io/mc-waypoints/)

多人 Minecraft 服务器的坐标点记录与共享工具。纯静态站点，通过 GitHub Issues 提交 / 报错，CI 自动校验审核后写入 `data` 分支，GitHub Pages 自动部署。

**在线演示：** https://conglinyizhi.github.io/mc-waypoints/

## 功能

### 坐标浏览

- 🗺️ **坐标表格** — 搜索名称/备注，按维度筛选（主世界 / 下界·地狱 / 末地）
- 🟢🔴🟣 **维度并入名称** — 表格以彩色圆点 + 名称展示，减少列宽
- 📋 **一键复制** — 复制 `X Y Z` 或 `/tp X Y Z`
- ⚠️ **报错入口** — 每行操作可进入站内纠错页（`#/report?id=…`）
- 📱 **窄屏操作菜单** — ≤720px 时操作折叠为 `⋯` 下拉
- 📝 **备注占位** — 空备注 / GitHub `_No response_` 显示为 `—`，不展示脏数据

### 提交与纠错

- ➕ **提交页**（`#/submit`）— 填表 → 拼 Issue URL → 打开 GitHub
- 🧠 **智能解析** — 粘贴自由文本（含「地狱X90 Y…」、维度别名、弱匹配提示），勾选要覆盖的字段后再写入表单
- 🧹 **清空确认** — 清空表单前拟态对话框二次确认
- 🛠️ **报错页**（`#/report`）— 勾选要改的字段或删除整条，说明问题后开 Issue；维护者回复 `通过`/`ok` 后 CI 写入

### 其它页面与壳层

- 🔢 **下界换算** — 主世界 ⇄ 下界（8:1）
- 📋 **待办** — `localStorage` 本地清单（不同步服务器）
- 📢 **公告** — 读取 `config.json` 公告列表
- ℹ️ **关于** — 版本 / 仓库 / CI 标签速查 / 急停说明
- 🌓 **主题** — 右上角固定：深色模式 / 浅色模式 / 跟随系统（`localStorage` 记忆）
- 🐙 **GitHub 入口** — 右上角链到配置的仓库；优先 favicon，失败回退 SVG（深色下反色）

### 自动化

- 🏷️ **新增坐标 CI** — 校验 → 查重 → 审核/直写 → `data` + 部署
- 🔧 **报错纠错 CI** — `update` 字段级修正或 `delete` 删除 → `data` + 部署
- 🛑 **急停** — 仓库变量 `CI_DISABLED=true` 可暂停 CI

## 页面路由

| 路由 | 说明 |
|------|------|
| `#/` | 坐标列表 |
| `#/submit` | 提交新坐标 |
| `#/report?id=` | 报错 / 纠错（需带记录 id） |
| `#/server` | 待办（本地） |
| `#/announcement` | 公告 |
| `#/converter` | 下界换算 |
| `#/about` | 关于 |
| `#/manage` | 仅 dev：本地 JSONL 管理 |

## 分支结构

```
main  ── 源代码 + CI 脚本 + 配置 (config.json) + Issue 模板
data  ── public/data/waypoints.jsonl（坐标数据，CI 主要写入目标）
```

- `main` **不包含**业务 `waypoints.jsonl`（gitignore）；日常只在此改代码
- `data` **仅**数据文件，由 CI（或维护者）维护
- 部署时 `deploy.yml` 检出 `main`，再 `git show origin/data:…jsonl` 合并后构建 Pages
- 示例格式见 `public/data/waypoints.example.jsonl`

### `data` 独立数据分支（不要合并进 main）

`data` 是 **orphan 长期分支**，与 `main` **无共同祖先**，只存坐标，**不是**功能分支。

| 规则 | 说明 |
|------|------|
| 禁止 PR 合入 main | 不要点 *Compare & pull request* / *data had recent pushes* 去合 `data` → `main` |
| 写入路径 | Issue + CI，或维护者 `checkout data` 后改 jsonl |
| 读取路径 | `git fetch origin data` + `git show origin/data:public/data/waypoints.jsonl` |
| 分支保护 | Ruleset `protect-data-branch`：禁删、禁 force-push（管理员可 bypass） |
| UI 提示可忽略 | *had recent pushes* 只是 GitHub 通用提示，不代表需要合并 |

### 待办事项说明

`#/server` 数据在浏览器 `localStorage`，**不会**上服务器。换设备 / 清站点数据会丢。

## 部署（GitHub Pages + Actions）

> 流程由 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 自动化。

### 前置条件

1. **Pages**：Settings → Pages → Source → **GitHub Actions**
2. **CI 写权限**：Settings → Actions → General → Workflow permissions → **Read and write permissions**
3. **初始化 data 分支**：
   ```bash
   git checkout --orphan data
   mkdir -p public/data
   touch public/data/waypoints.jsonl
   git add public/data/waypoints.jsonl
   git commit -m "初始化数据分支"
   git push origin data
   ```

### 部署触发

- push `main` → 代码变更自动部署
- push `data`（人工推送）→ 触发部署并拉 jsonl
- CI 用 `GITHUB_TOKEN` 写入 `data` **不会**级联触发其它 workflow，脚本内会再执行  
  `gh workflow run "构建部署"`
- 手动：`gh workflow run "构建部署"`

### 配置 `public/data/config.json`

```json
{
  "github_repo": "你的用户名/仓库名",
  "github_issues_url": "https://github.com/你的用户名/仓库名/issues/new?template=add-waypoint.yml",
  "server_name": "服务器名称",
  "server_seed": "世界种子（可选）",
  "minecraft_version": "1.21",
  "todos": [],
  "announcements": []
}
```

> `todos` 会合并进待办页本地数据（只新增、不覆盖已有）。  
> `github_repo` 用于右上角 GitHub 链接、提交/报错拼 Issue URL。

### 创建 CI 标签

| 标签 | 用途 |
|------|------|
| `ci:add_waypoint` | 触发**新增**坐标流程 |
| `ci:report_waypoint` | 触发**报错/纠错**流程 |
| `ci:pending` | 等待维护者审核 |
| `ci:review` | 强制走审核（维护者也可勾选） |
| `ci:approved` | 审核通过 |
| `ci:processed` | 已写入 data |
| `ci:invalid` | 校验失败 |
| `ci:rejected` | 审核拒绝 |

```bash
gh label create "ci:add_waypoint" --color "5fdc5f" --description "新增坐标"
gh label create "ci:report_waypoint" --color "fbbf24" --description "报错纠错"
# …其余标签按上表创建
```

### 急停变量

**Settings → Secrets and variables → Actions → Variables**  
新建 `CI_DISABLED`，平时 `false`；暂停 CI 时改为 `true`。

## CI 流程

### 新增坐标 — [add-waypoint.yml](.github/workflows/add-waypoint.yml)

```
用户 Issue（标签 ci:add_waypoint）
        │
        ▼
  解析校验 (ci-waypoint.mjs parse)
  · 清洗 _No response_ 为空
  · 维度归一 overworld/nether/end
        │
   ┌────┼────────────┐
   ▼    ▼            ▼
 失败  维护者且无 review  普通用户 / 勾了 review
   │    │                │
   ▼    ▼                ▼
invalid 直接 write      深度查重 → ci:pending
        data              │
        + 部署         回复 通过/ok 或 不通过/fail
                          │
                     approved → write data + 部署
```

要点：

- 并发组按 issue 号；实时标签门闩，避免 `opened`+`labeled` 双跑重复评论
- 维护者可不审核直写；`ci:review` 强制审核
- 提交信息含 `Closes #N`；因默认分支是 `main`，仍会 `gh issue close`
- 写入后显式触发「构建部署」

### 报错 / 纠错 — [report-waypoint.yml](.github/workflows/report-waypoint.yml)

```
用户从 #/report 开 Issue（ci:report_waypoint）
  body：记录 id、操作 update|delete、新字段（有则覆盖）、说明
        │
        ▼
  parse-report → 校验 id 存在于 jsonl
        │
   维护者直写 或  ci:pending → 通过后 patch
        │
        ▼
  patch：按字段更新或删除行 → push data → 部署
```

- **update**：只改填写了的新名称 / 新坐标 / 新维度 / 新备注（备注填 `-` 可清空）
- **delete**：删除整条记录
- 审核口令与新增相同：`通过`/`ok`，`不通过`/`fail`

### 脚本 — [ci-waypoint.mjs](.github/scripts/ci-waypoint.mjs)

| 子命令 | 作用 |
|--------|------|
| `parse` | 解析新增 Issue |
| `parse-report` | 解析报错 Issue |
| `deepcheck` | 坐标近似 + 名称相似 |
| `write` | 追加一行 jsonl |
| `patch` | 按 id 更新或删除 |

全链路 `cleanField`：GitHub 表单未填占位 `_No response_` 视为空。

## 开发

```bash
pnpm install
pnpm dev        # http://localhost:5173
                # 管理页（仅 dev）http://localhost:5173/#/manage
pnpm build      # → dist/
pnpm preview    # 预览构建结果
```

本地 Vite 中间件提供 JSONL CRUD；`#/manage` 可改测试数据。

### 样式与主题

- 入口：`src/styles/index.scss`（含 **深 / 浅** CSS 变量）
- 令牌：`src/styles/_tokens.scss` → 全部映射为 `var(--*)`，可运行时换肤
- 混入 / 复用：`_mixins.scss`、`_shared.scss`
- 组件：`<style scoped lang="scss">` + `@use '../styles/tokens' as *;`
- 主题逻辑：`src/composables/useTheme.js`  
  - 偏好：`system` \| `light` \| `dark`（存 `localStorage` 键 `mc-waypoints-theme`）  
  - 实际主题写在 `html[data-theme]`  
  - `index.html` 内联脚本减少首屏闪色

```scss
@use '../styles/tokens' as *;
@use '../styles/shared' as shared;

.panel { background: $bg-panel; border: 1px solid $border; }
@include shared.copy-btn-block;
```

### 维度约定

| 键 | 展示别名 |
|----|----------|
| `overworld` | 主世界 |
| `nether` | 下界 / 地狱（Nether） |
| `end` | 末地（The End） |

Issue 模板维度为 **input**（非 dropdown），便于 URL 预填；CI 负责把中文别名归一成键。

## 打版本

```bash
git tag v0.1.0
git push --tags
```

关于页会显示构建版本信息。

## 技术栈

Vue 3 · Vite · vue-router（hash）· SCSS / CSS 变量主题 · pnpm · GitHub Actions · GitHub Pages · Issues 表单

## 协议

MIT
