# System Audit: Processes, Cookies, Programs, Okta Removal, CPU/GPU

Generated: 2026-03-02 20:08:34 -03:00

## Scope
- Process inventory and memory pressure
- Browser cookie scan for Okta domains
- Program/task/service/process removal for Okta Verify
- Post-removal memory consolidation
- CPU/GPU observation and hardware-event checks

## Cookie Findings
- Edge/Chrome cookie DB scan found 0 cookies matching host contains `okta` on readable profiles.
- One Chrome profile DB was locked during scan (common when profile is in active use).

## Okta Verify Removal
- MSI product removed: {7056CBA2-CBAA-4454-BE88-BFE1E5E03F6E} (exit code 0)
- Programs: 2 -> 0
- Scheduled tasks: 1 -> 0
- Services: 1 -> 0
- Processes: 1 -> 0

## Memory Consolidation
- Candidate stale high-RAM PowerShell runners: 2
- Terminated: 2
- Approx WS freed: 1.88 GB
- Free RAM: 3.39 GB -> 5.9 GB (delta 2.51 GB)

## CPU/GPU Observation
- CPU 60s pre-consolidation sample: Avg 39.2%, Max 74%, Min 15%.
- CPU 45s post-consolidation sample: Avg 22.93%, Max 66%, Min 1%.
- GPU 45s post sample showed normal interactive desktop usage (SnippingTool, DWM, WindowsTerminal, Chrome).

## Hardware/Event Health (7-day lookback)
- No warning/error entries returned for providers: Display, WHEA-Logger, DxgKrnl, Kernel-Power, nvlddmkm, amdkmdag/amdkmdap.

## Safety Checks
- Microsoft Store: present.
- WindowsApps python shim: present.
- Codex/Asolaria bridge stack: healthy (local and tunnel health OK).

## Artifacts
- C:\Users\acer\Asolaria\reports\fix-increment23-20260302-195958
- C:\Users\acer\Asolaria\reports\fix-increment24-20260302-200610
- C:\Users\acer\Asolaria\reports\startup-health-snapshot-20260302-193933\snapshot.md
