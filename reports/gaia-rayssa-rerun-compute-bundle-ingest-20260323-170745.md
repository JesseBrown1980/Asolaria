# Gaia Rayssa Rerun Compute Bundle Ingest

- Ingested: `2026-03-23 17:07:45 -03:00`
- Source ZIP: `C:\Users\acer\Downloads\gaia-rayssa-rerun-compute-bundle-20260323-165807.zip`
- SHA-256: `F2BC29B49358AE17B6E970396D1BAFD632757411518F20484AF950A30EB9B67A`
- Extracted under: `C:\Users\acer\tmp\downloads\gaia-rayssa-rerun-compute-bundle-20260323-165807`

## Result

This packet is internally consistent and satisfies the narrow next-order set in `IX-296` and `IX-299`.

- Compat `4781` rerun PID hardening: `pass`
- Local `liris` compute-readiness preparation: `pass`
- `computeWorkerReady`: `false`
- Cross-host compute / phone CPU sharing: `not proven`

## Proof Preserved

### 1. Compat rerun hardening is complete

The Rayssa-side packet proves that the compat launcher now keys reuse off the actual listening PID on `4781`.

- First force-restart path completed with `exitCode=0`
- `compat4781.pid` after first launch: `15936`
- `Get-NetTCPConnection -LocalPort 4781 -State Listen` reported `OwningProcess = 15936`
- Second launcher run returned:
  - `ok=true`
  - `alreadyRunning=true`
  - `pid=15936`
  - `listenerPid=15936`
- Netstat proof shows one `LISTENING` row on `127.0.0.1:4781` with PID `15936`
- Health after rerun is green on both layers:
  - `4781`: `ok=true`, `compatSurface=proxy_4781`, `gatewayBaseUrl=http://127.0.0.1:4791`
  - `4791`: `ok=true`, `service=asolaria-gateway`

### 2. Local compute-preparation proof is clean but bounded

The Rayssa-side packet also proves the smaller compute-readiness boundary requested in `IX-299`.

- Node identity is explicit as `liris`
- `config/liris-node-identity.json` carries:
  - `nodeId = liris`
  - `mqttTopicPrefix = asolaria/nodes/liris`
- Compute slice presence is evidenced locally
- MQTT federation topic map is present in local code
- Bounded execution proof is clean:
  - `python --version` failed because Python is not installed on this host
  - `rg --version` succeeded and was selected as the proof command
  - `git --version` is available as fallback

Raw bounded-proof decision from the bundle:

- `boundedLocalExecution=true`
- `selectedBoundedProof=rg --version`
- `computeWorkerReady=false`
- reason: shell-local bounded execution is clean, but the advertised worker contract is not yet proven end to end on Rayssa host

## Durable Boundary

Promote the following as current Jesse-side memory truth:

- Rayssa host phone compat lane remains live under `liris/kuromi`
- Compat rerun PID hardening on Rayssa host is now complete
- Rayssa-side local compute preparation is real enough to prove:
  - explicit `liris` node identity
  - MQTT topic-shape presence
  - bounded local execution
- Do not promote `computeWorkerReady=true` from this packet
- Do not claim live cross-host compute or phone CPU/RAM sharing from this packet

## Task Impact

- Close the narrow `IX-296` follow-up task as satisfied
- Close the dedicated Rayssa compat rerun PID-check task as satisfied
- Leave shared-compute rollout open until Jesse sovereign runtime is restarted into the compute build and a real advertised worker contract is proven on a federated node
