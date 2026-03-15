# Upgrade Blocker Checkpoint

- Generated: 2026-03-10 21:33:00 -03:00
- Run mode: upgrade blocker preflight
- Runtime: http://127.0.0.1:4781
- Runtime health: False
- Runtime queue: queued=-1, running=-1, total=-1, concurrency=-1

## Slack
- enabled/configured: False/False
- tokenSource: 
- connection.error: 

## Google OAuth
- local integration enabled/configured: True/True
- allowlistedMissing count: 0
- console gate status: HTTP/1.1 302 Found
- console gate location: https://accounts.google.com/ServiceLogin

## NotebookLM Enterprise
- account: p*********@gmail.com
- enterpriseReady: False
- access: 
- required tier: 

## Phone Activation
- push subscriptions: 0

## PPO-005 (John Route)
- script exists (/Users/john/dev/oli/scripts/phone_provider_cutover.sh): False
- tasks exists (/Users/john/dev/oli/ops/projects/oli-upgrade/subprojects/phone-provider-onboarding/tasks.json): False

## Live Transcript Real Meetings
- latest checklist: C:\Users\acer\Asolaria\reports\live-transcript-real-meeting-checklist-20260307-1027.md
- latest packet: C:\Users\acer\Asolaria\reports\live-transcript-real-meeting-packet-20260307-1027.md
- latest summary: C:\Users\acer\Asolaria\reports\live-transcript-realmeet-20260307-104917\REALMEET_SUMMARY.md

## Blockers
- Runtime health not confirmed at http://127.0.0.1:4781/api/health.
- Slack integration is unconfigured (token missing).
- Google Console auth overview still redirects to sign-in (owner login required).
- NotebookLM Enterprise not ready.
- Phone push subscription count is 0; manual tap-through still pending.
- PPO-005 John runtime dependencies are not present on this machine.
- Security follow-up pending: rotate previously exposed password from historical logs/chat context.
- Real meeting transcript matrix remains manual: Zoom/Meet/Teams live-call validation still needed.

## Evidence
- C:\Users\acer\Asolaria\reports\task-closeout-runtime-validation-20260310-213108.json
- C:\Users\acer\Asolaria\reports\upgrade-blocker-checkpoint-20260310-213108.md
- C:\Users\acer\Asolaria\reports\upgrade-blocker-checkpoint-latest.md
