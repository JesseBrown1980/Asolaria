# Phone Tunnel Smoke Test - 2026-02-25T01:46:05.5697132+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4797
- remoteBaseUrl: https://tag-amazing-jets-cio.trycloudflare.com
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=public_internet)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=13100 staleSeconds=1

## ADB Checks
- adb path: 
- authorized devices: 0
- reverse tcp:4797 present: False

## Phone Network
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Desktop remote probes used relaxed TLS validation for this smoke run.

