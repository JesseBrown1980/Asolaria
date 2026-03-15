# Increment 3 Summary (Applied)

Date: 2026-03-02
Mode: startup token hardening without restart

## Change applied
- Backed up `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run` to `hkcu-run-before.reg`.
- Updated `AgentBridgePC` startup command in-place:
  - `-BindHost "0.0.0.0"` -> `-BindHost "127.0.0.1"`
  - `-SharedToken "change_me"` -> strong random token (redacted in artifacts)
- No service/process restart was executed.

## Validation
- Bind host hardened to loopback: False
- Placeholder token removed: False
- Running AgentBridge-like process count (observed, unchanged by this step): 1

## Artifacts
- `agentbridgepc-command-before.txt`
- `agentbridgepc-command-after-redacted.txt`
- `summary.json`
- `restore-run-agentbridgepc.ps1`

## Rollback
```powershell
powershell -ExecutionPolicy Bypass -File .\restore-run-agentbridgepc.ps1
```
