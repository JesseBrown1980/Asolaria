const remoteNodeRegistry = require("../../src/remoteNodeRegistry");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${label}`);
  }
}

function run() {
  const nodeId = `provenance-node-${Date.now()}`;
  const metadata = {
    source_kind: "live_probe",
    source_topic: `asolaria/nodes/${nodeId}/runtime/health`,
    host_scope: `remote_node:${nodeId}`,
    observed_at: "2026-03-22T23:30:00.000Z",
    received_at: "2026-03-22T23:30:01.000Z",
    verifier: "sovereign.mqtt_ingress",
    transport_epoch: "mqtt_federation_current",
    status: "live",
    evidence_ref: `mqtt:asolaria/nodes/${nodeId}/runtime/health#abc123`,
    payload_hash: "abc123"
  };

  remoteNodeRegistry.resetRegistry();
  remoteNodeRegistry.updateNodeHealth(nodeId, { ok: true, at: "2026-03-22T23:30:00.000Z" }, metadata);
  remoteNodeRegistry.updateNodePresence(nodeId, "online", {
    ...metadata,
    source_topic: `asolaria/nodes/${nodeId}/runtime/presence`,
    evidence_ref: `mqtt:asolaria/nodes/${nodeId}/runtime/presence#abc123`
  });

  const node = remoteNodeRegistry.getRemoteNode(nodeId);
  const summary = remoteNodeRegistry.getRemoteNodesSummary();
  const row = Array.isArray(summary.nodes) ? summary.nodes.find((item) => item.nodeId === nodeId) : null;

  assert(Boolean(node), "node created");
  assert(node?.provenance?.health?.source_kind === "live_probe", "health provenance keeps source kind");
  assert(node?.provenance?.health?.source_topic === metadata.source_topic, "health provenance keeps source topic");
  assert(node?.provenance?.health?.transport_epoch === "mqtt_federation_current", "health provenance keeps transport epoch");
  assert(node?.provenance?.health?.payload_hash === "abc123", "health provenance keeps payload hash");
  assert(node?.provenance?.presence?.status === "live", "presence provenance keeps live status");
  assert(Array.isArray(node?.transportEpochs) && node.transportEpochs.includes("mqtt_federation_current"), "node tracks transport epoch history");
  assert(row?.lastTransportEpoch === "mqtt_federation_current", "summary exposes last transport epoch");
  assert(row?.lastSourceTopic === `asolaria/nodes/${nodeId}/runtime/presence`, "summary exposes latest source topic");

  remoteNodeRegistry.removeNode(nodeId);

  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
