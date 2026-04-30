#!/usr/bin/env node
/** ASO Import Tool — restores state from an aso-export JSON.
 *  Usage: node tools/aso-import.js path/to/aso-export-*.json
 *  Idempotent: safe to run multiple times on the same export.
 *  Chain: LX-153, LX-170 */
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
process.env.ASOLARIA_INSTANCE_ROOT = process.env.ASOLARIA_INSTANCE_ROOT || projectRoot;
const aso = require("../src/index-kernel/aso");

const CROSSWALK_PATH = path.join(aso.ASO_DATA_DIR, "crosswalk.json");
const tablePath = (name) => path.join(aso.ASO_DATA_DIR, "tables", `${name}.json`);

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
  } catch (_) {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
  fs.renameSync(tempPath, filePath);
}

function tableRows(name) {
  const data = readJson(tablePath(name));
  return Array.isArray(data?.rows) ? data.rows : [];
}

function increment(summary, tableName, imported) {
  if (!summary[tableName]) summary[tableName] = [0, 0];
  summary[tableName][imported ? 0 : 1] += 1;
}

const exportPath = process.argv[2];
if (!exportPath) {
  console.error("Usage: node tools/aso-import.js <export.json>");
  process.exit(1);
}

const absoluteExportPath = path.resolve(exportPath);
if (!fs.existsSync(absoluteExportPath)) {
  console.error(`File not found: ${absoluteExportPath}`);
  process.exit(1);
}

const data = readJson(absoluteExportPath);
if (!data || data?._meta?.format !== "aso-full-export") {
  console.error("Invalid export: _meta.format must be 'aso-full-export'");
  process.exit(1);
}

const tables = data.tables || {};
const summary = {};

for (const row of tables.topics || []) {
  const result = aso.addTopic(row);
  increment(summary, "topics", Boolean(result.ok));
}

const crosswalk = readJson(CROSSWALK_PATH) || { mappings: {} };
let crosswalkNew = 0;
for (const [legacyId, asoId] of Object.entries(data.crosswalk || {})) {
  if (crosswalk.mappings[legacyId] === asoId) {
    increment(summary, "crosswalk", false);
    continue;
  }
  crosswalk.mappings[legacyId] = asoId;
  crosswalkNew += 1;
  increment(summary, "crosswalk", true);
}
if (crosswalkNew > 0) {
  writeJson(CROSSWALK_PATH, crosswalk);
}

for (const row of tables.relations || []) {
  const result = aso.addRelation(row);
  increment(summary, "relations", Boolean(result.ok) && result.note !== "already_exists");
}

const observationIds = new Set(tableRows("observations").map((row) => row.observationId));
for (const row of tables.observations || []) {
  if (observationIds.has(row.observationId)) {
    increment(summary, "observations", false);
    continue;
  }
  const result = aso.addObservation(row);
  if (result.ok) observationIds.add(row.observationId);
  increment(summary, "observations", Boolean(result.ok));
}

const outcomeKeys = new Set(tableRows("outcomes").map((row) => `${row.topicId}::${row.trigger}`));
for (const row of tables.outcomes || []) {
  const key = `${row.topicId}::${row.trigger}`;
  if (outcomeKeys.has(key)) {
    increment(summary, "outcomes", false);
    continue;
  }
  const result = aso.addOutcome(row);
  if (result.ok) outcomeKeys.add(key);
  increment(summary, "outcomes", Boolean(result.ok));
}

const evidenceKeys = new Set(tableRows("evidence").map((row) => `${row.topicId}::${row.sourceRef}`));
for (const row of tables.evidence || []) {
  const key = `${row.topicId}::${row.sourceRef}`;
  if (evidenceKeys.has(key)) {
    increment(summary, "evidence", false);
    continue;
  }
  const result = aso.addEvidence(row);
  if (result.ok) evidenceKeys.add(key);
  increment(summary, "evidence", Boolean(result.ok));
}

const surfaceIds = new Set(tableRows("surfaces").map((row) => row.surfaceId));
for (const row of tables.surfaces || []) {
  if (surfaceIds.has(row.surfaceId)) {
    increment(summary, "surfaces", false);
    continue;
  }
  const result = aso.addSurface(row);
  if (result.ok) surfaceIds.add(row.surfaceId);
  increment(summary, "surfaces", Boolean(result.ok));
}

const conflictIds = new Set(tableRows("conflicts").map((row) => row.conflictId));
for (const row of tables.conflicts || []) {
  if (row.resolutionState !== "open" || conflictIds.has(row.conflictId)) {
    increment(summary, "conflicts", false);
    continue;
  }
  const result = aso.addConflict(row);
  if (result.ok) conflictIds.add(row.conflictId);
  increment(summary, "conflicts", Boolean(result.ok));
}

const tableNames = [
  "topics",
  "crosswalk",
  "relations",
  "observations",
  "outcomes",
  "evidence",
  "surfaces",
  "conflicts"
];

console.log(`\nASO import complete — ${path.basename(absoluteExportPath)}`);
console.log(`  source: exported ${data._meta.exportedAt} by ${data._meta.exportedBy}\n`);
console.log("  Table          Imported  Skipped");
console.log(`  ${"-".repeat(38)}`);
let totalImported = 0;
let totalSkipped = 0;
for (const name of tableNames) {
  const [imported, skipped] = summary[name] || [0, 0];
  totalImported += imported;
  totalSkipped += skipped;
  console.log(`  ${name.padEnd(16)} ${String(imported).padStart(6)}   ${String(skipped).padStart(6)}`);
}
console.log(`  ${"-".repeat(38)}`);
console.log(`  ${"TOTAL".padEnd(16)} ${String(totalImported).padStart(6)}   ${String(totalSkipped).padStart(6)}`);
