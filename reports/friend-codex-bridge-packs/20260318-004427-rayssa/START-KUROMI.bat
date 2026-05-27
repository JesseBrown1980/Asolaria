@echo off
echo === KUROMI / LIRIS Sub-Colony Agent ===
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install it first.
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist node_modules\mqtt (
    echo Installing MQTT package...
    npm install mqtt
    echo.
)

echo Starting Kuromi agent...
echo Press Ctrl+C to stop.
echo.
node liris-mqtt-agent.js
pause
