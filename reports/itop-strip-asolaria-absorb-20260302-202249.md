# iTop Strip + Asolaria Absorb

Generated: 2026-03-02 20:22:49 -03:00

## What Was Removed
- iTop Screen Recorder uninstalled (quiet uninstall exit code 0).
- All iTop scheduled tasks removed.
- iTop microphone/webcam consent keys set to `Deny` before removal.
- No remaining iTop program/task/process/install folder traces.

## Asolaria Replacement (On-Demand Only)
- Wrapper: `C:\Users\acer\Asolaria\tools\Invoke-Asolaria-Capture.ps1`
- Desktop capture: `powershell -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Invoke-Asolaria-Capture.ps1 -Mode desktop`
- Window capture: `powershell -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Invoke-Asolaria-Capture.ps1 -Mode window -WindowTitle "AnyDesk"`
- Layout capture: `powershell -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Invoke-Asolaria-Capture.ps1 -Mode layout`
- Phone screencap (ADB): `powershell -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Invoke-Asolaria-Capture.ps1 -Mode phone`

## Verification
- iTop programs: 0
- iTop tasks: 0
- iTop processes: 0
- Wrapper smoketest: passed (desktop PNG produced).

## Safety
- Microsoft Store remains present.
- WindowsApps python shim remains present.

## Artifacts
- C:\Users\acer\Asolaria\reports\fix-increment27-20260302-202033
- C:\Users\acer\Asolaria\reports\fix-increment28c-20260302-202221
