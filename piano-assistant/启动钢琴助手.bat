@echo off
chcp 65001 >nul
title 钢琴助手 Piano Assistant
cd /d "%~dp0"

echo.
echo   🎹 钢琴助手 Piano Assistant
echo   ════════════════════════════
echo.

:: Find Python
set PY=
for %%p in (python python3 py) do (
    where %%p >nul 2>nul
    if !errorlevel!==0 set PY=%%p
)
if "%PY%"=="" (
    echo   [X] 未找到 Python
    echo   安装: https://python.org 或微软商店搜索 Python
    pause & exit /b 1
)

:: Kill old server
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8080.*LISTENING') do (
    echo   关闭旧服务...
    taskkill /F /PID %%a >nul 2>nul
)

:: Start
echo   启动服务 http://localhost:8080
start "" /MIN %PY% -m http.server 8080
timeout /t 2 /nobreak >nul
start "" http://localhost:8080

echo.
echo   ┌─────────────────────────────────────┐
echo   │  服务运行中 http://localhost:8080    │
echo   │                                     │
echo   │  💡 首次使用: 浏览器弹出麦克风权限   │
echo   │     请点击「允许」才能检测弹奏       │
echo   │                                     │
echo   │  按任意键停止服务                    │
echo   └─────────────────────────────────────┘
echo.
pause >nul

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8080.*LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
echo   已停止
