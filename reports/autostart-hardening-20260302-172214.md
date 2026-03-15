# Autostart Hardening Plan (Asolaria + CrossDevice Bridge)

Generated: 2026-03-02 17:22:14 (local)
Scope: startup/autostart/task ownership + hardening plan only
Mode: inspection + plan (no mutation executed)

## Constraints Honored
- No service restarts requested or performed.
- No destructive actions (no delete/unregister/reset) in this run.
- Did not disable or alter Microsoft Store / WindowsApps PATH behavior.
- Ignored unrelated workspace edits.

## Ownership Snapshot (Current State)

### CrossDevice bridge (startup ownership)
- Autostart vector: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` value `AgentBridgePC`.
- Current command:
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\acer\CrossDevice\agent-bridge\Start-AgentBridge-PC.ps1" -WorkDir "C:\Users\acer\CrossDevice\agent-bridge" -BindHost "0.0.0.0" -Port 8765 -SharedToken "change_me"`
- No Scheduled Task found for CrossDevice bridge startup.
- Runtime observed:
  - `python.exe pc_server.py` listening on `0.0.0.0:8765`.
  - `/api/pc/command` accepts local POST without auth header.
  - WebSocket accepted when token=`change_me`.

### Asolaria (startup ownership)
- Scheduled tasks present:
  - `\Asolaria One Button Startup` (AtLogOn delay 30s, RunLevel Highest, LastResult 1)
  - `\Asolaria Core Boot Startup` (AtLogOn delay 45s, RunLevel Highest, LastResult 1)
  - `\Asolaria NotebookLM Build Loop` (time trigger every 3h, LastResult 0)
  - plus one-off/time tasks (`Wake Display`, quota reminder).
- Startup folder entry present:
  - `%APPDATA%\...\Startup\Asolaria One Button Startup.lnk`
  - Target: `C:\Users\acer\Asolaria\Start-Asolaria-OneButton.cmd`
- `Start-Asolaria-OneButton.ps1` auto-registers both logon tasks and can fallback to shortcut mode, but does not remove an existing shortcut after task registration.

## Findings (Prioritized)

1. High: CrossDevice startup uses known placeholder secret in clear text (`change_me`) in HKCU Run.
- Risk: token leakage via registry/process command-line visibility and predictable default secret.

2. High: CrossDevice bridge binds all interfaces (`0.0.0.0`) while HTTP control endpoints are unauthenticated.
- Risk: LAN-reachable control API if host firewall/profile permits inbound.

3. Medium: Asolaria has overlapping autostart paths (two logon tasks + startup shortcut).
- Risk: duplicate launches/races and harder incident attribution.

4. Medium: Asolaria startup tasks run `-ExecutionPolicy Bypass` and RunLevel Highest.
- Note: likely intentional for boot reliability; hardening should be staged to avoid regressions.

## Minimal-Disruption Hardening Plan

### Phase 0: Backup/Snapshot (required before any mutation)
1. Export startup/task state to timestamped backup folder.
2. Export current `HKCU\...\Run` and Asolaria task XML.
3. Record Startup folder `.lnk` inventory.

### Phase 1: CrossDevice bridge secret + startup hardening (safe, no restart)
1. Generate strong token and store as **User env var** `BRIDGE_SHARED_TOKEN`.
2. Update `AgentBridgePC` Run command to remove inline `-SharedToken`.
3. Keep `-BindHost "0.0.0.0"` initially (to avoid breaking phone reachability), then optionally tighten host/firewall in Phase 1B.
4. Verification:
- `reg query ... /v AgentBridgePC`
- `[Environment]::GetEnvironmentVariable('BRIDGE_SHARED_TOKEN','User').Length`

Phase 1B (optional tighter network control):
- If phone needs LAN access: keep `0.0.0.0`, add narrow inbound firewall rule for TCP/8765 (Private profile, LocalSubnet or explicit phone IP).
- If phone does not need LAN access: switch Run command to `-BindHost "127.0.0.1"`.

### Phase 2: Asolaria autostart dedupe (lowest-risk first)
1. Keep Scheduled Tasks as canonical path.
2. Disable startup shortcut path first (rename `.lnk`), do not delete.
3. Verify after next logon that only scheduled startup path is active and server health remains good.

