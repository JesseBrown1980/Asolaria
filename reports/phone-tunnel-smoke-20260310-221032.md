# Phone Tunnel Smoke Test - 2026-03-11T01:10:31.9863137+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://192.168.1.3:5443
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: False
- mobile-console.html status: 0
- /api/mobile/session: False (route=)
- /api/mobile/control/status: False
- control plane healthy: False
- keeper running: False pid=0 staleSeconds=-1

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
- Local /api/health probe failed: O tempo limite da opera??o foi atingido.
- Remote /api/health (auth) probe failed: HTTP status 0
- Remote mobile console returned HTTP status 0.
- Remote /api/mobile/session failed: HTTP status 0
- Remote /api/mobile/control/status failed: HTTP status 0
- Desktop remote probes used relaxed TLS validation for this smoke run.

