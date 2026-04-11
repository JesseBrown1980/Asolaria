const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { execSync } = require("node:child_process");

const { withFreshAsolaria } = require("./_unitHarness");

const repoRoot = path.resolve(__dirname, "..");

/**
 * Helper: run a tool script in a child process with ASOLARIA_INSTANCE_ROOT set.
 * Returns stdout as a string. All tools auto-execute on require, so child_process
 * is the only safe way to invoke them without polluting the test process.
 */
function runTool(toolName, instanceRoot) {
  const toolPath = path.join(repoRoot, "tools", toolName);
  const result = execSync(`node "${toolPath}"`, {
    cwd: repoRoot,
    env: { ...process.env, ASOLARIA_INSTANCE_ROOT: instanceRoot },
    encoding: "utf8",
    timeout: 30_000,
    stdio: ["pipe", "pipe", "pipe"]
  });
  return result;
}

// ---------------------------------------------------------------------------
// 1. migrate-lx-to-aso — idempotency
// ---------------------------------------------------------------------------
test("migrate-lx-to-aso: first run creates topics, second run skips all", () => {
  withFreshAsolaria("migrate-idem", ({ instanceRoot, load }) => {
    // First run: should create topics
    const out1 = runTool("migrate-lx-to-aso.js", instanceRoot);
    const createdMatch1 = out1.match(/Created:\s*(\d+)/);
    assert.ok(createdMatch1, "first run should report Created count");
    const topicsCreated = parseInt(createdMatch1[1], 10);
    assert.ok(topicsCreated > 0, `first run should create >0 topics, got ${topicsCreated}`);

    // Second run: should create 0 new topics (all skipped)
    const out2 = runTool("migrate-lx-to-aso.js", instanceRoot);
    const allMigratedRe = /All entries already migrated/;
    const createdMatch2 = out2.match(/Created:\s*(\d+)/);

    if (createdMatch2) {
      assert.equal(parseInt(createdMatch2[1], 10), 0, "second run should create 0 topics");
    } else {
      assert.ok(allMigratedRe.test(out2), "second run should report all entries already migrated");
    }
  });
});

// ---------------------------------------------------------------------------
// 2. hydrate-observations — idempotency
// ---------------------------------------------------------------------------
test("hydrate-observations: first run adds observations, second run skips all", () => {
  withFreshAsolaria("hydrate-idem", ({ instanceRoot }) => {
    // Prerequisite: run migration to create topics + crosswalk
    runTool("migrate-lx-to-aso.js", instanceRoot);

    // First hydration
    const out1 = runTool("hydrate-observations.js", instanceRoot);
    const addedMatch1 = out1.match(/Observations added:\s*(\d+)/);
    assert.ok(addedMatch1, "first run should report Observations added count");
    const obsAdded = parseInt(addedMatch1[1], 10);
    assert.ok(obsAdded > 0, `first hydration should add >0 observations, got ${obsAdded}`);

    // Second hydration: should add 0 new observations
    const out2 = runTool("hydrate-observations.js", instanceRoot);
    const addedMatch2 = out2.match(/Observations added:\s*(\d+)/);
    assert.ok(addedMatch2, "second run should report Observations added count");
    assert.equal(parseInt(addedMatch2[1], 10), 0, "second hydration should add 0 observations");
  });
});

// ---------------------------------------------------------------------------
// 3. backfill-aso-relations — idempotency
// ---------------------------------------------------------------------------
test("backfill-aso-relations: first run creates relations, second run finds 0 new", () => {
  withFreshAsolaria("backfill-idem", ({ instanceRoot }) => {
    // Prerequisite: run migration (which creates some relations from chains)
    runTool("migrate-lx-to-aso.js", instanceRoot);

    // First backfill: should find chain refs (may or may not create new ones
    // beyond what migration already did, but total chain refs should be > 0)
    const out1 = runTool("backfill-aso-relations.js", instanceRoot);
    const chainRefsMatch = out1.match(/Total chain refs found:\s*(\d+)/);
    assert.ok(chainRefsMatch, "should report total chain refs found");
    const totalChainRefs = parseInt(chainRefsMatch[1], 10);
    assert.ok(totalChainRefs > 0, `should find >0 chain refs, got ${totalChainRefs}`);

    // Second backfill: should create 0 new relations (all already exist)
    const out2 = runTool("backfill-aso-relations.js", instanceRoot);
    const newRelMatch = out2.match(/New relations created:\s*(\d+)/);
    assert.ok(newRelMatch, "second run should report new relations count");
    assert.equal(parseInt(newRelMatch[1], 10), 0, "second backfill should create 0 new relations");
  });
});

// ---------------------------------------------------------------------------
// 4. seed-outcomes — idempotency
// ---------------------------------------------------------------------------
test("seed-outcomes: first run creates outcomes, second run skips all", () => {
  withFreshAsolaria("seed-outcomes-idem", ({ instanceRoot }) => {
    // Prerequisite: migration creates the topics that seed-outcomes references
    runTool("migrate-lx-to-aso.js", instanceRoot);

    // First seed
    const out1 = runTool("seed-outcomes.js", instanceRoot);
    const addedMatch1 = out1.match(/added=(\d+)/);
    assert.ok(addedMatch1, "first run should report added count");
    const outcomesAdded = parseInt(addedMatch1[1], 10);
    assert.ok(outcomesAdded > 0, `first seed should add >0 outcomes, got ${outcomesAdded}`);

    // Second seed: should add 0 (all skipped)
    const out2 = runTool("seed-outcomes.js", instanceRoot);
    const addedMatch2 = out2.match(/added=(\d+)/);
    assert.ok(addedMatch2, "second run should report added count");
    assert.equal(parseInt(addedMatch2[1], 10), 0, "second seed should add 0 outcomes");
  });
});

