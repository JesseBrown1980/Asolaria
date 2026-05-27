# Minimal Helm Startup Packet

Generated: 2026-03-23 04:21:17 -03:00

## Extracted Liris/Rayssa Guidance

Latest recovered WhatsApp guidance from the Rayssa thread:

- `Helm` context must be reduced so it does not crash Asolaria again
- `Helm` should carry only:
  - current runtime truth
  - active blockers
  - next executable step
  - hard boundaries
- everything else should stay indexed and be pulled on demand
- the minimal `Helm` startup packet should include:
  - `adb` path and version
  - `4781` state
  - `4791/5443/5444/18883/18884` state
  - phone-lane proof status
  - exact next command allowed to run

## Current Runtime Truth

### ADB

- Path: `C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe`
- Version: `Android Debug Bridge version 1.0.41`
- Build: `36.0.2-14143358`
- Device proof: `192.168.15.188:5555 device model:SM_S721U1`

### Port State

- `4781`: listening, PID `19340`, process `node`, address `0.0.0.0`
- `4791`: listening, PID `5084`, process `node`, address `127.0.0.1`
- `5443`: not listening
- `5444`: not listening
- `18883`: listening, PID `16828`, process `node`, address `127.0.0.1`
- `18884`: listening, PID `16828`, process `node`, address `127.0.0.1`

### Phone-Lane Proof

- Real `Falcon` lane is running under Asolaria Omnispindle
  - lane: `falcon`
  - status: `running`
  - PID: `4484`
- `Helm` admin-terminal sidecar is running
  - sidecar PID: `7872`
  - child PID: `320`
- ADB is live and the phone is reachable over wireless debugging

## Active Blockers

- `5443/5444` are not currently listening
- bridge colony remains too heavy to be the default startup path
- `Helm` context exhaustion remains a real risk unless startup stays compressed and file-backed

## Hard Boundaries

- do not feed `Helm` the whole archaeology at startup
- do not treat old terminal context as durable memory
- keep startup owner-visible
- keep real `Falcon` supervisor-spawned by Asolaria only

## Exact Next Command Allowed To Run

Owner-present staged startup smoke on Jesse host:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Start-Asolaria-OneButton.ps1 -NoUi
```

That command is now the bounded next proof step because one-button has been patched to:

- sample host memory
- refresh `Helm`
- stage real `Falcon`
- avoid making the full bridge colony the default path

