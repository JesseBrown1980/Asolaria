# Phone Tunnel Smoke Test - 2026-03-23T18:37:41.4771029+00:00

## Summary
- pass: True
- baseUrl: http://127.0.0.1:4781
- remoteBaseUrl: http://127.0.0.1:4781
- tokenHint: ************************************************************d7d1

## Remote Checks
- /api/health: True
- mobile-console.html status: 200
- /api/mobile/session: True (route=usb)
- /api/mobile/control/status: True
- control plane healthy: True
- keeper running: True pid=4612 staleSeconds=261

## ADB Checks
- adb path: C:\Users\rayss\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 0
- host-visible phones: 2
- selected device: 
- reverse tcp:4781 present: False

## Phone Network
- ping attempted: False
- ping ok: False
- raw probe attempted: False
- raw probe status: 0
- raw probe line: 

## Notes
- ADB found but no authorized devices connected.
- Windows sees phone hardware (ADB Interface [USBDevice/OK]; S24 FE de Rayssa [WPD/OK]), but the ADB interface is not active or not authorized yet.

