@echo off
chcp 65001 >nul
title 道德困境实验室 - 后端服务

echo ============================================
echo   道德困境实验室 - 后端启动中...
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] 启动 Python 后端...
start "Moral-Dilemma-Backend" python backend.py
echo       后台已在 http://localhost:8000 运行
echo.

echo [2/2] 启动公网隧道 (localtunnel)...
echo       正在生成分享链接...
echo.
npx --yes localtunnel --port 8000 --subdomain moral-dilemma-mkb

echo.
echo ============================================
echo   隧道已关闭。按任意键退出...
echo ============================================
pause >nul
