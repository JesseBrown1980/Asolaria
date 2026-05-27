# Jesse Gateway Restart Packet

- Timestamp: `2026-03-29 21:26:44 -03:00`
- PID: `gaia-20260329-jesse-system-restart`
- Profile: `gaia`
- Predecessor authority: `IX-460`, `IX-461`, `IX-462`
- Current live authority: `IX-463`, `IX-464`, `IX-465`

## Pre-dev

### Ground truth

- `C:\Users\acer\Asolaria` is already the working source tree on Jesse host.
- `4781` is healthy on PID `17656`.
- `4791` is transport-healthy on PID `10288`.
- gateway readiness is blocked by:
  - `Audit integrity verify is failing.`
  - `Audit gate is locked (entry 1146 prevHash mismatch).`
- memory indexer is already live on PID `16644`.
- sandbox manager is not currently running.

### Root cause

The gateway audit file is not random corruption.
It is a mixed-format file:

- `src/gateway/auditLog.js` writes hash-chained gateway events
- `middleware/attribution.js` writes raw mutation-attribution rows

The first raw row is the first failing verify row:

- entry `1146`
- `POST /api/standing-directives`

## Dev

### Minimum repair law

1. stop main-app attribution from writing into `data/gateway-audit.ndjson`
2. preserve the mixed file with backup + manifest
3. split raw attribution rows into a separate append-only file
4. keep the gateway file hash-chain-only

## Staging

### Bounded restart sequence after repair

1. verify the repaired chain offline
2. restart gateway
3. restart main runtime only if needed for the attribution-path change
4. start sandbox manager if Jesse-host startup coherence requires the full control-plane set
5. recheck:
   - `4781`
   - `4791`
   - gateway readiness
   - `5444`
   - sandbox health if started

## Prod

### Handoff rule

Do not talk to local Jesse-host Liris as if that is Rayssa.
The post-restart deliverable for Rayssa/Liris must be a ZIP relayed by the owner after the restart gates pass.
