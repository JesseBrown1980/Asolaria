#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const supervisorRoot = path.join(repoRoot, "data", "behcs", "supervisors");
const pidFabricRoot = path.join(repoRoot, "data", "behcs", "pid-fabric");

const OUTPUTS = Object.freeze({
  index: path.join(pidFabricRoot, "index", "supervisor-pid-indicator-index-latest.json"),
  ndjson: path.join(pidFabricRoot, "requests", "supervisor-pid-indicator-latest.ndjson"),
  preload: path.join(pidFabricRoot, "preload", "supervisor-pid-preload-bindings-latest.json"),
  reportJson: path.join(repoRoot, "reports", "supervisor-pid-indicator-index-latest.json"),
  reportMd: path.join(repoRoot, "reports", "supervisor-pid-indicator-index-latest.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "supervisor-pid-indicator-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "supervisor-pid-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "supervisor-pid-indicator-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "supervisor-pid-indicator.glpj.json")
});

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) {
    return filePath.replace(/\\/g, "/");
  }
  return relative.replace(/\\/g, "/");
}

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

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableIndicatorPid(seed) {
  const hex = sha256(seed).slice(0, 14);
  const n = BigInt(`0x${hex}`) % 1000000000000n;
  return `BH.SUP.IND.${n.toString().padStart(12, "0")}`;
}

function listJsonFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  const output = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        output.push(full);
      }
    }
  }
  return output.sort((a, b) => repoRel(a).localeCompare(repoRel(b)));
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { __parseError: error.message };
  }
}

function text(value, fallback = "") {
  const out = String(value || "").trim();
  return out || fallback;
}

function supervisorSetId(doc, filePath) {
  return text(
    doc.supervisorSetId || doc.id || doc.setId || doc.integrationId,
    path.basename(filePath, ".json")
  );
}

function directSupervisorRows(doc) {
  if (Array.isArray(doc.supervisors)) {
    return doc.supervisors;
  }
  if (doc.supervisor && typeof doc.supervisor === "object" && !Array.isArray(doc.supervisor)) {
    return [doc.supervisor];
  }
  return [];
}

function normalizeSupervisorRow(row, context) {
  const rawId = text(row.id || row.supervisorId || row.name || row.title, "unnamed-supervisor");
  const seed = `${context.setId}:${context.file}:${rawId}`;
  const nativePid = text(row.pid || row.pidRef || row.pid_ref || row.supervisorPid, "");
  const indicatorPid = nativePid || stableIndicatorPid(seed);
  return {
    indicatorPid,
    nativePid: nativePid || null,
    pidSource: nativePid ? "native" : "deterministic_indicator",
    supervisorId: rawId,
    title: text(row.title || row.role || row.domain || rawId, rawId),
    role: text(row.role || row.domain || row.authority || "", ""),
    authority: text(row.authority || row.writePolicy || row.decision || "", ""),
    setId: context.setId,
    sourceFile: context.file,
    sourceIndex: context.index,
    glyph: text(row.glyph || row.behcsGlyph || "", ""),
    status: text(row.status || context.status || "", ""),
    hash: sha256(JSON.stringify({ context, row })).slice(0, 16)
  };
}

function buildRegistry(generatedAt) {
  const files = listJsonFiles(supervisorRoot);
  const parseErrors = [];
  const sets = [];
  const supervisors = [];
  const pidCounts = new Map();

  for (const filePath of files) {
    const doc = readJson(filePath);
    const rel = repoRel(filePath);
    if (doc.__parseError) {
      parseErrors.push({ sourceFile: rel, error: doc.__parseError });
      continue;
    }
    const rows = directSupervisorRows(doc);
    const setId = supervisorSetId(doc, filePath);
    const setRecord = {
      setId,
      sourceFile: rel,
      status: text(doc.status || doc.d11 || doc.authority || "", ""),
      supervisorCount: rows.length,
      nativePidCount: rows.filter((row) => text(row.pid || row.pidRef || row.pid_ref || row.supervisorPid, "")).length,
      indicatorPidCount: rows.length
    };
    sets.push(setRecord);
    rows.forEach((row, index) => {
      const normalized = normalizeSupervisorRow(row, {
        setId,
        file: rel,
        status: setRecord.status,
        index
      });
      supervisors.push(normalized);
      pidCounts.set(normalized.indicatorPid, (pidCounts.get(normalized.indicatorPid) || 0) + 1);
    });
  }

  const duplicatePids = Array.from(pidCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([pid, count]) => ({ pid, count }));

  const nativePidCount = supervisors.filter((row) => row.pidSource === "native").length;
  const deterministicIndicatorCount = supervisors.length - nativePidCount;
  const index = {
    indexId: "supervisor-pid-indicator-index.v1",
    generatedAt,
    status: parseErrors.length || duplicatePids.length ? "PID_INDICATOR_HOLDS_PRESENT" : "PID_INDICATED",
    purpose: "Make every BEHCS supervisor addressable in the PID fabric while preserving native supervisor PIDs.",
    supervisorRoot: repoRel(supervisorRoot),
    counts: {
      supervisorFiles: files.length,
      parsedSupervisorSets: sets.length,
      supervisorRecords: supervisors.length,
      nativePidCount,
      deterministicIndicatorCount,
      parseErrors: parseErrors.length,
      duplicateIndicatorPids: duplicatePids.length
    },
    pidNamespace: {
      native: "preserved per supervisor source",
      deterministicIndicator: "BH.SUP.IND.<12-digit hash slot>",
      requestKind: "supervisor_pid_indicator"
    },
    sets,
    supervisors,
    parseErrors,
    duplicatePids,
    d11: parseErrors.length || duplicatePids.length ? "OBSERVED_WITH_HOLDS" : "PROVEN_LOCAL_INDEX"
  };
  index.indexHash = sha256(JSON.stringify(index));
  return index;
}

