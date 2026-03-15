# Live Transcript Real Meeting Validation Packet

Generated: 2026-03-04T22:44:32.3934280+00:00
Base URL: http://127.0.0.1:4781
Session Tag: 20260304-1942
API Matrix (synthetic): pass
API Matrix Report: C:\Users\acer\Asolaria\reports\live-transcript-validation-matrix-20260304-194430.md

## Runtime Snapshot

- health.ok: True
- uptimeSeconds: 705
- voice.live.running: False
- voice.compat.source: all
- voice.compat.bridgeSessionId: matrix_20260304_193303_69d309

## Pre-Flight

- [ ] Confirm `/api/health` returns `ok=true`.
- [ ] Confirm intended ingest auth mode (open vs token-protected).
- [ ] If token-protected, set `Bridge Push Token` in quick UI before copying bridge script.
- [ ] Confirm transcript source selector target (`live`, `bridge`, or `all`).

## Real Meeting Matrix

### Zoom
- Meeting id/url: `...`
- Capture source used: `...`
- Transcript source used: `...`
- [ ] Incoming lines appear within 2s median.
- [ ] Copy transcript output is paste-ready.
- [ ] No repeated noise/control lines.
- Notes: `...`

### Google Meet
- Meeting id/url: `...`
- Capture source used: `...`
- Transcript source used: `...`
- [ ] Incoming lines appear within 2s median.
- [ ] Copy transcript output is paste-ready.
- [ ] No repeated noise/control lines.
- Notes: `...`

### Microsoft Teams
- Meeting id/url: `...`
- Capture source used: `...`
- Transcript source used: `...`
- [ ] Incoming lines appear within 2s median.
- [ ] Copy transcript output is paste-ready.
- [ ] No repeated noise/control lines.
- Notes: `...`

## Exit Criteria

- [ ] All 3 apps pass with at least one full interview segment each.
- [ ] At least one run validated under token-protected ingest (if enabled in production).
- [ ] `source=bridge` and `source=all` transcript modes both validated in live UI.

## Operator Commands

```powershell
# Synthetic API matrix (optional)
powershell -NoProfile -ExecutionPolicy Bypass -File .\\tools\\Test-LiveTranscript-ValidationMatrix.ps1

# Generate another packet
powershell -NoProfile -ExecutionPolicy Bypass -File .\\tools\\New-LiveTranscript-RealMeetingPacket.ps1 -BaseUrl 'http://127.0.0.1:4781' -SessionTag '20260304-1942'
```
