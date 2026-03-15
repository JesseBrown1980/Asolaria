# Live Transcript Real-Meetings Validation Packet

- Timestamp: 2026-03-04 19:42 -03:00
- Scope: close out the remaining real-call validation task for Zoom/Google Meet/Microsoft Teams

## Objective

Run one controlled real meeting call per platform and verify that Asolaria's live transcript mirror is reliable for:
- bridge caption ingest
- transcript rendering in quick UI (`live|bridge|all`)
- copyability and operator usability under active call conditions

## Preflight (must pass before real calls)

1. Runtime health:
```powershell
Invoke-RestMethod http://127.0.0.1:4781/api/health | ConvertTo-Json -Depth 4
```

2. Scripted matrix baseline:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-LiveTranscript-ValidationMatrix.ps1
```

3. Bridge push auth check:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-VoiceBridgeCaptionPushAuth.ps1
# if auth required/configured:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-VoiceBridgeCaptionPushAuth.ps1 -BridgePushToken "<token>"
```

If preflight fails, do not run real-call validation; fix preflight first.

## Step-by-Step Real-Call Flow

Repeat this flow for `Zoom`, `Google Meet`, and `Microsoft Teams`.

1. Prepare session tracking:
- Record operator, local timezone, device/audio path, and meeting app version.
- Generate/record one session tag:
```text
realmeet_YYYYMMDD_HHMM_<platform>
```

2. Start call and enable captions in the meeting app.

3. In Asolaria quick UI:
- Select capture source:
  - `Google Meet`: `Google Meet Captions (Instant, Copyable)` preferred
  - `Zoom/Teams`: `Custom Caption Bridge (Script, Copyable)` preferred
- Set transcript source to `bridge` first.
- Click start.

4. Inject bridge script:
- Click `Copy Meet Bridge Script` or `Copy Custom Bridge Script`.
- Paste/run in target tab DevTools console.
- Keep it running for at least 5 minutes.

5. Test speaking phases:
- `Incoming-only` (interviewer speaks 60-90s).
- `Outgoing-only` (you speak 60-90s).
- `Mixed turn-taking` (2-3 minutes).

6. Switch transcript source live during call:
- `bridge` -> `all` -> `live` -> back to `bridge`.
- Confirm transcript panel remains responsive and copyable.

7. Collect API evidence while call is active:
```powershell
$sid = "<sessionId>"
Invoke-RestMethod "http://127.0.0.1:4781/api/voice/bridge-caption/lanes?sessionId=$sid" | ConvertTo-Json -Depth 6
Invoke-RestMethod "http://127.0.0.1:4781/api/voice/live/transcript?source=bridge&includeBridgeCaptions=1&bridgeSessionId=$sid&bridgeMaxEntries=240&text=1"
Invoke-RestMethod "http://127.0.0.1:4781/api/voice/live/transcript?source=all&includeBridgeCaptions=1&bridgeSessionId=$sid&bridgeMaxEntries=240&text=1"
```

8. Stop capture and save notes immediately (do not rely on memory later).

9. Collect evidence bundle with one command:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Collect-LiveTranscript-RealMeetingEvidence.ps1 `
  -ZoomSessionId "<zoom_session>" -ZoomLaneId "<zoom_lane>" `
  -MeetSessionId "<meet_session>" -MeetLaneId "<meet_lane>" `
  -TeamsSessionId "<teams_session>" -TeamsLaneId "<teams_lane>"
```

## Pass/Fail Matrix Template

| Platform | SessionId | Captions Enabled | Incoming Accuracy | Outgoing Accuracy | Mixed Stability | Source Switch (`bridge/all/live`) | Copy Action Works | Auth Errors | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zoom |  |  |  |  |  |  |  |  |  |
| Google Meet |  |  |  |  |  |  |  |  |  |
| Microsoft Teams |  |  |  |  |  |  |  |  |  |

Scoring guidance:
- `Incoming/Outgoing Accuracy`: PASS if key sentences are reflected with no major omissions.
- `Mixed Stability`: PASS if transcript keeps updating without stalling >15s during active speech.
- `Source Switch`: PASS if switching does not break panel updates.
- `Copy Action`: PASS if copied output contains expected latest lines.
- `Auth Errors`: PASS if none; FAIL if repeated 403 or token mismatch during valid setup.

## Evidence Artifacts to Collect

Create one folder per run under `reports/`:
```text
reports/live-transcript-realmeet-YYYYMMDD-HHMM/
```

Required artifacts:
- `REALMEET_SUMMARY.md` (human notes + filled matrix)
- `zoom-bridge-lanes.json`
- `meet-bridge-lanes.json`
- `teams-bridge-lanes.json`
- `zoom-transcript-bridge.txt`
- `meet-transcript-bridge.txt`
- `teams-transcript-bridge.txt`
- `zoom-transcript-all.txt`
- `meet-transcript-all.txt`
- `teams-transcript-all.txt`
- at least 1 screenshot per platform showing live transcript panel

Optional:
- short screen recordings of source-switch moments.

## Exit Criteria (mark task done only when all true)

1. All 3 platforms completed with filled matrix rows.
2. No blocking auth/ingest failures in real runs.
3. `Incoming`, `Outgoing`, and `Mixed` all PASS for each platform.
4. Source switching (`bridge/all/live`) confirmed usable in each platform run.
5. Evidence artifacts saved in `reports/live-transcript-realmeet-.../`.
6. `TASKS.md` updated with run timestamp + evidence path + final verdict.
