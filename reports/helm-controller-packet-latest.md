# Helm Controller Packet - 2026-03-11

## Identity

- Controller admin terminal: `Helm`
- Helper/watch admin terminal: `Sentinel`

`Helm` owns controller decisions.

`Sentinel` watches drift, stale assumptions, conflicting sources of truth, and sector boundaries without taking over controller authority.

## Restart Order

For `Helm`, read in this order:

1. `C:\Users\acer\Asolaria\reports\admin-terminal-helm-profile-latest.md`
2. `C:\Users\acer\Asolaria\reports\admin-terminal-identities-latest.md`
3. `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md`
4. `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md`
5. the active project restart packet for the lane being resumed

## Current Controller Baseline

Current high-value active sectors:

1. QDD EZ Protect monorepo resume
2. mobile console failover defect
3. NotebookLM / Google access recovery

Shared super-swarm contract:

- `C:\Users\acer\Asolaria\reports\qdd-super-swarm-contract-latest.md`

Controller command surface:

- `C:\Users\acer\Asolaria\tools\Invoke-Helm-Control.ps1`
- `C:\Users\acer\Asolaria\docs\HELM_CONTROLLER_SURFACES.md`

Current low-priority or already-contained sectors:

- queue-server SFTP slice is already completed and indexed
- admin-terminal naming is corrected and should not be reopened unless a real collision reappears

## Primary Active Engineering Lane

Primary lane:

- QDD EZ Protect monorepo work in `D:\projects\QDD\ebacmap-master`

Active restart packet:

- `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`

Controller decision:

- keep the old repo `D:\projects\QDD\ebacmap` as reference only
- do not let bridge ACKs or NotebookLM sync noise redefine the QDD resume point
- the EZ Protect slice is already landed in the monorepo web app
- the next real engineering move is verification and hardening of the landed slice, with manual smoke or rollout-evidence follow-up as the bounded next lane
- relay coordination to inner lanes stays on `vector` and `rook`; those lane names are not admin-terminal identities

## Secondary Watch Sectors

### Mobile Console

Anchor:

- `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md`

Current issue:

- `mobile-console.html` can still redirect from healthy local loopback to remote fallback and land on `chrome-error://chromewebdata/`

### NotebookLM / Google Recovery

Anchor:

- `C:\Users\acer\Asolaria\TASKS.md`

Current issue:

- NotebookLM access recovery is still incomplete across all intended Google accounts

## Sentinel Mission

`Sentinel` should maintain:

- `C:\Users\acer\Asolaria\reports\sector-drift-watch-latest.md`

The watch note should contain only:

- mismatched restart instructions
- stale or conflicting source-of-truth files
- sectors that have drifted into overlapping ownership
- places where completed work is still being treated as open
- places where blocked work is being treated as active engineering

`Sentinel` should recommend packet cleanup, scoping changes, and handoff corrections for `Helm` to approve.

## Controller Guardrails

- Do not collapse admin-terminal names into bridge lane names.
- Do not reopen already-closed queue-server SFTP work unless new evidence appears.
- Do not let the helper/watch terminal silently become the controller.
- Do not treat historical timestamped identity notes as the current source of truth over `*-latest` files.

## Next Helm Moves

1. Keep QDD EZ Protect as the primary implementation lane.
2. Use Sentinel's drift watch to catch stale restart anchors and conflicting packets.
3. Prefer authenticated manual smoke or rollout-evidence follow-up before reopening any new QDD feature implementation.
4. Revisit the mobile console failover issue only when the active QDD move is either delegated cleanly or paused explicitly.