function buildPreload(index) {
  return {
    preloadId: "supervisor-pid-preload-bindings.v1",
    generatedAt: index.generatedAt,
    status: index.status,
    indexHash: index.indexHash,
    supervisorPidIndex: repoRel(OUTPUTS.index),
    loadContract: {
      preloadOnce: true,
      sendPerSupervisor: ["indicatorPid", "supervisorId", "setId", "sourceFile", "hash"],
      returnPerSupervisor: ["indicatorPid", "decision", "evidenceHash", "nextGate"],
      bannedPerSupervisor: ["secret material", "raw chatter", "unbounded process spawn"]
    },
    pids: index.supervisors.map((row) => ({
      indicatorPid: row.indicatorPid,
      nativePid: row.nativePid,
      supervisorId: row.supervisorId,
      setId: row.setId,
      sourceFile: row.sourceFile,
      hash: row.hash
    }))
  };
}

function buildNdjson(index) {
  return index.supervisors.map((row) => JSON.stringify({
    kind: "supervisor_pid_indicator",
    generatedAt: index.generatedAt,
    pid: row.indicatorPid,
    nativePid: row.nativePid,
    supervisorId: row.supervisorId,
    setId: row.setId,
    sourceFile: row.sourceFile,
    payloadShape: "pid_supervisor_identity_hash_only",
    hash: row.hash
  })).join("\n") + (index.supervisors.length ? "\n" : "");
}

function buildReport(index) {
  const topSets = index.sets
    .slice()
    .sort((a, b) => b.supervisorCount - a.supervisorCount)
    .slice(0, 12);
  const json = {
    reportId: "supervisor-pid-indicator-index-latest",
    generatedAt: index.generatedAt,
    status: index.status,
    counts: index.counts,
    indexHash: index.indexHash,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    topSets,
    d11: index.d11
  };
  const rows = topSets.map((set) => `| ${set.setId} | ${set.supervisorCount} | ${set.nativePidCount} | ${set.sourceFile} |`).join("\n");
  const md = `# Supervisor PID Indicator Index

Status: ${index.status}

Every supervisor under \`data/behcs/supervisors\` now has a PID-fabric indicator row. Native supervisor PIDs are preserved; missing PIDs receive deterministic \`BH.SUP.IND.*\` indicator PIDs.

## Counts

- Supervisor files: ${index.counts.supervisorFiles}
- Parsed supervisor sets: ${index.counts.parsedSupervisorSets}
- Supervisor records: ${index.counts.supervisorRecords}
- Native PID records: ${index.counts.nativePidCount}
- Deterministic indicator PID records: ${index.counts.deterministicIndicatorCount}
- Parse errors: ${index.counts.parseErrors}
- Duplicate indicator PIDs: ${index.counts.duplicateIndicatorPids}

## Largest Sets

| Set | Supervisors | Native PIDs | Source |
|---|---:|---:|---|
${rows || "| none | 0 | 0 | none |"}

## Outputs

- \`${repoRel(OUTPUTS.index)}\`
- \`${repoRel(OUTPUTS.ndjson)}\`
- \`${repoRel(OUTPUTS.preload)}\`
- \`${repoRel(OUTPUTS.map)}\`
- \`${repoRel(OUTPUTS.cube)}\`
- \`${repoRel(OUTPUTS.glpj)}\`

D11: ${index.d11}
`;
  return { json, md };
}

