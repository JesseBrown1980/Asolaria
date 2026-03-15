# Phone Tunnel Smoke Test - 2026-03-01T21:38:13.9649284+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://gates-climb-bucks-secret.trycloudflare.com
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=none)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=1824 staleSeconds=160

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 2
- selected device: R5CXA4MGQXV
- reverse tcp:4781 present: True

## Phone Network
- ping attempted: True
- ping ok: True
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Desktop remote probes used relaxed TLS validation for this smoke run.

