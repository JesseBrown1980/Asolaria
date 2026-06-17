# Host8 Room Stubs

These folders are the first physical room stubs for the Asolaria task-manager to host8 migration.

Current intent:

- give load-bearing lanes a stable filesystem-backed room identity
- let future host8 launchers, receipts, and parity probes land without inventing paths later
- keep the dashboard/read-only registry separate from the eventual process controller

First materialized rooms:

- `rooms/task-manager/spine/behcs-bus`
- `rooms/task-manager/surface/super-dashboard`
- `rooms/task-manager/dispatch/omnidispatcher`
- `rooms/task-manager/cosign/cosign-chain`
- `rooms/task-manager/surface/agent-keyboard`

The full logical room list is in:

- `plans/ASOLARIA-TASK-MANAGER-HOST8-MIGRATION-2026-06-17.md`
- `packages/dashboard/src/runtimewatch/runtimewatch-process-catalog.mjs`
