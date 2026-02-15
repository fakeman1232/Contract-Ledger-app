#!/bin/bash

# 合同台账管理系统启动器

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    osascript -e 'display dialog "错误：未检测到 Node.js，请先安装 Node.js 后再试。" buttons {"确定"} default button 1'
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    osascript -e 'display dialog "首次运行需要安装依赖，这可能需要几分钟时间..." buttons {"确定"} default button 1'
    npm install
fi

# 打开终端并启动应用
osascript -e 'tell application "Terminal"
    activate
    do script "cd '"$SCRIPT_DIR"' && npm run dev"
end tell'

# 等待几秒让服务启动
sleep 3

# 自动打开浏览器
open http://localhost:3000