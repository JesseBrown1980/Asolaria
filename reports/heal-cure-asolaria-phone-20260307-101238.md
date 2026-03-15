# Heal/Cure Asolaria + Phone Compatibility Report

Generated: 2026-03-07T10:12:38.8116422-03:00
Overall ok: True
Apply fixes: True

## Core
- Local /api/health: True
- Local /api/mobile/bootstrap: True
- Remote base URL: https://192.168.1.2:5443
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
- audited: 3
- broken/outdated: 0
- repair attempted: False ok=False reason=not_requested

## Smoke
- run: True
- ok: True
- reason: ok
- report: C:\Users\acer\Asolaria\reports\phone-tunnel-smoke-20260307-101236.md

## Cleanup
- attempted: True
- ok: True
- dryRun: True
- report: C:\Users\acer\Asolaria\reports\data-cleanup-20260307-101238.md
- error: 

## Smoke Notes
- Desktop remote probes used relaxed TLS validation for this smoke run.

