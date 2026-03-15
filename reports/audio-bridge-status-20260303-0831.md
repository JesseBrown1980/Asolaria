# Audio Bridge Status (2026-03-03 08:31 -03:00)

## Implementation Status

- `done`: Added meeting-agnostic mixed capture mode `wasapi_meeting_mix` in backend live transcription:
  - Merges speaker loopback (incoming) + microphone (outgoing) before STT.
  - Works through existing `/api/voice/live/start` + `/api/voice/live/status` flow.
- `done`: Added controlled pre-transcription voice injection queue:
  - `POST /api/voice/live/injection/enqueue`
  - `POST /api/voice/live/injection/clear`
  - Each queued injection clip is mixed into the next live chunk before `transcribeAudioFile(...)`.
- `done`: Added optional direct speak-to-injection path:
  - `POST /api/voice/speak` now accepts `injectToLive` / `injectIntoLive`.
- `done`: Extended live status telemetry with injection counters + pending queue metadata.
- `done`: Updated UI capture-mode normalization/options to include `wasapi_meeting_mix`.

## Quick Execution Commands

1. Start live mixed capture:

```powershell
curl -s -X POST http://127.0.0.1:4781/api/voice/live/start `
  -H "Content-Type: application/json" `
  -d "{\"captureMode\":\"wasapi_meeting_mix\",\"chunkSeconds\":4,\"language\":\"en\"}"
```

2. Inject spoken test line into the transcription path:

```powershell
curl -s -X POST http://127.0.0.1:4781/api/voice/live/injection/enqueue `
  -H "Content-Type: application/json" `
  -d "{\"text\":\"Asolaria injection test line for meeting transcript.\",\"source\":\"ops_test\"}"
```

3. Pull status:

```powershell
curl -s "http://127.0.0.1:4781/api/voice/live/status?includeTranscript=true&includeSegments=true&maxSegments=20"
```

4. Stop:

```powershell
curl -s -X POST http://127.0.0.1:4781/api/voice/live/stop -H "Content-Type: application/json" -d "{}"
```

## Remaining Blockers

- Runtime activation pending listener reload:
  - Current live server still serves previous schema (`POST /api/voice/live/injection/clear` returned HTTP 404 before restart).
  - New endpoints and status fields activate after reloading `server.js`.
- Live meeting validation is still manual and app-dependent:
  - Zoom/Meet/Teams each need a real-call pass to verify noise floor and speech pickup quality.
  - Device routing differs by machine/audio driver; default device mapping may require per-host tuning.
- Caption-DOM bridge path is still Meet-specific and noisy in non-call/landing states:
  - Meeting-agnostic path should use `server_loopback` + `wasapi_meeting_mix`, not DOM caption scraping.

## Next Steps

1. Run a 3-app validation matrix (Zoom, Meet, Teams) using `wasapi_meeting_mix`, capture transcript samples, and compare false-positives/word-error-rate.
2. Add an API-level profile preset (`meeting_mix_fast`) to enforce known-good chunk/gain/device defaults per host.
3. Add optional per-session injection gain override in UI (current support exists via API payload only).
