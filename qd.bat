@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%HiProf"
set "BACKEND_DIR=%ROOT_DIR%HiProf-master"
set "BACKEND_JAR=%BACKEND_DIR%\hiprof-admin\target\hiprof-admin.jar"

rem Local development defaults. Set env vars before running this script to override.
if not defined DB_HOST set "DB_HOST=127.0.0.1"
if not defined DB_PORT set "DB_PORT=3306"
if not defined DB_NAME set "DB_NAME=hp_db"
if not defined DB_USERNAME set "DB_USERNAME=root"
if not defined DB_PASSWORD set "DB_PASSWORD=1472580369xhb@"
if not defined REDIS_HOST set "REDIS_HOST=127.0.0.1"
if not defined REDIS_PORT set "REDIS_PORT=6379"
if not defined REDIS_DATABASE set "REDIS_DATABASE=0"
if not defined REDIS_PASSWORD set "REDIS_PASSWORD="

if not exist "%FRONTEND_DIR%\package.json" (
    echo [错误] 未找到前端目录：%FRONTEND_DIR%
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\pom.xml" (
    echo [错误] 未找到后端目录：%BACKEND_DIR%
    pause
    exit /b 1
)

where mvn >nul 2>nul || (
    echo [错误] 未检测到 Maven，请先安装并配置 PATH。
    pause
    exit /b 1
)

where npm >nul 2>nul || (
    echo [错误] 未检测到 npm，请先安装 Node.js 并配置 PATH。
    pause
    exit /b 1
)

where java >nul 2>nul || (
    echo [错误] 未检测到 Java，请先安装 JDK 17 并配置 PATH。
    pause
    exit /b 1
)

echo [开发环境] 后端将使用以下本地连接配置：
echo - MySQL: %DB_HOST%:%DB_PORT%/%DB_NAME% ^(user=%DB_USERNAME%^)
echo - Redis: %REDIS_HOST%:%REDIS_PORT% ^(db=%REDIS_DATABASE%^)
echo.

echo [1/2] 正在启动后端服务...
start "HiProf Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && mvn -pl hiprof-admin -am -DskipTests package && java -jar ""%BACKEND_JAR%"""

echo 等待后端初始化 12 秒...
timeout /t 12 /nobreak >nul

echo [2/2] 正在启动前端服务...
start "HiProf Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev:local"

echo.
echo 已发送启动命令：
echo - 后端默认地址：http://localhost:9090
echo - 前端默认地址：http://localhost:5173
echo.
echo 注意：后端依赖 MySQL 和 Redis，没开的话它照样起不来。
echo 另外后端现在走“打包后运行 jar”，稳一点，但不是热更新模式。
pause
