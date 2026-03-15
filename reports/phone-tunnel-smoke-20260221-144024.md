# Phone Tunnel Smoke Test - 2026-02-21T17:40:24.3253161+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: http://desktop-j99vcnh.tailb47e0e.ts.net:4782
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=private_internet)
- /api/mobile/control/status: True
- keeper running: True pid=17636 staleSeconds=3349

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

