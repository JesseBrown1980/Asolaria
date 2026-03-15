# Phone Tunnel Smoke Test - 2026-02-22T00:53:39.9552127+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://192.168.1.7:5443
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=private_internet)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=16716 staleSeconds=192

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 0
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- ADB found but no authorized devices connected.
- Desktop remote probes used relaxed TLS validation for this smoke run.

