const assert = require("node:assert/strict");
const express = require("express");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

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

async function requestJson(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  return {
    status: response.status,
    json: await response.json()
  };
}

test("worker runtime routes use injected ctx for work, status, and civilization-world", async () => {
  await withFreshAsolaria("worker-runtime-routes", async ({ load }) => {
    const createWorkerRuntimeRouter = load("routes/routes/workerRuntime.js");
    const calls = {
      resolveCachedRuntimePayload: [],
      fastPayload: 0,
      workPayload: 0,
      statusPayload: 0,
      civilizationArgs: []
    };
    const fastCache = { id: "fast-cache", payload: null, refreshPromise: null, lastError: "fast_degraded" };
    const workCache = { id: "work-cache" };
    const app = express();
    app.use(express.json());
    app.use("/api/worker-runtime", createWorkerRuntimeRouter({
      resolveCachedRuntimePayload: async (cache, builder, options) => {
        calls.resolveCachedRuntimePayload.push({ cache, options });
        return builder();
      },
      workerRuntimeRouteCaches: { fast: fastCache, colony: {}, symphony: {}, superCoder: {}, abacus: {}, work: workCache },
      buildWorkerRuntimeFastPayload: async () => {
        calls.fastPayload += 1;
        return { route: "fast" };
      },
      buildWorkerRuntimeColonyPayload: async () => ({ route: "colony" }),
      buildWorkerRuntimeSymphonyPayload: async () => ({ route: "symphony" }),
      buildSuperCoderCockpitPayload: async () => ({ route: "super-coder" }),
      buildWorkerRuntimeAbacusPayload: async () => ({ route: "abacus" }),
      buildWorkerRuntimeWorkPayload: async () => {
        calls.workPayload += 1;
        return {
          route: "work",
          taskLedger: { openTasks: 7 },
          workerRouter: {
            leaseLedger: {
              summary: {
                activeLeases: 2,
                totalLeases: 4
              }
            }
          }
        };
      },
      getCachedWorkerRuntimePayload: async () => {
        calls.statusPayload += 1;
        return {
          route: "status",
          taskLedger: { openTasks: 11 },
          workerRouter: {
            leaseLedger: {
              summary: {
                activeLeases: 5,
                totalLeases: 6
              }
            }
          }
        };
      },
      getCachedTrustedEcosystemEntitiesPayload: async () => ({ summary: { total: 0, connected: 0 } }),
      buildCivilizationWorldBundle: async (args) => {
        calls.civilizationArgs.push(args);
        return {
          trustedEntities: args.includeTrusted ? [{ id: "trusted-1" }] : [],
          taskLedger: { summary: { openTasks: 3 } },
          worldState: {
            summary: {
              entities: 12,
              routes: 4,
              packets: 9,
              hotEntities: 3
            }
          },
          graphSnapshot: {
            generatedAt: "2026-03-25T00:00:00.000Z",
            graph: {
              nodes: ["n-1"],
              edges: ["e-1"]
            }
          }
        };
      },
      buildSwarmDeskExportPayload: () => ({ route: "swarmdesk" }),
      withWorkerRuntimeCacheMeta: (payload, meta) => ({ ...payload, cacheMeta: meta }),
      workerRuntimeSnapshotCache: { payload: { route: "cached-status" }, expiresAt: 0, refreshPromise: null, lastError: "status_degraded" },
      WORKER_RUNTIME_FAST_ROUTE_TTL_MS: 1000,
      WORKER_RUNTIME_PANEL_TTL_MS: 2000,
      WORKER_RUNTIME_ABACUS_ROUTE_TTL_MS: 3000,
      SUPER_CODER_TTL_MS: 4000
    }));

    await withServer(app, async (baseUrl) => {
      const fastResponse = await requestJson(baseUrl, "/api/worker-runtime/fast");
      assert.equal(fastResponse.status, 200);
      assert.equal(fastResponse.json.route, "fast");
      assert.equal(calls.fastPayload, 1);
      assert.equal(calls.resolveCachedRuntimePayload[0].cache, fastCache);
      assert.equal(calls.resolveCachedRuntimePayload[0].options.ttlMs, 1000);
      assert.deepEqual(fastResponse.json.cacheMeta, {
        stale: false,
        partial: true,
        refreshing: false,
        lastError: "fast_degraded"
      });

      const workResponse = await requestJson(baseUrl, "/api/worker-runtime/work");
      assert.equal(workResponse.status, 200);
      assert.equal(workResponse.json.route, "work");
      assert.equal(workResponse.json.workerRouter.leaseLedger.summary.activeLeases, 2);
      assert.equal(calls.workPayload, 1);
      assert.equal(calls.resolveCachedRuntimePayload.length, 2);
      assert.equal(calls.resolveCachedRuntimePayload[1].cache, workCache);
      assert.equal(calls.resolveCachedRuntimePayload[1].options.ttlMs, 2000);

      const statusResponse = await requestJson(baseUrl, "/api/worker-runtime/status");
      assert.equal(statusResponse.status, 200);
      assert.equal(statusResponse.json.route, "status");
      assert.equal(statusResponse.json.workerRouter.leaseLedger.summary.totalLeases, 6);
      assert.deepEqual(statusResponse.json.cacheMeta, {
        stale: true,
        partial: false,
        refreshing: false,
        lastError: "status_degraded"
      });
      assert.equal(calls.statusPayload, 1);

      const worldResponse = await requestJson(
        baseUrl,
        "/api/worker-runtime/civilization-world?trusted=1&admin=0&taskLimit=10&eventLimit=12&windowMinutes=45&maxNodes=64&maxEdges=140&includeLowRisk=0"
      );
      assert.equal(worldResponse.status, 200);
      assert.equal(worldResponse.json.summary.entities, 12);
      assert.equal(worldResponse.json.summary.routes, 4);
      assert.equal(calls.civilizationArgs.length, 1);
      assert.deepEqual(calls.civilizationArgs[0], {
        includeTrusted: true,
        includeAdminCockpit: false,
        taskLimit: 10,
        eventLimit: 12,
        windowMinutes: 45,
        maxNodes: 64,
        maxEdges: 140,
        includeLowRisk: false
      });
    });
  });
});

test("worker runtime routes reject missing cache buckets", async () => {
  await withFreshAsolaria("worker-runtime-routes-contract", async ({ load }) => {
    const createWorkerRuntimeRouter = load("routes/routes/workerRuntime.js");
    assert.throws(() => createWorkerRuntimeRouter({
      resolveCachedRuntimePayload: async () => ({}),
      workerRuntimeRouteCaches: { fast: {} },
      buildWorkerRuntimeFastPayload: async () => ({}),
      buildWorkerRuntimeColonyPayload: async () => ({}),
      buildWorkerRuntimeSymphonyPayload: async () => ({}),
      buildSuperCoderCockpitPayload: async () => ({}),
      buildWorkerRuntimeAbacusPayload: async () => ({}),
      buildWorkerRuntimeWorkPayload: async () => ({}),
      getCachedWorkerRuntimePayload: async () => ({}),
      getCachedTrustedEcosystemEntitiesPayload: async () => ({}),
      buildCivilizationWorldBundle: async () => ({}),
      buildSwarmDeskExportPayload: () => ({}),
      withWorkerRuntimeCacheMeta: (payload) => payload,
      workerRuntimeSnapshotCache: {}
    }), /cache bucket colony/);
  });
});
