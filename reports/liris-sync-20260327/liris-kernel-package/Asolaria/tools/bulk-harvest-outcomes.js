#!/usr/bin/env node
/** bulk-harvest-outcomes.js — backfill outcomes for skill, tool, and connector topics.
 *  Idempotent: skips topics that already have at least one outcome. */

const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const TABLES = path.join(ROOT, "data", "aso", "tables");
const SKILLS_DIR = path.join(ROOT, "skills");

function readTable(name) {
  return JSON.parse(fs.readFileSync(path.join(TABLES, `${name}.json`), "utf8"));
}

// Use aso-client for outcome writes (handles ID generation + persistence)
const aso = require(path.join(ROOT, "src", "aso-client"));

// --- Load current state ---
const topics = readTable("topics");
const outcomesBefore = readTable("outcomes").rows.length;
const topicsWithOutcomes = new Set(
  readTable("outcomes").rows.map((r) => r.topicId)
);
const observations = readTable("observations");

let added = 0;
let skipped = 0;
let errors = 0;

// --- 1. Skill topics: read skill.json from skills/ directory ---
const skillTopics = topics.rows.filter((r) => r.type === "skill");
for (const t of skillTopics) {
  if (topicsWithOutcomes.has(t.asoId)) { skipped++; continue; }

  // Skill topics with skill/ prefix map to a directory name
  const dirName = t.name.startsWith("skill/") ? t.name.slice(6) : null;
  let description = null;

  if (dirName) {
    const sjPath = path.join(SKILLS_DIR, dirName, "skill.json");
    try {
      const sj = JSON.parse(fs.readFileSync(sjPath, "utf8"));
      description = sj.description || sj.title || null;
    } catch (_) { /* no skill.json — fall back to topic summary */ }
  }

  // Fallback: use the topic's own summary or body
  if (!description) {
    description = (t.summary || t.body || t.name || "").slice(0, 200);
  }
  if (!description) { errors++; continue; }

  const res = aso.outcome(t.asoId, "skill definition loaded", description);
  if (res && res.ok) { added++; topicsWithOutcomes.add(t.asoId); }
  else { errors++; }
}

// --- 2. Tool topics (non-connector) with observation but no outcome ---
const toolTopics = topics.rows.filter(
  (r) => r.type === "tool" && !r.name.startsWith("connector:")
);
for (const t of toolTopics) {
  if (topicsWithOutcomes.has(t.asoId)) { skipped++; continue; }

  const obs = observations.rows.filter((r) => r.topicId === t.asoId);
  if (obs.length === 0) { skipped++; continue; }

  const summary = obs[0].summary || obs[0].detail || "";
  if (!summary) { skipped++; continue; }

  const res = aso.outcome(t.asoId, t.name, summary.slice(0, 300));
  if (res && res.ok) { added++; topicsWithOutcomes.add(t.asoId); }
  else { errors++; }
}

// --- 3. Connector topics (tool type with connector: prefix) ---
const connectorTopics = topics.rows.filter(
  (r) => r.type === "tool" && r.name.startsWith("connector:")
);
for (const t of connectorTopics) {
  if (topicsWithOutcomes.has(t.asoId)) { skipped++; continue; }

  const res = aso.outcome(
    t.asoId,
    "connector wrapper loaded",
    "ASO telemetry active via withAso"
  );
  if (res && res.ok) { added++; topicsWithOutcomes.add(t.asoId); }
  else { errors++; }
}

// --- Report ---
const outcomesAfter = readTable("outcomes").rows.length;
console.log("=== Bulk Harvest Outcomes ===");
console.log(`Outcomes before : ${outcomesBefore}`);
console.log(`Outcomes after  : ${outcomesAfter}`);
console.log(`Added           : ${added}`);
console.log(`Skipped (exist) : ${skipped}`);
console.log(`Errors          : ${errors}`);

const totalTopics = topics.rows.length;
const pctBefore = ((new Set(readTable("outcomes").rows.map((r) => r.topicId)).size / totalTopics) * 100).toFixed(1);
console.log(`Topic coverage  : ${pctBefore}% of ${totalTopics} topics now have outcomes`);
