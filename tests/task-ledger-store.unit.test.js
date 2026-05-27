const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("TaskLedger v2 preserves additive fields and normalizes lifecycle transitions", () => {
  withFreshAsolaria("task-ledger", ({ load }) => {
    const taskStore = load("src/taskLedgerStore.js");

    const created = taskStore.createTaskLedgerTask({
      title: "Lane regression audit",
      description: "Verify the new task fields survive the store round-trip.",
      status: "planned",
      priority: "high",
      assigneeId: "lane-review-01",
      originKind: "worker_router",
      originId: "dispatch-100",
      lastLeaseId: "lease_seed",
      progress: 100,
      actor: "unit-test",
      source: "unit-test"
    });

    assert.equal(created.task.assigneeId, "lane-review-01");
    assert.equal(created.task.originKind, "worker_router");
    assert.equal(created.task.originId, "dispatch-100");
    assert.equal(created.task.lastLeaseId, "lease_seed");
    assert.equal(created.task.progress, 99);

    const inProgress = taskStore.updateTaskLedgerTask(
      created.task.id,
      { status: "in_progress" },
      { actor: "unit-test", source: "unit-test" }
    );
    assert.equal(inProgress.task.status, "in_progress");
    assert.ok(inProgress.task.startedAt);

    const completed = taskStore.updateTaskLedgerTask(
      created.task.id,
      { status: "done", progress: 20 },
      { actor: "unit-test", source: "unit-test" }
    );
    assert.equal(completed.task.status, "done");
    assert.equal(completed.task.progress, 100);
    assert.ok(completed.task.completedAt);

    const reopened = taskStore.updateTaskLedgerTask(
      created.task.id,
      { status: "review" },
      { actor: "unit-test", source: "unit-test" }
    );
    assert.equal(reopened.task.status, "review");
    assert.equal(reopened.task.progress, 99);
    assert.equal(reopened.task.completedAt, "");

    const archived = taskStore.updateTaskLedgerTask(
      created.task.id,
      { archived: true },
      { actor: "unit-test", source: "unit-test" }
    );
    assert.equal(archived.task.status, "archived");
    assert.equal(archived.task.archived, true);
    assert.ok(archived.task.archivedAt);

    const restored = taskStore.updateTaskLedgerTask(
      created.task.id,
      { archived: false },
      { actor: "unit-test", source: "unit-test" }
    );
    assert.equal(restored.task.archived, false);
    assert.equal(restored.task.status, "planned");

    const fetched = taskStore.getTaskLedgerTask(created.task.id, { includeEvents: true });
    assert.equal(fetched.assigneeId, "lane-review-01");
    assert.equal(fetched.originKind, "worker_router");
    assert.equal(fetched.originId, "dispatch-100");
    assert.ok(Array.isArray(fetched.events));

    const listed = taskStore.listTaskLedgerTasks({
      includeArchived: true,
      query: "dispatch-100"
    });
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, created.task.id);
    assert.equal(listed[0].lastLeaseId, "lease_seed");
  });
});
