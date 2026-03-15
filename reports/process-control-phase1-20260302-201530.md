# Process Control Phase 1

Generated: 2026-03-02 20:15:31 -03:00

## Controls Applied
- Disabled HKCU autostarts: `Teams`, `Docker Desktop`, `com.squirrel.slack.slack`, `Adobe Acrobat Synchronizer`, `Microsoft.Lists`.
- Disabled all detected `iTop` scheduled tasks.
- Stopped related user app processes in this pass (Slack/Teams/Docker/Acrobat sync where present).
- Stopped residual running `iTop Screen Recorder Startup` execution.

## Current State Checks
- Teams autostart present: False
- Docker Desktop autostart present: False
- com.squirrel.slack.slack autostart present: False
- Adobe Acrobat Synchronizer autostart present: False
- Microsoft.Lists autostart present: False

### iTop Task State
- iTop JunSale Task (One-Time): Disabled
- iTop Screen Recorder SkipUAC (acer): Disabled
- iTop Screen Recorder Startup: Disabled
- iTop Screen Recorder Update: Disabled
- iTopEN VD2026 Task (One-Time): Disabled

### Top Memory Processes (post-control)
- chrome (PID 11540): WS 0.708 GB, CPU 59.2s
- WindowsTerminal (PID 13004): WS 0.363 GB, CPU 401.8s
- MsMpEng (PID 5028): WS 0.36 GB, CPU 7175.9s
- chrome (PID 20728): WS 0.327 GB, CPU 443.1s
- chrome (PID 15848): WS 0.304 GB, CPU 55.9s
- explorer (PID 14568): WS 0.284 GB, CPU 162.4s
- msedgewebview2 (PID 12132): WS 0.264 GB, CPU 199.8s
- SnippingTool (PID 10032): WS 0.236 GB, CPU 146.4s
- WhatsApp.Root (PID 17564): WS 0.213 GB, CPU 58s
- chrome (PID 12548): WS 0.203 GB, CPU 67.2s
- Memory Compression (PID 3308): WS 0.164 GB, CPU 199.9s
- dwm (PID 16820): WS 0.152 GB, CPU 2619.5s
- msedgewebview2 (PID 7136): WS 0.141 GB, CPU 187s
- powershell (PID 15892): WS 0.121 GB, CPU 29.2s
- TextInputHost (PID 8912): WS 0.107 GB, CPU 20s
- ShellExperienceHost (PID 10024): WS 0.104 GB, CPU 11.2s
- chrome (PID 18512): WS 0.101 GB, CPU 1.1s
- chrome (PID 11772): WS 0.094 GB, CPU 1.6s
- chrome (PID 10804): WS 0.091 GB, CPU 1s
- ExpressVPN.AppService (PID 5492): WS 0.091 GB, CPU 344.4s

## Interpretation
- Remaining top usage is mostly active foreground apps (`chrome`, `WindowsTerminal`, `SnippingTool`) and expected system/security components (`MsMpEng`, `dwm`).
- Asolaria bridge/watchdog stack remains healthy and running.

## Rollback
- Increment 25 rollback: `C:\Users\acer\Asolaria\reports\fix-increment25-20260302-201339\rollback-restore-process-control.ps1`
- Increment 26 is runtime stop only (tasks remain disabled from phase 1).
