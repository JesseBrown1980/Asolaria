# Phone Closeout Pack (Shutdown Continuation)

Generated: 2026-03-10 23:06:24 -03:00

## Diagnostics Snapshot
- api_health_ok: error: O tempo limite da operação foi atingido.
- relay_health_ok: True
- voice_live_running: False
- bridge_orchestrator_mode: n/a
- colony_counts: n/a
- phone_bridge_keeper_running: n/a
- tunnel_smoke_latest_pass: n/a
- mobile_push_subscriptions: n/a
- connection_route_channel: n/a
- phone-tunnel-smoke-latest.md: present
- one-button-start-latest.md: present

## Automatable vs Manual
### Automatable completed now
- Relay and API health endpoints checked.
- Latest tunnel/start artifacts presence verified.
### Manual on-device actions required
- Confirm notifier approval prompt on phone.
- Confirm app notification permission remains enabled.
- Trigger push test and verify real notification receipt.

## One-Pass User Checklist
1. Unlock phone and keep it connected to the active bridge path.
2. Open notifier target app and keep notifications allowed.
3. Trigger one controlled push test from desktop.
4. Confirm phone receives notification and approval action succeeds.
5. Capture screenshot/timestamp and append evidence to reports.

## Re-test Commands and Pass Criteria
- C:\Users\acer\codex-bridge\bridgectl.ps1 -Command status => key bots running.
- Invoke-RestMethod http://127.0.0.1:4781/api/health => ok=true.
- Refresh tunnel smoke report => timestamp updates.
- PASS when on-device notification + approval evidence is captured.
