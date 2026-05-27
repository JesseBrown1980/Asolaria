const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria, repoRoot } = require("./_unitHarness");

function installStub(relativePath, exportsValue) {
  const absolutePath = path.join(repoRoot, relativePath);
  delete require.cache[require.resolve(absolutePath)];
  require.cache[require.resolve(absolutePath)] = {
    id: require.resolve(absolutePath),
    filename: require.resolve(absolutePath),
    loaded: true,
    exports: exportsValue
  };
}

function loadWorkerRouter(load, options = {}) {
  const workerRouterPath = path.join(repoRoot, "src", "connectors", "workerRouter.js");
  delete require.cache[require.resolve(workerRouterPath)];
  installStub("src/connectors/systemPaths.js", {
    resolveToolPaths() {
      return {
        codexPath: "codex",
        claudePath: "claude"
      };
    }
  });
  installStub("src/connectors/codexConnector.js", {
    runCodex: options.runCodex || (async () => ({
      provider: "codex",
      reply: "Synthetic Codex reply."
    }))
  });
  installStub("src/connectors/anthropicCliConnector.js", {
    runAnthropicCli: async () => ({ reply: "Synthetic Claude reply." })
  });
  installStub("src/connectors/abacusConnector.js", {
    getAbacusIntegrationStatus: () => ({ capabilities: { browser: { ready: false } }, surfaces: { desktop: { installed: false } } }),
    getAbacusOperatingStrategy: () => ({ knownIssues: [] }),
    createAbacusWorkPacket: () => ({ packet: { id: "pkt_001", presetId: "chat_quick_chore" } })
  });
  installStub("src/connectors/symphonyConnector.js", {
    getSymphonyIntegrationStatus: () => ({ configured: false, process: { running: false } }),
    submitSymphonyWorkItem: async () => ({ issue: { id: "ISS-1", identifier: "ISS-1" } })
  });
  installStub("src/connectors/augmentContextConnector.js", {
    getAugmentContextStatus: () => ({ configured: false, mode: "" })
  });
  installStub("src/connectors/geminiApiConnector.js", {
    getGeminiApiConfigSummary: () => ({ configured: false })
  });
  installStub("src/projectStore.js", {
    getProjectById: () => null
  });
  installStub("src/remoteNodeRegistry.js", options.remoteNodeRegistry || {
    getRemoteNodesSummary: () => ({ total: 0, online: 0, offline: 0, nodes: [] })
  });
  return load("src/connectors/workerRouter.js");
}

test("workerRouter recommendation surfaces federation-ready candidates for explicit lanes", async () => {
  await withFreshAsolaria("worker-router-federation-recommend", async ({ load }) => {
    const workerRouter = loadWorkerRouter(load, {
      remoteNodeRegistry: {
        getRemoteNodesSummary: () => ({
          total: 1,
          online: 1,
          offline: 0,
          nodes: [
            {
              nodeId: "amy-sub-01",
              status: "online",
              capabilities: {
                declared: true,
                phoneMode: "phone_only",
                subColonyClass: "phone_only_sub"
              },
              routing: {
                dispatchReady: true,
                readyLaneIds: ["ph-action", "ph-capture", "ph-comms"],
                declaredLaneIds: ["ph-action", "ph-capture", "ph-comms"]
              }
            }
          ]
        })
      }
    });

    const recommendation = workerRouter.recommendWorker({
      title: "Phone action task",
      objective: "Use a phone-side lane.",
      laneId: "ph-action",
      taskType: "quick_chore",
      sensitivity: "sanitized"
    });

    assert.equal(recommendation.federation.laneId, "ph-action");
    assert.equal(recommendation.federation.selectedNodeId, "amy-sub-01");
    assert.equal(recommendation.federation.candidateCount, 1);
    assert.ok(recommendation.warnings.some((item) => String(item).includes("Federation routing is advisory")));
  });
});

test("workerRouter queues local_codex tasks without executing and persists queued lease state", async () => {
  await withFreshAsolaria("worker-router-queued", async ({ load }) => {
    const workerRouter = loadWorkerRouter(load);
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");

    const dispatch = await workerRouter.dispatchWorkerTask({
      title: "Queued local codex dispatch",
      objective: "Prepare a local codex task without executing it.",
      workerId: "local_codex",
      taskType: "patch",
      sensitivity: "internal",
      executeNow: false
    });

    assert.equal(dispatch.workerId, "local_codex");
    assert.equal(dispatch.leaseStatus, "queued");
    assert.equal(dispatch.result.dispatchMode, "queued_local");

    const task = taskStore.getTaskLedgerTask(dispatch.taskId);
    const lease = leaseStore.getTaskLease(dispatch.leaseId);
    assert.equal(task.status, "ready");
    assert.equal(task.assigneeId, "local_codex");
    assert.equal(lease.status, "queued");

    const hydrated = workerRouter.listWorkerDispatches(5).find((entry) => entry.id === dispatch.id);
    assert.ok(hydrated);
    assert.equal(hydrated.leaseStatus, "queued");
    assert.equal(hydrated.taskType, "patch");
  });
});

test("workerRouter executes and fails local_codex tasks with lease/task state staying in sync", async () => {
  await withFreshAsolaria("worker-router-direct", async ({ load }) => {
    const workerRouter = loadWorkerRouter(load, {
      runCodex: async ({ prompt }) => ({
        provider: "codex",
        reply: `Completed: ${String(prompt).slice(0, 24)}`
      })
    });
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");

    const completed = await workerRouter.dispatchWorkerTask({
      title: "Direct local codex dispatch",
      objective: "Execute immediately and complete.",
      workerId: "local_codex",
      taskType: "patch",
      sensitivity: "internal",
      executeNow: true
    });

    assert.equal(completed.leaseStatus, "completed");
    assert.equal(completed.result.dispatchMode, "direct_run");
    assert.equal(taskStore.getTaskLedgerTask(completed.taskId).status, "review");
    assert.equal(leaseStore.getTaskLease(completed.leaseId).status, "completed");

    const failingWorkerRouter = loadWorkerRouter(load, {
      runCodex: async () => {
        throw new Error("Synthetic Codex failure.");
      }
    });

    await assert.rejects(() => failingWorkerRouter.dispatchWorkerTask({
      title: "Failing local codex dispatch",
      objective: "Execute immediately and fail.",
      workerId: "local_codex",
      taskType: "patch",
      sensitivity: "internal",
      executeNow: true
    }), /Synthetic Codex failure/);

    const failedDispatch = failingWorkerRouter.listWorkerDispatches(10)
      .find((entry) => String(entry.title || "").includes("Failing local codex dispatch"));
    assert.ok(failedDispatch);
    assert.equal(failedDispatch.leaseStatus, "failed");
    assert.equal(taskStore.getTaskLedgerTask(failedDispatch.taskId).status, "blocked");
    assert.equal(leaseStore.getTaskLease(failedDispatch.leaseId).status, "failed");
  });
});
