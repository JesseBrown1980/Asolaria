# Phone Tunnel Smoke Test - 2026-03-13T10:34:59.9935002+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: 
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
- authorized devices: 2
- selected device: R5CXA4MGQXV
- reverse tcp:4781 present: True

## Phone Network
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Remote base URL could not be resolved from bootstrap.
- Remote mobile console returned HTTP status 0.
- Remote /api/mobile/session failed: remote_base_missing
- Remote /api/mobile/control/status failed: remote_base_missing

