# Asolaria Task Manager + Host8 Migration

Purpose: absorb the Windows task/process table into Asolaria as a first-class fabric surface, then replace Node-hosted pipes with 8-byte host processes where parity is proven.

## First slice

- `packages/dashboard/src/runtimewatch/feeds/task-manager-feed.mjs`
  Captures the wider OS process table.
- `packages/dashboard/src/runtimewatch/feeds/pid-coverage-feed.mjs`
  Binds observed OS processes to known Asolaria lanes, cubes, ports, and room stubs.
- `packages/dashboard/src/runtimewatch/feeds/asolaria-task-manager-feed.mjs`
  Synthesizes the Asolaria-native task manager surface.
- `packages/dashboard/src/runtimewatch/runtimewatch-process-catalog.mjs`
  Declares the migration catalog and room-stub contract.
- `packages/dashboard/src/runtimewatch/runtimewatch-refresh.mjs`
  Runs the read-only feed stack in dependency order, then emits the snapshot.
- `tools/behcs/super-os/super-dashboard-server.mjs`
  Serves the read-only routes `/api/runtimewatch/snapshot`, `/api/runtimewatch/feed/:name`, `/api/asolaria-task-manager`, and `/task-manager`.

This is additive. Nothing here starts, kills, or swaps a daemon.

## Room stubs

The migration should treat each process lane as an instant room with a stable address even before host8 takes it over.

Current room-stub contract:

- `rooms/task-manager/spine/behcs-bus`
- `rooms/task-manager/surface/super-dashboard`
- `rooms/task-manager/dispatch/omnidispatcher`
- `rooms/task-manager/quorum/vote-quorum`
- `rooms/task-manager/cosign/cosign-chain`
- `rooms/task-manager/pulse/federation-pulse`
- `rooms/task-manager/reflect/self-reflect`
- `rooms/task-manager/gnn/gnn-l0`
- `rooms/task-manager/gnn/gnn-l4`
- `rooms/task-manager/surface/agent-keyboard`
- `rooms/task-manager/watch/auto-fabric-query`
- `rooms/task-manager/bridge/gnn-dispatch-bridge`
- `rooms/task-manager/mcp/asolaria-fabric`
- `rooms/task-manager/mcp/asolaria-web`
- `rooms/task-manager/mcp/google-wiki`

The first physical room stubs now live under `packages/dashboard/src/runtimewatch/host8-room-stubs/rooms/...`.
They are still additive descriptors, but the folder substrate now exists for the host8 launcher to claim later.

## Migration order

1. Absorb the process table.
   Output: `task-manager`, `pid-coverage`, `asolaria-task-manager`.
2. Wire a dedicated dashboard route and panel.
   Read-only. No producer startup from the route.
3. Add fabric PID <-> OS PID binding rows.
   This closes the current registry gap.
4. Introduce host8 process wrappers for priority lanes.
   Order: bus, dashboard, omnidispatcher, agent-keyboard.
5. Run parity.
   Required before any Node retirement:
   - same port
   - same route/verb contract
   - same receipt shape
   - same restart/health semantics
6. Retire or merge redundant watchers and old Node pipes.

## Host8 target classes

- `host8-priority`
  Bus, dashboard, omnidispatcher, agent-keyboard.
- `host8-candidate`
  vote-quorum, cosign-chain, federation-pulse, self-reflect, GNN lanes.
- `host8-after-parity`
  GNN lanes that depend on parity with the active inference path.
- `bridge-later`
  MCP stdio bridges.
- `retire-or-host8`
  watch/bridge leftovers that may disappear once the registry is real.

## Non-negotiable rule

Node-out is not a declaration. A lane moves only after the host8 process serves the real route or protocol and passes parity on the live contract.
