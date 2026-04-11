const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("public worker-router read sanitizer keeps dispatches bounded and removes private fields", async () => {
  await withFreshAsolaria("worker-router-public-read-input", async ({ load }) => {
    const {
      buildWorkerRouterPublicReadSource,
      readPublicWorkerRouterDispatches
    } = load("src/connectors/workerRouterPublicRead.js");
    const input = {
      status: {
        generatedAt: "2026-03-25T19:20:00.000Z",
        defaultWorker: "local_codex",
        workers: [
          {
            id: "local_codex",
            title: "Local Codex",
            available: true,
            dispatchable: true,
            strengths: ["local edits", "fast review"],
            secretToken: "should-not-survive"
          }
        ],
        leaseLedger: {
          summary: {
            totalLeases: 3,
            activeLeases: 1,
            queuedLeases: 1,
            eventsCount: 7,
            hidden: 99
          }
        },
        coordinationSurfaces: [{ id: "worker-router", privateNote: "hidden" }],
        knownIssues: ["  direct writes disabled  ", ""],
        dispatches: [
          {
            id: "dispatch_001",
            title: "  Compat-safe dispatch  ",
            workerId: "claude_max",
            taskType: "review",
            resultSummary: "  Review completed.  ",
            leaseId: "lease_001",
            leaseStatus: "completed",
            completedAt: "2026-03-25T19:21:00.000Z",
            error: "",
            internalOnly: true
          }
        ],
        privateField: "should-not-survive"
      }
    };

    const result = buildWorkerRouterPublicReadSource(input, { dispatchLimit: 1 });

    assert.equal(result.ok, true);
    assert.equal(result.sourceContract, "public-worker-router-read");
    assert.equal(result.generatedAt, "2026-03-25T19:20:00.000Z");
    assert.equal(result.workerRouter.defaultWorker, "local_codex");
    assert.equal(result.workerRouter.knownIssues[0], "direct writes disabled");
    assert.equal(result.workerRouter.leaseLedger.summary.totalLeases, 3);
    assert.equal(result.workerRouter.leaseLedger.summary.activeLeases, 1);
    assert.equal(result.workerRouter.privateField, undefined);
    assert.equal(result.workerRouter.workers[0].secretToken, undefined);
    assert.deepEqual(result.dispatches, [
      {
        id: "dispatch_001",
        title: "Compat-safe dispatch",
        workerId: "claude_max",
        taskId: "",
        leaseId: "lease_001",
        leaseStatus: "completed",
        createdAt: "",
        completedAt: "2026-03-25T19:21:00.000Z",
        failedAt: "",
        taskType: "review",
        resultSummary: "Review completed.",
        error: ""
      }
    ]);
    assert.deepEqual(readPublicWorkerRouterDispatches(input, { dispatchLimit: 1 }), result.dispatches);
  });
});

test("public worker-router read uses file-backed snapshots without bootstrapping missing ledgers", async () => {
  await withFreshAsolaria("worker-router-public-read-disk", async ({ instanceRoot, load }) => {
    const dispatchRoot = path.join(instanceRoot, "data", "integrations", "worker-router", "dispatches", "dispatch_001");
    fs.mkdirSync(dispatchRoot, { recursive: true });
    fs.writeFileSync(path.join(dispatchRoot, "dispatch.json"), JSON.stringify({
      id: "dispatch_001",
      title: "Disk-backed dispatch",
      workerId: "claude_max",
      taskId: "task_001",
      leaseId: "lease_001",
      leaseStatus: "completed",
      createdAt: "2026-03-25T19:10:00.000Z",
      completedAt: "2026-03-25T19:11:00.000Z",
      taskType: "review",
      result: {
        resultSummary: "Recorded from disk."
      },
      recommendation: {
        input: {
          taskType: "review"
        }
      }
    }, null, 2), "utf8");
    const beforeDataEntries = fs.readdirSync(path.join(instanceRoot, "data"), { withFileTypes: true }).map((entry) => entry.name).sort();

    const {
      readPublicWorkerRouterStatus,
      listPublicWorkerRouterDispatches,
      getPublicWorkerRouterDispatch
    } = load("src/connectors/workerRouterPublicRead.js");

    const status = readPublicWorkerRouterStatus();
    const dispatches = listPublicWorkerRouterDispatches(12);
    const dispatch = getPublicWorkerRouterDispatch("dispatch_001");
    const afterDataEntries = fs.readdirSync(path.join(instanceRoot, "data"), { withFileTypes: true }).map((entry) => entry.name).sort();

    assert.equal(status.defaultWorker, "local_codex");
    assert.equal(status.leaseLedger.summary.totalLeases, 0);
    assert.equal(status.leaseLedger.summary.activeLeases, 0);
    assert.match(status.knownIssues.join(" "), /read-only/i);
    assert.equal(dispatches.length, 1);
    assert.equal(dispatches[0].resultSummary, "Recorded from disk.");
    assert.equal(dispatches[0].recommendation, undefined);
    assert.equal(dispatches[0].result, undefined);
    assert.equal(dispatch.id, "dispatch_001");
    assert.equal(dispatch.completedAt, "2026-03-25T19:11:00.000Z");
    assert.deepEqual(afterDataEntries, beforeDataEntries);
    assert.equal(fs.existsSync(path.join(instanceRoot, "data", "task-lease-ledger.json")), false);
  });
});
