# Liris Compute Readiness Report Template

Use this exact structure for the next narrow Rayssa-side return to Gaia.

Scope: Rayssa host only
Node identity: `liris`

## Identity

- Machine:
- Host scope:
- Node id:
- Branch:
- Commit:
- Git status:

## Shared-Compute Slice Presence

- `src/sharedComputeFabric.js`:
- `src/connectors/mqttConnector.js`:
- `src/remoteNodeRegistry.js`:
- `routes/sharedCompute.js`:
- `routes/federation.js`:
- `tests/contracts/shared-compute-fabric.test.js`:
- `tests/contracts/remote-node-registry-provenance.test.js`:

## Contract Tests

- `node tests/contracts/remote-node-registry-provenance.test.js`:
- `node tests/contracts/shared-compute-fabric.test.js`:

## MQTT Session Config

- `ASOLARIA_MQTT_ENABLED`:
- `ASOLARIA_MQTT_BASE_TOPIC`:
- `ASOLARIA_MQTT_CONTROL_ENABLED`:
- `ASOLARIA_MQTT_COMPUTE_WORKER_ENABLED`:
- Broker URL source:
- Do not include raw secrets.

## Runtime Health

- Startup command used:
- Did runtime stay running:
- `GET /api/health/fast`:

## MQTT Status JSON

```json
{}
```

## Shared Compute Status JSON

```json
{}
```

## Shared Compute Workers JSON

```json
{}
```

## Bounded Self-Test

- Executor used:
- Args:
- Absolute working directory:
- MQTT topic used:
- Expected node id:

### Request Payload

```json
{}
```

### Job Result

```json
{}
```

### Federation Nodes Snapshot

```json
{}
```

## Compat Launcher Rerun PID Hardening

- First launch result:
- Listening PID on `4781`:
- Second launch result:
- Duplicate listener created:
- `4781` health after rerun:
- `4791` health after rerun:

## Explicit Non-Claims

- Do not claim live cross-host dispatch unless Jesse sovereign actually dispatched a real job to `liris`.
- Do not claim Rayssa phone CPU/RAM sharing is live.
- Do not rename Rayssa phone-side identity to `falcon`.

## Return Rule

- Return this report plus raw artifacts in one small zip.
- No archaeology.
- No NotebookLM summary.
- No broad startup retelling.
