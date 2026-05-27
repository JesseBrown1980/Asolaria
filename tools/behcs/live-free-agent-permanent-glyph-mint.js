#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "live-free-agent-permanent-mint-20260427";
const eventId = "EVT-ACER-LIRIS-FALCON-LIVE-FREE-AGENT-PERMANENT-MINT-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const PATHS = Object.freeze({
  protocol: path.join(repoRoot, "data", "behcs", "protocols", "live-free-agent-pid-protocol.v1.json"),
  priorGlpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "live-free-agent-pid-protocol-behcs256.glpj.json"),
  priorSupervisor: path.join(repoRoot, "data", "behcs", "supervisors", "live-free-agent", "live-free-agent-pid-protocol-supervisors.v1.json"),
  family: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "live-free-agent-permanent-glyph-families.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "live-free-agent-permanent-glyph-mint.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "live-free-agent-permanent-glyph-mint-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "live-free-agent-permanent-mint-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "live-free-agent-permanent-mint-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "live-free-agent-permanent-mint-behcs256.glpj.json"),
  supervisorSet: path.join(repoRoot, "data", "behcs", "supervisors", "live-free-agent", "live-free-agent-permanent-mint-supervisors.v1.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "live-free-agent-permanent-mint-cosign-chain.ndjson"),
  runChain: path.join(runRoot, "COSIGN_CHAIN.ndjson"),
  lirisEnvelope: path.join(runRoot, "liris-live-free-agent-permanent-mint-ack-envelope.json"),
  lirisPostResult: path.join(runRoot, "liris-live-free-agent-permanent-mint-ack-post-result.json"),
  falconEnvelope: path.join(runRoot, "falcon-live-free-agent-permanent-mint-observer-envelope.json"),
  falconPostResult: path.join(runRoot, "falcon-live-free-agent-permanent-mint-observer-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "live-free-agent-permanent-glyph-mint-latest.json"),
  reportMd: path.join(repoRoot, "reports", "live-free-agent-permanent-glyph-mint-latest.md")
});

const GLYPHS_ALREADY_PRESENT = Object.freeze([
  "LX-WALK",
  "LX-WITNESS",
  "LX-NAME",
  "LX-FINGERPRINT",
  "LX-INGEST"
]);

