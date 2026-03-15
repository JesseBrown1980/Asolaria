# Mobile Push + Approvals Validation - 2026-02-24T19:16:59.732Z

## Summary
- baseUrl: http://127.0.0.1:4781
- push.enabled: true
- push.reason: ready:vault
- push.subscriptions: 0
- push.test.status: 200
- push.test.reason: no_mobile_subscriptions
- pending.approvals.before: 0
- pending.approvals.after: 0

## Push checks
- /api/mobile/session: status=200 ok=true
- /api/mobile/push/status: status=200 ok=true
- /api/mobile/push/test: status=200 ok=true

## Approval seed requests
- seed deny (voice-note approval): status=409 ok=false id=apr_1771960620528_wjaym2
- seed approve (voice-note approval): status=409 ok=false id=apr_1771960621260_vk7cg9
- seed approve+run (voice-note approval): status=409 ok=false id=apr_1771960621877_gjk3g6

## Mobile approval decisions
- mobile deny: status=200 ok=true status=denied
- mobile approve: status=200 ok=true status=approved
- mobile approve+run: status=200 ok=true status=approved
- approve+run execution.source: manual_retry
- approve+run execution.reply: Approval apr_1771960621877_gjk3g6 is approved. Auto-execute is disabled for approvals created by "phone-whatsapp-linked". Retry the original request now.

## Pass/Fail Matrix
- push status endpoint reachable: true
- push enabled: true
- push subscription present (>0): false
- push test request accepted: true
- mobile deny path: true
- mobile approve path: true
- mobile approve+run path: true
- approve+run manual retry behavior: true

## Notes
- Approval seeds were generated using `POST /api/phone/mirror/whatsapp/linked/voice-note` with synthetic values to force explicit approval creation without executing any phone macro.
- For non-chat approval sources, approve+run is expected to return manual-retry behavior.
