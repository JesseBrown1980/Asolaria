# Phone Tunnel Smoke Test - 2026-02-22T00:19:08.5193778+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: http://desktop-j99vcnh.tailb47e0e.ts.net:4782
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=vpn)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=17636 staleSeconds=777

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- reverse tcp:4781 present: True

## Phone Network
- ping attempted: True
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Phone ping to remote host failed (advisory only; authenticated control plane checks are healthy).

