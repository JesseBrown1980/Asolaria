# Phone Tunnel Smoke Test - 2026-03-04T23:06:20.8381533+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://rat-deposit-translation-container.trycloudflare.com
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=usb)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=17156 staleSeconds=3

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
- ADB found but no authorized devices connected.
- Desktop remote probes used relaxed TLS validation for this smoke run.

