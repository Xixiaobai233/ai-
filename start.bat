@echo off
chcp 65001 >nul
title Task Manager 一键启动
setlocal enabledelayedexpansion

:: ============================================================
:: Task Manager — 一键启动脚本
:: 启动 PostgreSQL、后端、前端，各开独立窗口
:: ============================================================

set "PROJECT_DIR=%CD%"

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Task Manager 一键启动脚本                ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── 1. 检查 Docker 是否运行 ──
echo [1/5] 检查 Docker Desktop ...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Docker Desktop 未运行，请手动启动 Docker Desktop 后重试
    echo.
    pause
    exit /b 1
)
echo   ✅ Docker Desktop 运行中
echo.

:: ── 2. 启动 PostgreSQL ──
echo [2/5] 检查 PostgreSQL 容器 ...
docker ps --filter "name=taskmanager-postgres" --filter "status=running" | findstr "taskmanager-postgres" >nul 2>&1
if %errorlevel% neq 0 (
    echo   ⚠️  PostgreSQL 未运行，正在启动 ...
    docker compose -p taskmanager -f "%PROJECT_DIR%\docker-compose.yml" up -d postgres
    if %errorlevel% neq 0 (
        echo   ❌ PostgreSQL 启动失败
        pause
        exit /b 1
    )
    echo   ✅ PostgreSQL 容器已启动
) else (
    echo   ✅ PostgreSQL 容器运行中
)
echo.

:: ── 3. 检查 3001 端口 ──
echo [3/5] 检查 3001 端口（后端）...
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ❌ 端口 3001 已被占用，请先释放该端口再重试
    pause
    exit /b 1
)
echo   ✅ 端口 3001 空闲
echo.

:: ── 4. 查找前端空闲端口 ──
echo [4/5] 查找前端空闲端口 ...
set FRONTEND_PORT=5173
for %%p in (5173 5174 5175 5176 5177) do (
    netstat -ano | findstr ":%%p " | findstr "LISTENING" >nul 2>&1
    if !errorlevel! neq 0 (
        set FRONTEND_PORT=%%p
        goto :port_found
    )
)
:port_found
echo   ✅ 使用端口 %FRONTEND_PORT% 启动前端
echo.

:: ── 5. 启动服务 ──
echo [5/5] 启动服务 ...
echo.

:: 启动 PostgreSQL（如果未运行，刚已启动，这里确保）
docker ps --filter "name=taskmanager-postgres" --filter "status=running" | findstr "taskmanager-postgres" >nul 2>&1
if %errorlevel% neq 0 (
    start "PostgreSQL" cmd /c "echo 正在启动 PostgreSQL ... && docker compose -p taskmanager -f %PROJECT_DIR%\docker-compose.yml up -d postgres && echo PostgreSQL 已启动 && timeout /t 5"
)

:: 启动后端
start "Backend - 3001" cmd /k "echo 后端启动中 ... && cd /d "%PROJECT_DIR%\backend" && npm run dev"

:: 稍等后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
start "Frontend - %FRONTEND_PORT%" cmd /k "echo 前端启动中 ... && cd /d "%PROJECT_DIR%\frontend" && npx vite --port %FRONTEND_PORT%"

:: ── 打开浏览器 ──
timeout /t 5 /nobreak >nul
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   ✅ 所有服务已启动！                            ║
echo  ║                                                 ║
echo  ║   后端 API : http://localhost:3001               ║
echo  ║   前端页面 : http://localhost:%FRONTEND_PORT%    ║
echo  ║                                                 ║
echo  ║   各服务运行在独立窗口中，关闭窗口即可停止        ║
echo  ╚══════════════════════════════════════════════════╝
echo.
start http://localhost:%FRONTEND_PORT%

echo 按任意键退出本窗口（服务将继续在后台运行）...
pause >nul
endlocal
