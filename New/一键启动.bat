@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-local.ps1" -NoPause %*
echo.
echo Press any key to close this window.
pause >nul
