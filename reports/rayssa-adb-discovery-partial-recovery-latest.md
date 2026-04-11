# Rayssa ADB Discovery Partial Recovery

Generated: 2026-03-23 12:25:00 -03:00

## Summary

Rayssa host is no longer in the "ADB missing" state.

New host truth:

- explicit `adb.exe` path was found under the WinGet install
- `4781` compatibility listener remains up
- `4791` remains healthy
- `adb devices -l` starts the daemon but still does not show an authorized device yet

## Evidence

Reported Rayssa-host facts:

- `netstat -ano | findstr :4781`
  - `TCP 127.0.0.1:4781 0.0.0.0:0 LISTENING 2060`
- explicit adb path discovered:
  - `C:\Users\rayss\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe`
- `Invoke-WebRequest http://127.0.0.1:4791/health`
  - `STATUS=200`
- `adb devices -l`
  - daemon started successfully
  - no device lines yet

## Operational Meaning

- Rayssa host blocker moved from "tool missing" to "device not yet authorized/connected"
- startup is still not blocked by the `4781`/`4791` contract anymore
- the remaining phone-lane gate on Rayssa host is now:
  - device visibility in `adb devices -l`
  - then `adb reverse`
  - then phone smoke

## Next Exact Step

Use the explicit binary, not `PATH` assumptions:

1. `& 'C:\Users\rayss\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe' version`
2. `& 'C:\Users\rayss\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe' devices -l`
3. If a device appears as `device`, run:
   `& 'C:\Users\rayss\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe' reverse tcp:4781 tcp:4781`
4. Then run the Rayssa phone smoke path

If `devices -l` stays empty, the remaining work is phone pairing/authorization, not Asolaria runtime repair.
