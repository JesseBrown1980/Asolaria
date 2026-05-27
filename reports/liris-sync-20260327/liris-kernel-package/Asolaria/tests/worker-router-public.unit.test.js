const assert = require("node:assert/strict");
const express = require("express");
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

async function requestJson(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || "GET",
    headers: options.headers || { Accept: "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

function loadPublicRouter(load, options = {}) {
  installStub("src/connectors/workerRouterPublicRead.js", {
    readPublicWorkerRouterStatus: () => options.status || {
      generatedAt: "2026-03-25T19:10:00.000Z",
      defaultWorker: "local_codex",
      workers: [{
        id: "local_codex",
        title: "Local Codex",
        available: true,
        dispatchable: true,
        directDispatchSupported: true,
        strengths: ["local edits"],
        limitations: [],
        mistakes: []
      }],
      leaseLedger: {
        summary: { activeLeases: 1, queuedLeases: 0, totalLeases: 1 },
      },
      knownIssues: []
    },
    listPublicWorkerRouterDispatches: (limit) => {
      options.recordedLimits?.push(limit);
      return options.dispatches || [
        {
          id: "dispatch_001",
          title: "Public dispatch",
          workerId: "local_codex",
          taskId: "task_001",
          leaseId: "lease_001",
          leaseStatus: "active",
          createdAt: "2026-03-25T19:09:00.000Z",
          completedAt: "",
          failedAt: "",
          taskType: "patch",
          resultSummary: "Ready for inspection.",
          error: ""
        }
      ];
    },
    getPublicWorkerRouterDispatch: (id) => {
      if (id === "not-found") return null;
      return {
        id,
        title: "Public dispatch",
        workerId: "local_codex",
        taskId: "task_001",
        leaseId: "lease_001",
        leaseStatus: "active",
        createdAt: "2026-03-25T19:09:00.000Z",
        completedAt: "",
        failedAt: "",
        taskType: "patch",
        resultSummary: "Ready for inspection.",
        error: ""
      };
    }
  });
  return load("routes/routes/workerRouterPublic.js");
}

test("workerRouterPublic exposes only read-only GET endpoints on compat surface", async () => {
  await withFreshAsolaria("worker-router-public", async ({ load }) => {
    const router = loadPublicRouter(load, { recordedLimits: [] });
    const app = express();
    app.use(express.json());
    app.use("/api/worker-router", router);

    await withServer(app, async (baseUrl) => {
      const statusResponse = await requestJson(baseUrl, "/api/worker-router/status");
      assert.equal(statusResponse.status, 200);
      assert.equal(statusResponse.payload.ok, true);
      assert.deepEqual(Object.keys(statusResponse.payload.status).sort(), [
        "defaultWorker",
        "generatedAt",
        "knownIssues",
        "leaseLedger",
        "workers"
      ].sort());
      assert.equal(statusResponse.payload.status.defaultWorker, "local_codex");
      assert.equal(statusResponse.payload.status.leaseLedger.summary.activeLeases, 1);
      assert.deepEqual(Object.keys(statusResponse.payload.status.workers[0]).sort(), [
        "available",
        "dispatchable",
        "directDispatchSupported",
        "id",
        "limitations",
        "mistakes",
        "strengths",
        "title"
      ].sort());

      const dispatchesResponse = await requestJson(baseUrl, "/api/worker-router/dispatches?limit=7");
      assert.equal(dispatchesResponse.status, 200);
      assert.equal(dispatchesResponse.payload.ok, true);
      assert.equal(dispatchesResponse.payload.dispatches.length, 1);
      assert.deepEqual(Object.keys(dispatchesResponse.payload.dispatches[0]).sort(), [
        "completedAt",
        "createdAt",
        "error",
        "failedAt",
        "id",
        "leaseId",
        "leaseStatus",
        "resultSummary",
        "taskId",
        "taskType",
        "title",
        "workerId"
      ].sort());
      assert.equal(dispatchesResponse.payload.dispatches[0].leaseStatus, "active");
      assert.equal(dispatchesResponse.payload.dispatches[0].leaseId, "lease_001");
      assert.equal(dispatchesResponse.payload.dispatches[0].taskType, "patch");
      assert.equal(dispatchesResponse.payload.dispatches[0].resultSummary, "Ready for inspection.");
      assert.equal(dispatchesResponse.payload.dispatches[0].recommendation, undefined);
      assert.equal(dispatchesResponse.payload.dispatches[0].result, undefined);
      assert.equal(dispatchesResponse.payload.dispatches[0].lease, undefined);

      const dispatchResponse = await requestJson(baseUrl, "/api/worker-router/dispatches/dispatch_001");
      assert.equal(dispatchResponse.status, 200);
      assert.equal(dispatchResponse.payload.ok, true);
      assert.deepEqual(Object.keys(dispatchResponse.payload.dispatch).sort(), [
        "completedAt",
        "createdAt",
        "error",
        "failedAt",
        "id",
        "leaseId",
        "leaseStatus",
        "resultSummary",
        "taskId",
        "taskType",
        "title",
        "workerId"
      ].sort());
      assert.equal(dispatchResponse.payload.dispatch.id, "dispatch_001");
      assert.equal(dispatchResponse.payload.dispatch.taskId, "task_001");
      assert.equal(dispatchResponse.payload.dispatch.taskType, "patch");
      assert.equal(dispatchResponse.payload.dispatch.resultSummary, "Ready for inspection.");
      assert.equal(dispatchResponse.payload.dispatch.recommendation, undefined);
      assert.equal(dispatchResponse.payload.dispatch.result, undefined);
      assert.equal(dispatchResponse.payload.dispatch.lease, undefined);

      const missingAs404Response = await requestJson(baseUrl, "/api/worker-router/dispatches/not-found");
      assert.equal(missingAs404Response.status, 404);

      const recommendResponse = await requestJson(baseUrl, "/api/worker-router/recommend", {
        method: "POST",
        body: { title: "Should not exist" }
      });
      assert.equal(recommendResponse.status, 404);

      const dispatchPostResponse = await requestJson(baseUrl, "/api/worker-router/dispatch", {
        method: "POST",
        body: { title: "Should not exist" }
      });
      assert.equal(dispatchPostResponse.status, 404);
    });
  });
});
