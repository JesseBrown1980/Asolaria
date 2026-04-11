const fs = require("fs");
const os = require("os");
const path = require("path");

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

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(modulePath);
}

async function run() {
  const tempRoot = path.join(os.tmpdir(), `asolaria-shared-compute-${Date.now()}`);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempRoot, { recursive: true });
  process.env.ASOLARIA_INSTANCE_ROOT = tempRoot;

  const modulesToReset = [
    "../../src/runtimePaths",
    "../../src/remoteNodeRegistry",
    "../../src/phoneConstructionBridge",
    "../../src/sharedComputeFabric"
  ];
  for (const modulePath of modulesToReset) {
    delete require.cache[require.resolve(modulePath)];
  }

  const remoteNodeRegistry = freshRequire("../../src/remoteNodeRegistry");
  const phoneBridge = freshRequire("../../src/phoneConstructionBridge");
  const fabric = freshRequire("../../src/sharedComputeFabric");

  remoteNodeRegistry.resetRegistry();
  phoneBridge.resetPhoneWorkers();

  const phoneJob = await fabric.dispatchSharedComputeJob({
    targetType: "phone",
    targetId: "phone:falcon",
    title: "Falcon python version",
    executor: "python",
    args: ["--version"]
  }, {
    phoneRunner: async (options = {}) => ({
      ok: true,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 11,
      deviceId: "R5CXA4MGQXV",
      exitCode: 0,
      commandPreview: String(options.command || "").slice(0, 280),
      stdout: "Python 3.12.1",
      stderr: ""
    })
  });

  assert(phoneJob.state === "completed", "phone job completes through Falcon");
  assert(phoneJob.result?.transport === "phone_termux", "phone job records phone_termux transport");
  assert(Boolean(fabric.getSharedComputeJob(phoneJob.id)), "phone job persisted to store");

  remoteNodeRegistry.updateNodeHealth("liris", { ok: true }, {
    observed_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    source_kind: "live_probe",
    source_topic: "asolaria/nodes/liris/runtime/health",
    verifier: "test"
  });

  fabric.recordFederatedComputeCapabilities("liris", {
    at: new Date().toISOString(),
    executors: ["pnpm", "python"],
    hostname: "rayssa-host",
    platform: "win32",
    computeWorkerReady: true
  }, {
    observed_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    source_kind: "live_probe",
    source_topic: "asolaria/nodes/liris/compute/capabilities",
    verifier: "test"
  });

  const published = [];
  const remoteJob = await fabric.dispatchSharedComputeJob({
    targetType: "node",
    targetId: "liris",
    title: "Remote pnpm version",
    executor: "pnpm",
    args: ["--version"],
    workingDirectory: tempRoot
  }, {
    publishMqttMessage: async (packet = {}) => {
      published.push(packet);
      return { ok: true, topic: packet.topic };
    }
  });

  assert(remoteJob.state === "dispatched", "remote node job enters dispatched state");
  assert(published.length === 1, "remote node job publishes one MQTT packet");
  assert(published[0]?.topic === "asolaria/nodes/liris/compute/request", "remote node job uses compute/request topic");

  fabric.recordFederatedComputeResult("liris", {
    jobId: remoteJob.id,
    ok: true,
    at: new Date().toISOString(),
    executor: "pnpm",
    args: ["--version"],
    finishedAt: new Date().toISOString(),
    exitCode: 0,
    stdout: "10.1.0",
    stderr: "",
    commandPreview: "pnpm --version",
    worker: {
      executors: ["pnpm", "python"],
      hostname: "rayssa-host",
      platform: "win32",
      computeWorkerReady: true
    }
  }, {
    observed_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    source_kind: "live_probe",
    source_topic: "asolaria/nodes/liris/compute/result",
    verifier: "test"
  });

  const completedRemoteJob = fabric.getSharedComputeJob(remoteJob.id);
  const remoteSummary = remoteNodeRegistry.getRemoteNodesSummary();
  const remoteNode = Array.isArray(remoteSummary.nodes)
    ? remoteSummary.nodes.find((row) => row.nodeId === "liris")
    : null;

  assert(completedRemoteJob?.state === "completed", "remote node result reconciles job to completed");
  assert(remoteNode?.hasCompute === true, "remote node summary exposes compute state");
  assert(remoteNode?.compute?.lastJobId === remoteJob.id, "remote node summary tracks last compute job id");

  const capabilityPacket = fabric.buildComputeCapabilitiesPacket("asolaria/nodes/liris");
  assert(capabilityPacket?.topic === "asolaria/nodes/liris/compute/capabilities", "capabilities packet uses node compute topic");

  const execution = await fabric.executeFederatedComputeRequest({
    jobId: "federated-exec-test",
    title: "Remote rg task",
    requestedBy: "sovereign",
    spec: {
      executor: "rg",
      args: ["pattern", "."],
      workingDirectory: tempRoot,
      timeoutMs: 120000,
      maxOutputChars: 8000
    }
  }, {
    baseTopic: "asolaria/nodes/liris",
    runLocalProcess: async (spec = {}) => ({
      ok: true,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 22,
      exitCode: 0,
      executor: spec.executor,
      args: spec.args,
      workingDirectory: spec.workingDirectory,
      commandPreview: "rg pattern .",
      stdout: "match",
      stderr: ""
    })
  });

  assert(execution.topic === "asolaria/nodes/liris/compute/result", "federated execution returns compute/result topic");
  assert(execution.payload?.ok === true, "federated execution payload reports success");

  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  failed += 1;
  console.error("FAIL  shared compute fabric test crashed");
  console.error(error && error.stack ? error.stack : error);
  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
  process.exit(1);
});
