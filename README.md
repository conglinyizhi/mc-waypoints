# ⛏ Minecraft 坐标簿

[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-222?logo=github)](https://conglinyizhi.github.io/mc-waypoints/)

多人 Minecraft 服务器的坐标点记录与共享工具。纯静态站点，通过 GitHub Issues 提交坐标，CI 自动校验审核后写入，GitHub Pages 自动部署。

## 功能

- 🗺️ **坐标表格** — 展示所有已记录坐标点，支持搜索和维度筛选
- 📋 **一键复制** — 复制坐标 `X Y Z` 或 `/tp X Y Z` 指令
- 🔢 **下界换算** — 主世界 ⇄ 下界坐标双向换算（8:1）
- ➕ **表单提交** — 网页填写 → 自动拼接 URL → 打开 GitHub Issue
- 📋 **待办事项** — localStorage 持久化的清单工具
- 🏷️ **CI 自动化** — 校验、查重、审核、写入全自动
- ℹ️ **关于页面** — CI 标签速查 + 急停控制

## 分支结构

```
main  ── 源代码 + CI 脚本 + 配置文件 (config.json)
data  ── waypoints.jsonl（坐标数据，CI 唯一写入目标）
```

- `main` 分支**不包含** `waypoints.jsonl`（已 gitignore），本地开发只操作此分支
- `data` 分支**仅包含** `public/data/waypoints.jsonl`，由 CI 自动维护
- 部署时 `deploy.yml` 自动从两个分支合并代码+数据，构建并推送到 GitHub Pages
- 本地开发 `main` 永远不会和 CI 数据写入冲突
- 示例坐标数据在 `public/data/waypoints.example.jsonl`，供格式参考

### `data` 独立数据分支（不要合并进 main）

`data` 是 **orphan 长期分支**，与 `main` **无共同祖先**，只存坐标数据，**不是**功能分支。

| 规则 | 说明 |
|------|------|
| 禁止 PR 合入 main | 不要点 GitHub 的 *Compare & pull request* / *data had recent pushes* 去合 `data` → `main` |
| 写入路径 | 只通过 Issue + CI（或维护者本地 `checkout data` 后改 jsonl）写入 |
| 读取路径 | 部署 / 校验用 `git fetch origin data` + `git show origin/data:public/data/waypoints.jsonl` |
| 分支保护 | 仓库 Ruleset `protect-data-branch`：禁止删除 `data`、禁止 force-push（管理员可 bypass） |
| UI 提示可忽略 | GitHub 对非默认分支的 *had recent pushes* 只是通用提示，不代表需要合并 |

日常开发：默认只在 `main` 上改代码；改坐标走网页提交 / Issue，不必把 `data` 当功能分支 rebase。

### 待办事项说明

待办事项页面（`#/server`）是纯本地功能——数据存储在浏览器 localStorage 中，**不会同步到服务器**。换设备、换浏览器、或清除浏览器数据后待办会丢失。

## 部署（GitHub Pages + Actions）

> 整个部署流程由 `.github/workflows/deploy.yml` 自动化，无需手动构建。

### 前置条件

1. **启用 GitHub Pages**：仓库 Settings → Pages → Source → **GitHub Actions**
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

- push `main` → 代码变更时自动部署
- push `data`（人工推送）→ 触发部署，从 data 拉 jsonl
- CI 用 `GITHUB_TOKEN` 写入 `data` 后**不会**级联触发其他 workflow，脚本里会再执行 `gh workflow run "构建部署"`
- 手动：`gh workflow run "构建部署"` 或 `gh workflow run deploy.yml`

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

> `todos` 数组中的项会自动合并到待办页面的本地数据中（仅新增，不覆盖已有）。

### 创建 CI 标签

在 Issues 页面创建以下标签（或运行 `gh label create`）：

| 标签 | 用途 |
|------|------|
| `ci:add_waypoint` | 触发坐标提交 |
| `ci:pending` | 等待审核 |
| `ci:review` | 强制审核 |
| `ci:approved` | 审核通过 |
| `ci:processed` | 已写入 |
| `ci:invalid` | 校验失败 |
| `ci:rejected` | 审核拒绝 |

### 设置急停变量

**Settings → Secrets and variables → Actions → Variables** 新建 `CI_DISABLED`，值设为 `false`。需要暂停 CI 时改为 `true` 即可。


## CI 流程

> 细节见 [add-waypoint.yml](.github/workflows/add-waypoint.yml)

```
用户提交 Issue（ci:add_waypoint）
     │
     ▼
 校验 (Node.js)
     │
 ┌───┼───┐
 ▼   ▼   ▼
失败 维护者 普通用户/
     无review ci:review
 │   │      │
 ▼   ▼      ▼
invalid 直接 深度查重
     写入 → ci:pending
      │      │
      ▼   ┌──┴──┐
    data   ▼     ▼
   分支  通过  不通过
          │     │
          ▼     ▼
       写入   rejected
       data
       分支
```

- 校验：名称、坐标格式、维度合法性
- 深度查重：同维度坐标近似（Δ≤10）+ 名称包含关系
- 维护者提交可不勾 review 直接写入；勾选则走完整审核
- 所有数据写入目标为 `data` 分支

## 开发

```bash
pnpm install
pnpm dev        # 开发服务器 → http://localhost:5173
                # 管理页面 → http://localhost:5173/#/manage
pnpm build      # 构建 → dist/
```

本地开发时 Vite 中间件提供 JSONL CRUD API，`#/manage` 页面可增删改测试数据。

### 样式（SCSS）

- 全局入口：`src/styles/index.scss`
- 设计令牌：`src/styles/_tokens.scss`（颜色 / 圆角 / 断点）
- 混入：`src/styles/_mixins.scss`、复用块：`src/styles/_shared.scss`
- 组件内：`<style scoped lang="scss">` + `@use '../styles/tokens' as *;`

```scss
// 示例：新组件里复用主题色与按钮
@use '../styles/tokens' as *;
@use '../styles/shared' as shared;

.panel { background: $bg-panel; border: 1px solid $border; }
@include shared.copy-btn-block;
```

## 打版本

```bash
git tag v0.1.0
git push --tags
```

前端关于页面自动显示版本号。

## 技术栈

Vue 3 · Vite · vue-router (hash mode) · SCSS (sass) · pnpm · GitHub Actions · GitHub Pages

## 协议

MIT
