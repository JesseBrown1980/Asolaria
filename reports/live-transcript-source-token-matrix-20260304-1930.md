# Live Transcript Source + Bridge Token + Matrix Update

- Timestamp: 2026-03-04 19:30 -03:00
- Scope: local backend + quick UI + scripted matrix validation

## Completed

1. Optional bridge push auth guard
- Endpoint: `GET/POST /api/voice/bridge-caption/push`
- Added optional token enforcement with env controls:
  - `ASOLARIA_VOICE_BRIDGE_CAPTION_PUSH_TOKEN_REQUIRED` (alias: `ASOLARIA_VOICE_BRIDGE_PUSH_TOKEN_REQUIRED`)
  - `ASOLARIA_VOICE_BRIDGE_CAPTION_PUSH_TOKEN` (alias: `ASOLARIA_VOICE_BRIDGE_PUSH_TOKEN`)
- Accepted token forms:
  - `Authorization: Bearer <token>`
  - `x-asolaria-bridge-token`
  - `x-asolaria-token`
  - `x-asolaria-mobile-token`
  - `token`/`bridgeToken` in query/body
- CORS allow-headers were expanded for bridge push clients.
- Backward compatibility: if token is not required/configured, behavior remains open as before.

2. Quick UI transcript source selector
- UI: new `Transcript Source` selector in quick realtime card:
  - `live`, `bridge`, `all`
- Frontend wiring in `public/app.js`:
  - state + normalization for transcript source
  - server-loopback polling now honors source and can pull compatibility transcript snapshots
  - source selector is hot-switchable while capture is active
  - startup URL preset support: `?transcriptSource=live|bridge|all`

3. Bridge script token passthrough (optional)
- `buildMeetCaptionBridgeScript` and `buildCustomCaptionBridgeScript` now append `token=` automatically when available from URL params:
  - `bridgeToken`, `captionToken`, or `token`

4. Scripted validation matrix runner
- New script: `tools/Test-LiveTranscript-ValidationMatrix.ps1`
- Validates synthetic Zoom/Meet/Teams lanes against:
  - `/api/voice/bridge-caption/pull`
  - `/api/voice/live/transcript?source=bridge`
  - `/api/voice/live/transcript?source=all`
  - `/api/voice/live/status?source=all`
- Latest run:
  - command: `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-LiveTranscript-ValidationMatrix.ps1`
  - result: `ok=true`
  - report: `reports/live-transcript-validation-matrix-20260304-193303.md`

## Verification

- `node --check server.js` passed.
- `node --check public/app.js` passed.
- Matrix runner completed with all three scenarios passing.

## Remaining

- Real interactive meeting validation (actual Zoom/Meet/Teams calls) is still recommended for audio quality/noise-floor/timing checks; scripted matrix now covers ingest + compatibility contract behavior.
