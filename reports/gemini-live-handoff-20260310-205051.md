# Gemini Live Handoff - Asolaria Core

Updated: 2026-03-10 20:50:51 -03:00

RESULT: lane=asolaria-core status=ok artifacts=C:\Users\acer\Asolaria\reports\gemini-live-handoff-20260310-205051.md,C:\Users\acer\Asolaria\reports\phone-tunnel-smoke-latest.md blockers=private-internet fallback unhealthy; no real meeting sessionId/laneId next=Keep USB active, refresh phone inbox task, owner performs short Gemini Live ping and reports exact on-phone result

## Current State

- `GET /api/health/fast` is healthy. Queue is idle, `voiceOutputMode=gemini_live_audio`, `brainPrimaryProvider=gemini-api`, and routing still prefers `usb`.
- `GET /api/voice/status` confirms `geminiLiveAudio=true` with project `winged-complex-390417` and model `gemini-live-2.5-flash-native-audio`. Live capture is currently idle.
- `reports/phone-tunnel-smoke-latest.md` was refreshed and still fails on the remote/private-internet path. ADB remains authorized and `adb reverse tcp:4781 tcp:4781` is present, so USB is the strongest current handoff path.
- Existing phone takeover task is `task_1772891226069_lvp9fb` and should remain the single phone-visible coordination task.

## Google Guidance Applied

- Use Gemini Live API as the machine-controlled runtime, not the consumer side-button session: https://ai.google.dev/gemini-api/docs/live
- For client-facing live sessions, use ephemeral tokens from the server rather than long-lived API keys on device: https://ai.google.dev/gemini-api/docs/ephemeral-tokens
- Prefer session resumption on reconnect rather than starting a brand-new live session if transport drops: https://ai.google.dev/gemini-api/docs/live-session
- If tools/function calling are used in the live loop, the app must send function responses back manually after execution: https://ai.google.dev/gemini-api/docs/live-tools

## Automation Steps That Can Run Immediately

1. Treat USB as primary and private-internet as degraded until a later monitor pass says otherwise.
2. Keep Asolaria on the current Gemini live-audio stack; do not switch control back to the consumer Gemini app as the authority surface.
3. Refresh the phone-visible handoff task `task_1772891226069_lvp9fb` with the current state, owner actions, and next-30-minute runbook.
4. If the owner begins a real meeting test, use the existing transcript bridge/orchestrator path rather than inventing a new capture lane:
   - `POST /api/voice/bridge-caption/orchestrator/start`
   - `GET /api/voice/bridge-caption/orchestrator/status`
   - `GET /api/voice/live/status?source=all&includeBridgeCaptions=true`
5. Keep any retry/reconnect logic aligned with Live API session resumption. Do not rotate credentials or Google account state unless the owner confirms repeated auth/session failures.

## Required Manual Phone Interactions For Owner

1. Keep the phone attached over USB and leave ADB authorized.
2. Open the Asolaria phone route already exposed by the current runtime, then confirm the Gemini handoff task is visible in the phone inbox.
3. Start the Gemini Live session from the supported Asolaria-controlled phone path.
4. Speak one short test line only: `Asolaria handoff test. Reply only ACK.`
5. If the phone shows `Something went wrong`, do not keep tapping randomly:
   - back out once
   - reopen the live session once
   - if it fails again, capture the exact error wording and the screen where it appears
6. If the owner moves into a real Meet/Zoom/Teams validation, keep captions/live transcript visible so Asolaria can bind the first real `sessionId` or `laneId`.

## Next 30 Minutes

- Minute 0-5: keep USB connected, avoid public/private route switching, and verify the handoff task is visible on phone.
- Minute 5-10: start one Gemini Live session and run the short ACK ping.
- Minute 10-15: if the session survives, continue the owner conversation on the same session rather than starting a new one.
- Minute 15-20: if the session drops, resume/reconnect once; if the same error repeats, stop and preserve the exact failure surface for diagnosis.
- Minute 20-30: if a real meeting is available, start the bridge-caption/orchestrator path and capture the first real transcript identifiers; otherwise keep the run in phone-only validation mode and do not claim real-meeting readiness.

## Active Blockers

- `reports/phone-tunnel-smoke-latest.md` still shows remote/private-internet probe failure, so phone reachability is currently strongest on USB.
- No live meeting `sessionId` or `laneId` is available yet, so real-meeting transcript validation cannot complete.

