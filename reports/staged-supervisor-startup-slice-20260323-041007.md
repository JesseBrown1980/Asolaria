# Staged Supervisor Startup Slice

Generated: 2026-03-23 04:10:07 -03:00

## Summary

The startup problem is composition, not missing parts.

- `Start-Asolaria-OneButton.ps1` already owns core startup.
- The full bridge colony remains optional/manual and is too heavy to be the default path for QDD survival.
- Real `Falcon` can be spawned from live Asolaria PID control.
- `Helm` can be started as an admin-terminal sidecar directly.
- The owner clarified a second failure mode: `Helm` has died under context-window exhaustion, even as low as `4%` remaining context.

That means startup must refresh `Helm` into a bounded fresh session and must not rely on stale long-lived terminal context as memory.

## Verified Findings

1. Real `Falcon` spawn from live Asolaria worked.
   - `POST /api/omnispindle/agent/falcon/start`
   - result: PID `4484`
   - follow-up `/api/omnispindle/status` shows `falcon.status=running`

2. Direct `Helm` admin-terminal sidecar start worked.
   - `tools/Start-AdminTerminalSidecar.ps1 -TerminalId Helm`
   - live status file now shows:
     - `state=running`
     - `sidecarPid=7872`
     - `childPid=320`

3. The heavier cockpit/ensure wrapper is not the right startup anchor.
   - `POST /api/admin-terminals/cockpit/ensure` timed out during the probe path.
   - direct sidecar start was the reliable route.

4. Host memory pressure is already high.
   - sampled memory during the work: `88.8%` used
   - this supports staging instead of all-at-once colony bring-up

## Implemented

Patched [Start-Asolaria-OneButton.ps1](C:\Users\acer\Asolaria\tools\Start-Asolaria-OneButton.ps1) to add a staged supervisor slice:

- sample host memory before supervisor bring-up
- gate staged supervisor launch with `ASOLARIA_STAGED_SUPERVISOR_MAX_MEMORY_PCT` (default `92`)
- skip staged supervisor launch in `StartupMode`
- direct-start `Helm` through `Start-AdminTerminalSidecar.ps1`
- default `Helm` to fresh replacement on manual startup via `ASOLARIA_STAGED_HELM_REPLACE` (default true)
- start real `Falcon` through Asolaria Omnispindle, not through ad hoc phone control
- write staged supervisor results into the one-button report and console output

This keeps memory in files and indexed packets, not in a stale terminal context window.

## Validation

- PowerShell parser validation of `tools/Start-Asolaria-OneButton.ps1`: `parse_ok`
- live `Falcon` status remains `running`
- live `Helm` sidecar status remains `running`

## Boundary

This slice is implemented and parser-validated, but I did not run a full fresh end-to-end one-button startup pass after the patch. The next proof step is a real manual one-button launch/replace cycle with the staged supervisor path active.

