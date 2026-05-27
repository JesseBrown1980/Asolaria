#!/usr/bin/env node
/**
 * migrate-lx-to-aso.js — Seeds the ASO system from the existing LX corpus.
 *
 * Reads all LX entries via the index-kernel inventory/compile pipeline,
 * groups by type, assigns tiers, creates ASO topics + crosswalk mappings,
 * and builds relations from chain fields.
 *
 * Idempotent: skips entries whose LX id already exists in the crosswalk.
 *
 * Usage: node tools/migrate-lx-to-aso.js
 *
 * LX chain: LX-015, LX-041, LX-153, LX-154, LX-170
 */

const path = require("path");
const aso = require("../src/index-kernel/aso");
const { getSourceInventory } = require("../src/index-kernel/inventory");
const { buildCompiledDocuments } = require("../src/index-kernel/compile");

// --- Constants ---

const BOOT_CRITICAL_LX = new Set([
  "LX-015", "LX-041", "LX-122", "LX-204", "LX-001"
]);

// Types that map to ASO valid types directly
const ASO_TYPE_MAP = {
  identity: "identity",
  pattern: "pattern",
  skill: "skill",
  tool: "tool",
  mistake: "mistake",
  plan: "plan",
  rule: "rule",
  project: "topic",   // project -> topic (workstream anchor)
  task: "topic",       // task -> topic (workstream anchor)
  reference: "topic",  // reference -> topic
  policy: "rule"       // policy -> rule
};

// Tier assignment heuristics for non-boot entries
const TYPE_DEFAULT_TIER = {
  identity: "foundational",
  pattern: "foundational",
  rule: "foundational",
  skill: "operational",
  tool: "operational",
  mistake: "operational",
  plan: "ephemeral",
  project: "operational",
  task: "ephemeral",
  reference: "operational",
  policy: "foundational"
};

// --- Helpers ---

function resolveAsoType(lxType) {
  return ASO_TYPE_MAP[lxType] || "topic";
}

function resolveTier(lxId, lxType) {
  if (BOOT_CRITICAL_LX.has(lxId)) {
    return "boot";
  }
  return TYPE_DEFAULT_TIER[lxType] || "operational";
}

function extractChainRefs(chain) {
  // chain is an array of strings like ["LX-005", "IX-007", "LX-041"]
  if (!Array.isArray(chain)) return [];
  return chain.filter((ref) => /^(LX|IX)-\d{3,4}$/i.test(ref));
}

// --- Main ---

