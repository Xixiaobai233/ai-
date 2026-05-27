@echo off
chcp 65001 >nul
title Cloudflared Tunnel 设置

:: ============================================================
:: Task Manager — Cloudflared Tunnel 设置脚本
:: 检查 cloudflared 环境，打印安装服务指引
:: ============================================================

setlocal enabledelayedexpansion

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║     Cloudflared Tunnel 设置                     ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── 1. 检查 cloudflared 是否安装 ──
echo [1/3] 检查 cloudflared ...
where cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('cloudflared version') do set CF_VER=%%i
    echo   ✅ cloudflared 已安装: !CF_VER!
) else (
    echo   ❌ cloudflared 未安装
    echo.
    echo   请前往 https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo   下载 Windows 版 cloudflared 并安装。
    echo.
    pause
    exit /b 1
)
echo.

:: ── 2. 检查配置文件 ──
echo [2/3] 检查 cloudflared 配置 ...
set "CONFIG_FILE=%USERPROFILE%\.cloudflared\config.yml"
if exist "!CONFIG_FILE!" (
    echo   ✅ 配置文件存在: !CONFIG_FILE!
    echo.
    type "!CONFIG_FILE!"
) else (
    echo   ⚠️  配置文件不存在: !CONFIG_FILE!
    echo.
    echo   请先创建配置文件，示例内容：
    echo.
    echo   tunnel: <你的 Tunnel ID>
    echo   credentials-file: C:\Users\%USERNAME%\.cloudflared\<你的 Tunnel ID>.json
    echo.
    echo   url: http://localhost:3001
    echo.
    echo   或者运行 cloudflared tunnel login 和 cloudflared tunnel create 来生成。
)
echo.

:: ── 3. 打印安装提示 ──
echo [3/3] 安装指引 ...
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  如需将 cloudflared 安装为 Windows 服务：        ║
echo  ║                                                 ║
echo  ║  1. 确保 config.yml 配置正确                     ║
echo  ║  2. 以管理员身份运行 CMD，执行：                 ║
echo  ║                                                 ║
echo  ║     cloudflared service install                 ║
echo  ║                                                 ║
echo  ║  3. 在服务管理器(services.msc)中启动服务          ║
echo  ║                                                 ║
echo  ║  常用命令：                                      ║
echo  ║     cloudflared tunnel login     登录 Cloudflare ║
echo  ║     cloudflared tunnel create    创建隧道       ║
echo  ║     cloudflared tunnel list      查看隧道列表   ║
echo  ║     cloudflared tunnel run       运行隧道       ║
echo  ║     cloudflared service install  安装为服务     ║
echo  ║     cloudflared service uninstall 卸载服务      ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
endlocal
