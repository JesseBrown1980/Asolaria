#!/usr/bin/env node
/** ASO Export Tool — full state snapshot.
 *  Produces data/aso/aso-export-{timestamp}.json
 *  Chain: LX-153, LX-170 */
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
process.env.ASOLARIA_INSTANCE_ROOT = process.env.ASOLARIA_INSTANCE_ROOT || projectRoot;
const aso = require("../src/index-kernel/aso");

const ASO_DIR = aso.ASO_DATA_DIR;
const TABLES_DIR = path.join(ASO_DIR, "tables");
const CROSSWALK_PATH = path.join(ASO_DIR, "crosswalk.json");

const TABLE_NAMES = [
  "topics", "observations", "relations", "outcomes",
  "surfaces", "evidence", "conflicts"
];

function readJson(fp) {
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, "utf8") || "{}"); }
  catch (_) { return null; }
}

function readTable(name) {
  const fp = path.join(TABLES_DIR, `${name}.json`);
  const d = readJson(fp);
  return (d && Array.isArray(d.rows)) ? d : { tableName: name, rows: [], updatedAt: "" };
}

// --- Gather all 7 tables ---
const tables = {};
for (const name of TABLE_NAMES) tables[name] = readTable(name);
const crosswalk = readJson(CROSSWALK_PATH) || { mappings: {} };

// --- Counts ---
const counts = {};
for (const name of TABLE_NAMES) counts[name] = tables[name].rows.length;
counts.crosswalkMappings = Object.keys(crosswalk.mappings || crosswalk).length;

const bootTopics = tables.topics.rows.filter(r => r.tier === "boot");
const openConflicts = tables.conflicts.rows.filter(r => r.resolutionState === "open");

// --- Build export payload ---
const now = new Date();
const tsStamp = now.toISOString().replace(/[:.]/g, "-");

const exportPayload = {
  _meta: {
    format: "aso-full-export",
    version: 1,
    exportedAt: now.toISOString(),
    exportedBy: process.env.ASOLARIA_AGENT_NAME || "aso-export-tool",
    description: "Complete ASO state snapshot"
  },
  summary: {
    counts,
    bootTopics: bootTopics.map(t => ({ asoId: t.asoId, name: t.name, type: t.type })),
    openConflicts: openConflicts.map(c => ({
      conflictId: c.conflictId, topicId: c.topicId,
      entryA: c.entryA, entryB: c.entryB,
      description: c.description || ""
    }))
  },
  tables: Object.fromEntries(TABLE_NAMES.map(n => [n, tables[n].rows])),
  crosswalk: crosswalk.mappings || crosswalk
};

// --- Write ---
const outPath = path.join(ASO_DIR, `aso-export-${tsStamp}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(exportPayload, null, 2), "utf8");

const stats = fs.statSync(outPath);
const sizeKB = (stats.size / 1024).toFixed(1);

console.log("ASO export complete");
console.log(`  path : ${outPath}`);
console.log(`  size : ${sizeKB} KB (${stats.size} bytes)`);
console.log(`  counts: ${JSON.stringify(counts)}`);
console.log(`  boot topics   : ${bootTopics.length}`);
console.log(`  open conflicts: ${openConflicts.length}`);
