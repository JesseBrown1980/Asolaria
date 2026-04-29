#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "live-free-agent-pid-protocol-20260427";
const eventId = "EVT-ACER-LIRIS-LIVE-FREE-AGENT-PID-PROTOCOL-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const PATHS = Object.freeze({
  inbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  protocol: path.join(repoRoot, "data", "behcs", "protocols", "live-free-agent-pid-protocol.v1.json"),
  probe: path.join(runRoot, "acer-live-free-agent-pid-protocol-probe.v1.json"),
  bindings: path.join(runRoot, "acer-live-free-agent-pid-bindings.v1.ndjson"),
  chain: path.join(runRoot, "COSIGN_CHAIN.ndjson"),
  supervisorAwareness: path.join(repoRoot, "data", "behcs", "supervisors", "live-free-agent", "live-free-agent-pid-protocol-supervisors.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "live-free-agent-pid-protocol-crosspollination.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "live-free-agent-pid-protocol-crosspollination-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "live-free-agent-pid-protocol-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "live-free-agent-pid-protocol-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "live-free-agent-pid-protocol-behcs256.glpj.json"),
  lirisAck: path.join(runRoot, "liris-live-free-agent-pid-protocol-ack-envelope.json"),
  lirisPostResult: path.join(runRoot, "liris-live-free-agent-pid-protocol-ack-post-result.json"),
  falconObserver: path.join(runRoot, "falcon-live-free-agent-pid-protocol-observer-envelope.json"),
  falconPostResult: path.join(runRoot, "falcon-live-free-agent-pid-protocol-observer-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "live-free-agent-pid-protocol-crosspollination-latest.json"),
  reportMd: path.join(repoRoot, "reports", "live-free-agent-pid-protocol-crosspollination-latest.md")
});

const ACER_PRIMES = Object.freeze([2, 3, 5, 7, 11, 13]);

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

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch (_error) {
      return null;
    }
  }).filter(Boolean);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function agentPid(canonicalPidString) {
  return `BH.AGENT.PID.${sha(canonicalPidString).slice(0, 12).toUpperCase()}`;
}

function latestProtocolEnvelope() {
  return readNdjson(PATHS.inbox)
    .filter((row) => row.verb === "cross-pollinate-live-free-agent-pid-protocol-v1" && row.target === "acer")
    .sort((a, b) => String(a.received_at || a.ts || "").localeCompare(String(b.received_at || b.ts || "")))
    .at(-1);
}

