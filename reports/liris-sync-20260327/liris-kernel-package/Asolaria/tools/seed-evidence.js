/**
 * seed-evidence.js — Populate the ASO evidence table with proven facts.
 *
 * Idempotent: skips entries whose sourceRef already exists in the evidence table.
 * Run: node tools/seed-evidence.js
 *
 * LX chain: LX-153, LX-170
 */

const aso = require("../src/index-kernel/aso");

const EVIDENCE_SEEDS = [
  {
    topicName: "Index Kernel",
    sourceKind: "test-output",
    sourceRef: "tests/index-kernel.unit.test.js",
    commandOrPath: "node --test tests/index-kernel.unit.test.js",
    verified: "2/2 pass"
  },
  {
    topicName: "ASO Language Runtime",
    sourceKind: "test-output",
    sourceRef: "tests/aso.unit.test.js",
    commandOrPath: "node --test tests/aso.unit.test.js",
    verified: "4/4 pass"
  },
  {
    topicName: "Append-Only Ledger",
    sourceKind: "integrity-check",
    sourceRef: "src/indexIntegrityEngine.js",
    commandOrPath: "runIntegrityCheck()",
    verified: "292 entries, 0 errors"
  },
  {
    topicName: "Encryption Before Connection",
    sourceKind: "archaeology",
    sourceRef: ".history/archaeology/GROUND-TRUTH.md",
    commandOrPath: "LX-134/135 recovery chain"
  },
  {
    topicName: "Index Language",
    sourceKind: "compression-metric",
    sourceRef: "LX-015",
    commandOrPath: "CATALOG.md ~1200 tokens for 14 entries, 12:1 ratio"
  },
  {
    topicName: "QDD eBacMap",
    sourceKind: "test-output",
    sourceRef: "jest.ez-protect.unit.config.js",
    commandOrPath: "EZ Protect 11/11 pass on pnpm 9"
  }
];

function findTopicId(topicName) {
  // Try searchTopics first
  const result = aso.searchTopics(topicName, { limit: 5 });
  if (result.matches && result.matches.length > 0) {
    // Prefer exact name match
    const exact = result.matches.find(
      (m) => m.name.toLowerCase() === topicName.toLowerCase()
    );
    if (exact) return exact.asoId;
    // Otherwise take best scored match
    return result.matches[0].asoId;
  }

  // Try crosswalk for legacy IDs
  const crosswalk = aso.getCrosswalk();
  for (const [legacyId, asoId] of Object.entries(crosswalk.mappings || {})) {
    if (legacyId.toLowerCase().includes(topicName.toLowerCase())) {
      return asoId;
    }
  }

  return null;
}

function existingSourceRefs() {
  // Read evidence table directly via getAsoStatus to check count,
  // then read the table file for dedup
  const fs = require("fs");
  const path = require("path");
  const evidencePath = path.join(aso.ASO_DATA_DIR, "tables", "evidence.json");
  if (!fs.existsSync(evidencePath)) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
    if (!data || !Array.isArray(data.rows)) return new Set();
    return new Set(data.rows.map((r) => r.sourceRef));
  } catch {
    return new Set();
  }
}

function main() {
  console.log("=== seed-evidence.js ===\n");

  const status = aso.getAsoStatus();
  console.log(`Evidence table before: ${status.counts.evidence} entries`);
  console.log(`Topics available: ${status.counts.topics}\n`);

  const existing = existingSourceRefs();
  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const seed of EVIDENCE_SEEDS) {
    // Idempotent: skip if sourceRef already recorded
    if (existing.has(seed.sourceRef)) {
      console.log(`  SKIP  "${seed.topicName}" — sourceRef "${seed.sourceRef}" already exists`);
      skipped++;
      continue;
    }

    const topicId = findTopicId(seed.topicName);
    if (!topicId) {
      console.log(`  FAIL  "${seed.topicName}" — topic not found in ASO`);
      failed++;
      continue;
    }

    const result = aso.addEvidence({
      topicId,
      sourceKind: seed.sourceKind,
      sourceRef: seed.sourceRef,
      commandOrPath: seed.commandOrPath
    });

    if (result.ok) {
      console.log(`  ADD   "${seed.topicName}" -> ${result.id} (topic ${topicId})`);
      added++;
    } else {
      console.log(`  FAIL  "${seed.topicName}" — ${result.error}`);
      failed++;
    }
  }

  const after = aso.getAsoStatus();
  console.log(`\nEvidence table after: ${after.counts.evidence} entries`);
  console.log(`Summary: ${added} added, ${skipped} skipped (idempotent), ${failed} failed`);
}

main();
