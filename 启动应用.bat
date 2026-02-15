@echo off
REM 合同台账管理系统启动器 (Windows版本)

cd /d "%~dp0"

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误：未检测到 Node.js，请先安装 Node.js 后再试。
    pause
    exit /b 1
)

REM 检查依赖是否安装
if not exist "node_modules\" (
    echo 首次运行需要安装依赖，这可能需要几分钟时间...
    call npm install
)

REM 启动应用
echo 正在启动合同台账管理系统...
echo 请勿关闭此窗口，否则应用将停止运行。
echo.
echo 访问地址: http://localhost:3000
echo.

start "" http://localhost:3000

call npm run dev