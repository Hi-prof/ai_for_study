@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
set "AGENT_DIR=%SCRIPT_DIR%HiProf-master\hiprof-agent\knowledge-agent"
set "VENV_PY=%AGENT_DIR%\.venv\Scripts\python.exe"
set "LOG_DIR=%AGENT_DIR%\logs"
set "PORT=18081"

if not exist "%AGENT_DIR%\requirements.txt" goto missing_dir
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
set "LOG_FILE=%LOG_DIR%\knowledge-agent-%RANDOM%-%RANDOM%.log"

if exist "%VENV_PY%" (
  set "PYTHON_CMD=%VENV_PY%"
) else (
  where python >nul 2>nul || goto missing_python
  set "PYTHON_CMD=python"
)

echo [INFO] Starting knowledge-agent...
echo [INFO] Dir: %AGENT_DIR%
echo [INFO] Python: %PYTHON_CMD%
echo [INFO] URL: http://localhost:%PORT%
echo [INFO] Log: %LOG_FILE%
echo.

powershell -NoProfile -Command "$pids = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { if ($procId -and $procId -ne 0) { Write-Host ('[INFO] Stopping old process PID=' + $procId + ' ...'); Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } }"
timeout /t 2 >nul

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }"
if errorlevel 1 goto port_busy

pushd "%AGENT_DIR%" || goto pushd_failed
"%PYTHON_CMD%" -m uvicorn app.main:app --host 0.0.0.0 --port %PORT% 1>>"%LOG_FILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"
popd

echo.
echo [ERROR] knowledge-agent exited, code=%EXIT_CODE%
echo [ERROR] See log: %LOG_FILE%
type "%LOG_FILE%"
pause
exit /b %EXIT_CODE%
:missing_dir
echo [ERROR] Agent directory not found: %AGENT_DIR%
pause
exit /b 1

:missing_python
echo [ERROR] Python not found in PATH.
pause
exit /b 1

:pushd_failed
echo [ERROR] Cannot enter directory: %AGENT_DIR%
pause
exit /b 1

:port_busy
echo [ERROR] Port %PORT% is still in use. Close the old knowledge-agent window or stop the process and try again.
pause
exit /b 1