function main() {
  console.log("=== LX -> ASO Migration Tool ===\n");

  // Step 1: Read all LX entries via index-kernel inventory
  console.log("[1/6] Scanning LX corpus via index-kernel inventory...");
  const inventory = getSourceInventory({ profile: "staging" }, { forceSourceScan: true });
  const documents = buildCompiledDocuments(inventory);

  // Filter to LX entries only (canonical layer)
  const lxDocs = documents.filter((doc) => doc.prefix === "LX");
  console.log(`     Found ${lxDocs.length} LX documents across ${inventory.canonicalFiles.length} source files.`);

  if (lxDocs.length === 0) {
    console.log("\n  No LX entries found. Nothing to migrate.");
    return;
  }

  // Step 2: Group by type
  console.log("\n[2/6] Grouping by type...");
  const byType = {};
  for (const doc of lxDocs) {
    const t = doc.type || "unknown";
    if (!byType[t]) byType[t] = [];
    byType[t].push(doc);
  }
  for (const [type, entries] of Object.entries(byType).sort()) {
    console.log(`     ${type}: ${entries.length}`);
  }

  // Step 3: Check crosswalk for already-migrated entries
  console.log("\n[3/6] Checking crosswalk for already-migrated entries...");
  const existingCrosswalk = aso.getCrosswalk();
  const alreadyMigrated = new Set(Object.keys(existingCrosswalk.mappings));
  const skippedCount = lxDocs.filter((d) => alreadyMigrated.has(d.id)).length;
  const toMigrate = lxDocs.filter((d) => !alreadyMigrated.has(d.id));
  console.log(`     Already migrated: ${skippedCount}`);
  console.log(`     To migrate: ${toMigrate.length}`);

  if (toMigrate.length === 0) {
    console.log("\n  All entries already migrated. Nothing to do.");
    printStatus();
    return;
  }

  // Step 4: Create ASO topics
  console.log("\n[4/6] Creating ASO topics...");
  let topicsCreated = 0;
  let topicErrors = 0;
  const lxToAso = {}; // LX-xxx -> ASO-xxx mapping for this run

  // Include existing crosswalk mappings in our map
  for (const [legacyId, asoId] of Object.entries(existingCrosswalk.mappings)) {
    lxToAso[legacyId] = asoId;
  }

  // Boot-critical entries first, then the rest
  const bootEntries = toMigrate.filter((d) => BOOT_CRITICAL_LX.has(d.id));
  const otherEntries = toMigrate.filter((d) => !BOOT_CRITICAL_LX.has(d.id));
  const orderedEntries = [...bootEntries, ...otherEntries];

  for (const doc of orderedEntries) {
    const asoType = resolveAsoType(doc.type);
    const tier = resolveTier(doc.id, doc.type);
    const tags = Array.isArray(doc.tags) ? doc.tags.slice() : [];

    // Add original type as tag if it was remapped
    if (doc.type !== asoType && doc.type) {
      tags.push(`lx-type:${doc.type}`);
    }

    const result = aso.addTopic({
      name: doc.title,
      type: asoType,
      tier,
      legacyIds: [doc.id],
      tags,
      chain: Array.isArray(doc.chain) ? doc.chain : [],
      body: doc.body || "",
      summary: doc.summary || "",
      scope: "liris-local",
      createdBy: "migrate-lx-to-aso"
    });

    if (result.ok) {
      lxToAso[doc.id] = result.id;
      topicsCreated++;
      if (BOOT_CRITICAL_LX.has(doc.id)) {
        console.log(`     [BOOT] ${doc.id} -> ${result.id} (${doc.title.slice(0, 60)})`);
      }
    } else if (result.error && result.error.startsWith("duplicate_name") && result.existingId) {
      // Name already exists under a different legacy id — record the crosswalk anyway
      lxToAso[doc.id] = result.existingId;
      console.log(`     [DUP]  ${doc.id} -> ${result.existingId} (name already exists)`);
      topicErrors++;
    } else {
      console.log(`     [ERR]  ${doc.id}: ${result.error}`);
      topicErrors++;
    }
  }

  console.log(`     Created: ${topicsCreated} | Errors/Dups: ${topicErrors}`);

  // Step 5: Create crosswalk mappings (already done by addTopic via legacyIds, but report)
  console.log("\n[5/6] Crosswalk mappings...");
  const finalCrosswalk = aso.getCrosswalk();
  const newMappings = Object.keys(finalCrosswalk.mappings).length - Object.keys(existingCrosswalk.mappings).length;
  console.log(`     New crosswalk mappings: ${newMappings}`);
  console.log(`     Total crosswalk mappings: ${Object.keys(finalCrosswalk.mappings).length}`);

  // Step 6: Create relations from chain fields
  console.log("\n[6/6] Creating relations from chain fields...");
  let relationsCreated = 0;
  let relationsSkipped = 0;
  let relationsErrors = 0;

  for (const doc of orderedEntries) {
    const fromAso = lxToAso[doc.id];
    if (!fromAso) continue;

    const chainRefs = extractChainRefs(doc.chain);
    for (const ref of chainRefs) {
      const toAso = lxToAso[ref];
      if (!toAso) {
        // Target not in crosswalk — might be an IX entry or not yet migrated
        continue;
      }

      const result = aso.addRelation({
        from: fromAso,
        verb: "requires",
        to: toAso,
        verifiedBy: "migrate-lx-to-aso"
      });

      if (result.ok) {
        if (result.note === "already_exists") {
          relationsSkipped++;
        } else {
          relationsCreated++;
        }
      } else {
        relationsErrors++;
      }
    }
  }

  console.log(`     Relations created: ${relationsCreated}`);
  console.log(`     Relations already existed: ${relationsSkipped}`);
  if (relationsErrors > 0) {
    console.log(`     Relation errors: ${relationsErrors}`);
  }

  // Summary
  printStatus();
}

function printStatus() {
  console.log("\n=== Migration Summary ===");
  const status = aso.getAsoStatus();
  console.log(`  Topics total:       ${status.counts.topics}`);
  console.log(`  Relations total:    ${status.counts.relations}`);
  console.log(`  Crosswalk mappings: ${status.counts.crosswalkMappings}`);
  console.log(`  Observations:       ${status.counts.observations}`);
  console.log(`  Data dir:           ${status.dataDir}`);
  console.log("\n  Topics by type:");
  for (const [type, count] of Object.entries(status.topicsByType).sort()) {
    console.log(`    ${type}: ${count}`);
  }
  console.log("\n  Topics by tier:");
  for (const [tier, count] of Object.entries(status.topicsByTier).sort()) {
    console.log(`    ${tier}: ${count}`);
  }
  console.log("\n=== Done ===");
}

main();