// ---------------------------------------------------------------------------
// 5. aso-export — produces valid JSON with expected shape
// ---------------------------------------------------------------------------
test("aso-export: outputs valid JSON file with _meta, summary, tables", () => {
  withFreshAsolaria("aso-export", ({ instanceRoot }) => {
    // Prerequisite: populate ASO data
    runTool("migrate-lx-to-aso.js", instanceRoot);

    // aso-export hardcodes ROOT to repo root, so we need to check its output
    // path from its stdout instead.
    const out = runTool("aso-export.js", instanceRoot);
    const pathMatch = out.match(/path\s*:\s*(.+)/);
    assert.ok(pathMatch, "aso-export should report output path");

    const exportPath = pathMatch[1].trim();
    assert.ok(fs.existsSync(exportPath), `export file should exist at ${exportPath}`);

    const exportData = JSON.parse(fs.readFileSync(exportPath, "utf8"));
    assert.ok(exportData._meta, "export should have _meta field");
    assert.equal(exportData._meta.format, "aso-full-export");
    assert.ok(exportData.summary, "export should have summary field");
    assert.ok(exportData.summary.counts, "export summary should have counts");
    assert.ok(exportData.tables, "export should have tables field");
    assert.ok(Array.isArray(exportData.tables.topics), "tables.topics should be an array");

    // Cleanup: remove the export file so we don't litter the repo
    try { fs.unlinkSync(exportPath); } catch { /* ignore */ }
  });
});

// ---------------------------------------------------------------------------
// 6. aso-digest — writes DIGEST.md
// ---------------------------------------------------------------------------
test("aso-digest: writes DIGEST.md with markdown content", () => {
  withFreshAsolaria("aso-digest", ({ instanceRoot }) => {
    // Prerequisite: populate ASO data
    runTool("migrate-lx-to-aso.js", instanceRoot);

    const out = runTool("aso-digest.js", instanceRoot);

    // aso-digest writes to ASO_DATA_DIR/DIGEST.md which uses instanceRoot
    const digestPath = path.join(instanceRoot, "data", "aso", "DIGEST.md");
    assert.ok(fs.existsSync(digestPath), `DIGEST.md should exist at ${digestPath}`);

    const content = fs.readFileSync(digestPath, "utf8");
    assert.ok(content.length > 0, "DIGEST.md should not be empty");
    assert.ok(content.includes("# ASO Digest"), "DIGEST.md should contain the header");
    assert.ok(content.includes("## Counts"), "DIGEST.md should contain Counts section");
    assert.ok(content.includes("## Boot-Critical Topics"), "DIGEST.md should contain Boot-Critical Topics section");
  });
});

// ---------------------------------------------------------------------------
// 7. harvest-evidence — idempotency
// ---------------------------------------------------------------------------
test("harvest-evidence: first run adds evidence, second run adds 0", () => {
  withFreshAsolaria("harvest-evidence-idem", ({ instanceRoot }) => {
    // Prerequisite: migration creates topics + crosswalk
    runTool("migrate-lx-to-aso.js", instanceRoot);

    // First harvest
    const out1 = runTool("harvest-evidence.js", instanceRoot);
    const addedMatch1 = out1.match(/TOTAL added:\s*(\d+)/);
    assert.ok(addedMatch1, "first run should report TOTAL added count");
    const evidenceAdded = parseInt(addedMatch1[1], 10);
    assert.ok(evidenceAdded > 0, `first harvest should add >0 evidence, got ${evidenceAdded}`);

    // Second harvest: should add 0 (all duplicates skipped)
    const out2 = runTool("harvest-evidence.js", instanceRoot);
    const addedMatch2 = out2.match(/TOTAL added:\s*(\d+)/);
    assert.ok(addedMatch2, "second run should report TOTAL added count");
    assert.equal(parseInt(addedMatch2[1], 10), 0, "second harvest should add 0 evidence");
  });
});

// ---------------------------------------------------------------------------
// 8. harvest-outcomes — idempotency
// ---------------------------------------------------------------------------
test("harvest-outcomes: first run adds outcomes, second run adds 0", () => {
  withFreshAsolaria("harvest-outcomes-idem", ({ instanceRoot }) => {
    // Prerequisite: migration creates topics + crosswalk
    runTool("migrate-lx-to-aso.js", instanceRoot);

    // First harvest
    const out1 = runTool("harvest-outcomes.js", instanceRoot);
    const addedMatch1 = out1.match(/added=(\d+)/);
    assert.ok(addedMatch1, "first run should report added count");
    const outcomesAdded = parseInt(addedMatch1[1], 10);
    assert.ok(outcomesAdded > 0, `first harvest should add >0 outcomes, got ${outcomesAdded}`);

    // Second harvest: should add 0 (all duplicates skipped)
    const out2 = runTool("harvest-outcomes.js", instanceRoot);
    const addedMatch2 = out2.match(/added=(\d+)/);
    assert.ok(addedMatch2, "second run should report added count");
    assert.equal(parseInt(addedMatch2[1], 10), 0, "second harvest should add 0 outcomes");
  });
});
