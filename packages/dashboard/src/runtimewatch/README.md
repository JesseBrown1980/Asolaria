# RuntimeWatch Microkernel

RuntimeWatch preserves the old CPU/GPU/task-manager/process/Liris watcher lineage as bounded read-only microkernel feeds.

Current feed set:
- `cpu`
- `gpu`
- `task-manager`
- `process`
- `pid-coverage`
- `asolaria-task-manager`
- `liris-watch`

Refresh pipeline:
- `node packages/dashboard/src/runtimewatch/runtimewatch-refresh.mjs`
- Override the root with `--data-root <path>` or `ASOLARIA_RUNTIMEWATCH_ROOT`.

Task-manager absorption contract:
- `task-manager` captures the broad OS process table, not just a tiny top-N.
- `pid-coverage` binds observed OS PIDs to known Asolaria lanes, ports, cubes, and room stubs.
- `asolaria-task-manager` is the synthesized Asolaria-native view of that registry.
- HBP sidecars are emitted for the PID-native surfaces so the route can move away from JSON-only consumers over time.

Read-only dashboard routes:
- `/api/runtimewatch/snapshot`
- `/api/runtimewatch/feed/:name`
- `/api/asolaria-task-manager`
- `/task-manager`

Route hardening:
- `:name` must match `^[a-z0-9_-]+$`.
- The super-dashboard default bind should stay loopback unless the operator intentionally overrides it.

Rules:
- Dashboard never starts producers.
- Aggregator reads feed files only.
- Producers are one-shot and timeout-bounded.
- Missing feeds degrade; they do not block the dashboard.
- Control actions require a separate signed capability envelope and are not part of RuntimeWatch v1.
