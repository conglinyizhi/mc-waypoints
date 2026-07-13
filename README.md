# ⛏ Minecraft 坐标簿

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
main  ── 源代码 + CI 脚本
data  ── waypoints.jsonl（坐标数据，CI 唯一写入目标）
```

本地开发只需 `main` 分支，永远不会和 CI 数据写入冲突。

## 部署（GitHub Pages + Actions）

### 1. 启用 GitHub Pages

仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

### 2. 配置 `public/data/config.json`

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

### 3. 配置 CI 权限

**Settings → Actions → General → Workflow permissions** 设为 **Read and write permissions**。

### 4. 创建 CI 标签

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

### 5. 设置急停变量

**Settings → Secrets and variables → Actions → Variables** 新建 `CI_DISABLED`，值设为 `false`。需要暂停 CI 时改为 `true` 即可。

### 6. 初始化 data 分支

```bash
git checkout --orphan data
mkdir -p public/data
echo '' > public/data/waypoints.jsonl
git add public/data/waypoints.jsonl
git commit -m "初始化数据分支"
git push origin data
```

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

## 打版本

```bash
git tag v0.1.0
git push --tags
```

前端关于页面自动显示版本号。

## 技术栈

Vue 3 · Vite · vue-router (hash mode) · GitHub Actions · GitHub Pages

## 协议

MIT
