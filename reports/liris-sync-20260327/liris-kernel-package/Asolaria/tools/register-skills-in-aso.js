#!/usr/bin/env node
/** Register all skills in ASO — one-shot batch tool.
 *  Scans skills/ directories, creates ASO topics, links each to ASO Language Runtime.
 *  Usage: node tools/register-skills-in-aso.js */

const path = require("path");
const fs = require("fs");
const aso = require("../src/aso-client");

const SKILLS_DIR = path.resolve(__dirname, "..", "skills");
const RUNTIME_TOPIC = "ASO-cf51760007"; // ASO Language Runtime

function main() {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

  let created = 0;
  let skipped = 0;
  let linked = 0;
  let errors = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const cfgPath = path.join(SKILLS_DIR, entry.name, "skill.json");
    if (!fs.existsSync(cfgPath)) continue;

    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    } catch (e) {
      console.error(`  SKIP ${entry.name} — invalid JSON: ${e.message}`);
      errors++;
      continue;
    }

    const topicName = `skill/${entry.name}`;
    const tags = ["skill", "auto-registered", ...(cfg.tags || [])];
    const desc = cfg.description || `Skill: ${entry.name}`;

    // Check if already exists
    const hits = aso.search(topicName);
    const existing = hits && hits.matches && hits.matches.find(
      (m) => m.name === topicName && m.type === "skill"
    );

    let asoId;
    if (existing) {
      asoId = existing.asoId;
      skipped++;
    } else {
      const result = aso.topic(topicName, "skill", {
        tier: "operational",
        description: desc,
        tags,
      });
      if (result && result.ok && result.id) {
        asoId = result.id;
        created++;
      } else {
        console.error(`  FAIL ${entry.name} — topic creation failed`);
        errors++;
        continue;
      }
    }

    // Link to ASO Language Runtime
    try {
      aso.relate(asoId, "part_of", RUNTIME_TOPIC);
      linked++;
    } catch (e) {
      console.error(`  WARN ${entry.name} — link failed: ${e.message}`);
    }

    console.log(`  ${existing ? "EXISTS" : "CREATE"} ${topicName} -> ${asoId}`);
  }

  console.log(`\n--- Skills ASO Registration Complete ---`);
  console.log(`  Created: ${created}`);
  console.log(`  Already existed: ${skipped}`);
  console.log(`  Linked to runtime: ${linked}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total processed: ${created + skipped + errors}`);
}

main();
