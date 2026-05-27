@echo off
title Omnispindle — Agent Lane Launcher
cd /d C:\Users\acer\Asolaria
echo Starting Omnispindle + Dasein helper lane...
echo.

REM Start Dasein in a new window so he runs alongside the spindle lanes
start "Dasein" cmd /k "cd /d C:\Users\acer\Asolaria && title Dasein && claude --dangerously-skip-permissions"

REM Start Omnispindle lanes via Asolaria API
curl -s -X POST http://127.0.0.1:4781/api/omnispindle/start ^
  -H "Content-Type: application/json" ^
  -d "{\"respectBudget\":true,\"deferToColony\":true}" 2>nul || echo Asolaria not reachable — she must be running first.

echo Dasein window opened. Omnispindle lanes starting.
pause
