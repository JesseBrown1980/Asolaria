# Admin Terminal Identities - 2026-03-11

## Naming Correction

The earlier `Vector` / `Rook` admin-terminal mapping was wrong.

Those names are already used by internal bridge lanes and must stay separate from the two human-facing admin terminals.

## Admin Terminal Layer

- Controller admin terminal: `Helm`
- Helper/watcher admin terminal: `Sentinel`

## Internal Lane Layer

These are not the admin-terminal names:

- `vector`
- `rook`
- `forge`
- `falcon`
- `asolaria`
- `watchdog`

They remain inner coordination identities only.

## Canonical Local Memory Files

- Shared identity registry:
  - `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
- Controller profile card:
  - `C:\Users\acer\Asolaria\reports\admin-terminal-helm-profile-latest.md`
- Helper/watch profile card:
  - `C:\Users\acer\Asolaria\reports\admin-terminal-sentinel-profile-latest.md`
- Machine-readable admin profiles:
  - `C:\Users\acer\codex-bridge\profiles\admin-helm-v1.profile.json`
  - `C:\Users\acer\codex-bridge\profiles\admin-sentinel-v1.profile.json`
  - `C:\Users\acer\codex-bridge\profiles\admin-terminal-identities.json`
- Shared controller packet:
  - `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md`
- Shared QDD super-swarm contract:
  - `C:\Users\acer\Asolaria\reports\qdd-super-swarm-contract-latest.md`
- Helm controller tool:
  - `C:\Users\acer\Asolaria\tools\Invoke-Helm-Control.ps1`
  - `C:\Users\acer\Asolaria\docs\HELM_CONTROLLER_SURFACES.md`

These admin JSON files are local admin-memory descriptors only.

They are not bridge launch profiles.

## Live Coordination Surfaces

- Asolaria control/runtime:
  - `/api/swarm/status`
  - `/api/swarm/mode`
  - `/api/worker-router/status`
  - `/api/worker-router/dispatch`
  - `/api/projects`
  - `/api/mistakes/hints`
  - `/api/mistakes/patterns`
- Integration lanes:
  - `/api/integrations/symphony/status`
  - `/api/integrations/symphony/submit`
  - `/api/integrations/augment-context/status`
  - `/api/integrations/augment-context/apply`
  - `/api/integrations/abacus/status`
  - `/api/integrations/gemini_api/status`
- Computer/browser control:
  - `/api/browser/task`
  - `/api/mobile/screen/capture`
  - `/api/mobile/control/*`
- Relay room:
  - `asolaria_bridge`
- Relay peers:
  - `vector`
  - `rook`
- Live confirmation thread:
  - `asolaria_bridge` / `helm-super-swarm-20260311`

## Super Swarm

- Method: `super_swarm`
- Mission: `qdd`
- Fanout per Codex terminal: `3`
- Coordinated participants:
  - `local_codex`
  - `abacus`
  - `symphony`
  - `gemini_api`
  - `augment_context`

Boundary:

- `augment_context` stays read-only.
- `symphony` stays the long-running issue lane.
- `vector` and `rook` remain relay lanes, not admin-terminal identities.

## Completion Hook

`Sentinel` has a restart-safe completion hook into `Helm`.

Meaning:

- `Sentinel` finishes a bounded watch pass
- updates `sector-drift-watch-latest.md`
- then emits a short relay note for `Helm` through `Invoke-Helm-Control.ps1`
- only when the pass changes controller-relevant state

Allowed completion-hook event types:

- `drift_changed`
- `controller_conflict`
- `new_blocker`
- `sector_cleared`
- `needs_helm_decision`

Required completion-hook payload:

- what changed
- why it matters
- what `Helm` should do next

## Sidecar And Dashboard Integration

`Helm` and `Sentinel` are now integrated into the live colony as admin-plane agents.

Canonical sidecar runtime roots:

- `C:\Users\acer\Asolaria\runtime\admin-terminals\helm`
- `C:\Users\acer\Asolaria\runtime\admin-terminals\sentinel`

Canonical sidecar control tools:

- `C:\Users\acer\Asolaria\tools\Start-AdminTerminalSidecar.ps1`
- `C:\Users\acer\Asolaria\tools\Send-AdminTerminalInput.ps1`
- `C:\Users\acer\Asolaria\tools\Get-AdminTerminalSidecarStatus.ps1`
- `C:\Users\acer\Asolaria\tools\Stop-AdminTerminalSidecar.ps1`

Live surfaces that should now reflect these terminals:

- colony dashboard / `agentColony`
- `/api/swarm/status`
- graph-runtime observations under category `admin_terminal`

Status rule:

- green/cyan light = active
- amber light = idle
- red light = offline / stopped

Obsolete admin-terminal cards kept only as historical correction points:

- `C:\Users\acer\Asolaria\reports\admin-terminal-vector-profile-latest.md`
- `C:\Users\acer\Asolaria\reports\admin-terminal-rook-profile-latest.md`

## Restart Rule

For `Helm`, reload:

1. `C:\Users\acer\Asolaria\reports\admin-terminal-helm-profile-latest.md`
2. `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
3. `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md`
4. `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md`
5. `C:\Users\acer\Asolaria\reports\qdd-super-swarm-contract-latest.md`
6. `C:\Users\acer\AGENTS.md`
7. `C:\Users\acer\Asolaria\TASKS.md`
8. any active project restart packet

For `Sentinel`, reload:

1. `C:\Users\acer\Asolaria\reports\admin-terminal-sentinel-profile-latest.md`
2. `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
3. `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md`
4. `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md`
5. `C:\Users\acer\Asolaria\reports\qdd-super-swarm-contract-latest.md`
6. `C:\Users\acer\AGENTS.md`
7. `C:\Users\acer\Asolaria\TASKS.md`
8. the active controller packet or active project restart packet
