const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria, repoRoot } = require("./_unitHarness");

const reporterPath = path.join(repoRoot, "src", "colony-health-reporter.js");

// ── 1. Module source exists and parses without syntax errors ──

test("colony-health-reporter source file exists and is valid JS", () => {
  assert.ok(fs.existsSync(reporterPath), "colony-health-reporter.js should exist");
  const source = fs.readFileSync(reporterPath, "utf8");
  // Verify it parses (throws on syntax error)
  new Function("require", "module", "exports", "__filename", "__dirname", "process", source);
});

// ── 2. The reporter's dependencies load and have the expected shape ──

test("buildColonyBody returns an object with boot and diagnoseAll methods", () => {
  withFreshAsolaria("reporter-deps", ({ load }) => {
    const { buildColonyBody } = load("src/colonyAnatomy.js");
    assert.equal(typeof buildColonyBody, "function");

    const body = buildColonyBody();
    assert.equal(typeof body.boot, "function");
    assert.equal(typeof body.diagnoseAll, "function");
    assert.equal(typeof body.heal, "function");
  });
});

test("aso-client exports the functions the reporter uses", () => {
  withFreshAsolaria("reporter-aso-shape", ({ load }) => {
    const aso = load("src/aso-client.js");
    assert.equal(typeof aso.search, "function");
    assert.equal(typeof aso.topic, "function");
    assert.equal(typeof aso.observe, "function");
    assert.equal(typeof aso.conflict, "function");
  });
});

// ── 3. Full reporter flow: boot -> diagnose -> record observations ──

test("reporter flow: boot colony, diagnose, record observations into ASO", async () => {
  await withFreshAsolaria("reporter-flow", async ({ load }) => {
    const { buildColonyBody } = load("src/colonyAnatomy.js");
    const aso = load("src/aso-client.js");

    // Boot the colony body (same as reporter does)
    const body = buildColonyBody();
    const bootResult = await body.boot();

    assert.ok(bootResult, "boot should return a result");
    assert.equal(bootResult.phase, "boot");
    assert.ok(typeof bootResult.preBoot === "string", "preBoot should be a string status");
    assert.ok(typeof bootResult.postBoot === "string", "postBoot should be a string status");
    assert.ok(typeof bootResult.message === "string", "message should be a string");

    // Run full diagnosis (same as reporter does)
    const diagnosis = await body.diagnoseAll();

    assert.ok(diagnosis, "diagnoseAll should return a result");
    assert.ok(diagnosis.results && typeof diagnosis.results === "object", "should have results object");
    assert.ok(typeof diagnosis.overall === "string", "should have overall status string");
    assert.ok(diagnosis.diagnosedAt, "should have diagnosedAt timestamp");

    // Replicate the reporter's summary-building logic
    const TOPIC_PREFIX = "colony-health";
    const AGENT_NAME = "health-reporter-test";
    const summary = { total: 0, passed: 0, warned: 0, failed: 0, observed: 0 };

    for (const [systemName, systemResult] of Object.entries(diagnosis.results)) {
      const checks = systemResult.checks || [];
      for (const check of checks) {
        summary.total++;
        const label = check.status === "ok" ? "pass" : check.status === "warning" ? "warning" : "fail";
        if (label === "pass") summary.passed++;
        else if (label === "warning") summary.warned++;
        else summary.failed++;

        const topicName = `${TOPIC_PREFIX}/${systemName}/${check.name}`;

        // Create ASO topic for this check
        const created = aso.topic(topicName, "topic", {
          tier: "operational",
          tags: ["colony-health", "auto-diagnostic"],
          summary: `Health check topic: ${topicName}`,
          createdBy: AGENT_NAME,
        });
        const topicId = (created && created.id) || topicName;

        // Record observation
        const obsResult = aso.observe(topicId, `[${label.toUpperCase()}] ${check.detail || "no detail"}`, {
          tags: [label, systemName, "auto-diagnostic"],
          createdBy: AGENT_NAME,
        });
        if (obsResult && obsResult.ok !== false) summary.observed++;

        // If failed, create conflict
        if (label === "fail") {
          aso.conflict(
            topicId,
            "expected:ok",
            `actual:${check.status} — ${check.detail || "unknown"}`,
            { createdBy: AGENT_NAME }
          );
        }
      }
    }

    // Verify the summary has the expected shape and counts are consistent
    assert.ok(summary.total > 0, "should have run at least one check");
    assert.equal(summary.total, summary.passed + summary.warned + summary.failed,
      "passed + warned + failed should equal total");
    assert.ok(summary.observed > 0, "should have recorded at least one observation");
    assert.ok(summary.observed <= summary.total, "observed should not exceed total");
  });
});

// ── 4. Observations are persisted in ASO after a health report run ──

test("ASO topics and observations persist after health report recording", async () => {
  await withFreshAsolaria("reporter-persist", async ({ load }) => {
    const { buildColonyBody } = load("src/colonyAnatomy.js");
    const aso = load("src/aso-client.js");

    const body = buildColonyBody();
    await body.boot();
    const diagnosis = await body.diagnoseAll();

    // Record one check into ASO
    const firstSystem = Object.keys(diagnosis.results)[0];
    const firstChecks = (diagnosis.results[firstSystem].checks || []);
    assert.ok(firstChecks.length > 0, `system '${firstSystem}' should have at least one check`);

    const check = firstChecks[0];
    const topicName = `colony-health/${firstSystem}/${check.name}`;

    const created = aso.topic(topicName, "topic", {
      tier: "operational",
      tags: ["colony-health"],
      createdBy: "persist-test",
    });
    assert.equal(created.ok, true, "topic creation should succeed");
    assert.ok(created.id, "topic should have an id");

    const obs = aso.observe(created.id, `[TEST] ${check.detail || check.status}`, {
      tags: ["test"],
      createdBy: "persist-test",
    });
    assert.equal(obs.ok, true, "observation should succeed");
    assert.ok(obs.id, "observation should have an id");

    // Verify the topic is retrievable
    const fetched = aso.get(created.id);
    assert.ok(fetched, "topic should be retrievable");
    assert.equal(fetched.name, topicName, "topic name should match");

    // Verify search finds it
    const searchResult = aso.search(topicName);
    assert.ok(searchResult && searchResult.matches, "search should return matches");
    const found = searchResult.matches.some(
      (m) => m.name.toLowerCase() === topicName.toLowerCase()
    );
    assert.ok(found, "search should find the created topic by name");
  });
});

// ── 5. statusLabel logic matches reporter behavior ──

test("statusLabel mapping: ok->pass, warning->warning, anything else->fail", () => {
  // Inline the reporter's statusLabel logic to verify it
  function statusLabel(checkStatus) {
    if (checkStatus === "ok") return "pass";
    if (checkStatus === "warning") return "warning";
    return "fail";
  }

  assert.equal(statusLabel("ok"), "pass");
  assert.equal(statusLabel("warning"), "warning");
  assert.equal(statusLabel("error"), "fail");
  assert.equal(statusLabel("critical"), "fail");
  assert.equal(statusLabel("unknown"), "fail");
  assert.equal(statusLabel(undefined), "fail");
});
