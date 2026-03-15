# Phone Tunnel Smoke Test - 2026-03-06T00:02:31.2317867+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://192.168.1.2:5443
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=usb)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=20000 staleSeconds=1

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- selected device: R5CXA4MGQXV
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: True
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- ADB reverse mapping tcp:4781 not present for USB transport.
- Phone ping to remote host failed (advisory only; authenticated control plane checks are healthy).
- Desktop remote probes used relaxed TLS validation for this smoke run.

