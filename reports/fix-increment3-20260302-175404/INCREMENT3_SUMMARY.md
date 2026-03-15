# Increment 3 Summary (Applied)

Date: 2026-03-02
Mode: hardening without behavior change

## Change applied
- Preserved existing bridge token value but moved it out of the HKCU Run command line.
- Set User env var `BRIDGE_SHARED_TOKEN` to existing token value.
- Updated `AgentBridgePC` Run entry to remove `-SharedToken "..."` switch.
- Kept bind host and port unchanged (`0.0.0.0:8765`).
- No restart was performed.

## Validation
- Run entry no longer contains `-SharedToken`.
- `BRIDGE_SHARED_TOKEN` is present at User scope.
- Local bridge health endpoint remains reachable.

## Rollback
1. `reg import .\hkcu-run-before.reg`
2. Optionally clear env var:
   - `[Environment]::SetEnvironmentVariable("BRIDGE_SHARED_TOKEN", $null, "User")`
