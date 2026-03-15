# Live Transcript Real-Meeting Checklist

Generated: 2026-03-04T22:45:29.1728910+00:00
Session tag: 20260304-1939
Base URL: http://127.0.0.1:4781

## Preconditions

- [ ] Asolaria runtime healthy (`GET /api/health` => `ok=true`).
- [ ] Quick Realtime UI opened and source selector visible.
- [ ] If bridge auth is required, Bridge Push Token is configured in quick UI.
- [ ] Meeting captions are enabled in target app.

## API Baseline

1. Run scripted matrix (synthetic lanes):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-LiveTranscript-ValidationMatrix.ps1
```

2. Run bridge auth smoke:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-VoiceBridgeCaptionPushAuth.ps1
```

## Real Call Validation - Zoom

- [ ] Join a Zoom call with live captions.
- [ ] Capture source chosen in Asolaria (`google_meet_caption` or `custom_caption` bridge path as appropriate).
- [ ] Transcript source tested: `live`.
- [ ] Transcript source tested: `bridge`.
- [ ] Transcript source tested: `all`.
- [ ] Copy output is human-usable and copy/paste clean.
- [ ] No unexpected noise/system lines.

Notes:
- audio device path used:
- observed lag (ms approx):
- anomalies:

## Real Call Validation - Google Meet

- [ ] Join a Meet call with live captions.
- [ ] Run copied Meet bridge script in DevTools.
- [ ] Transcript source tested: `live`.
- [ ] Transcript source tested: `bridge`.
- [ ] Transcript source tested: `all`.
- [ ] Lane routing metadata appears stable.
- [ ] Copy output is clean.

Notes:
- observed lag (ms approx):
- anomalies:

## Real Call Validation - Microsoft Teams

- [ ] Join a Teams call with captions/subtitles enabled.
- [ ] Use custom bridge script path where needed.
- [ ] Transcript source tested: `live`.
- [ ] Transcript source tested: `bridge`.
- [ ] Transcript source tested: `all`.
- [ ] Copy output is clean.

Notes:
- observed lag (ms approx):
- anomalies:

## Exit Criteria

- [ ] All three apps pass with no blocker severity findings.
- [ ] Any medium/high issue logged to `TASKS.md` with timestamp and reproduction.
- [ ] Final report saved in `reports/` and referenced in task ledger.
