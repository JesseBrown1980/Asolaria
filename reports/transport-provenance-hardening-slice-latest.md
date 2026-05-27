# Transport Provenance Hardening Slice

- Generated: `2026-03-22 23:57 -03:00`
- Scope: implement Liris-guided provenance capture on MQTT ingress and remote-node registry writes

## What Was Implemented

Added provenance-aware transport writes in:

- `src/remoteNodeRegistry.js`
- `src/connectors/mqttConnector.js`
- `tests/contracts/remote-node-registry-provenance.test.js`

## Write-Path Changes

`src/remoteNodeRegistry.js` now:

- stores per-channel provenance envelopes for `health`, `presence`, `colony`, and `world`
- keeps `transportEpochs` history per node
- returns cloned node snapshots instead of live mutable references
- exposes last-source metadata in federation summaries

`src/connectors/mqttConnector.js` now:

- derives ingress metadata from MQTT topic, payload timestamps, and payload hash
- stamps each inbound federation write with a provenance envelope
- preserves the following fields on future node updates:
  - `source_kind`
  - `source_topic`
  - `host_scope`
  - `observed_at`
  - `received_at`
  - `verifier`
  - `transport_epoch`
  - `status`
  - `evidence_ref`
  - `payload_hash`

## Verification

Syntax:

- `node --check src/remoteNodeRegistry.js`
- `node --check src/connectors/mqttConnector.js`
- `node --check tests/contracts/remote-node-registry-provenance.test.js`

Behavior:

- `node tests/contracts/remote-node-registry-provenance.test.js` -> `9` passed, `0` failed
- `node tests/contracts/colony-memory-store.test.js` -> `9` passed, `0` failed
- `node tests/contracts/colony-memory-contract.test.js` -> `27` passed, `0` failed

## Boundary

This hardening slice is implemented in code, but it is not yet live on the protected primary runtime listener.

The protected `4781` process still needs an owner-controlled restart before this provenance envelope appears in live `/api/federation/nodes` responses.

No bridge policy, no sender-token state, and no `4799` path were changed in this slice.

Historical remote-node records were not backfilled; the new provenance fields apply to future inbound MQTT telemetry after restart.

## Next Move

1. restart the protected main runtime listener
2. observe fresh federation telemetry on the live runtime
3. verify that `/api/federation/nodes` exposes the new last-source and transport-epoch fields
