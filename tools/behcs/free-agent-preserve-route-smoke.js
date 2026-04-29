#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "free-agent-preserve-route-smoke-20260427";
const eventId = "EVT-FREE-AGENT-PRESERVE-ROUTE-SMOKE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const paths = Object.freeze({
  result: path.join(runRoot, "big-pickle-preserve-route-smoke-result.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "free-agent-preserve-route-smoke.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "free-agent-preserve-route-smoke-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "free-agent-preserve-route-smoke-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "free-agent-preserve-route-smoke-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "free-agent-preserve-route-smoke-behcs256.glpj.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "free-agent-preserve-route-smoke-chain.ndjson"),
  envelope: path.join(runRoot, "free-agent-preserve-route-smoke-envelope.json"),
  postResults: path.join(runRoot, "free-agent-preserve-route-smoke-post-results.json"),
  reportJson: path.join(repoRoot, "reports", "free-agent-preserve-route-smoke-latest.json"),
  reportMd: path.join(repoRoot, "reports", "free-agent-preserve-route-smoke-latest.md")
});

const endpoints = Object.freeze([
  ["acer-local", "http://127.0.0.1:4947/behcs/send"],
  ["liris-cable", "http://192.168.100.2:4947/behcs/send"],
  ["falcon-law001", "http://192.168.1.8:4947/behcs/send"]
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function parseEvents(stdout) {
  return String(stdout || "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function extractText(events) {
  return events
    .filter((event) => event.type === "text")
    .map((event) => event.part?.text || event.text || "")
    .join("\n")
    .trim();
}

function httpJson(method, url, body = null, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      timeout: timeoutMs,
      headers: payload
        ? { "content-type": "application/json", "content-length": payload.length, connection: "close" }
        : { connection: "close" }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let bodyOut = text;
        try {
          bodyOut = JSON.parse(text);
        } catch {
          // Keep raw.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyOut });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const generatedAt = new Date().toISOString();
  fs.mkdirSync(runRoot, { recursive: true });
  const pid = `BH.AGENT.PID.${sha(`${eventId}:${generatedAt}:big-pickle`).slice(0, 12).toUpperCase()}`;
  const prompt = [
    "BEHCS-256 LX-SPAWN-FREE preserve-route smoke.",
    `PID=${pid}.`,
    "Model=opencode/big-pickle.",
    "Return one compact JSON object with keys status, finding, route, and supervisor.",
    "State that free-agent findings are preserved evidence and not quarantine material.",
    "Do not edit files. Do not run tools."
  ].join(" ");

  const started = Date.now();
  const proc = spawnSync("opencode", [
    "run",
    "--format",
    "json",
    "-m",
    "opencode/big-pickle",
    "--dir",
    repoRoot,
    prompt
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
    shell: true,
    env: {
      ...process.env,
      BROWN_HILBERT_PID: pid,
      BEHCS256_GLYPH: "LX-SPAWN-FREE",
      ASOLARIA_FREE_AGENT_POLICY: "PRESERVE_ROUTE_NOT_QUARANTINE",
      ASOLARIA_BOUNDARY: "NO_FILE_EDITS_NO_TOOLS_NO_FANOUT"
    }
  });

  const events = parseEvents(proc.stdout);
  const responseText = extractText(events);
  const finish = events.find((event) => event.type === "step_finish");
  const result = {
    id: "big-pickle-preserve-route-smoke-result.v1",
    generatedAt,
    runId,
    eventId,
    status: proc.status === 0 && responseText ? "BIG_PICKLE_FREE_AGENT_PRESERVE_ROUTE_SMOKE_OK" : "BIG_PICKLE_FREE_AGENT_PRESERVE_ROUTE_SMOKE_FAILED",
    d11: proc.status === 0 && responseText ? "PROVEN_REAL_BIG_PICKLE_RESPONSE_PRESERVED_AND_ROUTED" : "OBSERVED_BIG_PICKLE_SMOKE_FAILURE",
    pid,
    model: "opencode/big-pickle",
    ok: proc.status === 0 && responseText.length > 0,
    exitCode: proc.status,
    signal: proc.signal,
    elapsedMs: Date.now() - started,
    responseText,
    responseSha256: sha(responseText || ""),
    stdoutSha256: sha(proc.stdout || ""),
    stderr: String(proc.stderr || "").slice(0, 1000),
    error: proc.error ? String(proc.error.message || proc.error) : "",
    eventCount: events.length,
    tokens: finish?.part?.tokens || null,
    cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
    boundary: "One real Big Pickle free-agent smoke. Response preserved as evidence; no file edits, no tools, no fanout."
  };

  const artifacts = {
    result: repoRel(paths.result),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    chain: repoRel(paths.chain),
    report: repoRel(paths.reportMd)
  };

  writeJson(paths.result, result);
  writeJson(paths.memory, {
    type: "behcs-memory",
    generatedAt,
    eventId,
    status: result.status,
    d11: result.d11,
    significance: "The corrected free-agent route was exercised with opencode/big-pickle. The finding was preserved, PID-bound, indexed, mapped, cubed, GLPJ minted, and routed instead of quarantined.",
    result,
    artifacts
  });
  writeJson(paths.index, {
    id: "free-agent-preserve-route-smoke-index.v1",
    generatedAt,
    keys: ["big-pickle", "free-agent", "preserve-route", "LX-SPAWN-FREE", "not-quarantine"],
    pid,
    resultSha256: sha(result),
    artifacts
  });
  writeJson(paths.map, {
    id: "free-agent-preserve-route-smoke-map-map-mapped.v1",
    generatedAt,
    edges: [
      ["opencode/big-pickle", "produced", "finding"],
      ["finding", "preserved_as", "evidence"],
      ["evidence", "bound_to", pid],
      ["evidence", "routed_to", "supervisors"],
      ["quarantine", "not_applied_to", "finding"]
    ]
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    id: "free-agent-preserve-route-smoke-cube-cubed.v1",
    generatedAt,
    dimensions: {
      D_MODEL: "opencode/big-pickle",
      D_PID: pid,
      D_FINDING: "preserved",
      D_ROUTE: "supervisor",
      D_QUARANTINE: "not_applied"
    }
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    id: "free-agent-preserve-route-smoke-behcs256-glpj.v1",
    generatedAt,
    sentences: [
      "META-RUN { BIG-PICKLE } : LX-SPAWN-FREE : REAL-RESPONSE @ M-EYEWITNESS .",
      "META-FINDING { FREE-AGENT } : PRESERVE : PID-BIND : ROUTE @ M-INDICATIVE .",
      "META-DENY { QUARANTINE-FINDING } : NOT-APPLIED @ M-CLOSURE ."
    ]
  });
  appendNdjson(paths.chain, {
    ts: generatedAt,
    eventId,
    status: result.status,
    d11: result.d11,
    responseSha256: result.responseSha256,
    rowSha256: sha(result)
  });

  const envelope = {
    verb: "free-agent-preserve-route-smoke-result",
    target: "all-active-nodes",
    from: "acer-codex",
    id: "free-agent-preserve-route-smoke-20260427-001",
    ts: generatedAt,
    eventId,
    status: result.status,
    d11: result.d11,
    result,
    artifacts,
    boundary: result.boundary
  };
  envelope.envelopeSha256 = sha(envelope);
  writeJson(paths.envelope, envelope);

  const posts = [];
  for (const [name, url] of endpoints) {
    posts.push({ name, url, ...(await httpJson("POST", url, envelope)) });
  }
  writeJson(paths.postResults, { generatedAt: new Date().toISOString(), posts });

  const report = { ...result, artifacts, posts };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, [
    "# Free-Agent Preserve Route Smoke",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${result.status}`,
    `D11: ${result.d11}`,
    `Model: ${result.model}`,
    `PID: ${pid}`,
    `Elapsed ms: ${result.elapsedMs}`,
    `Cost: ${result.cost}`,
    `Response sha256: ${result.responseSha256}`,
    "",
    "Response:",
    "```text",
    responseText,
    "```",
    "",
    "Posts:",
    ...posts.map((post) => `- ${post.name}: ${post.ok}`),
    "",
    `Boundary: ${result.boundary}`
  ].join("\n"));

  console.log(JSON.stringify({
    ok: result.ok,
    status: result.status,
    d11: result.d11,
    model: result.model,
    pid,
    elapsedMs: result.elapsedMs,
    cost: result.cost,
    postsOk: posts.filter((post) => post.ok).length,
    postsTotal: posts.length,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
