# Phone Tunnel Smoke Test - 2026-02-27T01:02:42.8164634+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://192.168.1.2:5443
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=none)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=13600 staleSeconds=13

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 2
- reverse tcp:4781 present: True

## Phone Network
- ping attempted: True
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Phone ping to remote host failed (advisory only; authenticated control plane checks are healthy).
- Desktop remote probes used relaxed TLS validation for this smoke run.