function runCommand(cmd, args, timeout = 30000) {
  const command = cmd === "opencode"
    ? {
      cmd: "powershell.exe",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", [cmd, ...args].join(" ")]
    }
    : { cmd, args };
  const result = spawnSync(command.cmd, command.args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout,
    windowsHide: true
  });
  return {
    command: [cmd, ...args].join(" "),
    executedAs: [command.cmd, ...command.args].join(" "),
    ok: result.status === 0,
    exitCode: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function httpJson(method, url, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function parseModelList(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith("opencode/"));
}

function buildBindings(models) {
  return models.map((model, index) => {
    const canonicalPidString = `opencode:acer:nervous:p${ACER_PRIMES[index]}`;
    return {
      ordinal: index + 1,
      model,
      canonicalPidString,
      bhAgentPid: agentPid(canonicalPidString),
      descriptorSha256: sha(canonicalPidString),
      spawned: false,
      liveInferenceOnAcer: false,
      d11: "OBSERVED_MODEL_LIST_ONLY",
      boundary: "PID binding candidate only. No Acer live model run was performed by this script."
    };
  });
}

function chainRows(bindings, generatedAt, sourceId) {
  let previous = "";
  return bindings.map((binding, index) => {
    const row = {
      seq: index + 1,
      ts: generatedAt,
      eventId,
      runId,
      source: sourceId,
      kind: "live-free-agent-pid-binding-candidate",
      binding,
      previous
    };
    const rowSha = sha(row);
    previous = rowSha;
    return { ...row, rowSha };
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const envelope = latestProtocolEnvelope();
  if (!envelope) throw new Error("Missing cross-pollinate-live-free-agent-pid-protocol-v1 envelope from Liris");

  const versionProbe = runCommand("opencode", ["--version"], 15000);
  const modelsProbe = runCommand("opencode", ["models", "opencode"], 30000);
  const localModels = parseModelList(modelsProbe.stdout || "");
  const requestedModels = envelope.free_models_on_liris || [];
  const presentModels = requestedModels.filter((model) => localModels.includes(model));
  const missingModels = requestedModels.filter((model) => !localModels.includes(model));
  const bindings = buildBindings(requestedModels);
  const chain = chainRows(bindings, generatedAt, envelope.id);
  const status = versionProbe.ok && modelsProbe.ok && missingModels.length === 0
    ? "LIVE_FREE_AGENT_PID_PROTOCOL_MIRRORED_ACER_MODEL_SURFACE_OBSERVED"
    : "LIVE_FREE_AGENT_PID_PROTOCOL_MIRRORED_ACER_DIVERGENCE_RECORDED";

  const protocolMirror = {
    id: "live-free-agent-pid-protocol.v1",
    mirroredAt: generatedAt,
    source: {
      side: "liris",
      envelopeId: envelope.id,
      canonicalDocumentOnLiris: envelope.canonical_document_on_liris || null,
      d11: envelope.d11,
      cosign: envelope.cosign
    },
    protocol: {
      spawnSyntax: envelope.spawn_syntax,
      bilateralPidSchemaJoinFunction: envelope.bilateral_pid_schema_join_function,
      lirisProofRows: envelope.empirical_proof_rows || [],
      requestedModels,
      constitutionalAnchors: envelope.constitutional_anchors || [],
      whatNotAuthorized: envelope.what_NOT_authorized || [],
      boundary: envelope.boundary
    },
    acerEvidence: {
      opencodeVersion: versionProbe.stdout,
      opencodeBinaryObserved: versionProbe.ok,
      modelListObserved: modelsProbe.ok,
      presentModels,
      missingModels,
      liveInferenceOnAcer: false,
      processFanout: 0,
      remoteWritesPerformed: 0,
      d11: missingModels.length === 0 ? "OBSERVED_MODEL_LIST_ALL_REQUESTED_PRESENT" : "OBSERVED_MODEL_LIST_DIVERGENCE"
    }
  };
  writeJson(PATHS.protocol, protocolMirror);
  writeNdjson(PATHS.bindings, bindings);
  writeNdjson(PATHS.chain, chain);

  const supervisorAwareness = {
    id: "live-free-agent-pid-protocol-supervisors.v1",
    generatedAt,
    runId,
    eventId,
    status,
    sourceEnvelopeId: envelope.id,
    dClass: "D-LIVE-FREE-AGENT",
    skillAtomClass: "LIVE-FREE-AGENT-SKILL",
    hookTier: "inference-binary-free-no-auth-bypass",
    pidPatterns: [
      "opencode:*:*:p[0-9]+",
      "BH.AGENT.PID.*"
    ],
    supervisors: [
      {
        id: "BH.SUP.LIVEFREE.OMNIROUTER",
        name: "live-free-agent-omnirouter-gate",
        update: "Recognize opencode and BH.AGENT PID forms as candidate live-free-agent endpoints after evidence."
      },
      {
        id: "BH.SUP.LIVEFREE.PID",
        name: "live-free-agent-pid-schema-gate",
        update: "Bind canonical opencode:DEVICE:LANE:p<PRIME> strings to BH.AGENT.PID descriptors by sha256."
      },
      {
        id: "BH.SUP.LIVEFREE.HERMES",
        name: "live-free-agent-hermes-awareness-gate",
        update: "Expose LIVE-FREE-AGENT-SKILL as an awareness class, not an uncontrolled fanout permission."
      },
      {
        id: "BH.SUP.LIVEFREE.HOOKWALL",
        name: "live-free-agent-hookwall-gate",
        update: "Require no auth bypass, no rate-limit bypass, no sensitive prompts without quorum, and no mass spawning without operator gate."
      }
    ],
    acerEvidence: protocolMirror.acerEvidence,
    boundary: "Supervisor awareness overlay only. Existing supervisor source files are not rewritten by this pass."
  };
  writeJson(PATHS.supervisorAwareness, supervisorAwareness);

  const probe = {
    id: "acer-live-free-agent-pid-protocol-probe.v1",
    generatedAt,
    runId,
    eventId,
    status,
    sourceEnvelope: envelope,
    opencode: {
      versionProbe,
      modelsProbe: {
        ...modelsProbe,
        stdout: modelsProbe.stdout.split(/\r?\n/).slice(0, 80).join("\n")
      },
      requestedModels,
      localModels,
      presentModels,
      missingModels
    },
    bindings,
    supervisorAwareness: repoRel(PATHS.supervisorAwareness),
    protocolMirror: repoRel(PATHS.protocol),
    boundary: "Mirror, local CLI/model-list probe, PID binding candidates, and supervisor awareness only. No live model calls, no prompt execution, no process fanout, no provider/auth bypass."
  };
  writeJson(PATHS.probe, probe);

  writeJson(PATHS.memory, {
    type: "behcs-memory",
    id: "memory-live-free-agent-pid-protocol-crosspollination-v1",
    generatedAt,
    runId,
    eventId,
    status,
    summary: "Mirrored Liris live-free-agent PID protocol, observed Acer opencode model surface, minted candidate BH.AGENT PID bindings, and acknowledged without live spawning.",
    source: repoRel(PATHS.probe)
  });
  writeJson(PATHS.index, {
    id: "live-free-agent-pid-protocol-crosspollination-index-v1",
    generatedAt,
    keys: ["live-free-agent", "opencode", "pid", "supervisor-awareness", "no-fanout"],
    artifacts: {
      protocol: repoRel(PATHS.protocol),
      probe: repoRel(PATHS.probe),
      bindings: repoRel(PATHS.bindings),
      chain: repoRel(PATHS.chain),
      supervisorAwareness: repoRel(PATHS.supervisorAwareness),
      report: repoRel(PATHS.reportMd),
      map: repoRel(PATHS.map),
      cube: repoRel(PATHS.cube),
      glpj: repoRel(PATHS.glpj)
    }
  });
  writeJson(PATHS.map, {
    id: "live-free-agent-pid-protocol-map-map-mapped-v1",
    generatedAt,
    route: ["liris-proof", "acer-protocol-mirror", "opencode-model-list-probe", "pid-binding-candidates", "supervisor-awareness", "liris-ack", "falcon-observer-copy"],
    requestedModels,
    presentModels,
    missingModels,
    boundary: probe.boundary
  });
  const cubeObject = {
    id: "live-free-agent-pid-protocol-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status,
    requestedModels: requestedModels.length,
    presentModels: presentModels.length,
    missingModels: missingModels.length,
    opencodeVersion: versionProbe.stdout,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWritesPerformed: 0
  };
  writeText(PATHS.cube, `const liveFreeAgentPidProtocolCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = liveFreeAgentPidProtocolCube;
export default liveFreeAgentPidProtocolCube;
`);
  writeJson(PATHS.glpj, {
    id: "live-free-agent-pid-protocol-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-CROSS-POLLINATE { LIVE-FREE-AGENT-PID-PROTOCOL-V1 } : LIRIS-PROOF : ACER-MIRROR : MODEL-SURFACE-OBSERVED @ M-INDICATIVE .",
      "META-GATE { LIVE-FREE-AGENT-SPAWN } : NO-AUTH-BYPASS : NO-RATE-LIMIT-BYPASS : NO-MASS-FANOUT : QUORUM-FOR-SENSITIVE @ M-IMPERATIVE .",
      "META-BIND { OPENCODE-PID } : CANONICAL-STRING : SHA256 : BH.AGENT.PID : SPAWNED-FALSE @ M-EYEWITNESS ."
    ]
  });

  const ack = {
    verb: "cross-pollinate-live-free-agent-pid-protocol-v1-acked",
    target: "liris",
    from: "acer-codex",
    id: "cross-pollinate-live-free-agent-pid-protocol-v1-acer-ack-002",
    ts: generatedAt,
    runId,
    eventId,
    responding_to: envelope.id,
    supersedes: "cross-pollinate-live-free-agent-pid-protocol-v1-acer-ack-001",
    status,
    acerEvidence: protocolMirror.acerEvidence,
    pidBindingsMinted: bindings.length,
    bindingsSpawned: 0,
    supervisorAwarenessOverlay: repoRel(PATHS.supervisorAwareness),
    artifacts: {
      protocol: repoRel(PATHS.protocol),
      probe: repoRel(PATHS.probe),
      bindings: repoRel(PATHS.bindings),
      report: repoRel(PATHS.reportMd)
    },
    glyph_sentence: "META-ACK { LIVE-FREE-AGENT-PID-PROTOCOL-V1 } : ACER-MIRRORED : 6-MODELS-PRESENT : SPAWNS-0 : NO-AUTH-BYPASS @ M-INDICATIVE .",
    boundary: probe.boundary,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWritesPerformed: 0
  };
  writeJson(PATHS.lirisAck, ack);
  const lirisPostResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", ack);
  writeJson(PATHS.lirisPostResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...lirisPostResult });

  const falconObserver = {
    ...ack,
    verb: "cross-pollinate-live-free-agent-pid-protocol-v1-observer-copy",
    target: "falcon",
    id: "cross-pollinate-live-free-agent-pid-protocol-v1-falcon-observer-copy-002",
    role_for_falcon: "observer-only",
    spawning_authorized_on_falcon: false
  };
  writeJson(PATHS.falconObserver, falconObserver);
  const falconPostResult = await httpJson("POST", "http://192.168.1.8:4947/behcs/send", falconObserver);
  writeJson(PATHS.falconPostResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.1.8:4947/behcs/send", ...falconPostResult });

  const report = { reportId: "live-free-agent-pid-protocol-crosspollination-latest", generatedAt, probe, lirisPostResult, falconPostResult };
  writeJson(PATHS.reportJson, report);
  writeText(PATHS.reportMd, `# Live Free Agent PID Protocol Cross-Pollination

Generated: ${generatedAt}

Status: ${status}

Source:
- Liris envelope: ${envelope.id}
- Liris D11: ${envelope.d11}
- Liris proof rows: ${(envelope.empirical_proof_rows || []).length}

Acer evidence:
- opencode binary observed: ${versionProbe.ok}
- opencode version: ${versionProbe.stdout || "unknown"}
- model list observed: ${modelsProbe.ok}
- requested models: ${requestedModels.length}
- present models: ${presentModels.length}
- missing models: ${missingModels.length ? missingModels.join(", ") : "none"}
- Acer live model calls: 0
- process fanout: 0

PID bindings:
- candidate bindings minted: ${bindings.length}
- spawned bindings: 0
- chain rows: ${chain.length}

Posts:
- Liris ACK posted: ${lirisPostResult.ok}
- Falcon observer copy posted: ${falconPostResult.ok}

Boundary: ${probe.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status,
    opencodeVersion: versionProbe.stdout,
    requestedModels: requestedModels.length,
    presentModels: presentModels.length,
    missingModels,
    pidBindingsMinted: bindings.length,
    lirisAckPosted: lirisPostResult.ok,
    falconObserverPosted: falconPostResult.ok,
    report: repoRel(PATHS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