### Phase 3: Optional Asolaria task simplification
1. If duplicate startup behavior remains, disable (not remove) `\Asolaria Core Boot Startup` and keep `\Asolaria One Button Startup` as single logon trigger.
2. Verify one full login cycle.
3. Re-enable immediately if startup reliability drops.

## Optional Patch Commands (Not Executed)

### A) Backup block
```powershell
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$bak = "C:\Users\acer\Asolaria\reports\autostart-hardening-backup-$ts"
New-Item -ItemType Directory -Path $bak -Force | Out-Null

reg export "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" "$bak\hkcu-run.reg" /y | Out-Null

$startup = [Environment]::GetFolderPath('Startup')
Get-ChildItem -Path $startup -Filter *.lnk | Select-Object Name,FullName,LastWriteTime |
  ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 "$bak\startup-links.json"

foreach($t in @(
  'Asolaria One Button Startup',
  'Asolaria Core Boot Startup',
  'Asolaria NotebookLM Build Loop',
  'Asolaria Wake Display 1000 BRT',
  'Asolaria-OpenAI-Quota-Reminder-20260304'
)){
  try { Export-ScheduledTask -TaskName $t -TaskPath '\\' | Set-Content -Encoding Unicode "$bak\task-$($t -replace '[^A-Za-z0-9._-]','_').xml" } catch {}
}
```

### B) Apply block (CrossDevice + Asolaria minimal)
```powershell
# 1) Strong token in user env (no inline token in Run value)
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$token = [Convert]::ToBase64String($bytes)
[Environment]::SetEnvironmentVariable('BRIDGE_SHARED_TOKEN', $token, 'User')

# 2) Update HKCU Run value without -SharedToken
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$cmd = '%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\acer\CrossDevice\agent-bridge\Start-AgentBridge-PC.ps1" -WorkDir "C:\Users\acer\CrossDevice\agent-bridge" -BindHost "0.0.0.0" -Port 8765'
Set-ItemProperty -Path $runKey -Name 'AgentBridgePC' -Value $cmd -Type String

# 3) Optional LAN tighten (enable only if admin and desired)
# New-NetFirewallRule -DisplayName 'AgentBridge 8765 (Private LocalSubnet)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8765 -Profile Private -RemoteAddress LocalSubnet

# 4) Asolaria dedupe: disable startup-folder autostart path (reversible)
$startup = [Environment]::GetFolderPath('Startup')
$lnk = Join-Path $startup 'Asolaria One Button Startup.lnk'
if(Test-Path $lnk){ Rename-Item -LiteralPath $lnk -NewName 'Asolaria One Button Startup.lnk.disabled' }
```

### C) Rollback block
```powershell
# 1) Restore HKCU Run from backup export (pick your backup path)
# reg import "C:\Users\acer\Asolaria\reports\autostart-hardening-backup-<TS>\hkcu-run.reg"

# 2) Remove user env token if reverting
[Environment]::SetEnvironmentVariable('BRIDGE_SHARED_TOKEN', $null, 'User')

# 3) Restore Asolaria startup shortcut
$startup = [Environment]::GetFolderPath('Startup')
$disabled = Join-Path $startup 'Asolaria One Button Startup.lnk.disabled'
if(Test-Path $disabled){ Rename-Item -LiteralPath $disabled -NewName 'Asolaria One Button Startup.lnk' }

# 4) Optional: remove firewall rule if created
# Remove-NetFirewallRule -DisplayName 'AgentBridge 8765 (Private LocalSubnet)'
```

## Verification Checklist (Post-change)
- `reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v AgentBridgePC`
- Confirm no `-SharedToken "..."` appears in Run value.
- Confirm `BRIDGE_SHARED_TOKEN` exists at User scope.
- Next logon: verify bridge and Asolaria come up once (no duplicate launch symptom).
- Check listeners:
  - `Get-NetTCPConnection -State Listen | ? LocalPort -in 8765,4781,5443`

## Notes on Next Safe Code Patch (Optional, not applied)
- `CrossDevice\agent-bridge\Install-AgentBridge-PC-StartupUserRun.ps1` and `...StartupTask.ps1`:
  - stop defaulting `SharedToken` to `change_me`; require explicit token or pre-set `BRIDGE_SHARED_TOKEN`.
- `Asolaria\tools\Start-Asolaria-OneButton.ps1`:
  - after successful task registration, auto-disable stale `Asolaria One Button Startup.lnk` to prevent dual autostart paths.
