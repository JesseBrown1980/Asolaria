@echo off
setlocal

:: ── Asolaria Sub-Colony Startup ──────────────────────────────────
:: This starts Asolaria in sub-colony mode, connecting back to the
:: sovereign instance at 192.168.1.3 via MQTT.
::
:: Prerequisites:
::   1. Node.js installed (node --version)
::   2. npm install --production (run once after extracting)

set "ASOLARIA_PORT=4781"
set "ASOLARIA_BIND_HOST="

:: MQTT: connect to sovereign's broker on the LAN
set "ASOLARIA_MQTT_BROKER_URL=mqtt://192.168.1.3:18883"
set "ASOLARIA_MQTT_ENABLED=true"
set "ASOLARIA_MQTT_BASE_TOPIC=asolaria/nodes/rayssa"
set "ASOLARIA_MQTT_CLIENT_ID=asolaria-rayssa"
set "ASOLARIA_MQTT_INCLUDE_HEALTH=true"
set "ASOLARIA_MQTT_INCLUDE_COLONY=true"
set "ASOLARIA_MQTT_INCLUDE_WORLD=true"
set "ASOLARIA_MQTT_CONTROL_ENABLED=true"

:: Sub-colony identity
set "ASOLARIA_NODE_ID=rayssa"
set "ASOLARIA_NODE_ROLE=sub_colony"
set "ASOLARIA_SOVEREIGN_HOST=192.168.1.3"

:: Connection policy
set "ASOLARIA_CONNECTION_PREFERENCE=private_internet"
set "ASOLARIA_CONNECTION_AVAILABLE=private_internet"
set "ASOLARIA_NETWORK_REMOTE_AUTH_REQUIRED=true"

:: Disable features that only the sovereign needs
set "ASOLARIA_SLACK_ENABLED=false"
set "ASOLARIA_GITHUB_ENABLED=false"
set "ASOLARIA_OPENCLAW_MODE=disabled"

echo ── Asolaria Sub-Colony (rayssa) ──
echo Sovereign: 192.168.1.3
echo MQTT Broker: mqtt://192.168.1.3:18883
echo Topic namespace: asolaria/nodes/rayssa
echo.

node server.js

endlocal
