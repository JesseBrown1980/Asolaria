# Phone Tunnel Smoke Test - 2026-02-25T01:43:17.2659146+00:00

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
- authorized devices: 0
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Local /api/health probe failed: Imposs?vel conectar-se ao servidor remoto
- Local /api/mobile/bootstrap probe failed: Imposs?vel conectar-se ao servidor remoto
- Remote base URL could not be resolved from bootstrap.
- Remote mobile console returned HTTP status 0.
- ADB found but no authorized devices connected.