const GLYPHS_ADDED = Object.freeze([
  "LX-SPAWN-FREE",
  "LX-PID-MINT-AGENT",
  "LX-ROUTE-SPAWN",
  "D-LIVE-FREE-AGENT",
  "D-LIVE-FREE-AGENT-SKILL",
  "D-AGENT-PID-LIRIS-FORM",
  "D-AGENT-PID-ACER-FORM",
  "PROF-LIVE-FREE-AGENT-OBSERVER",
  "EVT-LIVE-FREE-AGENT-SPAWN",
  "EVT-LIVE-FREE-AGENT-RESPONSE",
  "EVT-LIVE-FREE-AGENT-PID-MINTED",
  "META-LIVE-FREE-AGENT-EMPIRICAL-PROVEN"
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
  } catch (_error) {
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

function httpJson(method, url, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload
        ? { "content-type": "application/json", "content-length": payload.length, connection: "close" }
        : { connection: "close" },
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

function buildPermanentFamily(generatedAt, protocol) {
  return {
    id: "live-free-agent-permanent-glyph-families.v1",
    generatedAt,
    runId,
    eventId,
    status: "PERMANENT_MINTED_IN_ACER_BEHCS256_CANON",
    authority: "COSIGN-MERGED-034-EXTENDED + operator live instruction + Liris/Acer/Falcon cross-pollination evidence",
    operatorVerbatimGo: "2026-04-27: officially mint it into permanent existence unequivocally using the new BEHCS 256 glyph systems too",
    lirisObservedMint: {
      source: "operator-pasted Liris transcript",
      path: "C:/Users/rayss/Asolaria-BEHCS-256/kernel/glyph-families.json",
      status: "JSON validates on Liris transcript, 306 to 363 lines, last_mint live-free-agent-protocol-v1-permanent-mint",
      d11: "OBSERVED_FROM_LIRIS_BUS_TRANSCRIPT"
    },
    sourceProtocol: repoRel(PATHS.protocol),
    protocolSha256: protocol ? sha(protocol) : null,
    families: {
      lx: {
        prefix: "LX",
        defaultBlast: "operation",
        role: "file-supervisor plus live-free-agent verbs in BEHCS-256 v6+",
        glyphsAlreadyPresent: GLYPHS_ALREADY_PRESENT,
        glyphsAddedThisBatch: GLYPHS_ADDED.filter((glyph) => glyph.startsWith("LX-")),
        notes: "LX-WALK through LX-INGEST remain file-supervisor verbs. LX-SPAWN-FREE, LX-PID-MINT-AGENT, and LX-ROUTE-SPAWN route D-LIVE-FREE-AGENT entities to supervisor-gated spawn protocol semantics, not filesystem reads."
      },
      live_free_agent: {
        prefix: "LFA",
        defaultBlast: "operation",
        role: "live-free-agent classification and bilateral PID schema markers",
        glyphsAddedThisBatch: GLYPHS_ADDED.filter((glyph) => !glyph.startsWith("LX-")),
        notes: "Bilateral PID schema is preserved: Liris opencode:DEVICE:LANE:pN and Acer BH.AGENT.PID.* forms join by descriptor sha256."
      }
    },
    permanentPin: {
      status: "PERMANENT_UNTIL_QUAD_QUORUM_SUPERSEDES",
      quorumRequiredToDeprecate: ["acer", "lineage_liris", "hermes", "sentinel_kr"],
      reason: "The event is now a language-level primitive, not a temporary run artifact."
    },
    empiricalEvidence: {
      lirisProofRows: protocol?.protocol?.lirisProofRows?.length || 0,
      acerRequestedModels: protocol?.protocol?.requestedModels?.length || 0,
      acerPresentModels: protocol?.acerEvidence?.presentModels?.length || 0,
      acerLiveInference: protocol?.acerEvidence?.liveInferenceOnAcer === true,
      processFanout: protocol?.acerEvidence?.processFanout || 0,
      falconRole: "observer-only"
    },
    boundary: "Permanent language mint only. This does not authorize uncontrolled spawning, auth bypass, provider limit bypass, sensitive prompts without quorum, Falcon spawning, or remote mutation."
  };
}

function buildChainRow(generatedAt, family) {
  const base = {
    seq: 1,
    ts: generatedAt,
    eventId,
    runId,
    kind: "live-free-agent-permanent-glyph-mint",
    status: family.status,
    glyphsAddedThisBatch: GLYPHS_ADDED,
    glyphsAlreadyPresent: GLYPHS_ALREADY_PRESENT,
    authority: family.authority,
    permanentPin: family.permanentPin,
    protocolSha256: family.protocolSha256,
    previous: ""
  };
  return { ...base, rowSha: sha(base) };
}

async function run() {
  const generatedAt = new Date().toISOString();
  const protocol = readJson(PATHS.protocol);
  if (!protocol) throw new Error(`Missing protocol mirror: ${repoRel(PATHS.protocol)}`);

  const family = buildPermanentFamily(generatedAt, protocol);
  const chainRow = buildChainRow(generatedAt, family);
  writeJson(PATHS.family, family);
  appendNdjson(PATHS.chain, chainRow);
  writeText(PATHS.runChain, JSON.stringify(chainRow));

  const memory = {
    type: "behcs-memory",
    id: "memory-live-free-agent-permanent-glyph-mint-v1",
    generatedAt,
    runId,
    eventId,
    status: "LIVE_FREE_AGENT_PERMANENT_GLYPH_MINTED",
    summary: "Live-free-agent protocol is now minted as a permanent BEHCS-256 glyph family on Acer, aligned with Liris permanent mint evidence and Falcon observer copy.",
    permanentPin: family.permanentPin,
    glyphsAddedThisBatch: GLYPHS_ADDED,
    source: repoRel(PATHS.family)
  };

  const index = {
    id: "live-free-agent-permanent-glyph-mint-index-v1",
    generatedAt,
    keys: [
      "live-free-agent",
      "permanent-mint",
      "BEHCS-256",
      "LX-SPAWN-FREE",
      "D-LIVE-FREE-AGENT",
      "quad-quorum"
    ],
    artifacts: {
      family: repoRel(PATHS.family),
      memory: repoRel(PATHS.memory),
      chain: repoRel(PATHS.chain),
      map: repoRel(PATHS.map),
      cube: repoRel(PATHS.cube),
      glpj: repoRel(PATHS.glpj),
      supervisorSet: repoRel(PATHS.supervisorSet),
      report: repoRel(PATHS.reportMd)
    }
  };

  const map = {
    id: "live-free-agent-permanent-mint-map-map-mapped-v1",
    generatedAt,
    route: [
      "liris-empirical-proof",
      "acer-model-surface-observation",
      "falcon-observer-copy",
      "BEHCS-256-glyph-family-mint",
      "cosign-chain-row",
      "memory-index-map-cube-glpj",
      "supervisor-awareness"
    ],
    glyphsAddedThisBatch: GLYPHS_ADDED,
    permanentPin: family.permanentPin,
    boundary: family.boundary
  };

  const glpj = {
    id: "live-free-agent-permanent-mint-behcs256-glpj-v1",
    generatedAt,
    eventId,
    sentences: [
      "META-MINT { LIVE-FREE-AGENT-PROTOCOL-V1 } : BEHCS-256 : PERMANENT-GLYPH-FAMILY : LIRIS-ACER-FALCON-ALIGNED @ M-INDICATIVE .",
      "META-PIN { LX-SPAWN-FREE LX-PID-MINT-AGENT LX-ROUTE-SPAWN } : D-LIVE-FREE-AGENT : BH.AGENT.PID : SHA256-JOIN @ M-EYEWITNESS .",
      "META-GATE { LIVE-FREE-AGENT-SPAWN } : NO-AUTH-BYPASS : NO-MASS-FANOUT : QUAD-QUORUM-FOR-SENSITIVE : FALCON-OBSERVER-ONLY @ M-IMPERATIVE .",
      "META-CLOSURE { LIVE-FREE-AGENT-PERMANENT-MINT } : MEMORY : INDEX : MAP-MAP-MAPPED : CUBE-CUBE-CUBED : GLPJ : COSIGN-CHAIN @ M-CLOSURE ."
    ],
    glyphsAddedThisBatch: GLYPHS_ADDED,
    permanentPin: family.permanentPin
  };

  const supervisorSet = {
    id: "live-free-agent-permanent-mint-supervisors.v1",
    generatedAt,
    runId,
    eventId,
    status: "SUPERVISORS_AWARE_OF_PERMANENT_MINT",
    supervisors: [
      {
        id: "BH.SUP.LIVEFREE.PERMANENT.GLYPH",
        name: "live-free-agent-permanent-glyph-mint-gate",
        responsibility: "Treat LX-SPAWN-FREE, LX-PID-MINT-AGENT, LX-ROUTE-SPAWN, and D-LIVE-FREE-AGENT as permanent BEHCS-256 language primitives."
      },
      {
        id: "BH.SUP.LIVEFREE.PERMANENT.QUORUM",
        name: "live-free-agent-quad-quorum-deprecation-gate",
        responsibility: "Block deprecation or semantic weakening unless acer, lineage_liris, hermes, and sentinel_kr all cosign."
      },
      {
        id: "BH.SUP.LIVEFREE.PERMANENT.BOUNDARY",
        name: "live-free-agent-boundary-preservation-gate",
        responsibility: "Preserve no-auth-bypass, no-mass-fanout, no-sensitive-without-quorum, Falcon-observer-only constraints."
      }
    ],
    glyphsAddedThisBatch: GLYPHS_ADDED,
    permanentPin: family.permanentPin
  };

  writeJson(PATHS.memory, memory);
  writeJson(PATHS.index, index);
  writeJson(PATHS.map, map);
  writeJson(PATHS.glpj, glpj);
  writeJson(PATHS.supervisorSet, supervisorSet);
  writeText(PATHS.cube, `// Generated ${generatedAt}
module.exports = ${JSON.stringify({
  id: "live-free-agent-permanent-mint-cube-cubed",
  eventId,
  status: "CUBE_CUBE_CUBED",
  glyphsAddedThisBatch: GLYPHS_ADDED,
  permanentPin: family.permanentPin,
  boundary: family.boundary
}, null, 2)};
`);

  const lirisEnvelope = {
    verb: "live-free-agent-permanent-mint-acer-cosign",
    target: "liris",
    from: "acer-codex",
    id: "live-free-agent-permanent-mint-20260427-acer-cosign-001",
    ts: generatedAt,
    eventId,
    status: "ACER_PERMANENT_MINTED_AND_COSIGNED",
    familySha256: sha(family),
    chainRowSha256: chainRow.rowSha,
    glyphsAddedThisBatch: GLYPHS_ADDED,
    artifacts: index.artifacts,
    d11: "PROVEN_LOCAL_ACER_CANON_MINT_WITH_LIRIS_TRANSCRIPT_OBSERVED",
    boundary: family.boundary
  };

  const falconEnvelope = {
    ...lirisEnvelope,
    verb: "live-free-agent-permanent-mint-falcon-observer-copy",
    target: "falcon",
    id: "live-free-agent-permanent-mint-20260427-falcon-observer-copy-001",
    status: "FALCON_OBSERVER_COPY_ONLY"
  };

  writeJson(PATHS.lirisEnvelope, lirisEnvelope);
  writeJson(PATHS.falconEnvelope, falconEnvelope);
  const lirisPost = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", lirisEnvelope);
  const falconPost = await httpJson("POST", "http://192.168.1.8:4947/behcs/send", falconEnvelope);
  writeJson(PATHS.lirisPostResult, { postedAt: new Date().toISOString(), result: lirisPost });
  writeJson(PATHS.falconPostResult, { postedAt: new Date().toISOString(), result: falconPost });

  const report = {
    ok: true,
    status: memory.status,
    eventId,
    glyphsAdded: GLYPHS_ADDED.length,
    glyphsAlreadyPresent: GLYPHS_ALREADY_PRESENT.length,
    familySha256: sha(family),
    chainRowSha256: chainRow.rowSha,
    lirisPostOk: lirisPost.ok,
    falconPostOk: falconPost.ok,
    artifacts: index.artifacts
  };

  writeJson(PATHS.reportJson, report);
  writeText(PATHS.reportMd, [
    "# Live Free Agent Permanent Glyph Mint",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${memory.status}`,
    "",
    `Glyphs added this batch: ${GLYPHS_ADDED.length}`,
    `Glyphs already present: ${GLYPHS_ALREADY_PRESENT.length}`,
    "",
    "Added glyphs:",
    ...GLYPHS_ADDED.map((glyph) => `- ${glyph}`),
    "",
    `Family sha256: ${report.familySha256}`,
    `Chain row sha256: ${report.chainRowSha256}`,
    "",
    "Posts:",
    `- Liris accepted: ${lirisPost.ok}`,
    `- Falcon observer accepted: ${falconPost.ok}`,
    "",
    "Artifacts:",
    ...Object.values(index.artifacts).map((artifact) => `- ${artifact}`),
    "",
    `Boundary: ${family.boundary}`
  ].join("\n"));

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
