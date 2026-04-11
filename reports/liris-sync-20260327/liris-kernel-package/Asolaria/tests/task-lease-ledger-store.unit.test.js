const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("TaskLeaseLedger links tasks, blocks duplicate active leases, and tracks lease lifecycle", () => {
  withFreshAsolaria("task-lease-ledger", ({ load }) => {
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");

    const task = taskStore.createTaskLedgerTask({
      title: "Dispatch handoff verification",
      actor: "unit-test",
      source: "unit-test"
    }).task;

    const created = leaseStore.createTaskLease({
      taskId: task.id,
      holderId: "manager-alpha",
      holderType: "manager",
      status: "queued",
      actor: "unit-test",
      source: "unit-test"
    });

    const linkedTask = taskStore.getTaskLedgerTask(task.id);
    assert.equal(linkedTask.lastLeaseId, created.lease.leaseId);
    assert.equal(created.lease.status, "queued");

    assert.throws(() => leaseStore.createTaskLease({
      taskId: task.id,
      holderId: "manager-beta",
      holderType: "manager",
      status: "active",
      actor: "unit-test",
      source: "unit-test"
    }), /active lease/i);

    const heartbeat = leaseStore.heartbeatTaskLease(created.lease.leaseId, {
      actor: "unit-test",
      source: "unit-test",
      ttlSeconds: 321
    });
    assert.equal(heartbeat.lease.status, "active");
    assert.equal(heartbeat.lease.ttlSeconds, 321);
    assert.ok(heartbeat.lease.heartbeatAt);
    assert.ok(Date.parse(heartbeat.lease.expiresAt) > Date.parse(created.lease.expiresAt));

    const released = leaseStore.releaseTaskLease(created.lease.leaseId, {
      status: "completed",
      actor: "unit-test",
      source: "unit-test"
    });
    assert.equal(released.lease.status, "completed");
    assert.ok(released.lease.releasedAt);

    const parallel = leaseStore.createTaskLease({
      taskId: task.id,
      holderId: "manager-beta",
      holderType: "manager",
      status: "active",
      allowParallel: true,
      actor: "unit-test",
      source: "unit-test"
    });
    assert.equal(parallel.lease.status, "active");

    const taskLeases = leaseStore.listTaskLeases({ taskId: task.id, limit: 10 });
    assert.equal(taskLeases.length, 2);
    assert.equal(taskLeases[0].taskId, task.id);

    const summary = leaseStore.getTaskLeaseLedgerSummary();
    assert.equal(summary.totalLeases, 2);
    assert.equal(summary.statusCounts.completed, 1);
    assert.equal(summary.statusCounts.active, 1);

    const extraTask = taskStore.createTaskLedgerTask({
      title: "Filtered lease summary task",
      actor: "unit-test",
      source: "unit-test"
    }).task;
    leaseStore.createTaskLease({
      taskId: extraTask.id,
      holderId: "manager-gamma",
      holderType: "manager",
      status: "active",
      actor: "unit-test",
      source: "unit-test"
    });

    const filteredState = leaseStore.getTaskLeaseLedgerState({ taskId: task.id });
    assert.equal(filteredState.leases.length, 2);
    assert.equal(filteredState.summary.totalLeases, 2);
  });
});
