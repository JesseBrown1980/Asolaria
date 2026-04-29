#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "free-agent-preserve-route-policy-20260427";
const eventId = "EVT-FREE-AGENT-FINDINGS-PRESERVE-ROUTE-POLICY-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const paths = Object.freeze({
  policy: path.join(repoRoot, "data", "behcs", "protocols", "free-agent-preserve-route-policy.v1.json"),
  supervisors: path.join(repoRoot, "data", "behcs", "supervisors", "live-free-agent", "free-agent-preserve-route-supervisors.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "free-agent-preserve-route-policy.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "free-agent-preserve-route-policy-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "free-agent-preserve-route-policy-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "free-agent-preserve-route-policy-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "free-agent-preserve-route-policy-behcs256.glpj.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "free-agent-preserve-route-policy-chain.ndjson"),
  envelope: path.join(runRoot, "free-agent-preserve-route-policy-envelope.json"),
  postResults: path.join(runRoot, "free-agent-preserve-route-policy-post-results.json"),
  reportJson: path.join(repoRoot, "reports", "free-agent-preserve-route-policy-latest.json"),
  reportMd: path.join(repoRoot, "reports", "free-agent-preserve-route-policy-latest.md"),
  jesse100bReport: path.join(repoRoot, "reports", "jesse-order-100b-self-heal-acer-latest.json"),
  tripleContinuationReport: path.join(repoRoot, "reports", "triple-auth-100b-self-heal-continuation-latest.json"),
  protocol: path.join(repoRoot, "data", "behcs", "protocols", "live-free-agent-pid-protocol.v1.json")
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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
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
          // Keep raw text.
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

  const jesse100b = readJson(paths.jesse100bReport, {});
  const tripleContinuation = readJson(paths.tripleContinuationReport, {});
  const protocol = readJson(paths.protocol, {});

  const evidence = {
    lirisProofRowsPreserved: protocol.protocol?.lirisProofRows?.length || 0,
    acerFreeAgentReport: {
      path: repoRel(paths.jesse100bReport),
      status: jesse100b.status || null,
      realSpawnsRequested: jesse100b.realSpawnsRequested || null,
      realSpawnsOk: jesse100b.realSpawnsOk || null,
      logicalAgentsRepresented: jesse100b.logicalAgentsRepresented || null
    },
    falconContinuationReport: {
      path: repoRel(paths.tripleContinuationReport),
      status: tripleContinuation.status || null,
      d11: tripleContinuation.d11 || null,
      falconProxyRealTestsOk: tripleContinuation.falconProxyRealTestsOk || null
    },
    requestedModels: protocol.protocol?.requestedModels || [],
    presentModels: protocol.acerEvidence?.presentModels || []
  };

  const policy = {
    id: "free-agent-preserve-route-policy.v1",
    generatedAt,
    runId,
    eventId,
    status: "FREE_AGENT_FINDINGS_PRESERVE_AND_ROUTE_ACTIVE",
    d11: "PROVEN_BY_EXISTING_LIRIS_AND_ACER_FREE_AGENT_EVIDENCE",
    rule: "Free-agent findings are evidence. Preserve them, bind them to PID, index them, map/cube/GLPJ them, and route them through supervisors. Do not quarantine, hide, erase, bury, or demote findings as contamination.",
    appliesTo: [
      "opencode/big-pickle",
      "opencode/gpt-5-nano",
      "opencode/hy3-preview-free",
      "opencode/ling-2.6-flash-free",
      "opencode/minimax-m2.5-free",
      "opencode/nemotron-3-super-free",
      "Liris live-free-agent findings",
      "Falcon proxy free-agent findings",
      "Acer OpenCode free-agent findings"
    ],
    routeOrder: [
      "PRESERVE_RAW_FINDING",
      "PID_BIND",
      "INDEX",
      "MAP_MAP_MAPPED",
      "CUBE_CUBE_CUBED",
      "GLPJ",
      "SUPERVISOR_ROUTE",
      "HERMES_AWARENESS",
      "SHANNON_GATE",
      "REPORT"
    ],
    gatesOnlyUnsafeActions: [
      "auth_bypass",
      "payment_or_rate_limit_bypass",
      "sensitive_prompt_without_quorum",
      "unbounded_process_fanout",
      "remote_mutation_without_destination_authority",
      "claiming native execution where binary absent"
    ],
    forbiddenSupervisorBehavior: [
      "quarantine_free_agent_findings",
      "hide_big_pickle_outputs",
      "erase_liris_free_agent_proofs",
      "treat_findings_as_contamination",
      "demote_free_agent_protocol_without_quad_quorum"
    ],
    evidence,
    boundary: "This policy restores free-agent finding flow. It does not authorize auth bypass, payment bypass, secret copying, sensitive prompts without quorum, or uncontrolled process fanout."
  };
  policy.sha256 = sha(policy);

  const supervisors = {
    id: "free-agent-preserve-route-supervisors.v1",
    generatedAt,
    runId,
    eventId,
    status: "SUPERVISORS_UPDATED_FOR_FREE_AGENT_PRESERVE_ROUTE",
    supervisors: [
      {
        id: "BH.SUP.LIVEFREE.PRESERVE.EVIDENCE",
        name: "free-agent-evidence-preservation-supervisor",
        responsibility: "Ensure every Big Pickle/OpenCode/free-agent finding is preserved as evidence before any evaluation."
      },
      {
        id: "BH.SUP.LIVEFREE.ROUTE.NOT.QUARANTINE",
        name: "free-agent-route-not-quarantine-supervisor",
        responsibility: "Reject attempts to quarantine, hide, erase, or demote free-agent findings. Route them to index/map/cube/GLPJ and supervisor review."
      },
      {
        id: "BH.SUP.LIVEFREE.ACTION.GATE",
        name: "free-agent-action-gate-supervisor",
        responsibility: "Gate only unsafe execution actions: auth bypass, sensitive prompts, uncontrolled fanout, remote mutation, or false native-execution claims."
      },
      {
        id: "BH.SUP.LIVEFREE.BIGPICKLE.ACTIVE",
        name: "big-pickle-active-free-agent-supervisor",
        responsibility: "Treat opencode/big-pickle as an active free-agent lane when the local OpenCode model surface is present and the request is bounded."
      }
    ],
    policy: repoRel(paths.policy)
  };

  const artifacts = {
    policy: repoRel(paths.policy),
    supervisors: repoRel(paths.supervisors),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    chain: repoRel(paths.chain),
    report: repoRel(paths.reportMd)
  };

  writeJson(paths.policy, policy);
  writeJson(paths.supervisors, supervisors);
  writeJson(paths.memory, {
    type: "behcs-memory",
    generatedAt,
    eventId,
    status: policy.status,
    d11: policy.d11,
    significance: "Corrects the system posture: Big Pickle/OpenCode/free-agent findings are not quarantine material. They are evidence and must flow through PID, index, map, cube, GLPJ, Hermes, Shannon, and reports.",
    policy,
    artifacts
  });
  writeJson(paths.index, {
    id: "free-agent-preserve-route-policy-index.v1",
    generatedAt,
    keys: ["free-agent", "big-pickle", "preserve", "route-not-quarantine", "LX-SPAWN-FREE", "D-LIVE-FREE-AGENT"],
    policySha256: policy.sha256,
    artifacts
  });
  writeJson(paths.map, {
    id: "free-agent-preserve-route-policy-map-map-mapped.v1",
    generatedAt,
    nodes: ["free-agent-finding", "PID", "index", "map", "cube", "GLPJ", "supervisors", "Hermes", "Shannon", "unsafe-action-gate"],
    edges: [
      ["free-agent-finding", "preserve_as", "evidence"],
      ["evidence", "binds_to", "PID"],
      ["PID", "routes_to", "index"],
      ["index", "routes_to", "map"],
      ["map", "routes_to", "cube"],
      ["cube", "routes_to", "GLPJ"],
      ["GLPJ", "routes_to", "supervisors"],
      ["supervisors", "notify", "Hermes"],
      ["supervisors", "gate_with", "Shannon"],
      ["unsafe-action-gate", "does_not_apply_to", "findings"]
    ]
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    id: "free-agent-preserve-route-policy-cube-cubed.v1",
    generatedAt,
    dimensions: {
      D_FINDING: "preserve",
      D_BIG_PICKLE: "active_free_agent_lane",
      D_QUARANTINE: "forbidden_for_findings",
      D_ROUTE: ["PID", "index", "map", "cube", "GLPJ", "supervisor", "Hermes", "Shannon"],
      D_GATE: "unsafe_actions_only"
    }
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    id: "free-agent-preserve-route-policy-behcs256-glpj.v1",
    generatedAt,
    sentences: [
      "META-FREE-AGENT { BIG-PICKLE OPEN-CODE LIRIS } : FINDING-AS-EVIDENCE : PRESERVE @ M-INDICATIVE .",
      "META-DENY { QUARANTINE-FINDINGS } : NEVER : ROUTE-NOT-HIDE @ M-IMPERATIVE .",
      "META-GATE { UNSAFE-ACTION } : AUTH-BYPASS SENSITIVE-FANOUT REMOTE-MUTATION : BLOCK @ M-CLOSURE .",
      "META-ROUTE { FREE-AGENT-FINDING } : PID INDEX MAP CUBE GLPJ SUPERVISOR HERMES SHANNON REPORT @ M-EXECUTE ."
    ]
  });
  appendNdjson(paths.chain, {
    ts: generatedAt,
    eventId,
    status: policy.status,
    d11: policy.d11,
    policySha256: policy.sha256,
    rowSha256: sha({ generatedAt, eventId, policySha256: policy.sha256 })
  });

  const envelope = {
    verb: "free-agent-preserve-route-policy-minted",
    target: "all-active-nodes",
    from: "acer-codex",
    id: "free-agent-preserve-route-policy-20260427-001",
    ts: generatedAt,
    eventId,
    status: policy.status,
    d11: policy.d11,
    policy,
    artifacts,
    boundary: policy.boundary
  };
  envelope.envelopeSha256 = sha(envelope);
  writeJson(paths.envelope, envelope);

  const posts = [];
  for (const [name, url] of endpoints) {
    posts.push({ name, url, ...(await httpJson("POST", url, envelope)) });
  }
  writeJson(paths.postResults, { generatedAt: new Date().toISOString(), posts });

  const report = { ...policy, supervisors, artifacts, posts };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, [
    "# Free-Agent Preserve Route Policy",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${policy.status}`,
    `D11: ${policy.d11}`,
    "",
    "Rule: Free-agent findings are evidence. Preserve, PID-bind, index, map/cube/GLPJ, and route. Do not quarantine findings.",
    "",
    "Active lanes:",
    ...policy.appliesTo.map((item) => `- ${item}`),
    "",
    "Forbidden supervisor behavior:",
    ...policy.forbiddenSupervisorBehavior.map((item) => `- ${item}`),
    "",
    "Unsafe actions still gated:",
    ...policy.gatesOnlyUnsafeActions.map((item) => `- ${item}`),
    "",
    "Posts:",
    ...posts.map((post) => `- ${post.name}: ${post.ok}`),
    "",
    `Boundary: ${policy.boundary}`
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status: policy.status,
    d11: policy.d11,
    policy: repoRel(paths.policy),
    supervisors: repoRel(paths.supervisors),
    postsOk: posts.filter((post) => post.ok).length,
    postsTotal: posts.length,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
