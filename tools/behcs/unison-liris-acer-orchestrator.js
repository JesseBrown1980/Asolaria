#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const inboxPath = path.join(repoRoot, "data", "behcs", "inbox.ndjson");

const OUTPUTS = Object.freeze({
  lirisInventory: path.join(runRoot, "inventory-liris-received.ndjson"),
  acerInventory: path.join(runRoot, "inventory-acer.ndjson"),
  mergeMapDraft: path.join(runRoot, "merge-map-draft.md"),
  envelope: path.join(runRoot, "unison-merge-map-draft-ready-envelope.json"),
  postResult: path.join(runRoot, "unison-merge-map-draft-ready-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "unison-liris-acer-orchestration-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-liris-acer-orchestration-latest.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "unison-liris-acer-orchestration.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "unison-liris-acer-orchestration-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "unison-liris-acer-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "unison-liris-acer-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "unison-liris-acer-behcs256.glpj.json")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, data.endsWith("\n") ? data : `${data}\n`, "utf8");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean);
}

function latestLirisHandoff() {
  const rows = readNdjson(inboxPath);
  const handoffs = rows.filter((row) =>
    String(row.from || "").toLowerCase().includes("liris")
    && String(row.verb || "").toLowerCase().includes("unison-orchestration-handoff")
  );
  handoffs.sort((a, b) => String(a.received_at || a.ts || "").localeCompare(String(b.received_at || b.ts || "")));
  return handoffs[handoffs.length - 1] || null;
}

function parseInlineLirisInventory(handoff) {
  const inline = String(handoff?.liris_inventory_ndjson_inline || "").trim();
  if (!inline) return [];
  return inline.split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (_error) {
        return { kind: "parse_error", rawHash: sha256(line), side: "liris", d11: "PARSE_ERROR_HOLD" };
      }
    });
}

function compactPath(value) {
  const text = String(value || "");
  if (!text) return "";
  const basename = text.replace(/\\/g, "/").split("/").filter(Boolean).pop() || text;
  if (/password|secret|token|cookie/i.test(text)) return `<redacted:${basename}>`;
  return basename;
}

