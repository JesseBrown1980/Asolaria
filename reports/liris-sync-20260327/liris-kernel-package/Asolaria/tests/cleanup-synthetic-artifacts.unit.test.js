const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

test("cleanup tool removes only dispatch-linked synthetic artifacts", () => {
  withFreshAsolaria("cleanup-synthetic", ({ instanceRoot, load }) => {
    const dataRoot = path.join(instanceRoot, "data");
    const dispatchRoot = path.join(dataRoot, "integrations", "worker-router", "dispatches");
    const syntheticDispatchDir = path.join(dispatchRoot, "20260325172928-failing-local-codex-dispatch");
    const legitDispatchDir = path.join(dispatchRoot, "20260325180000-real-dispatch");

    writeJson(path.join(dataRoot, "task-ledger.json"), {
      version: 1,
      createdAt: "2026-03-25T17:00:00.000Z",
      updatedAt: "2026-03-25T17:30:00.000Z",
      tasks: [
        {
          id: "task_syn",
          title: "Failing local codex dispatch",
          description: "Execute immediately and fail.",
          status: "blocked",
          createdAt: "2026-03-25T17:29:28.650Z",
          updatedAt: "2026-03-25T17:29:28.692Z"
        },
        {
          id: "task_legit",
          title: "Failing local codex dispatch",
          description: "A legitimate maintenance record.",
          status: "review",
          createdAt: "2026-03-25T18:00:00.000Z",
          updatedAt: "2026-03-25T18:01:00.000Z"
        }
      ],
      events: [
        { id: "evt_syn", taskId: "task_syn", at: "2026-03-25T17:29:28.680Z", detail: { leaseId: "lease_syn" } },
        { id: "evt_legit", taskId: "task_legit", at: "2026-03-25T18:01:00.000Z", note: "Synthetic Codex failure." }
      ]
    });

    writeJson(path.join(dataRoot, "task-lease-ledger.json"), {
      version: 1,
      createdAt: "2026-03-25T17:00:00.000Z",
      updatedAt: "2026-03-25T17:30:00.000Z",
      leases: [
        {
          leaseId: "lease_syn",
          taskId: "task_syn",
          status: "failed",
          acquiredAt: "2026-03-25T17:29:28.658Z",
          releasedAt: "2026-03-25T17:29:28.686Z",
          artifactRef: "integrations/worker-router/dispatches/20260325172928-failing-local-codex-dispatch/prompt.md"
        },
        {
          leaseId: "lease_legit",
          taskId: "task_legit",
          status: "failed",
          acquiredAt: "2026-03-25T18:00:00.000Z",
          releasedAt: "2026-03-25T18:01:00.000Z"
        }
      ],
      events: [
        { id: "levt_syn", leaseId: "lease_syn", taskId: "task_syn", at: "2026-03-25T17:29:28.686Z" },
        { id: "levt_legit", leaseId: "lease_legit", taskId: "task_legit", at: "2026-03-25T18:01:00.000Z", note: "Synthetic Codex failure." }
      ]
    });

    fs.mkdirSync(syntheticDispatchDir, { recursive: true });
    writeJson(path.join(syntheticDispatchDir, "dispatch.json"), {
      id: "20260325172928-failing-local-codex-dispatch",
      workerId: "local_codex",
      taskId: "task_syn",
      leaseId: "lease_syn",
      leaseStatus: "failed",
      title: "Failing local codex dispatch",
      error: "Synthetic Codex failure.",
      recommendation: {
        input: {
          title: "Failing local codex dispatch",
          objective: "Execute immediately and fail."
        }
      }
    });

    fs.mkdirSync(legitDispatchDir, { recursive: true });
    writeJson(path.join(legitDispatchDir, "dispatch.json"), {
      id: "20260325180000-real-dispatch",
      workerId: "local_codex",
      taskId: "task_legit",
      leaseId: "lease_legit",
      leaseStatus: "failed",
      title: "Failing local codex dispatch",
      error: "Synthetic Codex failure.",
      recommendation: {
        input: {
          title: "Failing local codex dispatch",
          objective: "This is real work."
        }
      }
    });

    fs.writeFileSync(path.join(dataRoot, "graph-runtime-events.ndjson"), [
      JSON.stringify({ id: "gevt_syn", context: { taskId: "task_syn", leaseId: "lease_syn", dispatchId: "20260325172928-failing-local-codex-dispatch" } }),
      JSON.stringify({ id: "gevt_legit", detail: { note: "Synthetic Codex failure." }, context: { taskId: "task_legit", leaseId: "lease_legit", dispatchId: "20260325180000-real-dispatch" } })
    ].join("\n") + "\n", "utf8");
    fs.writeFileSync(path.join(dataRoot, "graph-runtime-manifests.ndjson"), [
      JSON.stringify({ id: "gman_syn", context: { taskId: "task_syn", leaseId: "lease_syn", dispatchId: "20260325172928-failing-local-codex-dispatch" } }),
      JSON.stringify({ id: "gman_legit", reason: "Synthetic Codex failure.", context: { taskId: "task_legit", leaseId: "lease_legit", dispatchId: "20260325180000-real-dispatch" } })
    ].join("\n") + "\n", "utf8");

    const { cleanupSyntheticTestArtifacts } = load("tools/Cleanup-SyntheticTestArtifacts.js");
    const summary = cleanupSyntheticTestArtifacts();
    assert.equal(summary.removedTasks, 1);
    assert.deepEqual(summary.removedTaskIds, ["task_syn"]);
    assert.equal(summary.removedLeases, 1);
    assert.deepEqual(summary.removedLeaseIds, ["lease_syn"]);
    assert.deepEqual(summary.removedDispatchIds, ["20260325172928-failing-local-codex-dispatch"]);
    assert.equal(summary.removedDispatchDirs, 1);
    assert.equal(summary.removedEventLines, 1);
    assert.equal(summary.removedManifestLines, 1);

    const taskLedger = JSON.parse(fs.readFileSync(path.join(dataRoot, "task-ledger.json"), "utf8"));
    assert.equal(taskLedger.tasks.length, 1);
    assert.equal(taskLedger.tasks[0].id, "task_legit");
    assert.equal(taskLedger.events.length, 1);
    assert.equal(taskLedger.events[0].id, "evt_legit");
    assert.equal(taskLedger.updatedAt, "2026-03-25T18:01:00.000Z");

    const leaseLedger = JSON.parse(fs.readFileSync(path.join(dataRoot, "task-lease-ledger.json"), "utf8"));
    assert.equal(leaseLedger.leases.length, 1);
    assert.equal(leaseLedger.leases[0].leaseId, "lease_legit");
    assert.equal(leaseLedger.events.length, 1);
    assert.equal(leaseLedger.events[0].id, "levt_legit");
    assert.equal(leaseLedger.updatedAt, "2026-03-25T18:01:00.000Z");

    assert.equal(fs.existsSync(syntheticDispatchDir), false);
    assert.equal(fs.existsSync(legitDispatchDir), true);

    const eventLines = String(fs.readFileSync(path.join(dataRoot, "graph-runtime-events.ndjson"), "utf8")).trim().split(/\r?\n/g);
    const manifestLines = String(fs.readFileSync(path.join(dataRoot, "graph-runtime-manifests.ndjson"), "utf8")).trim().split(/\r?\n/g);
    assert.equal(eventLines.length, 1);
    assert.equal(manifestLines.length, 1);
    assert.ok(eventLines[0].includes("task_legit"));
    assert.ok(manifestLines[0].includes("task_legit"));
  });
});

