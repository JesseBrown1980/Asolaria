const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");

const BASE = process.env.ASOLARIA_CONTRACT_BASE || "http://127.0.0.1:4781";
const SHOULD_RUN = Boolean(process.env.ASOLARIA_CONTRACT_BASE);

function request(pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, BASE);
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    const req = http.request(url, {
      method: options.method || "GET",
      timeout: options.timeoutMs || 10000,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        })
      }
    }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          json = null;
        }
        resolve({
          status: res.statusCode,
          json,
          text: raw
        });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error(`Timeout requesting ${pathname}`));
    });
    if (body !== undefined) {
      req.write(body);
    }
    req.end();
  });
}

test("public compat worker-runtime surface exposes read-only snapshots and keeps worker-router writes off the public host", { skip: !SHOULD_RUN }, async () => {
  const workerRouterPage = await request("/worker-router.html");
  assert.equal(workerRouterPage.status, 200);
  assert.match(workerRouterPage.text, /name="asolaria-router-mode" content="read-only"/i);
  assert.match(workerRouterPage.text, /data-router-mode="read-only"/i);

  const status = await request("/api/worker-runtime/status");
  assert.equal(status.status, 200);
  assert.equal(status.json?.ok, true);
  assert.ok(Array.isArray(status.json?.workerRouter?.dispatches));
  assert.ok(Array.isArray(status.json?.taskLedger?.openTasks));

  const world = await request("/api/worker-runtime/civilization-world?trusted=1&admin=0");
  assert.equal(world.status, 200);
  assert.ok(world.json && typeof world.json === "object");
  assert.ok(world.json.summary && typeof world.json.summary.entities === "number");
  assert.ok(world.json.projections && typeof world.json.projections.taskLedger?.openTasks === "number");

  const routerStatus = await request("/api/worker-router/status");
  assert.equal(routerStatus.status, 200);
  assert.equal(routerStatus.json?.ok, true);
  assert.ok(routerStatus.json?.status && typeof routerStatus.json.status === "object");

  const routerDispatches = await request("/api/worker-router/dispatches?limit=5");
  assert.equal(routerDispatches.status, 200);
  assert.equal(routerDispatches.json?.ok, true);
  assert.ok(Array.isArray(routerDispatches.json?.dispatches));

  const blockedEndpoints = [
    { method: "POST", path: "/api/worker-router/recommend", body: { title: "probe" } },
    { method: "POST", path: "/api/worker-router/dispatch", body: { title: "probe" } }
  ];

  for (const endpoint of blockedEndpoints) {
    const res = await request(endpoint.path, { method: endpoint.method, body: endpoint.body });
    assert.notEqual(res.status, 200, `${endpoint.method} ${endpoint.path} should not be public on compat`);
  }
});
