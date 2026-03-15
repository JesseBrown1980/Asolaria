# Phone Tunnel Smoke Test - 2026-02-21T23:33:21.8315090+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://192.168.1.7:5443
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=vpn)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=17636 staleSeconds=3572

## ADB Checks
- adb path: 
- authorized devices: 0
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Desktop remote probes used relaxed TLS validation for this smoke run.

