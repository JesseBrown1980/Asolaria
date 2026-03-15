# Phone Tunnel Smoke Test - 2026-03-07T00:29:27.9334674+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://192.168.1.2:5443
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=usb)
- /api/mobile/control/status: False
- control plane healthy: False
- keeper running: False pid=0 staleSeconds=-1

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 0
- selected device: 
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Remote /api/mobile/control/status failed: HTTP status 0
- ADB found but no authorized devices connected.
- Desktop remote probes used relaxed TLS validation for this smoke run.

