/**
 * harvest-outcomes.js — Harvest trigger/result pairs from test files,
 * cure-asolaria.md workflow, and GROUND-TRUTH.md archaeology.
 *
 * Idempotent: deduplicates on trigger text before inserting.
 * Usage: node tools/harvest-outcomes.js
 */

const fs = require("fs");
const path = require("path");
const aso = require(path.join(__dirname, "..", "src", "index-kernel", "aso"));

const ROOT = path.resolve(__dirname, "..");
const CURE_PATH = path.join(ROOT, ".agent", "workflows", "cure-asolaria.md");
const TRUTH_PATH = path.join(ROOT, ".history", "archaeology", "GROUND-TRUTH.md");
const TESTS_DIR = path.join(ROOT, "tests");

function readOutcomes() {
  const p = path.join(aso.ASO_DATA_DIR, "tables", "outcomes.json");
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, "utf8")).rows || []; }
  catch { return []; }
}

function findTopic(query) {
  const res = aso.searchTopics(query, { limit: 1 });
  return res.matches.length > 0 ? res.matches[0].asoId : null;
}

// --- 1. Parse cure-asolaria.md for completed [x] tasks with results ---
function harvestCureTasks() {
  if (!fs.existsSync(CURE_PATH)) return [];
  const text = fs.readFileSync(CURE_PATH, "utf8");
  const outcomes = [];
  let currentSection = "";

  for (const line of text.split("\n")) {
    const hdr = line.match(/^###?\s+(.+)/);
    if (hdr) { currentSection = hdr[1].replace(/\[.*?\]/g, "").trim(); continue; }

    // Completed tasks with bold result lines
    const task = line.match(/^-\s+\[x\]\s+(.+)/i);
    if (task) {
      const raw = task[1].replace(/\*\*/g, "").trim();
      // Skip very short items or items without a clear result
      if (raw.length < 15) continue;
      // Extract trigger/result from items with " — " or " -- " separator
      let trigger, result;
      const sep = raw.match(/^(.+?)\s*[—–-]{1,3}\s+(.+)$/);
      if (sep && sep[1].length > 8 && sep[2].length > 8) {
        trigger = sep[1].trim();
        result = sep[2].trim();
      } else {
        trigger = raw.slice(0, 80);
        result = `COMPLETE in ${currentSection}`;
      }
      outcomes.push({ trigger, result, section: currentSection });
    }

    // Bold status lines with colon results
    const bold = line.match(/^-\s+\*\*(.+?):\*\*\s+(.+)/);
    if (bold && bold[2].length > 10) {
      outcomes.push({ trigger: bold[1].trim(), result: bold[2].trim(), section: currentSection });
    }
  }
  return outcomes;
}

// --- 2. Parse test files for outcomes ---
function harvestTestFiles() {
  if (!fs.existsSync(TESTS_DIR)) return [];
  const files = fs.readdirSync(TESTS_DIR).filter(f => f.endsWith(".test.js"));
  const outcomes = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(TESTS_DIR, f), "utf8");
    const its = (src.match(/\b(it|test)\s*\(/g) || []).length;
    if (its > 0) {
      outcomes.push({ trigger: `run ${f}`, result: `${its} test cases defined`, file: f });
    }
  }
  return outcomes;
}

// --- 3. Parse GROUND-TRUTH.md for agent decisions with outcomes ---
function harvestArchaeology() {
  if (!fs.existsSync(TRUTH_PATH)) return [];
  const text = fs.readFileSync(TRUTH_PATH, "utf8");
  const outcomes = [];

  // Section 7 table: agent decisions with outcomes
  const rows = text.match(/\|\s*\d+\s*\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|/g) || [];
  for (const row of rows) {
    const cols = row.split("|").map(c => c.trim()).filter(Boolean);
    if (cols.length >= 4) {
      const decision = cols[3]; // Decision column
      const outcome = cols[4];  // Outcome column
      if (decision && outcome && outcome.length > 5 &&
          /GOOD|BAD|MIXED|NEUTRAL/.test(outcome)) {
        outcomes.push({
          trigger: decision.replace(/\*\*/g, "").slice(0, 120),
          result: outcome.replace(/\*\*/g, "").slice(0, 200),
        });
      }
    }
  }

  // Root causes (Section 8) — each has a "What's wrong" / "The fix"
  const rcBlocks = text.split(/### Root Cause \d+:/).slice(1);
  for (const block of rcBlocks) {
    const title = (block.match(/^(.+)/) || ["", ""])[1].trim();
    const fix = (block.match(/\*\*The fix:\*\*\n([\s\S]*?)(?=\n### |\n---|\n## |$)/) || ["", ""])[1].trim();
    if (title && fix) {
      const firstFix = fix.split("\n").find(l => l.match(/^\d+\./)) || fix.split("\n")[0];
      outcomes.push({
        trigger: `Root cause: ${title.replace(/\*\*/g, "")}`.slice(0, 120),
        result: `Fix: ${firstFix.replace(/^\d+\.\s*/, "").trim()}`.slice(0, 200),
      });
    }
  }
  return outcomes;
}

// --- 4. Link to topics via search ---
function resolveTopicId(trigger, section) {
  const queries = [trigger.slice(0, 40), section || ""].filter(Boolean);
  for (const q of queries) {
    const id = findTopic(q);
    if (id) return id;
  }
  // Fallback: Index Kernel as catch-all
  return findTopic("Index Kernel") || findTopic("ASO Language Runtime");
}

// --- Main ---
function main() {
  const before = aso.getAsoStatus();
  console.log(`[harvest] BEFORE: ${before.counts.outcomes} outcomes across ${before.counts.topics} topics`);

  const existing = new Set(readOutcomes().map(r => r.trigger));
  let added = 0, skipped = 0, failed = 0;

  function tryAdd(trigger, result, topicHint) {
    if (existing.has(trigger)) { skipped++; return; }
    const topicId = resolveTopicId(trigger, topicHint);
    if (!topicId) { console.log(`  SKIP (no topic): "${trigger.slice(0, 50)}"`); skipped++; return; }
    const res = aso.addOutcome({ topicId, trigger, result });
    if (res.ok) {
      console.log(`  ADD  ${res.id}: "${trigger.slice(0, 55)}" -> "${result.slice(0, 45)}"`);
      existing.add(trigger);
      added++;
    } else {
      console.log(`  FAIL: ${res.error} — "${trigger.slice(0, 40)}"`);
      failed++;
    }
  }

  console.log("\n--- Cure-Asolaria workflow tasks ---");
  for (const o of harvestCureTasks()) tryAdd(o.trigger, o.result, o.section);

  console.log("\n--- Test file outcomes ---");
  for (const o of harvestTestFiles()) tryAdd(o.trigger, o.result, o.file);

  console.log("\n--- Archaeology decisions & root causes ---");
  for (const o of harvestArchaeology()) tryAdd(o.trigger, o.result, null);

  const after = aso.getAsoStatus();
  console.log(`\n[harvest] AFTER: ${after.counts.outcomes} outcomes across ${after.counts.topics} topics`);
  console.log(`[harvest] added=${added}, skipped=${skipped}, failed=${failed}`);
  console.log(`[harvest] Delta: ${after.counts.outcomes - before.counts.outcomes} new outcomes`);
}

main();
