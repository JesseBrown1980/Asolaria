# Phone Tunnel Smoke Test - 2026-03-05T13:55:29.9636827+00:00

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
- keeper running: True pid=21652 staleSeconds=2

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- selected device: 192.168.1.8:5555
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: True
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- ADB authorized transports are wireless-only; USB reverse not required.
- Phone ping to remote host failed (advisory only; authenticated control plane checks are healthy).
- Desktop remote probes used relaxed TLS validation for this smoke run.

