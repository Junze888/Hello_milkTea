import { defineConfig } from "vite";

// 部署到 GitHub Pages 子路径时，把仓库名填到 base，例如 '/Hello_milkTea/'
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    proxy: {
      // 本地开发：VITE_API_BASE 留空时，请求 /api 转发到本机 Go 服务
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
