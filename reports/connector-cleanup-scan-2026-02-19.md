# Connector Cleanup Scan (2026-02-19)

## Scope
- Desktop runtime: Asolaria API at `http://127.0.0.1:4781`
- Phone runtime: connected Android device via ADB
- Goal: remove/disable old or unsafe experimental connectors from earlier build phases

## Findings

### Active core mobile apps (kept)
- `com.jessebrown.asolaria`
- `com.termux`
- `com.termux.api`
- `com.tailscale.ipn`
- `org.fdroid.fdroid`

### Legacy/experimental connectors identified
1. External provider shims (`cursor`, `antigravity`) were still marked `enabled=true` in Asolaria external-provider status.
2. OpenClaw scheduled task existed as `OpenClaw Gateway` (already disabled but still present).
3. Legacy phone connector app `com.maazm7d.termuxhub` had been present earlier in this upgrade cycle.

## Actions applied

### 1) Disable legacy external provider shims
- API call: `POST /api/integrations/external/config`
  - `{ "provider": "cursor", "enabled": false }`
  - `{ "provider": "antigravity", "enabled": false }`
- Verification: `GET /api/integrations/external/status`
  - both providers now show `enabled=false`

### 2) Remove stale OpenClaw scheduled task
- Removed scheduled task:
  - `OpenClaw Gateway`
- Verification:
  - no remaining scheduled tasks matching `openclaw|claw`

### 3) Enforce OpenClaw-off runtime posture
- API call: `POST /api/settings`
  - `{ "openclawMode": "disabled", "allowExternalPosting": false }`
- Verification:
  - settings reflect `openclawMode=disabled`

### 4) Legacy phone connector package cleanup
- `com.maazm7d.termuxhub` removed from phone package set
- Current package list no longer includes it

## Post-clean status
- Asolaria remains healthy on `4781`
- External legacy shims are disabled (`cursor`/`antigravity`)
- OpenClaw auto-start scheduled task removed
- Phone bridge stack remains intact (Asolaria + Termux + Termux:API + Tailscale)
