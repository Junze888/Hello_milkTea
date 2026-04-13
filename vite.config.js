import { defineConfig } from "vite";

// 部署到 GitHub Pages 子路径时，把仓库名填到 base，例如 '/Hello_milkTea/'
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
});
