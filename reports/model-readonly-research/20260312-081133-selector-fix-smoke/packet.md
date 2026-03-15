# Asolaria Read-Only Research Packet

Date: 2026-03-12
Scope: diagnose the remaining Asolaria admin-terminal cockpit loading and prompting issues.
Mode: read-only analysis only. Do not suggest executing commands or changing state during analysis. Reason from the evidence below.

## Primary Question

Is this fixable?

More specifically:

1. Are profile loading or profile permissions the main cause?
2. Or are transport/runtime issues the main cause?
3. What is the smallest ranked fix plan to stabilize the system?

## Current State

- The `Admin Terminal Cockpit` exists in the dashboard and can show `Helm` and `Sentinel`.
- The sidecars are real and already running from:
  - `C:\Users\acer\Asolaria\runtime\admin-terminals\helm`
  - `C:\Users\acer\Asolaria\runtime\admin-terminals\sentinel`
- The dashboard requirement is interactive small live terminals, similar to Codex commentary, inside the updated Super Admin dashboard.

## Verified Findings

### Already fixed

- `src/connectors/screenshotConnector.js`
  - Playwright import was changed from eager to lazy load.
  - This removed a startup/runtime poison path in this environment.

- `server.js`
  - Cockpit prompt delivery was changed from `restart_with_prompt` to live inbox delivery.
  - `Helm` now accepts dashboard prompts without replacing the running sidecar.
  - `Helm` status now records dashboard-delivered input and updated transcript/screen state.

- `server.js`
  - Minimal-startup `/api/health` was reduced so the dashboard background polling does not wedge the whole app as easily.

### Verified evidence after the fixes

- `/api/health` and `/api/admin-terminals/cockpit` are now responding again.
- Browser verification showed:
  - `Prompt queued for helm.`
  - Helm card changed to `ACTIVE`
  - Helm live transcript included a dashboard-sent prompt
- `runtime/admin-terminals/helm/status.json` showed:
  - `lastInputSource = "Asolaria Dashboard"`
  - `inboxLinesProcessed = 2`

## Remaining Symptoms

- The dashboard can still temporarily show `No admin terminals registered yet.` until a refresh.
- The UI has frequent background polling and still produces noisy console errors.
- Some routes remain unstable or degraded:
  - gateway authority status
  - gateway audit status
- The server can still become slow under load, though it is better than before.
- The user suspects profile permissions, but current evidence suggests that may not be the primary root cause.

## Known Relevant Files

- `C:\Users\acer\Asolaria\server.js`
- `C:\Users\acer\Asolaria\src\connectors\screenshotConnector.js`
- `C:\Users\acer\Asolaria\public\app.js`
- `C:\Users\acer\Asolaria\public\index.html`
- `C:\Users\acer\codex-bridge\profiles\admin-helm-v1.profile.json`
- `C:\Users\acer\codex-bridge\profiles\admin-sentinel-v1.profile.json`
- `C:\Users\acer\codex-bridge\profiles\admin-terminal-identities.json`
- `C:\Users\acer\Asolaria\runtime\admin-terminals\helm\status.json`
- `C:\Users\acer\Asolaria\runtime\admin-terminals\sentinel\status.json`

## Constraints For This Research

- Read-only analysis only.
- Do not propose destructive resets.
- Do not assume profile permissions are the cause unless the evidence strongly supports that.
- Distinguish clearly between:
  - profile identity/ability metadata
  - loopback/API authorization gates
  - PowerShell script bugs
  - browser automation limits
  - server/runtime load problems
  - frontend refresh/rendering issues

## Requested Output Format

Return these sections:

1. `Executive summary`
2. `Ranked root causes`
3. `Why profile permissions are or are not central`
4. `Read-only validation plan`
5. `Minimal ranked fix plan`
6. `Risks and unknowns`
7. `Confidence`

## Extra Instruction For Deep Modes

If your surface supports a deeper reasoning mode such as Deep Research or Deep Think, use it.
If not, answer in standard mode, but keep the analysis read-only.
