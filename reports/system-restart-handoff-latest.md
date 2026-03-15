# System Restart Handoff - 2026-03-11

## Purpose

This note is the durable restart packet for a full computer shutdown and reboot.

## Current Truth

- Canonical controller admin terminal: `Helm`
- Canonical helper/watch admin terminal: `Sentinel`
- Inner relay lane names remain separate:
  - `vector`
  - `rook`
  - `forge`
  - `falcon`
  - `asolaria`
  - `watchdog`

## New Admin Cockpit Surface

Asolaria now has a dedicated dashboard runtime card named `Admin Terminal Cockpit`.

It can:

1. Render stacked `Helm` and `Sentinel` control panes
2. Show transcript tails and live state
3. Launch or stop sidecar-managed admin sessions
4. Re-brief either terminal from the permanent profile and current QDD/controller packets
5. Prompt either terminal directly from the dashboard

Important constraint:

- This cockpit manages dedicated sidecar sessions.
- It does not attach to already-open manual Codex terminals by native session id.

## Read Order After Restart

1. `C:\Users\acer\AGENTS.md`
2. `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
3. `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md`
4. `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md`
5. `C:\Users\acer\Asolaria\reports\qdd-super-swarm-contract-latest.md`
6. `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`
7. `C:\Users\acer\Asolaria\reports\qdd-monorepo-ez-protect-checkpoint-latest.md`

## QDD Resume Truth

- Use: `D:\projects\QDD\ebacmap-master`
- Do not resume new EZ Protect implementation in: `D:\projects\QDD\ebacmap`
- The EZ Protect monorepo slice is already landed.
- The next clean move remains verification/hardening, manual smoke, or rollout-evidence work, not re-porting the slice.

## Dashboard / API Surfaces

- Dashboard card: `C:\Users\acer\Asolaria\public\index.html`
- Cockpit API:
  - `GET /api/admin-terminals/cockpit`
  - `POST /api/admin-terminals/cockpit/ensure`
  - `POST /api/admin-terminals/cockpit/stop`
  - `POST /api/admin-terminals/cockpit/prompt`

## Shutdown Note

This machine is being fully shut down and restarted.

On restart:

- reopen Asolaria
- use Super Admin mode or the runtime dashboard to reach `Admin Terminal Cockpit`
- launch sidecar-managed `Helm` / `Sentinel` only when you want the dashboard-managed pair, instead of reusing stale manual windows blindly

## Recovery Anchors

- `C:\Users\acer\Asolaria\TASKS.md`
- `C:\Users\acer\Asolaria\reports\system-restart-handoff-latest.md`
- `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
- `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`
- `C:\Users\acer\Asolaria\reports\sector-drift-watch-latest.md`
