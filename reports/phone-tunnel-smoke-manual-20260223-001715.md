# Phone Tunnel Smoke Test - 2026-02-23T03:17:20.3298837+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://daniel-barriers-problems-dsc.trycloudflare.com
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=none)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=22140 staleSeconds=36

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

