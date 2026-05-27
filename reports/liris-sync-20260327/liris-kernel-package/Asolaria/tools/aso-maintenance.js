#!/usr/bin/env node
/** ASO Maintenance Tool — log rotation, table stats, conflict archival.
 *  Usage: node tools/aso-maintenance.js
 *  Chain: LX-153 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ASO_DIR = path.join(ROOT, "data", "aso");
const TABLES_DIR = path.join(ASO_DIR, "tables");
const OPS_LOG = path.join(ASO_DIR, "ops-log.ndjson");
const ARCHIVE_PATH = path.join(ASO_DIR, "conflicts-archive.json");

const TABLE_NAMES = [
  "topics", "observations", "relations", "outcomes",
  "surfaces", "evidence", "conflicts"
];
const RESOLVED_STATES = ["resolved", "accepted", "dismissed"];
const STALE_DAYS = 7;

function ts() { return new Date().toISOString().replace(/[:.]/g, "-"); }

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

// --- 1. Rotate ops-log.ndjson ---
function rotateOpsLog() {
  if (!fs.existsSync(OPS_LOG)) {
    console.log("[rotate] No ops-log.ndjson found — nothing to rotate.");
    return { rotated: false, lines: 0, bytes: 0, backupFile: null };
  }
  const stat = fs.statSync(OPS_LOG);
  const content = fs.readFileSync(OPS_LOG, "utf8");
  const lines = content.split("\n").filter(Boolean).length;
  const backupName = `ops-log-${ts()}.ndjson.bak`;
  const backupPath = path.join(ASO_DIR, backupName);
  fs.renameSync(OPS_LOG, backupPath);
  fs.writeFileSync(OPS_LOG, "", "utf8");
  console.log(`[rotate] ${lines} lines (${(stat.size / 1024).toFixed(1)} KB) -> ${backupName}`);
  return { rotated: true, lines, bytes: stat.size, backupFile: backupName };
}

// --- 2. Table size report ---
function reportTableSizes() {
  console.log("[tables] Row counts:");
  const sizes = {};
  for (const name of TABLE_NAMES) {
    const p = path.join(TABLES_DIR, `${name}.json`);
    const data = readJson(p);
    const count = (data && Array.isArray(data.rows)) ? data.rows.length : 0;
    sizes[name] = count;
    console.log(`  ${name.padEnd(14)} ${count}`);
  }
  return sizes;
}

// --- 3. Archive resolved conflicts older than 7 days ---
function archiveStaleConflicts() {
  const p = path.join(TABLES_DIR, "conflicts.json");
  const table = readJson(p);
  if (!table || !Array.isArray(table.rows)) {
    console.log("[conflicts] No conflicts table found.");
    return { archived: 0 };
  }
  const cutoff = Date.now() - STALE_DAYS * 86400000;
  const stale = [];
  const keep = [];
  for (const row of table.rows) {
    const isResolved = RESOLVED_STATES.includes(row.resolutionState);
    const resolvedTime = row.resolvedAt ? new Date(row.resolvedAt).getTime() : 0;
    if (isResolved && resolvedTime > 0 && resolvedTime < cutoff) {
      stale.push(row);
    } else {
      keep.push(row);
    }
  }
  if (stale.length === 0) {
    console.log("[conflicts] No stale resolved conflicts to archive.");
    return { archived: 0 };
  }
  const archive = readJson(ARCHIVE_PATH) || { archivedAt: [], entries: [] };
  archive.archivedAt.push(new Date().toISOString());
  archive.entries.push(...stale);
  writeJson(ARCHIVE_PATH, archive);
  table.rows = keep;
  table.updatedAt = new Date().toISOString();
  writeJson(p, table);
  console.log(`[conflicts] Archived ${stale.length} resolved conflicts (older than ${STALE_DAYS}d).`);
  return { archived: stale.length };
}

// --- 4. Record maintenance observation via aso-client ---
function recordObservation(summary) {
  try {
    const aso = require(path.join(ROOT, "src", "aso-client"));
    const res = aso.observe("ASO-cf51760007", summary, { tags: ["maintenance", "automated"] });
    if (res && res.ok) console.log(`[observe] Recorded observation on ASO-cf51760007`);
    else console.log(`[observe] aso-client returned: ${JSON.stringify(res)}`);
    return res;
  } catch (err) {
    console.log(`[observe] Could not record observation: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// --- Main ---
(function main() {
  console.log(`\n=== ASO Maintenance — ${new Date().toISOString()} ===\n`);
  const rotation = rotateOpsLog();
  console.log();
  const sizes = reportTableSizes();
  console.log();
  const archival = archiveStaleConflicts();
  console.log();
  const totalRows = Object.values(sizes).reduce((a, b) => a + b, 0);
  const summary = `Maintenance run: log rotated (${rotation.lines} ops, ${(rotation.bytes / 1024).toFixed(1)}KB), `
    + `${totalRows} total rows across ${TABLE_NAMES.length} tables, `
    + `${archival.archived} stale conflicts archived.`;
  recordObservation(summary);
  console.log(`\n=== Done ===\n`);
})();
