# Phone Tunnel Smoke Test - 2026-02-21T16:18:02.3939583+00:00

## Summary
- pass: False
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: http://desktop-j99vcnh.tailb47e0e.ts.net:4781
- tokenHint: ********************************************ef3c

## Remote Checks
- /api/health: False
- mobile-console.html status: 0
- /api/mobile/session: False (route=)
- /api/mobile/control/status: False
- keeper running: False pid=0 staleSeconds=-1

## ADB Checks
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- reverse tcp:4781 present: True

## Phone Network
- ping attempted: True
- ping ok: True
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- Remote /api/health (auth) probe failed: O nome remoto n?o p?de ser resolvido: 'desktop-j99vcnh.tailb47e0e.ts.net'
- Remote mobile console returned HTTP status 0.
- Remote /api/mobile/session failed: O nome remoto n?o p?de ser resolvido: 'desktop-j99vcnh.tailb47e0e.ts.net'
- Remote /api/mobile/control/status failed: O nome remoto n?o p?de ser resolvido: 'desktop-j99vcnh.tailb47e0e.ts.net'

