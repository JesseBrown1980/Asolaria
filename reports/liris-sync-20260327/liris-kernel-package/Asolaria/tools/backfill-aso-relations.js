#!/usr/bin/env node
/**
 * backfill-aso-relations.js — Backfills ASO relations from LX chain fields.
 *
 * The migrate-lx-to-aso.js tool only creates relations for entries migrated
 * in the same run. If the "to" target wasn't yet migrated at that time, the
 * relation was silently lost. This tool rescans ALL LX documents and resolves
 * both ends of every chain reference through the crosswalk, creating any
 * missing relations.
 *
 * Idempotent: aso.addRelation skips duplicates (returns already_exists).
 *
 * Usage: node tools/backfill-aso-relations.js
 *
 * LX chain: LX-015, LX-041, LX-153, LX-154, LX-170
 */

const path = require("path");
const aso = require("../src/index-kernel/aso");
const { getSourceInventory } = require("../src/index-kernel/inventory");
const { buildCompiledDocuments } = require("../src/index-kernel/compile");

// --- Helpers ---

function extractChainRefs(chain) {
  // chain is an array of strings like ["LX-005", "IX-007", "LX-041"]
  if (!Array.isArray(chain)) return [];
  return chain.filter((ref) => /^(LX|IX)-\d{3,4}$/i.test(ref));
}

// --- Main ---

function main() {
  console.log("=== ASO Relation Backfill Tool ===\n");

  // Step 1: Read all LX entries via index-kernel inventory
  console.log("[1/3] Scanning LX corpus via index-kernel inventory...");
  const inventory = getSourceInventory({ profile: "staging" }, { forceSourceScan: true });
  const documents = buildCompiledDocuments(inventory);

  const lxDocs = documents.filter((doc) => doc.prefix === "LX");
  console.log(`      Found ${lxDocs.length} LX documents.`);

  if (lxDocs.length === 0) {
    console.log("\n  No LX entries found. Nothing to backfill.");
    return;
  }

  // Step 2: Load the crosswalk
  console.log("\n[2/3] Loading crosswalk...");
  const crosswalk = aso.getCrosswalk();
  const mappings = crosswalk.mappings || {};
  const mappingCount = Object.keys(mappings).length;
  console.log(`      Crosswalk contains ${mappingCount} mappings.`);

  // Step 3: Walk all chain fields and backfill relations
  console.log("\n[3/3] Backfilling relations from chain fields...\n");

  let totalChainRefs = 0;
  let newRelations = 0;
  let alreadyExisted = 0;
  let unresolvable = 0;
  const unresolvableDetails = [];

  for (const doc of lxDocs) {
    const chainRefs = extractChainRefs(doc.chain);
    if (chainRefs.length === 0) continue;

    const fromAso = mappings[doc.id];
    if (!fromAso) {
      // The source document itself isn't in the crosswalk
      for (const ref of chainRefs) {
        totalChainRefs++;
        unresolvable++;
        unresolvableDetails.push(`${doc.id} -> ${ref} (source "${doc.id}" not in crosswalk)`);
      }
      continue;
    }

    for (const ref of chainRefs) {
      totalChainRefs++;
      const toAso = mappings[ref];

      if (!toAso) {
        unresolvable++;
        unresolvableDetails.push(`${doc.id} -> ${ref} (target "${ref}" not in crosswalk)`);
        continue;
      }

      const result = aso.addRelation({
        from: fromAso,
        verb: "requires",
        to: toAso,
        verifiedBy: "backfill-aso-relations"
      });

      if (result.ok) {
        if (result.note === "already_exists") {
          alreadyExisted++;
        } else {
          newRelations++;
          console.log(`      [NEW] ${doc.id} (${fromAso}) --requires--> ${ref} (${toAso})`);
        }
      } else {
        // Treat addRelation errors as unresolvable
        unresolvable++;
        unresolvableDetails.push(`${doc.id} -> ${ref} (addRelation error: ${result.error})`);
      }
    }
  }

  // --- Report ---
  console.log("\n=== Backfill Report ===");
  console.log(`  Total chain refs found:   ${totalChainRefs}`);
  console.log(`  New relations created:    ${newRelations}`);
  console.log(`  Already existed:          ${alreadyExisted}`);
  console.log(`  Unresolvable:             ${unresolvable}`);

  if (unresolvableDetails.length > 0) {
    console.log("\n  Unresolvable details:");
    for (const detail of unresolvableDetails) {
      console.log(`    - ${detail}`);
    }
  }

  // Final status
  console.log("\n=== Current ASO Status ===");
  const status = aso.getAsoStatus();
  console.log(`  Topics total:       ${status.counts.topics}`);
  console.log(`  Relations total:    ${status.counts.relations}`);
  console.log(`  Crosswalk mappings: ${status.counts.crosswalkMappings}`);
  console.log("\n=== Done ===");
}

main();