function buildMap(index) {
  return {
    mapId: "supervisor-pid-map-map-mapped.v1",
    generatedAt: index.generatedAt,
    status: "MAP_MAP_MAPPED",
    indexHash: index.indexHash,
    root: "all BEHCS supervisors are PID-indicated",
    edges: index.sets.map((set) => ({
      from: set.sourceFile,
      to: "data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json",
      relation: "supervisor_set_pid_indicated",
      count: set.supervisorCount
    })),
    d11: index.d11
  };
}

function buildGlpj(index) {
  return {
    glpjId: "supervisor-pid-indicator.glpj.v1",
    generatedAt: index.generatedAt,
    alphabet: "BEHCS-256",
    status: "MINTED",
    sentence: "SUPERVISOR -> PID_INDICATOR -> PRELOAD -> TINY_REQUEST -> RESULT_DELTA -> HERMES",
    glyphs: [
      {
        glyph: "SUP_PID_NATIVE",
        meaning: "Supervisor already carried a native PID and the PID fabric preserves it."
      },
      {
        glyph: "SUP_PID_INDICATOR",
        meaning: "Supervisor lacked a native PID and now has a deterministic BH.SUP.IND indicator."
      },
      {
        glyph: "SUP_PID_PRELOAD",
        meaning: "Supervisor identities can be preloaded once and referenced by tiny PID packets."
      },
      {
        glyph: "SUP_PID_HERMES_AWARE",
        meaning: "Hermes can address supervisor surfaces through the PID index."
      }
    ],
    counts: index.counts,
    d11: index.d11
  };
}

function buildMemory(index) {
  return {
    memoryId: "supervisor-pid-indicator-index.v1",
    generatedAt: index.generatedAt,
    event: "All local BEHCS supervisor sets were scanned and bound into the PID fabric as addressable indicator rows.",
    significance: "Supervisor authority is now PID-addressable. The global PID fabric can preload supervisor identities, refer to them by compact PID rows, and let Hermes/OmniShannon/GNN route decisions without embedding whole supervisor files in each request.",
    counts: index.counts,
    indexHash: index.indexHash,
    d11: index.d11
  };
}

function buildCube(index) {
  return `"use strict";

const supervisorPidIndicatorCube = Object.freeze({
  cubeId: "supervisor-pid-indicator-cube-cubed.v1",
  generatedAt: ${JSON.stringify(index.generatedAt)},
  status: "CUBE_CUBE_CUBED",
  index: "data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json",
  dimensions: Object.freeze({
    supervisorSet: "source supervisor set",
    supervisorId: "local supervisor identity",
    nativePid: "pid present in source artifact",
    indicatorPid: "deterministic PID if native pid is absent",
    preload: "preload-once supervisor identity binding",
    request: "tiny PID indicator request",
    hermes: "supervisor-of-supervisors route",
    outcome: "native|indicator|hold"
  }),
  classify(row) {
    if (!row || !row.indicatorPid) return "HOLD_NO_PID";
    if (row.nativePid) return "NATIVE_SUPERVISOR_PID";
    return "DETERMINISTIC_SUPERVISOR_INDICATOR_PID";
  },
  route(row) {
    const classification = this.classify(row);
    return {
      classification,
      allowed: classification !== "HOLD_NO_PID",
      pid: row && row.indicatorPid || "",
      requiredPreload: "supervisor-pid-preload-bindings-latest.json",
      requiredHermesAwareness: true
    };
  }
});

export default supervisorPidIndicatorCube;
`;
}

function run() {
  const generatedAt = new Date().toISOString();
  const index = buildRegistry(generatedAt);
  const preload = buildPreload(index);
  const report = buildReport(index);
  writeJson(OUTPUTS.index, index);
  writeText(OUTPUTS.ndjson, buildNdjson(index));
  writeJson(OUTPUTS.preload, preload);
  writeJson(OUTPUTS.reportJson, report.json);
  writeText(OUTPUTS.reportMd, report.md);
  writeJson(OUTPUTS.memory, buildMemory(index));
  writeJson(OUTPUTS.map, buildMap(index));
  writeJson(OUTPUTS.glpj, buildGlpj(index));
  writeText(OUTPUTS.cube, buildCube(index));
  console.log(JSON.stringify({
    ok: true,
    status: index.status,
    counts: index.counts,
    index: repoRel(OUTPUTS.index),
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

if (require.main === module) {
  run();
}

module.exports = {
  buildRegistry,
  stableIndicatorPid
};
