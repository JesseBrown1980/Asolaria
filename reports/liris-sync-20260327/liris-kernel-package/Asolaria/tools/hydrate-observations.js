#!/usr/bin/env node
/**
 * hydrate-observations.js — Converts LX document bodies into ASO observations.
 *
 * Every LX markdown file has a body with substantive knowledge that should
 * become an observation on the corresponding ASO topic. This script reads
 * all compiled LX documents via the index-kernel, resolves each to its ASO
 * topic through the crosswalk, and adds an observation with the body content.
 *
 * Idempotent: skips topics that already have an observation with
 * observedBy="lx-hydration".
 *
 * Usage: node tools/hydrate-observations.js
 *
 * LX chain: LX-153, LX-154, LX-170
 */

const path = require("path");
const aso = require("../src/index-kernel/aso");
const { getSourceInventory } = require("../src/index-kernel/inventory");
const { buildCompiledDocuments } = require("../src/index-kernel/compile");

const OBSERVER_TAG = "lx-hydration";
const MIN_BODY_LENGTH = 20;

function main() {
  console.log("=== LX -> ASO Observation Hydration ===\n");

  // Step 1: Read all LX entries via index-kernel inventory
  console.log("[1/4] Scanning LX corpus via index-kernel inventory...");
  const inventory = getSourceInventory({ profile: "staging" }, { forceSourceScan: true });
  const documents = buildCompiledDocuments(inventory);
  const lxDocs = documents.filter((doc) => doc.prefix === "LX");
  console.log(`      Found ${lxDocs.length} LX documents.`);

  // Step 2: Load crosswalk and existing observations for idempotency check
  console.log("\n[2/4] Loading crosswalk and existing observations...");
  const crosswalk = aso.getCrosswalk();
  const allObservations = (() => {
    // Read observations table to find which topics already have lx-hydration obs
    const status = aso.getAsoStatus();
    console.log(`      Current ASO state: ${status.counts.topics} topics, ${status.counts.observations} observations`);
    return status;
  })();

  // Build set of topicIds that already have an lx-hydration observation
  // We need to check each topic's observations individually
  const alreadyHydrated = new Set();
  const topicsTable = aso.listTopics();
  for (const topic of topicsTable) {
    const obs = aso.getObservations(topic.asoId);
    if (obs.some((o) => o.observedBy === OBSERVER_TAG)) {
      alreadyHydrated.add(topic.asoId);
    }
  }
  console.log(`      Topics already hydrated: ${alreadyHydrated.size}`);

  // Step 3: Hydrate observations
  console.log("\n[3/4] Hydrating observations...");
  let added = 0;
  let skippedHydrated = 0;
  let skippedShortBody = 0;
  let unresolvable = 0;
  let errors = 0;

  for (const doc of lxDocs) {
    const body = String(doc.body || "").trim();

    // Skip docs with empty or short bodies
    if (body.length <= MIN_BODY_LENGTH) {
      skippedShortBody++;
      continue;
    }

    // Resolve LX ID to ASO topic ID via crosswalk
    const asoId = crosswalk.mappings[doc.id];
    if (!asoId) {
      unresolvable++;
      continue;
    }

    // Idempotency: skip if already hydrated
    if (alreadyHydrated.has(asoId)) {
      skippedHydrated++;
      continue;
    }

    // Add observation
    const summary = String(doc.summary || doc.title || "").trim().slice(0, 200);
    if (!summary) {
      errors++;
      console.log(`      [ERR] ${doc.id}: no summary available`);
      continue;
    }

    const result = aso.addObservation({
      topicId: asoId,
      summary,
      detail: body,
      observedBy: OBSERVER_TAG,
      scope: "global"
    });

    if (result.ok) {
      added++;
    } else {
      errors++;
      console.log(`      [ERR] ${doc.id} -> ${asoId}: ${result.error}`);
    }
  }

  // Step 4: Report
  console.log("\n[4/4] Summary");
  console.log(`      Total LX docs scanned:     ${lxDocs.length}`);
  console.log(`      Observations added:         ${added}`);
  console.log(`      Skipped (already hydrated): ${skippedHydrated}`);
  console.log(`      Skipped (short/empty body): ${skippedShortBody}`);
  console.log(`      Unresolvable (no crosswalk):${unresolvable}`);
  if (errors > 0) {
    console.log(`      Errors:                     ${errors}`);
  }

  // Final ASO status
  const finalStatus = aso.getAsoStatus();
  console.log("\n=== Final ASO Status ===");
  console.log(`  Topics:       ${finalStatus.counts.topics}`);
  console.log(`  Observations: ${finalStatus.counts.observations}`);
  console.log(`  Crosswalk:    ${finalStatus.counts.crosswalkMappings}`);
  console.log("\n=== Done ===");
}

main();
