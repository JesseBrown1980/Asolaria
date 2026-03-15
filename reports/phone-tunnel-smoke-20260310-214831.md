# Phone Tunnel Smoke Test - 2026-03-11T00:48:30.8744823+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: 
- tokenHint: 

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
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Local /api/health probe failed: O tempo limite da opera??o foi atingido.
- Local /api/mobile/bootstrap probe failed: O tempo limite da opera??o foi atingido.
- Remote base URL could not be resolved from bootstrap.
- Remote mobile console returned HTTP status 0.

