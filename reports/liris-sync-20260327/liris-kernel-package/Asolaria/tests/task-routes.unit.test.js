const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");

const { withFreshAsolaria } = require("./_unitHarness");

function inferHttpStatusForError(error) {
  if (error?.status) return Number(error.status);
  const msg = String(error?.message || "").toLowerCase();
  if (msg.includes("not found")) return 404;
  if (msg.includes("already has an active lease") || msg.includes("conflict")) return 409;
  if (
    msg.includes("required")
    || msg.includes("invalid")
    || msg.includes("cannot be empty")
    || msg.includes("requires a title or description")
    || msg.includes("must be a number")
    || msg.includes("must be between")
  ) return 400;
  return 500;
}

function respondError(res, status, error) {
  return res.status(status).json({
    ok: false,
    error: String(error?.message || "request_failed"),
    code: String(error?.code || "request_failed")
  });
}

async function withServer(app, callback) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

async function requestJson(baseUrl, method, pathname, body) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return {
    status: response.status,
    json: await response.json()
  };
}

test("task and task-lease routers return normalized task state, live lease context, and 409 conflicts", async () => {
  await withFreshAsolaria("task-routes", async ({ load }) => {
    const createTaskLedgerRouter = load("routes/taskLedger.js");
    const createTaskLeaseLedgerRouter = load("routes/taskLeaseLedger.js");

    const app = express();
    app.use(express.json());
    app.use("/api/task-ledger", createTaskLedgerRouter({ respondError, inferHttpStatusForError }));
    app.use("/api/task-leases", createTaskLeaseLedgerRouter({ respondError, inferHttpStatusForError }));

    await withServer(app, async (baseUrl) => {
      const invalidCreate = await requestJson(baseUrl, "POST", "/api/task-ledger/tasks", {});
      assert.equal(invalidCreate.status, 400);
      assert.equal(invalidCreate.json.ok, false);

      const createTask = await requestJson(baseUrl, "POST", "/api/task-ledger/tasks", {
        title: "Route smoke task",
        description: "Exercising mounted task routes.",
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(createTask.status, 200);
      assert.equal(createTask.json.ok, true);
      const taskId = createTask.json.task.id;

      const createLease = await requestJson(baseUrl, "POST", "/api/task-leases/leases", {
        taskId,
        holderId: "route-manager",
        holderType: "manager",
        status: "active",
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(createLease.status, 200);
      assert.equal(createLease.json.lease.status, "active");

      const duplicateLease = await requestJson(baseUrl, "POST", "/api/task-leases/leases", {
        taskId,
        holderId: "route-manager-2",
        holderType: "manager",
        status: "queued",
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(duplicateLease.status, 409);
      assert.equal(duplicateLease.json.ok, false);

      const invalidPatch = await requestJson(baseUrl, "PATCH", `/api/task-ledger/tasks/${taskId}`, {
        progress: "bad-value",
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(invalidPatch.status, 400);
      assert.equal(invalidPatch.json.ok, false);

      const patchTask = await requestJson(baseUrl, "PATCH", `/api/task-ledger/tasks/${taskId}`, {
        status: "done",
        progress: 20,
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(patchTask.status, 200);
      assert.equal(patchTask.json.task.status, "done");
      assert.equal(patchTask.json.task.progress, 100);
      assert.equal(patchTask.json.task.leaseContext.status, "completed");

      const fetchTask = await requestJson(baseUrl, "GET", `/api/task-ledger/tasks/${taskId}?includeEvents=true`);
      assert.equal(fetchTask.status, 200);
      assert.equal(fetchTask.json.task.leaseContext.holderId, "route-manager");
      assert.equal(fetchTask.json.task.leaseContext.status, "completed");
      assert.ok(Array.isArray(fetchTask.json.task.events));

      const leaseState = await requestJson(baseUrl, "GET", `/api/task-leases/state?taskId=${encodeURIComponent(taskId)}`);
      assert.equal(leaseState.status, 200);
      assert.equal(leaseState.json.summary.totalLeases, 1);
      assert.equal(leaseState.json.leases.length, 1);
      assert.equal(leaseState.json.leases[0].taskId, taskId);
      assert.equal(leaseState.json.leases[0].status, "completed");

      const archiveTask = await requestJson(baseUrl, "POST", "/api/task-ledger/tasks", {
        title: "Archive route smoke task",
        description: "Exercising archive and lease sync.",
        actor: "route-test",
        source: "route-test"
      });
      const archiveTaskId = archiveTask.json.task.id;
      const archiveLease = await requestJson(baseUrl, "POST", "/api/task-leases/leases", {
        taskId: archiveTaskId,
        holderId: "route-archive-manager",
        holderType: "manager",
        status: "queued",
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(archiveLease.status, 200);

      const archiveResult = await requestJson(baseUrl, "DELETE", `/api/task-ledger/tasks/${archiveTaskId}`, {
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(archiveResult.status, 200);
      assert.equal(archiveResult.json.task.status, "archived");
      assert.equal(archiveResult.json.task.leaseContext.status, "released");

      const hardDeleteTask = await requestJson(baseUrl, "POST", "/api/task-ledger/tasks", {
        title: "Hard delete route smoke task",
        description: "Exercising hard delete and lease sync.",
        actor: "route-test",
        source: "route-test"
      });
      const hardDeleteTaskId = hardDeleteTask.json.task.id;
      const hardDeleteLease = await requestJson(baseUrl, "POST", "/api/task-leases/leases", {
        taskId: hardDeleteTaskId,
        holderId: "route-hard-manager",
        holderType: "manager",
        status: "active",
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(hardDeleteLease.status, 200);

      const hardDeleteResult = await requestJson(baseUrl, "DELETE", `/api/task-ledger/tasks/${hardDeleteTaskId}?hard=true`, {
        actor: "route-test",
        source: "route-test"
      });
      assert.equal(hardDeleteResult.status, 200);
      assert.equal(hardDeleteResult.json.removed.id, hardDeleteTaskId);
      assert.equal(hardDeleteResult.json.removed.leaseContext.status, "released");
    });
  });
});
