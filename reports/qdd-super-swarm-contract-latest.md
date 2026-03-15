# QDD Super Swarm Contract - 2026-03-11

## Purpose

This file is the restart-safe contract for QDD super-swarm coordination inside Asolaria.

## Activation

- `swarmModeEnabled = true`
- `superSwarmEnabled = true`
- `superSwarmMethod = super_swarm`
- `superSwarmMission = qdd`
- `superSwarmAgentFanout = 3`

If `SUPER_SWARM` is enabled, base swarm mode must remain enabled.

## Admin Terminals

- `Helm`: controller admin terminal
- `Sentinel`: helper/watch admin terminal

## Relay Layer

- Relay room: `asolaria_bridge`
- Relay peers:
  - `vector`
  - `rook`
- Confirmation thread:
  - `asolaria_bridge` / `helm-super-swarm-20260311`

These are relay lanes only.

They are not the admin-terminal identities.

## Coordinated Participants

- `local_codex`
  - primary repo-writing lane
- `abacus`
  - bounded external worker lane
- `symphony`
  - long-running issue lane
- `gemini_api`
  - alternate brain / analysis lane
- `augment_context`
  - read-only indexing sidecar

## Control Surfaces

- Runtime control:
  - `/api/swarm/status`
  - `/api/swarm/mode`
  - `/api/worker-router/status`
  - `/api/worker-router/dispatch`
- QDD support:
  - `/api/projects`
  - `/api/mistakes/hints`
  - `/api/mistakes/patterns`
- Integrations:
  - `/api/integrations/symphony/status`
  - `/api/integrations/symphony/submit`
  - `/api/integrations/augment-context/status`
  - `/api/integrations/augment-context/apply`
  - `/api/integrations/abacus/status`
  - `/api/integrations/gemini_api/status`
- Browser/computer:
  - `/api/browser/task`
  - `/api/mobile/screen/capture`
  - `/api/mobile/control/*`
- Local Playwright CLI:
  - `npx` is available on this machine
- Helm controller tool:
  - `C:\Users\acer\Asolaria\tools\Invoke-Helm-Control.ps1`
  - `C:\Users\acer\Asolaria\docs\HELM_CONTROLLER_SURFACES.md`

## QDD Anchors

- Authoritative repo:
  - `D:\projects\QDD\ebacmap-master`
- Reference-only old repo:
  - `D:\projects\QDD\ebacmap`
- QDD restart packet:
  - `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`
- Helm controller packet:
  - `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md`

## Guardrails

- Do not collapse `Helm` / `Sentinel` into `vector` / `rook`.
- Do not treat `augment_context` as a writer lane.
- Do not treat `symphony` as direct repo-write authority.
- Do not let bridge ACKs redefine project truth.
- Do not reopen the old QDD repo as the implementation target.
