# Upgrade Blocker Checkpoint

- Generated: 2026-03-04 20:07:42 -03:00
- Run mode: upgrade blocker preflight
- Runtime: http://127.0.0.1:4781
- Runtime health: True
- Runtime queue: queued=-1, running=-1, total=-1, concurrency=-1

## Slack
- enabled/configured: True/False
- tokenSource: none
- connection.error: not_configured

## Google OAuth
- local integration enabled/configured: True/True
- allowlistedMissing count: 0
- console gate status: HTTP/1.1 302 Found
- console gate location: https://accounts.google.com/ServiceLogin?service=cloudconsole&passive=1209600&osid=1&continue=https://console.cloud.google.com/auth/overview?project%3Dwinged-complex-390417&followup=https://console.cloud.google.com/auth/overview?project%3Dwinged-complex-390417

## NotebookLM Enterprise
- account: plasmatoid@gmail.com
- enterpriseReady: False
- access: False
- required tier: SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT

## Phone Activation
- push subscriptions: 0
- phone tunnel smoke: C:\Users\acer\Asolaria\reports\phone-tunnel-smoke-20260304-200742.md

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
- C:\Users\acer\Asolaria\reports\task-closeout-runtime-validation-20260304-200735.json
- C:\Users\acer\Asolaria\reports\upgrade-blocker-checkpoint-20260304-200735.md
- C:\Users\acer\Asolaria\reports\upgrade-blocker-checkpoint-latest.md
