# Upgrade Blocker Checkpoint

- Generated: 2026-03-04 20:14:48 -03:00
- Run mode: upgrade blocker preflight
- Runtime: http://127.0.0.1:4781
- Runtime health: True
- Runtime queue: queued=0, running=0, total=7, concurrency=2

## Slack
- enabled/configured: True/False
- tokenSource: none
- connection.error: not_configured

## Google OAuth
- local integration enabled/configured: True/True
- allowlistedMissing count: 0
- console gate status: HTTP/1.1 302 Found
- console gate location: https://accounts.google.com/ServiceLogin

## NotebookLM Enterprise
- account: p*********@gmail.com
- enterpriseReady: False
- access: False
- required tier: SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT

## Phone Activation
- push subscriptions: 0

## PPO-005 (John Route)
- script exists (/Users/john/dev/oli/scripts/phone_provider_cutover.sh): False
- tasks exists (/Users/john/dev/oli/ops/projects/oli-upgrade/subprojects/phone-provider-onboarding/tasks.json): False

## Live Transcript Real Meetings
- latest checklist: C:\Users\acer\Asolaria\reports\live-transcript-real-meeting-checklist-20260304-1947.md
- latest packet: C:\Users\acer\Asolaria\reports\live-transcript-real-meeting-packet-20260304-1949.md
- latest summary: C:\Users\acer\Asolaria\reports\live-transcript-realmeet-20260304-195552\REALMEET_SUMMARY.md

## Blockers
- Slack integration is unconfigured (token missing).
- Google Console auth overview still redirects to sign-in (owner login required).
- NotebookLM Enterprise not ready; required tier SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT.
- Phone push subscription count is 0; manual tap-through still pending.
- PPO-005 John runtime dependencies are not present on this machine.
- Security follow-up pending: rotate previously exposed password from historical logs/chat context.
- Real meeting transcript matrix remains manual: Zoom/Meet/Teams live-call validation still needed.

## Evidence
- C:\Users\acer\Asolaria\reports\task-closeout-runtime-validation-20260304-201441.json
- C:\Users\acer\Asolaria\reports\upgrade-blocker-checkpoint-20260304-201441.md
- C:\Users\acer\Asolaria\reports\upgrade-blocker-checkpoint-latest.md
