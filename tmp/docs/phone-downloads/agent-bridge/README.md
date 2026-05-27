# Agent Bridge (Windows PC <-> Samsung S24 FE)

Phase-1 scaffold for an always-on bidirectional bridge between a Windows host and an Android phone.

## What This Includes

- `pc_server.py`
  - FastAPI dashboard + API
  - WebSocket endpoint for phone connection
  - Heartbeat/offline detection
  - Connector registration
  - Command dispatch to phone
  - Optional local-AI relay on PC (`LOCAL_AI_HTTP_URL`)
- `phone_agent.py`
  - Android/Termux client
  - CIDR auto-discovery scan (no hardcoded host required)
  - Auto-reconnect loop
  - Heartbeat ping
  - Basic command handlers (battery, clipboard, notification)
- `requirements.txt`
- `.env.example`

## Quick Start

1. On PC (Windows):

```powershell
Set-Location C:\Users\acer\CrossDevice\agent-bridge
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\requirements.txt
Copy-Item .\.env.example .\.env
# optional: edit .env values
python .\pc_server.py
```

2. Open dashboard:

- `http://127.0.0.1:8765`

3. On phone (Termux):

```bash
pkg update -y
pkg install -y python termux-api
pip install websockets
```

4. Copy `phone_agent.py` to phone and run:

```bash
export PC_BRIDGE_PORT=8765
export BRIDGE_SHARED_TOKEN=change_me
python phone_agent.py
```

If `PC_BRIDGE_HOST` is not set, the phone agent performs CIDR scan on the local subnet.

## Control Scripts (PC)

From `C:\Users\acer\CrossDevice\agent-bridge`:

```powershell
.\Start-AgentBridge-PC.ps1 -SharedToken "change_me"
.\Get-AgentBridge-PC-Status.ps1
.\Stop-AgentBridge-PC.ps1
```

Optional startup task (auto-start at Windows logon):

```powershell
.\Install-AgentBridge-PC-StartupTask.ps1 -SharedToken "change_me"
```

If Scheduled Task install is blocked by policy/permissions, use user-level startup registry:

```powershell
.\Install-AgentBridge-PC-StartupUserRun.ps1 -SharedToken "change_me"
```

Remove startup task:

```powershell
.\Uninstall-AgentBridge-PC-StartupTask.ps1
```

Remove user-level startup registry entry:

```powershell
.\Uninstall-AgentBridge-PC-StartupUserRun.ps1
```

## Termux Helper

- Copy `phone_agent.py` and `termux-start-agent.sh` to the same folder on phone.
- Start with:

```bash
chmod +x termux-start-agent.sh
./termux-start-agent.sh
```

## Environment Variables

- `PC_BRIDGE_HOST` (optional for phone; if empty, CIDR scan is used)
- `PC_BRIDGE_PORT` (default `8765`)
- `BRIDGE_SHARED_TOKEN` (recommended)
- `LOCAL_AI_HTTP_URL` (optional PC-side AI endpoint)
- `LOCAL_AI_HTTP_TOKEN` (optional bearer token)
- `PHONE_DEVICE_ID` (optional phone identifier)
- `DISCOVERY_CIDR` (optional, e.g. `192.168.1.0/24`)
- `DISCOVERY_TIMEOUT_SECONDS` (default `0.35`)
- `HEARTBEAT_INTERVAL_SECONDS` (default `8`)
- `HEARTBEAT_TIMEOUT_SECONDS` (default `30`)
- `ENABLE_CLIPBOARD_CONNECTOR` (default `0`; clipboard commands disabled unless explicitly enabled)

## Notes

- Clipboard is disabled by default. Enable only if needed using `ENABLE_CLIPBOARD_CONNECTOR=1`.
- Clipboard history is not universally accessible via Android shell APIs. If enabled, this agent supports current clipboard value only (not full history) through Termux APIs when available.
- This is a secure baseline scaffold, not final production hardening.
- This implementation is backend/stealth friendly and does not require front-screen phone automation.
