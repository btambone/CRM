@echo off
cd /d %~dp0
start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:5173"
echo Starting Inflate AI CRM... a browser tab will open automatically in a few seconds.
echo Keep this window open while you use the CRM. Close it to stop the servers.
echo.
npm run dev
pause
