#!/usr/bin/env bash
# 在云服务器项目目录中执行：更新代码并重新构建静态资源
set -euo pipefail
cd "$(dirname "$0")/.."
git pull
npm install
npm run build
echo "构建完成，静态文件目录: $(pwd)/dist"
echo "请将 Nginx root 指向该 dist 目录，然后: sudo nginx -t && sudo systemctl reload nginx"
