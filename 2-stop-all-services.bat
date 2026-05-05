@echo off
setlocal EnableExtensions
chcp 65001 >nul

echo [INFO] Stopping HiProf project services...
echo.

set "PORTS=8080,18081,9090,5173"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(%PORTS%);" ^
  "$processIds = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains [int]$_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "foreach ($processId in $processIds) {" ^
  "  if ($processId -and $processId -ne 0) {" ^
  "    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue;" ^
  "    if ($process) {" ^
  "      Write-Host ('[INFO] Stopping PID=' + $processId + ' Name=' + $process.ProcessName + ' ...');" ^
  "      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue;" ^
  "    }" ^
  "  }" ^
  "}"

echo.
echo [INFO] Closing startup command windows if they are still running...
for %%T in ("HiProf Backend" "HiProf Frontend" "HiProf UI" "Start HiProf Main" "Start Knowledge Agent" "Start HiProf UI") do (
  taskkill /F /T /FI "WINDOWTITLE eq %%~T" >nul 2>nul
)

timeout /t 2 /nobreak >nul

echo.
echo [INFO] Checking service ports...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(%PORTS%);" ^
  "$busy = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains [int]$_.LocalPort } | Select-Object LocalAddress,LocalPort,OwningProcess;" ^
  "if ($busy) {" ^
  "  Write-Host '[ERROR] Some service ports are still in use:';" ^
  "  $busy | Format-Table -AutoSize;" ^
  "  exit 1;" ^
  "}" ^
  "Write-Host '[INFO] All project service ports are free.'"

if errorlevel 1 (
  echo.
  echo [ERROR] Failed to stop all services. See the port list above.
  pause
  exit /b 1
)

echo.
echo [INFO] Done.
pause
