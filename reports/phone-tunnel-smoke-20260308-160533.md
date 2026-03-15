# Phone Tunnel Smoke Test - 2026-03-08T19:05:33.8023609+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://exec-twiki-somerset-talking.trycloudflare.com
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: False
- mobile-console.html status: 200
- /api/mobile/session: True (route=usb)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=19544 staleSeconds=11

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- selected device: R5CXA4MGQXV
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: True
- ping ok: True
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Remote /api/health (auth) probe failed: HTTP status 0
- ADB reverse mapping tcp:4781 not present for USB transport.
- Desktop remote probes used relaxed TLS validation for this smoke run.

