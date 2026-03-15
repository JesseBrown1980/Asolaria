# Phone Tunnel Smoke Test - 2026-02-22T11:21:53.6356901+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://example.com
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: False
- mobile-console.html status: 404
- /api/mobile/session: False (route=)
- /api/mobile/control/status: False
- control plane healthy: False
- keeper running: False pid=0 staleSeconds=-1

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
- Remote /api/health (auth) probe failed: HTTP status 404
- Remote mobile console returned HTTP status 404.
- Remote /api/mobile/session failed: HTTP status 404
- Remote /api/mobile/control/status failed: HTTP status 404
- Desktop remote probes used relaxed TLS validation for this smoke run.

