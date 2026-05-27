/**
 * Workspace Knowledge Indexed Retrieval Contract
 * Validates the agent-index layer is exposed through workspace knowledge routes.
 * Run: node tests/contracts/workspace-knowledge-indexed.test.js
 */

const http = require("http");

const BASE = String(process.env.ASOLARIA_TEST_BASE_URL || "http://127.0.0.1:4781").trim() || "http://127.0.0.1:4781";
let passed = 0;
let failed = 0;

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE}${path}`, { timeout: 15000 }, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (_error) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function assert(label, fn) {
  try {
    const ok = await fn();
    if (ok) {
      passed += 1;
      console.log(`PASS  ${label}`);
    } else {
      failed += 1;
      console.log(`FAIL  ${label}`);
    }
  } catch (error) {
    failed += 1;
    console.log(`FAIL  ${label} - ${error.message}`);
  }
}

async function run() {
  await assert("GET /api/workspace-knowledge/status exposes agentIndex status", async () => {
    const result = await get("/api/workspace-knowledge/status");
    return result.status === 200
      && result.body?.ok === true
      && result.body?.agentIndex?.ok === true
      && Number(result.body?.agentIndex?.catalogEntries || 0) >= 1;
  });

  await assert("GET /api/workspace-knowledge/index/status returns indexed-memory status", async () => {
    const result = await get("/api/workspace-knowledge/index/status");
    return result.status === 200
      && result.body?.ok === true
      && Number(result.body?.catalogEntries || 0) >= 1
      && Number(result.body?.ixFiles || 0) >= 1;
  });

  await assert("GET /api/workspace-knowledge/index/search retrieves IX-238", async () => {
    const result = await get("/api/workspace-knowledge/index/search?q=IX-238%20memory");
    const matches = Array.isArray(result.body?.matches) ? result.body.matches : [];
    return result.status === 200
      && result.body?.ok === true
      && matches.some((row) => String(row?.ix || "").toUpperCase() === "IX-238");
  });

  await assert("GET /api/workspace-knowledge/search includes index results", async () => {
    const result = await get("/api/workspace-knowledge/search?q=IX-238%20memory");
    const matches = Array.isArray(result.body?.matches) ? result.body.matches : [];
    return result.status === 200
      && result.body?.ok === true
      && result.body?.agentIndex?.ok === true
      && matches.some((row) => String(row?.kind || "").toLowerCase() === "index");
  });

  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error("workspace-knowledge-indexed.test.js failed:", error);
  process.exit(1);
});
