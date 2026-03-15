# Increment 9 Summary (Applied)

Date: 2026-03-02
Mode: staged bridge token rotation (future-start compatibility)

## Changes
- Patched pc_server.py to support BRIDGE_SHARED_TOKEN_ALLOWLIST.
- Set User env BRIDGE_SHARED_TOKEN to a new strong token.
- Set User env BRIDGE_SHARED_TOKEN_ALLOWLIST to "new,old" for compatibility on next startup.
- No restart performed; current running bridge unchanged until next launch.

## Rollback
- powershell -ExecutionPolicy Bypass -File .\restore-env.ps1
