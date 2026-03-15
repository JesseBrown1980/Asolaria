# Phone Tunnel Smoke Test - 2026-03-09T15:24:44.8646809+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://192.168.1.3:5443
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: False
- mobile-console.html status: 200
- /api/mobile/session: True (route=usb)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=1836 staleSeconds=91

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- selected device: R5CXA4MGQXV
- reverse tcp:4781 present: True

## Phone Network
- ping attempted: True
- ping ok: True
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Remote /api/health (auth) probe failed: HTTP status 0
- Desktop remote probes used relaxed TLS validation for this smoke run.

