@echo off
REM start_backend_and_tunnel.bat
REM Place this file in B:\College\ILGC\web_v2\backend

pushd "%~dp0"
setlocal

REM Config
set PORT=8001
set CONDA_ENV=ilgc_env
set LOG_BACKEND=%CD%\backend.log
set LOG_TUNNEL=%CD%\tunnel.log

echo [%date% %time%] Starting backend + localtunnel... > "%LOG_BACKEND%"
echo [%date% %time%] Starting backend + localtunnel... > "%LOG_TUNNEL%"

REM Activate conda environment (adjust path if needed)
REM This calls conda's activate.bat to ensure 'conda activate' works in batch file.
call "%USERPROFILE%\miniconda3\Scripts\activate.bat" "%CONDA_ENV%" 2>nul || (
  echo Could not call activate.bat at %%USERPROFILE%%\miniconda3\Scripts\activate.bat
  echo Ensure conda is installed or adjust path in the script.
)

REM Kill any process listening on the port (best-effort)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
  echo Killing PID %%a >> "%LOG_BACKEND%"
  taskkill /PID %%a /F >nul 2>&1 || echo Failed to kill %%a >> "%LOG_BACKEND%"
)

REM Start uvicorn in a new window (logs -> backend.log)
start "Backend" cmd /c "python -m uvicorn app.main:app --host 0.0.0.0 --port %PORT% > \"%LOG_BACKEND%\" 2>&1"

REM Give the server a few seconds to spin up
ping -n 3 127.0.0.1 >nul

REM Try to start localtunnel with subdomain rstm; if it fails, fall back to a random subdomain.
start "LocalTunnel" cmd /c "(npx localtunnel --port %PORT% --subdomain rstm > \"%LOG_TUNNEL%\" 2>&1) || (npx localtunnel --port %PORT% > \"%LOG_TUNNEL%\" 2>&1)"

echo Started. Backend log: %LOG_BACKEND%
echo Started. Tunnel log: %LOG_TUNNEL%

endlocal
popd
