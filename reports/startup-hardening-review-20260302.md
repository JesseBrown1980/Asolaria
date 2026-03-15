# Startup Hardening Review (2026-03-02)

Scope (read-only inspection):
- `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- Scheduled tasks `Asolaria*`
- Startup folder `C:\Users\acer\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`
- `C:\Users\acer\CrossDevice\agent-bridge` startup install scripts

## Findings (ordered by severity)

### 1) High - Agent Bridge control API is currently network-exposed on all interfaces

Evidence:
- Listener present: `netstat -ano` shows `TCP 0.0.0.0:8765 ... LISTENING 15028`.
- Process bound to that listener: PID `15028` is `python.exe pc_server.py`.
- Live server status confirms host: `GET http://127.0.0.1:8765/api/status` returns event `"PC server started"` with `"host": "0.0.0.0"`.
- API routes are HTTP and unauthenticated in code:
  - `/api/status` at `pc_server.py:811`
  - `/api/pc/message` at `pc_server.py:826`
  - `/api/pc/command` at `pc_server.py:836`
- Token enforcement is only on websocket route `/ws/phone` (`pc_server.py:913-919`).
- Token logic allows all when no token configured: `if not required: return True` (`pc_server.py:342-343`).

Security impact:
- Any host that can reach this machine on port `8765` can call HTTP API endpoints.
- Current `pc_shell_enabled` is `false` (from `/api/status`), which limits direct shell execution, but control-plane endpoints remain exposed.

Concrete validation / reproduction (read-only):
- On this host: `Invoke-RestMethod http://127.0.0.1:8765/api/status`.
- From another LAN host: `curl http://<PC_IP>:8765/api/status` (if reachable, exposure is confirmed).
- Optional harmless API check: POST `{"action":"ping"}` to `/api/pc/command`; success confirms unauthenticated command endpoint reachability.

### 2) Medium - Startup installer defaults can reintroduce broad exposure

Evidence:
- Default bind host is wide-open in all startup paths:
  - `Install-AgentBridge-PC-StartupTask.ps1:4` -> `BindHost = "0.0.0.0"`
  - `Install-AgentBridge-PC-StartupUserRun.ps1:4` -> `BindHost = "0.0.0.0"`
  - `Start-AgentBridge-PC.ps1:3` -> `BindHost = "0.0.0.0"`
- Shared token is optional/empty by default:
  - `Install-AgentBridge-PC-StartupTask.ps1:6`
  - `Install-AgentBridge-PC-StartupUserRun.ps1:6`
  - `Start-AgentBridge-PC.ps1:5`
- Current `HKCU Run` entry is safer (`BindHost "127.0.0.1"`), but runtime state is still `0.0.0.0`, indicating drift between persisted startup config and active process launch mode.

Security impact:
- Re-running installers with defaults can restore an externally reachable listener even if current Run key is hardened.

Concrete validation / reproduction (read-only):
- Inspect defaults with `rg -n "BindHost|SharedToken"` on the three scripts.
- Compare current persisted startup command:
  - `Get-ItemPropertyValue HKCU:\Software\Microsoft\Windows\CurrentVersion\Run -Name AgentBridgePC`
- Compare current runtime bind:
  - `netstat -ano | Select-String ':8765'`
  - `/api/status` host field.

### 3) Medium - Asolaria scheduled task command regression (malformed action)

Evidence:
- Task: `Asolaria NotebookLM Upgrade Loop`.
- `schtasks /query /tn "Asolaria NotebookLM Upgrade Loop" /v /fo list` shows malformed action:
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File " C:\Users\acer\Asolaria\tools\Start-NotebookLM-Upgrade-Loop.ps1\`
- Last result indicates failure: `-196608` (also observed as `4294770688` via `Get-ScheduledTaskInfo`).
- Task is currently disabled, so this is a latent correctness regression that will likely surface if re-enabled.

Correctness/regression impact:
- Re-enabling this task without fixing the action string is likely to fail immediately.

Concrete validation / reproduction (read-only):
- Run: `schtasks /query /tn "Asolaria NotebookLM Upgrade Loop" /v /fo list` and inspect `Task To Run` string for broken quoting/path.
- Run: `Get-ScheduledTaskInfo -TaskName "Asolaria NotebookLM Upgrade Loop"` and confirm non-zero `LastTaskResult`.

### 4) Low - Startup execution policy and privilege posture is permissive

Evidence:
- Multiple startup commands/tasks use `-ExecutionPolicy Bypass`.
- Enabled task `Asolaria One Button Startup` runs at `RunLevel Highest`.
- HKCU Run entry `AgentBridgePC` also uses `-ExecutionPolicy Bypass`.

Security impact:
- If startup scripts are modified by a local attacker/process under the same user context, permissive startup settings make malicious persistence easier.

Concrete validation / reproduction (read-only):
- `Get-ScheduledTask -TaskName 'Asolaria*' | ...` inspect `RunLevel` and action args.
- `Get-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Run` inspect startup commands.

## Residual Risks If No Further Action Is Taken

- Immediate risk remains while `pc_server.py` listens on `0.0.0.0:8765` with unauthenticated HTTP API routes.
- Future maintenance risk remains because installer defaults (`0.0.0.0`, optional token) can silently undo hardening.
- Reliability risk remains because `Asolaria NotebookLM Upgrade Loop` is misconfigured and likely to fail when re-enabled.
- Persistence hardening remains weak due to widespread `ExecutionPolicy Bypass` and high-privilege startup task usage.

## Conservative Next-Step Sequence (backup-first, disable-only)

1. Backup current startup/task state before any change.
- Export `HKCU Run` key to a timestamped `.reg` file.
- Export each `Asolaria*` task XML (`schtasks /query /tn <name> /xml`).
- Record startup folder link targets (`.lnk` target + args).

2. Disable exposed entry points first (no deletion).
- Stop active `pc_server.py` process and verify port `8765` is closed.
- Disable `AgentBridgePC` startup (rename value or move to `AgentBridgePC_DISABLED_<date>` after backup).
- Keep task entries present but disabled rather than removed.

3. Normalize to local-only startup defaults before any re-enable.
- Enforce `BindHost=127.0.0.1` in startup command paths.
- Require non-empty shared token for any non-loopback bind.
- Keep shell connector disabled unless explicitly needed.

4. Repair and validate broken task definitions before enabling.
- Recreate `Asolaria NotebookLM Upgrade Loop` action string with correct quoting/path.
- Validate with `schtasks /query /v` and one manual dry run in controlled session.

5. Post-change verification checklist.
- `netstat -ano` shows no unintended external listener on `:8765`.
- `Get-ScheduledTask -TaskName 'Asolaria*'` states match intended enable/disable matrix.
- `HKCU Run` contains only expected, reviewed startup commands.
