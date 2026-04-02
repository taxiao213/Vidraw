#!/bin/bash

# 启动 Vidraw 项目脚本

set -e

echo "🚀 启动 Vidraw 项目..."

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npx yarn install
fi

# 启动开发服务器
echo "🌟 启动开发服务器..."
npx yarn start
