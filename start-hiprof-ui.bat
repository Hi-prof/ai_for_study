@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
set "UI_DIR=%ROOT_DIR%HiProf-master\hiprof-ui"

if not exist "%UI_DIR%\package.json" (
    echo [ERROR] UI directory not found: %UI_DIR%
    pause
    exit /b 1
)

where npm >nul 2>nul || (
    echo [ERROR] npm not found. Please install Node.js and add it to PATH.
    pause
    exit /b 1
)

echo [INFO] Starting HiProf UI dev server...
start "HiProf UI" cmd /k "cd /d ""%UI_DIR%"" && npm run dev"

echo.
echo Launch command sent.
echo - Directory: %UI_DIR%
echo - Default URL: http://localhost:8080
echo.
pause