test("cleanup tool can recover ledger cleanup after dispatch folders are already gone", () => {
  withFreshAsolaria("cleanup-synthetic-fallback", ({ instanceRoot, load }) => {
    const dataRoot = path.join(instanceRoot, "data");

    writeJson(path.join(dataRoot, "task-ledger.json"), {
      version: 1,
      createdAt: "2026-03-25T17:00:00.000Z",
      updatedAt: "2026-03-25T17:30:00.000Z",
      tasks: [
        {
          id: "task_syn_fallback",
          title: "Failing local codex dispatch",
          description: "Execute immediately and fail.",
          projectScope: "worker-router",
          status: "archived",
          createdAt: "2026-03-25T17:29:28.650Z",
          updatedAt: "2026-03-25T17:29:28.692Z"
        }
      ],
      events: [
        { id: "evt_syn_fallback", taskId: "task_syn_fallback", at: "2026-03-25T17:29:28.680Z", detail: { leaseId: "lease_syn_fallback" } }
      ]
    });

    writeJson(path.join(dataRoot, "task-lease-ledger.json"), {
      version: 1,
      createdAt: "2026-03-25T17:00:00.000Z",
      updatedAt: "2026-03-25T17:30:00.000Z",
      leases: [
        {
          leaseId: "lease_syn_fallback",
          taskId: "task_syn_fallback",
          status: "released",
          acquiredAt: "2026-03-25T17:29:28.658Z",
          releasedAt: "2026-03-25T17:29:28.686Z",
          artifactRef: "integrations/worker-router/dispatches/20260325172928-failing-local-codex-dispatch/prompt.md"
        }
      ],
      events: [
        { id: "levt_syn_fallback", leaseId: "lease_syn_fallback", taskId: "task_syn_fallback", at: "2026-03-25T17:29:28.686Z" }
      ]
    });

    fs.writeFileSync(path.join(dataRoot, "graph-runtime-events.ndjson"), [
      JSON.stringify({ id: "gevt_syn_fallback", context: { taskId: "task_syn_fallback", leaseId: "lease_syn_fallback", dispatchId: "20260325172928-failing-local-codex-dispatch" } })
    ].join("\n") + "\n", "utf8");
    fs.writeFileSync(path.join(dataRoot, "graph-runtime-manifests.ndjson"), [
      JSON.stringify({ id: "gman_syn_fallback", context: { taskId: "task_syn_fallback", leaseId: "lease_syn_fallback", dispatchId: "20260325172928-failing-local-codex-dispatch" } })
    ].join("\n") + "\n", "utf8");

    const { cleanupSyntheticTestArtifacts } = load("tools/Cleanup-SyntheticTestArtifacts.js");
    const summary = cleanupSyntheticTestArtifacts();
    assert.equal(summary.removedTasks, 1);
    assert.deepEqual(summary.removedTaskIds, ["task_syn_fallback"]);
    assert.equal(summary.removedLeases, 1);
    assert.deepEqual(summary.removedLeaseIds, ["lease_syn_fallback"]);
    assert.deepEqual(summary.removedDispatchIds, []);
    assert.equal(summary.removedDispatchDirs, 0);
    assert.equal(summary.removedEventLines, 1);
    assert.equal(summary.removedManifestLines, 1);

    const taskLedger = JSON.parse(fs.readFileSync(path.join(dataRoot, "task-ledger.json"), "utf8"));
    const leaseLedger = JSON.parse(fs.readFileSync(path.join(dataRoot, "task-lease-ledger.json"), "utf8"));
    assert.ok(taskLedger.updatedAt);
    assert.ok(leaseLedger.updatedAt);
  });
});