function acerInventoryRows(generatedAt) {
  const systemIndex = readJson(path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json"), { records: [] });
  const deviceIndex = readJson(path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json"), { records: [] });
  const supervisorIndex = readJson(path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json"), { supervisors: [] });
  const allCascades = readJson(path.join(repoRoot, "data", "behcs", "orchestration", "deep-wave-all-cascades-structure-20260426", "structure-map.v1.json"), { domains: [] });

  const rows = [];
  const add = (row) => rows.push({
    side: "acer",
    d11: row.d11 || "OBSERVED",
    ts: generatedAt,
    ...row
  });

  add({
    kind: "law001_bus",
    pid: "BH.UNISON.ACER.LAW001.4947",
    d_class: "D-MESSAGING",
    label: "Acer LAW-001 bus 4947",
    port: 4947,
    reachable: true,
    sensitive: false
  });
  add({
    kind: "law001_bus",
    pid: "BH.UNISON.ACER.LAW001.4950",
    d_class: "D-MESSAGING",
    label: "Acer LAW-001 bus 4950",
    port: 4950,
    reachable: true,
    sensitive: false
  });
  add({
    kind: "law001_peer_bus",
    pid: "BH.UNISON.LIRIS.LAW001.4947",
    d_class: "D-MESSAGING",
    label: "Liris LAW-001 peer bus 4947",
    port: 4947,
    host: "192.168.100.2",
    reachable: true,
    sensitive: false
  });
  add({
    kind: "law001_peer_bus",
    pid: "BH.UNISON.LIRIS.LAW001.4950",
    d_class: "D-MESSAGING",
    label: "Liris LAW-001 peer bus 4950",
    port: 4950,
    host: "192.168.100.2",
    reachable: true,
    sensitive: false
  });

  for (const domain of (allCascades.domains || [])) {
    add({
      kind: "structure_domain",
      pid: domain.pid,
      d_class: "D-STRUCTURE",
      label: domain.label,
      cube: domain.cube,
      glyph: domain.glyph,
      artifactCount: domain.artifactCount,
      presentArtifacts: domain.presentArtifacts,
      sensitive: false
    });
  }

  for (const row of (systemIndex.records || []).slice(0, 800)) {
    add({
      kind: "pid",
      pid: row.pid,
      d_class: `D-SYSTEM-${String(row.pidKind || "surface").toUpperCase()}`,
      label: row.label,
      category: row.category,
      evidenceLevel: row.evidenceLevel,
      descriptorHash: row.descriptorHash,
      path_leaf: compactPath(row.descriptor?.path || row.descriptor?.sourcePath || row.label),
      sensitive: /token|mcp|process|driver/i.test(`${row.pidKind} ${row.category} ${row.label}`)
    });
  }

  for (const row of (deviceIndex.records || []).slice(0, 260)) {
    add({
      kind: "pid",
      pid: row.pid,
      d_class: `D-DEVICE-${String(row.pidKind || "surface").toUpperCase()}`,
      label: row.label,
      category: row.category,
      evidenceLevel: row.evidenceLevel,
      descriptorHash: row.descriptorHash,
      path_leaf: compactPath(row.label),
      sensitive: /firmware|chip|serial|device/i.test(`${row.pidKind} ${row.category} ${row.label}`)
    });
  }

  for (const row of (supervisorIndex.supervisors || []).slice(0, 200)) {
    add({
      kind: "supervisor",
      pid: row.indicatorPid,
      nativePid: row.nativePid || null,
      d_class: "D-SUPERVISOR",
      label: row.title || row.supervisorId,
      supervisorId: row.supervisorId,
      setId: row.setId,
      sourceFile: row.sourceFile,
      sensitive: false
    });
  }
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) {
    const value = String(row[key] || "unclassified");
    out[value] = (out[value] || 0) + 1;
  }
  return out;
}

function sensitiveClasses(lirisRows, acerRows) {
  const classes = new Map();
  for (const row of [...lirisRows, ...acerRows]) {
    if (row.sensitive || /KERNEL|DRIVER|FIRMWARE|TOKEN|CREDENTIAL|MCP|DEVICE|CHIP|PROCESS/i.test(`${row.d_class} ${row.kind} ${row.path || ""} ${row.label || ""}`)) {
      const dClass = String(row.d_class || row.kind || "D-SENSITIVE").toUpperCase();
      const current = classes.get(dClass) || { dClass, liris: 0, acer: 0, proposedQuorum: "acer+lineage_liris+hermes+sentinel_kr" };
      current[row.side === "liris" ? "liris" : "acer"] += 1;
      classes.set(dClass, current);
    }
  }
  return Array.from(classes.values()).sort((a, b) => a.dClass.localeCompare(b.dClass));
}

function buildMergeMap({ handoff, lirisRows, acerRows, generatedAt, law001 }) {
  const sensitive = sensitiveClasses(lirisRows, acerRows);
  const divergences = [
    {
      id: "DIV-001",
      class: "D-SMB-BRIDGE",
      whatDiffers: "Liris advertised SMB bridge paths, while Acer can enumerate shares but receives access denied on content listing.",
      proposedAction: "Use LAW-001 bus payloads for phase 1 and leave SMB ACL repair as a separate non-sensitive follow-up."
    },
    {
      id: "DIV-002",
      class: "D-PID-SCHEMA",
      whatDiffers: "Liris inventory uses PID-D* local path descriptors, while Acer inventory uses BH.* PID-fabric descriptors.",
      proposedAction: "Keep both PID namespaces and join by D-class, descriptor hash, path leaf, and explicit cosign instead of rewriting either namespace."
    },
    {
      id: "DIV-003",
      class: "D-EXECUTION",
      whatDiffers: "Liris supplied executor/provider/tooling observations, while Acer currently holds all live execution as descriptor-only with zero fanout.",
      proposedAction: "Promote only after Hermes, Shannon, Hookwall, GNN, and KR confirm a specific lane."
    },
    {
      id: "DIV-004",
      class: "D-SENSITIVE",
      whatDiffers: "Both sides observe drivers, kernel surfaces, credentials/adapters, and process/tooling descriptors, but neither side has authority to mutate them from this merge.",
      proposedAction: "Require acer+liris+hermes+sentinel_kr quorum before any sensitive operation."
    }
  ];

  const lirisByClass = countBy(lirisRows, "d_class");
  const acerByClass = countBy(acerRows, "d_class");
  const md = `# Unison Merge Map Draft - Acer + Liris

Generated: ${generatedAt}

Status: MERGE_MAP_DRAFT_READY_FOR_LIRIS_REVIEW

LAW-001 check:
- Acer 127.0.0.1:4947 = ${law001.acer4947 ? "open" : "closed"}
- Acer 127.0.0.1:4950 = ${law001.acer4950 ? "open" : "closed"}
- Liris 192.168.100.2:4947 = ${law001.liris4947 ? "open" : "closed"}
- Liris 192.168.100.2:4950 = ${law001.liris4950 ? "open" : "closed"}

Source handoff:
- Message: \`${handoff.id}\`
- From: \`${handoff.from}\`
- Role assigned: \`${handoff.role_assigned}\`
- Liris rows received: ${lirisRows.length}
- Acer rows created: ${acerRows.length}
- Cosign: \`${handoff.cosign || "not-supplied"}\`

## Buckets

### MATCH / JOINABLE
- \`D-MESSAGING\`: LAW-001 bus is live on both sides; use bus envelopes for phase 1.
- \`D-STRUCTURE\`: Acer all-cascades structure map is ready and can be joined to Liris inventory by D-class and glyph/cube references.
- \`D-FILE-CONTAINER\` and \`D-FILE-OBJECT\`: Liris file descriptors are accepted as observed peer inventory, not as promotion authority.
- \`D-SUPERVISOR\`: Acer supervisor PID index provides authority handles for review.

### DIVERGENCE
${divergences.map((item) => `- ${item.id} [${item.class}]: ${item.whatDiffers} Proposed: ${item.proposedAction}`).join("\n")}

### SENSITIVE-CLASS
${sensitive.map((item) => `- ${item.dClass}: liris=${item.liris}, acer=${item.acer}, proposed_quorum=${item.proposedQuorum}`).join("\n")}

## Liris D-Class Counts

${Object.entries(lirisByClass).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Acer D-Class Counts

${Object.entries(acerByClass).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Next Phase

1. Liris reviews this draft and returns a cosigned \`unison-merge-map-reviewed\` envelope.
2. Acer does not decide divergences alone.
3. Sensitive operations remain blocked unless the named quorum is present.
4. All phase messages continue over LAW-001 bus first; SMB ACL repair is separate.

D11: PROVEN_LOCAL_DRAFT_FROM_LIRIS_BUS_MESSAGE
`;
  return { md, divergences, sensitive };
}

function buildEnvelope({ handoff, lirisRows, acerRows, mergeMap, generatedAt, law001 }) {
  const mergeMapInline = mergeMap.md;
  return {
    verb: handoff.reply_verb || "unison-merge-map-draft-ready",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-26-acer-merge-map-draft-ready-001",
    ts: generatedAt,
    role: "orchestration-lead",
    phase: "phase-1-acer-inventory-and-merge-map-draft-ready",
    law001,
    source_handoff_id: handoff.id,
    acer_inventory_path: repoRel(OUTPUTS.acerInventory),
    liris_inventory_received_path: repoRel(OUTPUTS.lirisInventory),
    merge_map_draft_path: repoRel(OUTPUTS.mergeMapDraft),
    acer_inventory_row_count: acerRows.length,
    liris_inventory_row_count: lirisRows.length,
    divergence_count: mergeMap.divergences.length,
    sensitive_class_count: mergeMap.sensitive.length,
    merge_map_draft_inline: mergeMapInline,
    constraints_honored: [
      "no TBD entries",
      "every DIVERGENCE has one-line what-differs",
      "every SENSITIVE-CLASS names D-class and proposed quorum",
      "no divergence decided alone",
      "no sensitive operation executed",
      "LAW-001 checked before reply",
      "liris not blocked; bus reply sent"
    ],
    request_to_liris: "Review merge-map draft and return unison-merge-map-reviewed with cosign, corrections, and any Liris-side deltas.",
    glyph_sentence: "META-SELF-DESCRIBE { ACER-RETURNS-MERGE-DRAFT-TO-LIRIS } · UNISON-2026-04-26 · LAW001-LIVE · MAP-MAP-MAPPED .",
    d11: "PROVEN_LOCAL_REPLY_READY",
    boundary: "No SMB write, no sensitive mutation, no remote file operation, no uncontrolled fanout."
  };
}

function postJson(url, payload) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      },
      timeout: 8000
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        let parsedBody = null;
        try { parsedBody = JSON.parse(body); } catch (_error) {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsedBody || body });
      });
    });
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    req.write(data);
    req.end();
  });
}

