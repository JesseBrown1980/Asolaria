# Heal/Cure Asolaria + Phone Compatibility Report

Generated: 2026-02-20T12:38:01.1945920-03:00
Overall ok: True
Apply fixes: True

## Core
- Local /api/health: True
- Local /api/mobile/bootstrap: True
- Remote base URL: http://desktop-j99vcnh.tailb47e0e.ts.net:4781
- Remote /api/health (auth): True
- Remote /api/mobile/session: True
- Remote /api/mobile/control/status: True

## ADB
- adb path: C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
- authorized devices: 1
- reverse tcp:4781: True
- reverse fix attempted: False ok=False reason=not_requested

## NotebookLM Path
- Google status endpoint: True
- Gemini API status endpoint: True
- Vertex status endpoint: True

## Shortcuts
- audited: 14
- broken/outdated: 0
- repair attempted: False ok=False reason=not_requested

## Smoke
- run: True
- ok: False
- reason: smoke_failed
- report: C:\Users\acer\Asolaria\reports\phone-tunnel-smoke-20260220-123757.md

## Cleanup
- attempted: True
- ok: True
- dryRun: True
- report: C:\Users\acer\Asolaria\reports\data-cleanup-20260220-123800.md
- error: 

## Smoke Notes
- Phone ping to remote host failed.

