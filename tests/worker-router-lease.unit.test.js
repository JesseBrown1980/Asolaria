const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("workerRouterLease creates, updates, and hydrates dispatch lease records", () => {
  withFreshAsolaria("worker-router-lease", ({ instanceRoot, load }) => {
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");
    const workerRouterLease = load("src/connectors/workerRouterLease.js");

    const task = taskStore.createTaskLedgerTask({
      title: "Worker router lease contract",
      actor: "unit-test",
      source: "unit-test"
    }).task;

    const dispatchFolder = path.join(instanceRoot, "data", "worker-router", "dispatch-001");
    fs.mkdirSync(dispatchFolder, { recursive: true });

    const context = workerRouterLease.createDispatchContext({
      createdAt: "2026-03-25T00:00:00.000Z",
      dispatchId: "dispatch-001",
      dispatchFolder,
      task,
      workerId: "local_codex",
      initialLeaseStatus: "queued"
    });

    const createdLease = leaseStore.getTaskLease(context.leaseId);
    assert.equal(context.leaseStatus, "queued");
    assert.equal(createdLease.dispatchId, "dispatch-001");
    assert.equal(createdLease.artifactRef, "worker-router/dispatch-001/dispatch.json");

    const updated = workerRouterLease.updateDispatchLease(context, {
      status: "completed",
      runId: "run-001",
      artifactPath: path.join(dispatchFolder, "result.json")
    }, {
      note: "Dispatch finished cleanly.",
      type: "lease_completed"
    });

    assert.equal(updated.lease.status, "completed");
    assert.equal(updated.lease.runId, "run-001");
    assert.equal(updated.lease.artifactRef, "worker-router/dispatch-001/result.json");
    assert.equal(context.leaseStatus, "completed");
    assert.equal(context.leaseTerminal, true);

    const hydrated = workerRouterLease.hydrateDispatchRecord({
      id: "dispatch-001",
      leaseStatus: "queued",
      recommendation: { input: { taskType: "repair" } },
      result: {
        leaseId: context.leaseId,
        leaseStatus: "queued",
        dispatchMode: "local",
        resultSummary: "Repaired",
        issue: { identifier: "ISS-101" }
      }
    });

    assert.equal(hydrated.leaseId, context.leaseId);
    assert.equal(hydrated.leaseStatus, "completed");
    assert.equal(hydrated.dispatchMode, "local");
    assert.equal(hydrated.resultSummary, "Repaired");
    assert.equal(hydrated.taskType, "repair");
    assert.equal(hydrated.issueIdentifier, "ISS-101");
    assert.equal(hydrated.lease.artifactRef, "worker-router/dispatch-001/result.json");
  });
});
