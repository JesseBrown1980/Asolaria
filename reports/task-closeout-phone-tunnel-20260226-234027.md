# Phone Tunnel Smoke Test - 2026-02-27T02:40:33.2216016+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: https://filtering-passes-acrobat-tanks.trycloudflare.com
- tokenHint: ********************************************8bef

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=public_internet)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=13600 staleSeconds=142

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

