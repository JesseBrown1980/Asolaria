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

function loadWorkBundle(load, options = {}) {
  installStub("src/connectors/workerRouter.js", {
    getWorkerRouterStatus: () => options.status || {
      generatedAt: "2026-03-25T10:11:12.000Z",
      defaultWorker: "claude_max",
      workers: [{ id: "local_codex", ready: true }],
      leaseLedger: {
        summary: { activeLeases: 1, queuedLeases: 1, totalLeases: 2 },
        activeLeases: [{ leaseId: "lease_active_1", status: "active" }],
        queuedLeases: [{ leaseId: "lease_queue_1", status: "queued" }]
      },
      integrationSummary: {
        localCodexAvailable: true,
        claudeMaxReady: true
      },
      coordinationSurfaces: [],
      knownIssues: []
    },
    listWorkerDispatches: () => options.dispatches || [
      {
        id: "dispatch_001",
        title: "Synthetic dispatch",
        workerId: "local_codex",
        leaseStatus: "active",
        resultSummary: "Synthetic result"
      }
    ]
  });

  return load("src/workerRuntimeWorkBundle.js");
}

test("workerRuntimeWorkBundle composes router status, dispatches, lease summary, and open task projection", async () => {
  await withFreshAsolaria("worker-runtime-work-bundle", async ({ load }) => {
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");

    const openTask = taskStore.createTaskLedgerTask({
      title: "Open task with lease",
      description: "This task should appear in the work bundle.",
      status: "planned",
      priority: "normal",
      source: "unit-test",
      assigneeId: "local_codex"
    }).task;
    const lease = leaseStore.createTaskLease({
      taskId: openTask.id,
      holderId: "local_codex",
      holderType: "worker",
      status: "active",
      actor: "unit-test",
      source: "unit-test"
    }).lease;

    taskStore.createTaskLedgerTask({
      title: "Closed task",
      description: "This task should be filtered out.",
      status: "done",
      priority: "normal",
      source: "unit-test"
    });
    const archivedTask = taskStore.createTaskLedgerTask({
      title: "Archived task",
      description: "This task should also be filtered out.",
      status: "planned",
      priority: "normal",
      source: "unit-test"
    }).task;
    taskStore.deleteTaskLedgerTask(archivedTask.id, { source: "unit-test" });

    const bundleModule = loadWorkBundle(load);
    const bundle = bundleModule.buildWorkerRuntimeWorkBundle({ dispatchLimit: 5, taskLimit: 10 });

    assert.equal(bundle.ok, true);
    assert.equal(bundle.generatedAt, "2026-03-25T10:11:12.000Z");
    assert.equal(bundle.workerRouter.defaultWorker, "claude_max");
    assert.deepStrictEqual(bundle.workerRouter.dispatches, [
      {
        id: "dispatch_001",
        title: "Synthetic dispatch",
        workerId: "local_codex",
        leaseStatus: "active",
        resultSummary: "Synthetic result"
      }
    ]);
    assert.equal(bundle.workerRouter.leaseLedger.summary.activeLeases, 1);
    assert.equal(bundle.workerRouter.leaseLedger.summary.totalLeases, 2);

    assert.equal(bundle.taskLedger.summary.totalTasks, 3);
    assert.equal(bundle.taskLedger.summary.openTasks, 1);
    assert.equal(bundle.taskLedger.openTasks.length, 1);
    assert.equal(bundle.taskLedger.openTasks[0].id, openTask.id);
    assert.equal(bundle.taskLedger.openTasks[0].leaseContext.leaseId, lease.leaseId);
    assert.equal(bundle.taskLedger.openTasks[0].leaseContext.status, "active");
    assert.equal(bundle.taskLedger.openTasks[0].assigneeId, "local_codex");
  });
});

test("buildOpenTaskProjection keeps only open tasks and stays lease-aware", async () => {
  await withFreshAsolaria("worker-runtime-work-bundle-projection", async ({ load }) => {
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");

    const openTask = taskStore.createTaskLedgerTask({
      title: "Projected open task",
      description: "Should be retained.",
      status: "in_progress",
      priority: "high",
      source: "unit-test"
    }).task;
    leaseStore.createTaskLease({
      taskId: openTask.id,
      holderId: "claude_max",
      holderType: "worker",
      status: "queued",
      actor: "unit-test",
      source: "unit-test"
    });
    const closedTask = taskStore.createTaskLedgerTask({
      title: "Projected closed task",
      description: "Should be removed.",
      status: "planned",
      priority: "normal",
      source: "unit-test"
    }).task;
    taskStore.updateTaskLedgerTask(closedTask.id, { status: "canceled" }, { source: "unit-test" });

    const bundleModule = loadWorkBundle(load, { dispatches: [], status: { generatedAt: "2026-03-25T00:00:00.000Z", leaseLedger: { summary: {}, activeLeases: [], queuedLeases: [] }, workers: [], integrationSummary: {}, coordinationSurfaces: [], knownIssues: [] } });
    const projection = bundleModule.buildOpenTaskProjection({ taskLimit: 10 });

    assert.equal(projection.length, 1);
    assert.equal(projection[0].id, openTask.id);
    assert.equal(projection[0].leaseContext.holderId, "claude_max");
    assert.equal(projection[0].status, "in_progress");
    assert.ok(!projection.some((task) => task.id === closedTask.id));
    assert.equal(bundleModule.isOpenTask({ status: "done" }), false);
    assert.equal(bundleModule.isOpenTask({ status: "planned" }), true);
  });
});
