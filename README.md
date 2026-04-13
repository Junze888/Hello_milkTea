# Hello_milkTea · 奶茶点评（网页初版）

精美的单页前端：登录（初版为本地昵称）、奶茶列表、五星打分、点评、排行榜（按平均分）及「打分人数」。

数据初版保存在浏览器 **localStorage**，与后端字段对齐；`src/api.js` 中预留了 REST 路径，后续可用 **Go** 实现高并发服务，前端只需配置环境变量切换。

## 前置条件

安装 **Node.js 20+**（含 `npm`）：https://nodejs.org/

## 本地开发

```bash
cd Hello_milkTea
npm install
npm run dev
```

浏览器打开终端里提示的地址（一般为 `http://localhost:5173`）。

## 构建

```bash
npm run build
```

产物在 `dist/` 目录，可部署到任意静态托管。

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE` | 后端 API 根地址（例如 `https://api.example.com`），留空则仅走初版 mock |
| `VITE_USE_MOCK` | 设为 `false` 且配置 `VITE_API_BASE` 后，将调用真实 API（需后端实现） |
| `VITE_BASE_PATH` | 部署到 **GitHub Pages 项目页** 时设为 `/仓库名/` |

构建时若使用 GitHub Pages：

```bash
set VITE_BASE_PATH=/Hello_milkTea/
npm run build
```

（PowerShell 可用 `$env:VITE_BASE_PATH="/Hello_milkTea/"; npm run build`）

## 预留 API（后端 Go 可对齐）

- `GET /api/v1/teas` — 奶茶列表（含 `ratings`）
- `POST /api/v1/teas/:id/reviews` — 提交 `{ stars, comment }`
- `POST /api/v1/auth/login` — 登录 `{ username, password }`

## 部署方式（任选）

### 1）预览构建结果（本机）

```bash
npm run preview
```

### 2）任意静态服务器（例如 `dist` 目录）

```bash
npx --yes serve dist -p 3000
```

### 3）GitHub Pages

1. 将仓库推送到 GitHub。
2. 在仓库 **Settings → Pages** 中，Source 选 **GitHub Actions**（或手动上传 `dist`）。
3. 使用本仓库可选 workflow：推送 `main` 分支时自动构建并部署（见 `.github/workflows/pages.yml`）。
4. 若站点地址为 `https://<user>.github.io/Hello_milkTea/`，请设置 `VITE_BASE_PATH=/Hello_milkTea/` 再构建。

### 4）Netlify / Vercel

- 构建命令：`npm run build`
- 发布目录：`dist`
- 若为子路径部署，在项目设置里配置对应 `base` 或 `VITE_BASE_PATH`

## 许可证

MIT