test("cleanup tool ignores heuristic-only matches without exact synthetic refs", () => {
  withFreshAsolaria("cleanup-synthetic-no-heuristics", ({ instanceRoot, load }) => {
    const dataRoot = path.join(instanceRoot, "data");

    writeJson(path.join(dataRoot, "task-ledger.json"), {
      version: 1,
      createdAt: "2026-03-25T17:00:00.000Z",
      updatedAt: "2026-03-25T17:30:00.000Z",
      tasks: [
        {
          id: "task_similar",
          title: "Failing local codex dispatch",
          description: "Execute immediately and fail.",
          projectScope: "worker-router",
          status: "archived",
          createdAt: "2026-03-25T17:29:28.650Z",
          updatedAt: "2026-03-25T17:29:28.692Z"
        }
      ],
      events: []
    });

    writeJson(path.join(dataRoot, "task-lease-ledger.json"), {
      version: 1,
      createdAt: "2026-03-25T17:00:00.000Z",
      updatedAt: "2026-03-25T17:30:00.000Z",
      leases: [
        {
          leaseId: "lease_similar",
          taskId: "task_similar",
          status: "released",
          acquiredAt: "2026-03-25T17:29:28.658Z",
          releasedAt: "2026-03-25T17:29:28.686Z",
          artifactRef: "integrations/worker-router/dispatches/20260325172928-failing-local-codex-dispatch/prompt.md"
        }
      ],
      events: []
    });

    fs.writeFileSync(path.join(dataRoot, "graph-runtime-events.ndjson"), "", "utf8");
    fs.writeFileSync(path.join(dataRoot, "graph-runtime-manifests.ndjson"), "", "utf8");

    const { cleanupSyntheticTestArtifacts } = load("tools/Cleanup-SyntheticTestArtifacts.js");
    const summary = cleanupSyntheticTestArtifacts();

    assert.equal(summary.ok, true);
    assert.equal(summary.removed, 0);
    assert.equal(summary.reason, "no_synthetic_refs_found");

    const taskLedger = JSON.parse(fs.readFileSync(path.join(dataRoot, "task-ledger.json"), "utf8"));
    const leaseLedger = JSON.parse(fs.readFileSync(path.join(dataRoot, "task-lease-ledger.json"), "utf8"));
    assert.equal(taskLedger.tasks.length, 1);
    assert.equal(leaseLedger.leases.length, 1);
  });
});
