@echo off
chcp 65001 >nul
title Task Manager 环境检查

:: ============================================================
:: Task Manager — 环境检查脚本
:: 检查 Node.js、npm、Docker、PostgreSQL、端口占用、依赖
:: ============================================================

setlocal enabledelayedexpansion

set "PROJECT_DIR=%CD%"

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║     Task Manager 环境检查                       ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  项目目录: %PROJECT_DIR%
echo.

:: ── 1. 检查 Node.js ──
echo ── [1/6] Node.js ──
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo   ✅ Node.js !NODE_VER!
) else (
    echo   ❌ Node.js 未安装
)
echo.

:: ── 2. 检查 npm ──
echo ── [2/6] npm ──
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
    echo   ✅ npm v!NPM_VER!
) else (
    echo   ❌ npm 未安装
)
echo.

:: ── 3. 检查 Docker Desktop ──
echo ── [3/6] Docker Desktop ──
docker ps >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Docker Desktop 运行中
) else (
    echo   ❌ Docker Desktop 未运行
)
echo.

:: ── 4. 检查 PostgreSQL 容器 ──
echo ── [4/6] PostgreSQL 容器 ──
docker ps --filter "name=taskmanager-postgres" --filter "status=running" | findstr "taskmanager-postgres" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ PostgreSQL 容器运行中
) else (
    docker ps -a --filter "name=taskmanager-postgres" | findstr "taskmanager-postgres" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ⚠️  PostgreSQL 容器存在但未运行
    ) else (
        echo   ❌ PostgreSQL 容器不存在
    )
)
echo.

:: ── 5. 检查 3001 端口 ──
echo ── [5/6] 端口 3001（后端） ──
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ❌ 端口 3001 已被占用
) else (
    echo   ✅ 端口 3001 空闲
)
echo.

:: ── 6. 检查 node_modules ──
echo ── [6/6] node_modules ──

if exist "%PROJECT_DIR%\frontend\node_modules" (
    echo   ✅ frontend\node_modules 存在
) else (
    echo   ❌ frontend\node_modules 不存在（请执行 cd frontend ^&^& npm install）
)

if exist "%PROJECT_DIR%\backend\node_modules" (
    echo   ✅ backend\node_modules 存在
) else (
    echo   ❌ backend\node_modules 不存在（请执行 cd backend ^&^& npm install）
)
echo.

:: ── 总结 ──
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  检查完毕                                       ║
echo  ║  如果以上有 ❌，请根据提示修复后重新运行本脚本    ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
endlocal
