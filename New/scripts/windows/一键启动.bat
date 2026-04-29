@echo off
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0一键启动.ps1" %*
echo.
echo 按任意键关闭窗口。
pause >nul
