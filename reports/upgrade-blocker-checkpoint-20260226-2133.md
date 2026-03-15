# Upgrade Blocker Checkpoint (2026-02-26 21:33 -03)

## Local checks rerun
- `/api/integrations/slack/status`: `enabled=true`, `configured=false`, `connection.error=not_configured`, `tokenSource=none`.
- `tools/Watch-NotebookLM-EnterpriseReadiness.ps1`: `enterpriseReady=false`, `access=False`, required tier `SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT`.
- `tools/Test-Asolaria-PhoneTunnelPath.ps1`: `ok=true`; authenticated remote control-plane checks pass; ADB reverse present.
- `/api/health` + `data/mobile-push-subscriptions.json`: push backend ready but `subscriptions=0` and file still has `subscriptions: []`.
- PPO-005 local dependency paths are not present in this workspace: `scripts/phone_provider_cutover.sh`, `ops/projects/oli-upgrade/subprojects/phone-provider-onboarding/tasks.json`.

## Evidence
- `reports/task-closeout-runtime-validation-20260226-213318.json`
- `reports/task-closeout-notebooklm-watch-20260226-213248.log`
- `reports/phone-tunnel-smoke-20260226-213241.md`

## Remaining owner/external actions
1. Google OAuth consent-screen remediation in Google Console (owner login required).
2. Rotate previously exposed account password (owner credential action).
3. Provide/configure Slack token for runtime integration.
4. Assign NotebookLM Enterprise license tier (`SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT`) to principal.
5. Complete first phone/browser push subscription and physical approvals tap-through.
6. Provide John/Oli HTTPS provider endpoints for PPO-005 (`push_url`, `sms_url`, `voice_url`) in John runtime.
