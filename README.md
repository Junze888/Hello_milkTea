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

### 5）云服务器（拉取代码 + 构建 + Nginx）

适用于在 **VPS / 云主机** 上通过 Git 拉取本仓库并对外提供静态站点。前端构建后为纯静态文件（`dist/`），无需长期运行 Node 进程；仅需在构建阶段安装 Node。

**说明：** 若站点挂在 **域名根路径**（例如 `https://tea.example.com/`），构建时 **不要** 设置 `VITE_BASE_PATH`，保持默认 `/` 即可。仅当部署在子路径（如 `https://example.com/milktea/`）时，才需要设置 `VITE_BASE_PATH=/milktea/` 后再 `npm run build`。

#### 5.1 服务器环境（示例：Ubuntu / Debian）

```bash
sudo apt update
sudo apt install -y git nginx
# Node.js 20+（任选一种安装方式，以下为 NodeSource 示例）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

#### 5.2 首次克隆与构建

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www
cd /var/www
git clone git@github.com:Junze888/Hello_milkTea.git
cd Hello_milkTea
npm install
npm run build
```

构建完成后，静态资源在 **`/var/www/Hello_milkTea/dist`**。

#### 5.3 Nginx 配置示例

将站点根目录指向 `dist`，并适配 SPA 路由（本项目为单页，刷新时仍返回 `index.html`）：

```nginx
server {
    listen 80;
    server_name tea.example.com;   # 改成你的域名或 _

    root /var/www/Hello_milkTea/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

检查并重载：

```bash
sudo nano /etc/nginx/sites-available/hello-milktea   # 粘贴上述内容后保存
sudo ln -sf /etc/nginx/sites-available/hello-milktea /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

如需 HTTPS，可在域名解析生效后使用 **Certbot**（`certbot --nginx`）申请证书。

#### 5.4 后续更新（拉取最新代码）

在项目目录执行：

```bash
cd /var/www/Hello_milkTea
git pull
npm install
npm run build
sudo nginx -t && sudo systemctl reload nginx
```

或使用仓库内脚本（需 `chmod +x scripts/deploy-server.sh` 后执行）：

```bash
./scripts/deploy-server.sh
```

---

## 首次推送到 GitHub（维护者）

若远程仓库尚未创建，请先在 GitHub 网页上 **新建空仓库** `Hello_milkTea`（不要勾选初始化 README），然后在本地执行：

```bash
cd Hello_milkTea
git remote add origin git@github.com:Junze888/Hello_milkTea.git   # 若已添加可跳过
git branch -M main
git push -u origin main
```

推送成功后，云服务器即可按 **「5）云服务器」** 一节克隆该地址部署。

## 许可证

MIT
