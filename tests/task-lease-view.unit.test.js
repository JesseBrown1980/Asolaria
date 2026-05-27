const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("Task lease view returns a missing sentinel and does not mutate the original task", () => {
  withFreshAsolaria("task-lease-view-missing", ({ load }) => {
    const leaseView = load("src/taskLeaseView.js");

    const originalTask = { id: "task_missing", lastLeaseId: "lease_missing", owner: "stale-owner" };
    const decorated = leaseView.decorateTaskLeaseContext(originalTask);

    assert.equal(decorated.leaseContext.status, "missing");
    assert.equal(decorated.leaseContext.leaseId, "lease_missing");
    assert.equal(originalTask.leaseContext, undefined);
  });
});

test("Task lease view and mobile inbox prefer live lease metadata over stale task ownership", () => {
  withFreshAsolaria("task-lease-view-live", ({ load }) => {
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");
    const leaseView = load("src/taskLeaseView.js");
    const { buildMobileInboxState } = load("src/mobileInbox.js");

    const phoneTask = taskStore.createTaskLedgerTask({
      title: "Phone lane blocker",
      source: "phone-takeover",
      projectScope: "phone-live",
      status: "blocked",
      priority: "high",
      actor: "unit-test",
      source: "phone-takeover"
    }).task;

    const leasedTask = taskStore.createTaskLedgerTask({
      title: "Deploy sync packet",
      projectScope: "lab-fast",
      status: "review",
      owner: "stale-owner",
      actor: "unit-test",
      source: "chat-auto"
    }).task;

    taskStore.createTaskLedgerTask({
      title: "General inbox noise",
      projectScope: "lab-fast",
      status: "planned",
      owner: "background-owner",
      actor: "unit-test",
      source: "chat-auto"
    });

    const lease = leaseStore.createTaskLease({
      taskId: leasedTask.id,
      holderId: "lease-owner",
      holderType: "manager",
      status: "queued",
      actor: "unit-test",
      source: "unit-test"
    });

    const decorated = leaseView.decorateTaskLeaseContext(taskStore.getTaskLedgerTask(leasedTask.id));
    assert.equal(decorated.leaseContext.holderId, "lease-owner");
    assert.equal(decorated.leaseContext.status, "queued");

    const inbox = buildMobileInboxState({ taskLimit: 10 });
    assert.equal(inbox.summary.activeTasks, 3);
    assert.equal(inbox.tasks[0].id, phoneTask.id);

    const leasedRow = inbox.tasks.find((row) => row.id === leasedTask.id);
    assert.ok(leasedRow);
    assert.equal(leasedRow.assigneeId, "lease-owner");
    assert.equal(leasedRow.leaseStatus, "queued");
    assert.equal(leasedRow.leaseId, lease.lease.leaseId);
  });
});
