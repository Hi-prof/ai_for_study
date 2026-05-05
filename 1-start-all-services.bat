@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "ROOT_DIR=%~dp0"
set "MAIN_SCRIPT=%ROOT_DIR%qd.bat"
set "AGENT_SCRIPT=%ROOT_DIR%start-knowledge-agent.bat"
set "HIPROF_UI_SCRIPT=%ROOT_DIR%start-hiprof-ui.bat"

if not exist "%MAIN_SCRIPT%" goto missing_main
if not exist "%AGENT_SCRIPT%" goto missing_agent
if not exist "%HIPROF_UI_SCRIPT%" goto missing_hiprof_ui

echo [INFO] Starting all HiProf project services...
echo.

echo [1/3] Starting backend and main frontend...
start "Start HiProf Main" cmd /k "cd /d ""%ROOT_DIR%"" && call ""%MAIN_SCRIPT%"""

timeout /t 2 /nobreak >nul

echo [2/3] Starting knowledge-agent...
start "Start Knowledge Agent" cmd /k "cd /d ""%ROOT_DIR%"" && call ""%AGENT_SCRIPT%"""

timeout /t 2 /nobreak >nul

echo [3/3] Starting HiProf UI dev server...
start "Start HiProf UI" cmd /k "cd /d ""%ROOT_DIR%"" && call ""%HIPROF_UI_SCRIPT%"""

echo.
echo [INFO] Startup commands sent.
echo - Backend: http://localhost:9090
echo - Main frontend: http://localhost:5173
echo - HiProf UI: http://localhost:8080
echo - knowledge-agent: http://localhost:18081
echo.
echo [INFO] Use stop-all-services.bat to stop these services.
pause
exit /b 0

:missing_main
echo [ERROR] Missing script: %MAIN_SCRIPT%
pause
exit /b 1

:missing_agent
echo [ERROR] Missing script: %AGENT_SCRIPT%
pause
exit /b 1

:missing_hiprof_ui
echo [ERROR] Missing script: %HIPROF_UI_SCRIPT%
pause
exit /b 1
