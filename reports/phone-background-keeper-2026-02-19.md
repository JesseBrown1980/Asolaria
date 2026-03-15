# Phone Background Keeper Activation (2026-02-19)

## Goal
- Keep Asolaria reachable from phone in background mode while foreground apps (games) remain uninterrupted.

## Changes
- Added keeper loop:
  - `tools/Keep-Asolaria-PhoneBackground.ps1`
- Added wrappers:
  - `tools/Start-Asolaria-PhoneBackgroundKeeper.ps1`
  - `tools/Stop-Asolaria-PhoneBackgroundKeeper.ps1`

## Runtime Activation
- Start command used:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Start-Asolaria-PhoneBackgroundKeeper.ps1 -Port 4781 -CheckIntervalSeconds 20 -MaxHours 12`
- Keeper PID:
  - `35860`
- PID file:
  - `logs/phone-link-keeper.pid`
- Keeper log:
  - `logs/phone-link-keeper-20260219-192128.log`

## Verification
- `adb reverse --list` includes:
  - `UsbFfs tcp:4781 tcp:4781`
- Keeper log confirms steady state:
  - `health=True`
  - `authorized=1`
  - `reverse_ok=True`
  - `reverse_changed=False`

## Operator Notes
- This keeper does not launch apps or send UI input events.
- It only checks health + ADB authorization and re-applies reverse mapping if needed.
