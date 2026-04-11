/**
 * seed-outcomes.js — Populate the ASO outcomes table from documented ground truth.
 *
 * Idempotent: checks for existing outcomes with matching trigger text before inserting.
 * Source: cure-asolaria.md ground truth, QDD test results, GROUND-TRUTH.md archaeology.
 *
 * Usage: node tools/seed-outcomes.js
 */

const path = require("path");
const aso = require(path.join(__dirname, "..", "src", "index-kernel", "aso"));

// --- Ground truth outcome definitions ---

const OUTCOMES = [
  {
    trigger: "myth-kill LX-134/135",
    result: "lost encryption knowledge, stealth ports refused plaintext silently",
    // Topic: Encryption Before Connection (rule) — the direct consequence
    topicId: "ASO-7a73380002",
    linkedMistakes: [
      "ASO-2d78060002",  // Never kill needed connections — layer new ones
      "ASO-f77f230015",  // Port 18886 myth — full forensic report
      "ASO-a469620016",  // PERMANENT — Never delete security you don't understand
    ],
    linkedSkills: [
      "ASO-5ce8820183",  // RECOVERED — STEALTH PORTS
      "ASO-9d27d00184",  // RECOVERED — TWO PORT LAYERS
    ],
  },
  {
    trigger: "pnpm 10 upgrade + whatwg-url override",
    result: "TSC passes clean on Node 24",
    // Topic: QDD eBacMap
    topicId: "ASO-7ea6480005",
    linkedMistakes: [
      "ASO-29089b0006",  // Node 24 breaks @shelf/jest-mongodb (whatwg-url compat)
      "ASO-38f3e20020",  // Current pnpm10 install is blocked by native modules on Node 24
    ],
    linkedSkills: [
      "ASO-5a0c170187",  // pnpm 10 onlyBuiltDependencies
      "ASO-6e126c0283",  // RECOVERED — whatwg-url override context
    ],
  },
  {
    trigger: "EZ Protect tests on pnpm 9",
    result: "11/11 pass",
    // Topic: QDD eBacMap
    topicId: "ASO-7ea6480005",
    linkedMistakes: [
      "ASO-d130300019",  // EZ Protect test configs are branch-scoped
      "ASO-76636a0037",  // MISTAKE — ran QDD tests on wrong branch
    ],
    linkedSkills: [
      "ASO-7e8d260188",  // QDD test infrastructure mapping
      "ASO-5dc5d70208",  // EZ Protect integration passes on Node 24 when real Mongo active
    ],
  },
  {
    trigger: "jest root config run",
    result: "2/24 suites pass, 14 tests pass — remaining are pre-existing config issues",
    // Topic: QDD eBacMap
    topicId: "ASO-7ea6480005",
    linkedMistakes: [
      "ASO-b2184e0004",  // Jest ESM import in .js setup file
    ],
    linkedSkills: [
      "ASO-7e8d260188",  // QDD test infrastructure mapping
      "ASO-fe376c0189",  // QDD workspace libs need build before tests
    ],
  },
  {
    trigger: "append-only ledger + integrity engine",
    result: "292 entries verified, 0 duplicates, 0 type mismatches",
    // Topic: Append-Only Ledger (rule)
    topicId: "ASO-4250780004",
    linkedMistakes: [],
    linkedSkills: [],
  },
  {
    trigger: "staging gates with deep scan",
    result: "source integrity + line budget + scan contract + search smoke all pass",
    // Topic: Index Kernel (tool) — the runtime that enforces gates
    topicId: "ASO-2ffbe30006",
    linkedMistakes: [],
    linkedSkills: [],
  },
  {
    trigger: "ASO typed ops instead of file overwrite",
    result: "agents can append observations without erasing each other",
    // Topic: ASO Language Runtime (tool)
    topicId: "ASO-cf51760007",
    linkedMistakes: [],
    linkedSkills: [],
  },
];

// --- Idempotent seed logic ---

function main() {
  const existing = aso.getAsoStatus();
  console.log(`[seed-outcomes] ASO status before: outcomes=${existing.counts.outcomes}`);

  // Load current outcomes for dedup
  const outcomesTable = readOutcomesTable();
  const existingTriggers = new Set(outcomesTable.map((r) => r.trigger));

  let added = 0;
  let skipped = 0;

  for (const def of OUTCOMES) {
    if (existingTriggers.has(def.trigger)) {
      console.log(`  SKIP (exists): "${def.trigger}"`);
      skipped++;
      continue;
    }

    const res = aso.addOutcome({
      topicId: def.topicId,
      trigger: def.trigger,
      result: def.result,
      linkedMistakes: def.linkedMistakes,
      linkedSkills: def.linkedSkills,
    });

    if (res.ok) {
      console.log(`  ADD  ${res.id}: "${def.trigger}" -> "${def.result.slice(0, 60)}..."`);
      added++;
    } else {
      console.error(`  FAIL: "${def.trigger}" -> ${res.error}`);
    }
  }

  const after = aso.getAsoStatus();
  console.log(`\n[seed-outcomes] Done. added=${added}, skipped=${skipped}, total outcomes=${after.counts.outcomes}`);
}

function readOutcomesTable() {
  // Use the same path convention as aso.js
  const fs = require("fs");
  const tablesDir = path.join(aso.ASO_DATA_DIR, "tables");
  const outPath = path.join(tablesDir, "outcomes.json");
  if (!fs.existsSync(outPath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(outPath, "utf8"));
    return Array.isArray(data.rows) ? data.rows : [];
  } catch {
    return [];
  }
}

main();
