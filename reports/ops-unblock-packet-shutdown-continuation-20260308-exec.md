# Ops Unblock Packet (Shutdown Continuation)

Generated: 2026-03-10 23:17:28 -03:00

## Open Blockers Snapshot
9:- [ ] Google/NotebookLM access recovery in progress (2026-03-10 22:38 -03:00): latest `tools/Invoke-GoogleNotebookLm-RecoveryPlan.ps1` evidence (`reports/google-notebooklm-recovery-plan-latest.md`) now shows `ready=1` (`plasmatoid@gmail.com`), `oauth-blocked=2` (`jesse@jbrowndevelopmentllc.com`, `plasmatoid@jbrowndevelopmentllc.com` with fresh reauth links), `enterprise-degraded=1` (`jessebrown.soft1980@gmail.com` due NotebookLM Enterprise license-seat quota), `iam-blocked=0`, and `infra-blocked=0`. Remaining work is to complete the two OAuth reauths, assign or add a NotebookLM-capable seat for `jessebrown.soft1980@gmail.com`, then rerun `tools/Invoke-GoogleNotebookLm-RecoveryPlan.ps1` until all four accounts are `ready`.
99:- [ ] Blocked manual validation: audio bridge live matrix for real meetings (Zoom/Meet/Teams) (2026-03-03 08:31 -03:00). Scripted API-level matrix is implemented and passing (`tools/Test-LiveTranscript-ValidationMatrix.ps1`, latest `reports/live-transcript-validation-matrix-20260307-102804.md`) and auth policy has dedicated smoke coverage (`tools/Test-VoiceBridgeCaptionPushAuth.ps1`, latest `reports/bridge-caption-auth-smoke-20260307-102727.md`), but interactive call validation is still required to confirm capture quality, subtitle noise floor, and injection timing under real app/audio-device combinations. Immediate execution artifacts: `reports/live-transcript-real-meeting-checklist-20260307-1027.md`, `reports/live-transcript-real-meeting-packet-20260307-1027.md`, and evidence collector `tools/Collect-LiveTranscript-RealMeetingEvidence.ps1`. Revalidated on 2026-03-07 10:28 -03:00: `/api/health` returned `ok=true`, `/api/voice/live/status` showed live capture idle with bridge orchestrator running in passive mode, bridge auth remained `open`, and fresh evidence bundle `reports/live-transcript-realmeet-20260307-102750/REALMEET_SUMMARY.md` was captured; rows were skipped only because no real meeting `sessionId`/`laneId` values existed yet. Revalidated again on 2026-03-07 10:49 -03:00: captured `reports/live-transcript-realmeet-20260307-104917/REALMEET_SUMMARY.md`; runtime remained `ok=true`, bridge auth remained `open`, and rows again skipped only because no real meeting `sessionId`/`laneId` values were available. Fresh local probe on 2026-03-10 23:02 -03:00 shows an additional capture-path regression to clear before manual meeting work: `/api/voice/live/status` reports the latest live run stopped with `FFmpeg capture failed for all input candidates: Command timed out after 7000ms.` after `failedChunks=2`.
164:- [ ] Blocked external dependency: PPO-005 phone-provider cutover (John route) (2026-02-26): mapped to John runtime path `/Users/john/dev/oli` and onboarding tracker `ops/projects/oli-upgrade/subprojects/phone-provider-onboarding/tasks.json` (`PPO-005`). Jesse local machine cannot provide John phone/provider endpoints, so this lane stays external-dependency only until John/Oli provides real HTTPS `push_url`, `sms_url`, and `voice_url`. Revalidated on 2026-03-01 19:39 -03 that local paths `/Users/john/dev/oli/scripts/phone_provider_cutover.sh` and `/Users/john/dev/oli/ops/projects/oli-upgrade/subprojects/phone-provider-onboarding/tasks.json` are still not present in this workspace (John runtime dependency unchanged; evidence `reports/upgrade-blocker-checkpoint-20260301-1939.md`). Next sequence after URLs arrive in John runtime: run script dry-run cutover, then production cutover, capture artifacts, and mark PPO-005 done.
269:- [ ] Blocked manual closeout: phone activation (consolidated). Latest live evidence remains mixed. `reports/phone-tunnel-smoke-latest.md` (updated 2026-03-10 22:41 -03:00) is currently `pass: False`, with remote `/api/health=False` and `mobile-console.html status: 0`, while remote `/api/mobile/session=True` (`route=usb`) and `/api/mobile/control/status=True` still pass. USB ADB device `R5CXA4MGQXV` remains authorized and reverse mapping is still present, but `data/mobile-push-subscriptions.json` still shows `subscriptions=[]`, mirror snapshot state is still not ready, and pro-mirror is not running. Remaining closeout work is still on-device push subscription + push confirmation + approval-flow tap-through, plus deciding whether live pro-mirror is actually required for signoff.

## Owner-Facing Asks (John/Oli)
1. Provide real HTTPS push_url/sms_url/voice_url for PPO-005 cutover in John runtime.
2. Confirm maintenance window and rollback owner for provider cutover.
3. Share sandbox credential channel to execute dry-run safely (no plaintext in chat/logs).
4. Confirm phone-side approval owner and availability window for manual closeout.
5. Confirm evidence destination path and required sign-off names.

## Local Prechecks (Automatable)
- C:\Users\acer\codex-bridge\bridgectl.ps1 -Command status
- Invoke-RestMethod http://127.0.0.1:4781/api/health
- Confirm latest reports exist: phone-tunnel-smoke-latest.md and one-button-start-latest.md

## Closure Criteria
- PPO-005: URLs delivered, dry-run logged, production cutover logged, rollback test documented.
- Phone activation: on-device approval completed, push path confirmed, evidence captured with timestamp.

## Proposed TASKS.md Edit Guidance
- Keep PPO-005 labeled external dependency until John runtime URLs are delivered.
- Keep phone activation labeled manual closeout with explicit owner/date.
- Keep audio real-meeting validation blocked-manual until a real sessionId/laneId capture is recorded.
