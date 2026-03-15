# Phone Tunnel Smoke Test - 2026-02-21T18:28:09.3559220+00:00

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
- keeper running: True pid=17636 staleSeconds=870

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
- ADB found but no authorized devices connected.

