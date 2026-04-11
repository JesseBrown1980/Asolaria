# LIRIS Ethernet Controller Hydration

## Verdict

The LIRIS lane is already live over direct Ethernet. This is not a discovery lane anymore; it is an established controller lane.

- local host: `192.168.100.1`
- peer host: `192.168.100.2`
- peer MAC: `7C-8A-E1-E1-3A-DC`
- latency: approximately `1 ms`
- primary service: `asolaria-gateway` on `4791`
- reachable auxiliary lanes: `4820`, `18883`, `18884`, `18885`

## Remote Truth

The live gateway health response on `http://192.168.100.2:4791/health` reports:

- `service = asolaria-gateway`
- `bind = 0.0.0.0`
- `port = 4791`
- `startedAt = 2026-04-06T01:58:31.460Z`
- `authorityMode = asolaria_primary`
- `updatedBy = liris`
- `audit file = C:\Users\rayss\Asolaria\data\gateway-audit.ndjson`
- `approval store = C:\Users\rayss\Asolaria\data\gateway-approvals.json`

That means the Ethernet peer is not just reachable. It is a live Asolaria authority surface, with LIRIS already stamped into the authority state.

## Canon Chain

The active hydration/cross-pollination chain is:

- `IX-473`: Slack is the primary communication vein
- `IX-521`: approval-loop and relay spine
- `IX-552`: boundary decision for shadow/helper lanes
- `IX-553`: shadow comms catalog
- `IX-574`: OpenClaude derived runtime form
- `IX-579`: stage-aware triage packet
- `IX-584`: authority map
- `IX-585`: LIRIS implementation packet

## Operating Rule

Ethernet is the primary controller lane for this host pair.

- USB handoff is not the governing path here
- shadow/selector/runtime forms stay derived and reversible
- canon stays sovereign
- any fast/helper lane must collapse back into indexed canon

## Cross-Pollination Model

Hydration is not a one-time act. The stable model is repeated governed pulses:

1. control room
2. triage packet
3. shadow selector layer
4. authority map
5. live gateway truth
6. approved execution only

## Strongest Truth

The direct Ethernet lane is already live and owned by the Asolaria gateway.

## Strongest Risk

No derived entry point may silently gain destructive authority.

The first segmentation targets remain:

- `selector::comms.agent_admission_intake`
- `surface::verb.phone_adb.direct_run`

## Recommended Next Bridge

- `desktop-slack-visual` for human-visible follow-up
- `internal_http` through `4791` for governed machine actions
- keep Ethernet above USB unless Ethernet itself degrades
