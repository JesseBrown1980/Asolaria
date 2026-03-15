# Phone Tunnel Smoke Test - 2026-02-21T17:42:28.7670188+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://gaming-assured-endif-grams.trycloudflare.com
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=public_internet)
- /api/mobile/control/status: True
- keeper running: True pid=17636 staleSeconds=3473

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

