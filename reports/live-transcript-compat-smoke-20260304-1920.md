# Live Transcript Compatibility Smoke (2026-03-04 19:20 -03:00)

## Scope

Validate optional compatibility mode added to:
- `GET /api/voice/live/transcript`
- `GET /api/voice/live/status`

Defaults must remain unchanged (live-only), and opt-in flags must expose bridge content.

## Runtime

- Restarted main runtime via `tools/Restart-Asolaria-Main.ps1 -Port 4781`
- Post-restart health: `ok=true` and fresh uptime observed

## Checks

1. Default transcript endpoint:
- Request: `/api/voice/live/transcript`
- Result: `hasCompat=false`, no schema change in default path

2. Transcript compatibility mode:
- Request: `/api/voice/live/transcript?bridge=1&source=all&bridgeMaxEntries=12`
- Result: `hasCompat=true`, `compat.source=all`

3. Status compatibility mode:
- Request: `/api/voice/live/status?includeBridgeCaptions=true&source=bridge&bridgeMaxEntries=8`
- Result: `hasCompatTranscript=true`, `compatTranscript.source=bridge`

4. Bridge injection smoke:
- Pushed test caption via `/api/voice/bridge-caption/push` using lane `smoke_lane`
- Request: `/api/voice/live/transcript?bridge=1&source=bridge&bridgeLaneId=smoke_lane&bridgeMaxEntries=10`
- Result: response transcript contains test line
- Text mode request (`text=1`) also contains test line
- Cleanup executed: `POST /api/voice/bridge-caption/reset` with reason `compat_smoke_cleanup`

## Outcome

Compatibility mode is active and working after runtime reload.
Default endpoint behavior remains live-only unless compatibility flags are provided.
