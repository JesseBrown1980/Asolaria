# Phone Tunnel Smoke Test - 2026-02-23T01:01:59.6588123+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://daniel-barriers-problems-dsc.trycloudflare.com
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=public_internet)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=22140 staleSeconds=2737

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: True
- ping ok: True
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- ADB reverse mapping tcp:4781 not present.
- Desktop remote probes used relaxed TLS validation for this smoke run.

