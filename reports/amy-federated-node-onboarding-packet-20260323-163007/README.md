# Amy Federated Node Onboarding Packet

Generated: 2026-03-23 16:30:07 -03:00
Scope: Amy host only
Default node id: `amy`

## Goal

Prepare Amy's machine as a bounded Asolaria federated node under Jesse sovereign control.

This expands Asolaria's throughput for bounded CLI/build/index/test/browser work.

It does **not** create merged RAM or one giant computer.

## Hard Boundaries

- Do not describe this as merged RAM or pooled OS memory.
- Do not enable old side channels like `4799`.
- Do not invent broker URLs, usernames, or passwords.
- Do not print secrets into reports.
- Use a trusted local Asolaria checkout only.
- Keep node identity as `amy` unless the owner explicitly chooses another lowercase node id.

## Phase 0: Inspect Before Mutating

Confirm these files exist in the local checkout:

- `src/sharedComputeFabric.js`
- `src/connectors/mqttConnector.js`
- `src/remoteNodeRegistry.js`
- `routes/sharedCompute.js`
- `routes/federation.js`
- `tests/contracts/shared-compute-fabric.test.js`
- `tests/contracts/remote-node-registry-provenance.test.js`

If any are missing, stop and report drift. Do not improvise a different architecture.

## Phase 1: Configure Session Environment

Open PowerShell on Amy's machine and set the session-only environment variables from `amy-node-session-env.ps1`.

Critical rule:

- `ASOLARIA_MQTT_BASE_TOPIC` must be exactly `asolaria/nodes/amy`
- if it is not under `asolaria/nodes/<nodeId>`, Jesse sovereign will not treat the machine as a federated node
- `computeWorkerReady` is derived from that node-shaped base topic

## Phase 2: Install And Validate Local Code

From the local checkout:

```powershell
npm install
node tests/contracts/remote-node-registry-provenance.test.js
node tests/contracts/shared-compute-fabric.test.js
```

If either test fails, stop and report the exact failing output.

## Phase 3: Start The Local Runtime

Preferred:

```powershell
npm run restart:main
```

Fallback:

```powershell
npm start
```

## Phase 4: Verify Local Runtime And MQTT State

From loopback:

```powershell
irm 'http://127.0.0.1:4781/api/health/fast'
irm 'http://127.0.0.1:4781/api/integrations/mqtt/status'
irm 'http://127.0.0.1:4781/api/shared-compute/status'
irm 'http://127.0.0.1:4781/api/shared-compute/workers'
```

Acceptance criteria:

- `/api/health/fast` returns `ok=true`
- `/api/integrations/mqtt/status` shows configured plus connected
- `/api/shared-compute/status` or `/api/shared-compute/workers` shows local worker with `nodeId=amy`
- `computeWorkerReady=true`
- the allowlisted executors are present

The current allowlist in sovereign code is:

- `node`
- `python`
- `python3`
- `npm`
- `npx`
- `pnpm`
- `pytest`
- `jest`
- `tsc`
- `rg`
- `git`

## Phase 5: Run One Bounded Local Self-Test Through MQTT Compute

Use the script `amy-node-selftest.ps1`.

It publishes a bounded self-addressed compute request on:

- `asolaria/nodes/amy/compute/request`

It then reads back:

- `/api/shared-compute/jobs`
- `/api/federation/nodes`

Acceptance criteria:

- the MQTT publish succeeds
- a shared-compute job appears
- the job completes
- stdout or stderr are captured
- the node is visible in federation with node id `amy`

## Phase 6: Return Packet For Gaia

Create one zip containing:

- one report with:
  - host scope
  - node id
  - timestamp
  - local checkout path
  - exact MQTT base topic
  - `/api/health/fast` result
  - `/api/integrations/mqtt/status` result
  - `/api/shared-compute/status` result
  - `/api/shared-compute/workers` result
  - self-test compute request payload
  - self-test compute result
- one short machine-readable summary file

Do not include:

- secrets
- full environment dumps
- broad architecture essays

## Exact Safe Language

Use this wording in the return:

- "Amy host is prepared as a bounded federated node under Jesse sovereign control."
- "This proves local node readiness and bounded compute execution."
- "This does not by itself prove merged RAM or full cross-host pooled compute."

## Important Constraints

- use an absolute `workingDirectory`
- do not use `node -e` or `python -c`; inline eval is blocked by guardrails
- do not claim success if MQTT is configured but not connected
- do not claim cross-host dispatch is live until Jesse sovereign runtime dispatches a real job to `amy`

## Stop Condition

If the machine becomes locally ready and produces the return zip, stop there and wait for sovereign-side dispatch.
