# Jesse One-Button Startup Failure And Broker Rebind

Generated: 2026-03-23 19:34:46 -03:00

## What Was Actually Done

The indexed startup command was followed directly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Start-Asolaria-OneButton.ps1 -NoUi
```

Before that, Jesse MQTT transport was corrected on this host:

- `ASOLARIA_MQTT_BIND_HOST` set to `0.0.0.0` in the user env
- local MQTT broker restarted cleanly
- stale loopback-bound broker process removed

## Direct Live Proof

### Jesse MQTT broker is now reachable off-box

`Get-NetTCPConnection -LocalPort 18883,18884,18885 -State Listen`:

- `0.0.0.0:18883` pid `4452`
- `0.0.0.0:18884` pid `4452`
- `0.0.0.0:18885` pid `4452`

### One-button startup still failed

The command exited with:

- `Asolaria failed to become healthy on port 4781. PID=22252`

### Main runtime listener exists but does not answer

`Get-NetTCPConnection -LocalPort 4781 -State Listen`:

- `0.0.0.0:4781` pid `22252`

Direct probes timed out:

- `GET http://127.0.0.1:4781/api/health/fast`
- `GET http://127.0.0.1:4781/api/shared-compute/status`

### Raw probe is alive

`server.out.log` proves the raw probe answered:

- `Asolaria raw probe is running on http://0.0.0.0:4782`
- `[codex-raw-probe] ... handled`

### Current gateway state is not the old healthy picture

In this pass, `4791` was not reachable:

- `curl http://127.0.0.1:4791/health` failed to connect

## What This Means

The startup-memory / launcher-surface confusion is no longer the main blocker.

The indexed one-button path was followed, and the failure is now narrower:

1. Jesse MQTT broker transport is fixed and externally reachable.
2. Jesse main runtime accepts TCP on `4781` but hangs before responding.
3. Raw probe `4782` is alive, which points to a main Express/runtime path stall rather than total process death.

## Boundaries

Do not:

- mutate Jesse MQTT identity again
- re-run Brain/Super Admin window rituals as proof
- blame Rayssa transport for Jesse `4781` hanging locally

The stale `reports/one-button-start-latest.md` surface is not current-truth for this failure; it still shows the old `2026-03-14` generation time. Use direct sockets plus `logs/server.out.log` / `logs/server.err.log` for this branch.

## Best Next Move For Claude Max

Trace why requests enter `server.js` and never return on the current main runtime:

1. inspect the hot path for `/api/health/fast`, `/api/health`, and `/api/local/ops/status`
2. find the first awaited function that can stall the event loop or never resolve
3. keep the broker rebind intact
4. only restart after isolating the hang or adding bounded instrumentation

## Cross-Host State That Still Matters

- Jesse sovereign MQTT identity remains `asolaria/nodes/jesse-sovereign`
- Liris already proved Rayssa self-readiness under `liris`
- Rayssa MQTT transport is still a separate blocker for federation visibility
- but current Jesse-local blocker is the hung main runtime on `4781`