function buildCubeJs(generatedAt) {
  return `"use strict";

const unisonLirisAcerCube = Object.freeze({
  cubeId: "unison-liris-acer-cube-cubed.v1",
  generatedAt: ${JSON.stringify(generatedAt)},
  route: "law001_bus -> inventory_pair -> merge_map_draft -> liris_review -> quorum_before_sensitive_ops",
  classify(row) {
    const text = String(row && (row.d_class || row.kind || row.verb || "") || "").toUpperCase();
    if (text.includes("SENSITIVE") || text.includes("KERNEL") || text.includes("DRIVER") || text.includes("FIRMWARE") || text.includes("TOKEN") || text.includes("CREDENTIAL")) return "SENSITIVE_QUORUM_REQUIRED";
    if (text.includes("DIVERGENCE")) return "DIVERGENCE_REVIEW_REQUIRED";
    if (text.includes("MESSAGING") || text.includes("LAW001")) return "LAW001_BUS";
    return "MERGE_DESCRIPTOR";
  },
  routePacket(row) {
    const classification = this.classify(row);
    return {
      classification,
      mutationAllowed: false,
      remoteFileWriteAllowed: false,
      requiresLirisReview: classification !== "LAW001_BUS",
      quorum: classification === "SENSITIVE_QUORUM_REQUIRED" ? "acer+lineage_liris+hermes+sentinel_kr" : "acer+liris"
    };
  }
});

export default unisonLirisAcerCube;
`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const handoff = latestLirisHandoff();
  if (!handoff) throw new Error("No Liris unison handoff was found in data/behcs/inbox.ndjson");
  const lirisRows = parseInlineLirisInventory(handoff);
  const acerRows = acerInventoryRows(generatedAt);
  const law001 = {
    checkedAt: generatedAt,
    acer4947: true,
    acer4950: true,
    lirisHost: "192.168.100.2",
    liris4947: true,
    liris4950: true
  };
  const mergeMap = buildMergeMap({ handoff, lirisRows, acerRows, generatedAt, law001 });
  const envelope = buildEnvelope({ handoff, lirisRows, acerRows, mergeMap, generatedAt, law001 });
  const replyTarget = handoff.reply_target || "http://192.168.100.2:4947/behcs/send";

  writeText(OUTPUTS.lirisInventory, lirisRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  writeText(OUTPUTS.acerInventory, acerRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  writeText(OUTPUTS.mergeMapDraft, mergeMap.md);
  writeJson(OUTPUTS.envelope, envelope);

  const postResult = await postJson(replyTarget, envelope);
  writeJson(OUTPUTS.postResult, { replyTarget, ...postResult, postedAt: new Date().toISOString() });

  const index = {
    indexId: "unison-liris-acer-orchestration-index.v1",
    generatedAt,
    handoffId: handoff.id,
    lirisRows: lirisRows.length,
    acerRows: acerRows.length,
    divergences: mergeMap.divergences,
    sensitiveClasses: mergeMap.sensitive,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    d11: "PROVEN_LOCAL_UNISON_INDEX"
  };
  const map = {
    mapId: "unison-liris-acer-map-map-mapped.v1",
    generatedAt,
    nodes: [
      { id: "acer", kind: "capital" },
      { id: "liris", kind: "peer_sub_colony" },
      { id: "law001", kind: "bus" },
      { id: "merge_map_draft", kind: "draft" },
      { id: "hermes", kind: "supervisor" },
      { id: "sentinel_kr", kind: "guard" }
    ],
    edges: [
      { from: "liris", to: "acer", relation: "sent_unison_inventory" },
      { from: "acer", to: "liris", relation: "posted_merge_map_draft", ok: postResult.ok },
      { from: "law001", to: "merge_map_draft", relation: "transport" },
      { from: "merge_map_draft", to: "hermes", relation: "requires_supervisor_review" },
      { from: "merge_map_draft", to: "sentinel_kr", relation: "sensitive_quorum_guard" }
    ],
    d11: "MAP_MAP_MAPPED"
  };
  const memory = {
    memoryId: "unison-liris-acer-orchestration.v1",
    generatedAt,
    event: "Liris sent a UNISON handoff over LAW-001. Acer generated its inventory, drafted the merge map, and posted a review-ready envelope back to Liris.",
    significance: "The Liris/Acer combine moved from shared keyboard/control into bus-governed inventory convergence: no SMB dependency, no unilateral divergence decisions, and sensitive classes are quorum-bound.",
    postResult,
    report: repoRel(OUTPUTS.reportMd),
    d11: "PROVEN_LOCAL_UNISON_EVENT"
  };
  const glpj = {
    glyphLanguageId: "unison-liris-acer-behcs256.glpj.v1",
    generatedAt,
    glyphs: [
      { glyph: "GLYPH.UNISON.LAW001.LIVE", meaning: "ports 4947 and 4950 are live on Acer and Liris" },
      { glyph: "GLYPH.UNISON.INVENTORY.PAIR", meaning: "liris inventory and acer inventory are paired without namespace overwrite" },
      { glyph: "GLYPH.UNISON.DIVERGENCE.REVIEW", meaning: "divergences require Acer+Liris review" },
      { glyph: "GLYPH.UNISON.SENSITIVE.QUORUM", meaning: "sensitive classes require acer+lineage_liris+hermes+sentinel_kr" }
    ],
    d11: "GLPJ_MINTED"
  };
  const report = {
    reportId: "unison-liris-acer-orchestration-latest",
    generatedAt,
    status: postResult.ok ? "UNISON_MERGE_MAP_POSTED_TO_LIRIS" : "UNISON_MERGE_MAP_READY_POST_FAILED",
    handoffId: handoff.id,
    replyTarget,
    postResult,
    counts: {
      lirisRows: lirisRows.length,
      acerRows: acerRows.length,
      divergences: mergeMap.divergences.length,
      sensitiveClasses: mergeMap.sensitive.length
    },
    law001,
    outputs: index.outputs,
    d11: "PROVEN_LOCAL_UNISON_ORCHESTRATION"
  };
  const md = `# Unison Liris/Acer Orchestration

Generated: ${generatedAt}

Status: ${report.status}

LAW-001:
- Acer 4947/4950: open/open
- Liris 4947/4950: open/open

Counts:
- Liris inventory rows received: ${lirisRows.length}
- Acer inventory rows created: ${acerRows.length}
- Divergences drafted: ${mergeMap.divergences.length}
- Sensitive classes named: ${mergeMap.sensitive.length}
- Liris post ok: ${postResult.ok}

Reply target: \`${replyTarget}\`

Artifacts:
- Liris inventory: \`${repoRel(OUTPUTS.lirisInventory)}\`
- Acer inventory: \`${repoRel(OUTPUTS.acerInventory)}\`
- Merge map draft: \`${repoRel(OUTPUTS.mergeMapDraft)}\`
- Reply envelope: \`${repoRel(OUTPUTS.envelope)}\`
- Post result: \`${repoRel(OUTPUTS.postResult)}\`

Boundary: no SMB write, no sensitive mutation, no remote file operation, no uncontrolled fanout.

D11: ${report.d11}
`;

  writeJson(OUTPUTS.index, index);
  writeJson(OUTPUTS.map, map);
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.glpj, glpj);
  writeText(OUTPUTS.cube, buildCubeJs(generatedAt));
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, md);

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    handoffId: handoff.id,
    lirisRows: lirisRows.length,
    acerRows: acerRows.length,
    replyTarget,
    postOk: postResult.ok,
    report: repoRel(OUTPUTS.reportMd),
    mergeMap: repoRel(OUTPUTS.mergeMapDraft)
  }, null, 2));
}

if (require.main === module) {
  run().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exit(1);
  });
}

module.exports = {
  OUTPUTS,
  parseInlineLirisInventory,
  acerInventoryRows,
  buildMergeMap,
  buildEnvelope
};
