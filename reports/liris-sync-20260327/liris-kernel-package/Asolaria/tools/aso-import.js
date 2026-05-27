#!/usr/bin/env node
/** ASO Import Tool — restores state from an aso-export JSON.
 *  Usage: node tools/aso-import.js path/to/aso-export-*.json
 *  Idempotent: safe to run multiple times on the same export.
 *  Chain: LX-153, LX-170 */
"use strict";
const fs = require("fs"), path = require("path");
const aso = require("../src/index-kernel/aso");
const CW_PATH = path.join(aso.ASO_DATA_DIR, "crosswalk.json");
const TBL = (n) => path.join(aso.ASO_DATA_DIR, "tables", `${n}.json`);

function readJson(fp) {
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, "utf8") || "{}"); } catch (_) { return null; }
}
function writeJson(fp, d) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  const tmp = `${fp}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2), "utf8");
  if (fs.existsSync(fp)) fs.rmSync(fp, { force: true });
  fs.renameSync(tmp, fp);
}
function tblRows(name) { const d = readJson(TBL(name)); return (d && d.rows) || []; }

// --- Validate input ---
const exportPath = process.argv[2];
if (!exportPath) { console.error("Usage: node tools/aso-import.js <export.json>"); process.exit(1); }
const absPath = path.resolve(exportPath);
if (!fs.existsSync(absPath)) { console.error(`File not found: ${absPath}`); process.exit(1); }
const data = readJson(absPath);
if (!data || !data._meta || data._meta.format !== "aso-full-export") {
  console.error("Invalid export: _meta.format must be 'aso-full-export'"); process.exit(1);
}

const t = data.tables || {}, S = {};
function inc(tbl, ok) { if (!S[tbl]) S[tbl] = [0, 0]; S[tbl][ok ? 0 : 1]++; }

// a. Topics (name dedup built into addTopic)
for (const r of (t.topics || [])) inc("topics", aso.addTopic(r).ok);

// b. Crosswalk (merge new mappings)
const cw = readJson(CW_PATH) || { mappings: {} };
let cwNew = 0;
for (const [k, v] of Object.entries(data.crosswalk || {})) {
  if (cw.mappings[k] === v) { inc("crosswalk", false); }
  else { cw.mappings[k] = v; cwNew++; inc("crosswalk", true); }
}
if (cwNew) writeJson(CW_PATH, cw);

// c. Relations (addRelation already dedup by from+verb+to)
for (const r of (t.relations || [])) {
  const res = aso.addRelation(r);
  inc("relations", res.ok && res.note !== "already_exists");
}

// d. Observations (dedup by observationId)
const obsIds = new Set(tblRows("observations").map(r => r.observationId));
for (const r of (t.observations || [])) {
  if (obsIds.has(r.observationId)) { inc("observations", false); continue; }
  if (aso.addObservation(r).ok) { obsIds.add(r.observationId); inc("observations", true); }
  else inc("observations", false);
}

// e. Outcomes (skip if same trigger exists for topic)
const outKeys = new Set(tblRows("outcomes").map(r => `${r.topicId}::${r.trigger}`));
for (const r of (t.outcomes || [])) {
  const k = `${r.topicId}::${r.trigger}`;
  if (outKeys.has(k)) { inc("outcomes", false); continue; }
  if (aso.addOutcome(r).ok) { outKeys.add(k); inc("outcomes", true); }
  else inc("outcomes", false);
}

// f. Evidence (skip if same sourceRef for topic)
const evdKeys = new Set(tblRows("evidence").map(r => `${r.topicId}::${r.sourceRef}`));
for (const r of (t.evidence || [])) {
  const k = `${r.topicId}::${r.sourceRef}`;
  if (evdKeys.has(k)) { inc("evidence", false); continue; }
  if (aso.addEvidence(r).ok) { evdKeys.add(k); inc("evidence", true); }
  else inc("evidence", false);
}

// g. Surfaces (dedup by surfaceId)
const srfIds = new Set(tblRows("surfaces").map(r => r.surfaceId));
for (const r of (t.surfaces || [])) {
  if (srfIds.has(r.surfaceId)) { inc("surfaces", false); continue; }
  if (aso.addSurface(r).ok) { srfIds.add(r.surfaceId); inc("surfaces", true); }
  else inc("surfaces", false);
}

// h. Conflicts (open only, dedup by conflictId)
const conIds = new Set(tblRows("conflicts").map(r => r.conflictId));
for (const r of (t.conflicts || [])) {
  if (r.resolutionState !== "open" || conIds.has(r.conflictId)) { inc("conflicts", false); continue; }
  if (aso.addConflict(r).ok) { conIds.add(r.conflictId); inc("conflicts", true); }
  else inc("conflicts", false);
}

// --- Report ---
const TABLES = ["topics","crosswalk","relations","observations","outcomes","evidence","surfaces","conflicts"];
console.log(`\nASO import complete — ${path.basename(absPath)}`);
console.log(`  source: exported ${data._meta.exportedAt} by ${data._meta.exportedBy}\n`);
console.log("  Table          Imported  Skipped");
console.log("  " + "-".repeat(38));
let totI = 0, totS = 0;
for (const n of TABLES) {
  const [i, s] = S[n] || [0, 0]; totI += i; totS += s;
  console.log(`  ${n.padEnd(16)} ${String(i).padStart(6)}   ${String(s).padStart(6)}`);
}
console.log("  " + "-".repeat(38));
console.log(`  ${"TOTAL".padEnd(16)} ${String(totI).padStart(6)}   ${String(totS).padStart(6)}`);
