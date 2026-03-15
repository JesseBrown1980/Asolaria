# Fix Increment 32 (Full Dedupe + CPU/GPU State)

Generated: 2026-03-02 22:07:07Z

## User intent applied
- Ran dedupe in full all-at-once mode (no batching).
- Kept AnyDesk + Google Remote Desktop active.

## Dedupe results
- Script patched for strict-mode stability: Start-MediaDedupeQuarantine.ps1
- Full pass command: -MaxMoves 50000 -Apply
- Latest full run output:
  - C:\Users\acer\Asolaria\reports\media-dedupe-quarantine-20260302-220339.json
  - plannedOrMoved = 0 (no remaining candidates in scope)
- Prior applied run remains:
  - C:\Users\acer\Asolaria\reports\media-dedupe-quarantine-20260302-214626.json
  - moved 36 files, staged 0.0161 GB

## CPU/GPU state snapshot
- CPU sample (10 points): avg 31.5%, peak 53%
- GPU sample (perf counter): avg ~13%, peak ~13.5%
- NVIDIA telemetry (
vidia-smi):
  - GPU: GeForce GTX 1050
  - Driver: 442.23
  - Temp: 75 C
  - Util: 11%
  - VRAM: 292 MB / 4096 MB
  - P-state: P8
- Event log scan (last 7 days): no display-driver crash/reset pattern detected (no critical GPU fault signature found in collected set).

## Health interpretation
- CPU: operating normally for a multi-agent, browser-heavy session.
- GPU: functional and lightly loaded; temp is warm but acceptable for this class of laptop while active.
- Management could be improved via driver modernization and thermal profile tuning, but current state is stable.

## Guardrails verified
- AnyDesk service/process: running/automatic.
- Chrome Remote Desktop host service/process: running/automatic.
- Microsoft Store present.
- WindowsApps python shim present.

## Coordination
- Posted status + thresholds request to Asolaria/Oli via bridge thread solaria-system-repair-20260302.
