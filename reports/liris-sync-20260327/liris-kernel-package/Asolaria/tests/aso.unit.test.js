const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("ASO typed operations: add-topic, add-observation, add-relation, crosswalk", () => {
  withFreshAsolaria("aso-ops", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    // add-topic
    const topic1 = aso.addTopic({
      name: "Test Concept Alpha",
      type: "pattern",
      tier: "operational",
      legacyIds: ["LX-999"],
      tags: ["test"],
      summary: "A test concept for validation.",
      createdBy: "test-harness"
    });
    assert.equal(topic1.ok, true);
    assert.ok(topic1.id.startsWith("ASO-"));

    // duplicate name rejected
    const dup = aso.addTopic({ name: "Test Concept Alpha", type: "pattern" });
    assert.equal(dup.ok, false);
    assert.ok(dup.error.startsWith("duplicate_name"));

    // revise-topic
    const revised = aso.reviseTopic({ asoId: topic1.id, summary: "Updated summary." });
    assert.equal(revised.ok, true);
    assert.ok(revised.changes.includes("summary"));

    // getTopic
    const fetched = aso.getTopic(topic1.id);
    assert.equal(fetched.name, "Test Concept Alpha");
    assert.equal(fetched.summary, "Updated summary.");

    // crosswalk
    const byLegacy = aso.findTopicByLegacyId("LX-999");
    assert.equal(byLegacy.asoId, topic1.id);
    assert.equal(aso.resolveId("LX-999"), topic1.id);

    // add-observation (append-only)
    const obs1 = aso.addObservation({
      topicId: topic1.id,
      summary: "First observation",
      observedBy: "test-harness"
    });
    assert.equal(obs1.ok, true);
    assert.ok(obs1.id.startsWith("OBS-"));

    const obs2 = aso.addObservation({
      topicId: topic1.id,
      summary: "Second observation",
      observedBy: "test-harness"
    });
    assert.equal(obs2.ok, true);
    assert.notEqual(obs1.id, obs2.id);

    const observations = aso.getObservations(topic1.id);
    assert.equal(observations.length, 2);

    // add-relation
    const topic2 = aso.addTopic({
      name: "Test Concept Beta",
      type: "mistake",
      tier: "operational",
      createdBy: "test-harness"
    });
    const rel = aso.addRelation({
      from: topic1.id,
      verb: "fixes",
      to: topic2.id,
      verifiedBy: "test-harness"
    });
    assert.equal(rel.ok, true);
    assert.ok(rel.id.startsWith("REL-"));

    // duplicate relation returns existing
    const relDup = aso.addRelation({
      from: topic1.id,
      verb: "fixes",
      to: topic2.id
    });
    assert.equal(relDup.ok, true);
    assert.equal(relDup.id, rel.id);
    assert.equal(relDup.note, "already_exists");

    // invalid verb rejected
    const badRel = aso.addRelation({ from: "A", verb: "destroys", to: "B" });
    assert.equal(badRel.ok, false);
    assert.ok(badRel.error.startsWith("invalid_verb"));

    // getRelations
    const rels = aso.getRelations(topic1.id);
    assert.equal(rels.length, 1);
    assert.equal(rels[0].verb, "fixes");

    // add-conflict + resolve
    const conflict = aso.addConflict({
      topicId: topic1.id,
      entryA: topic1.id,
      entryB: topic2.id,
      description: "Test conflict"
    });
    assert.equal(conflict.ok, true);

    const resolved = aso.resolveConflict({
      conflictId: conflict.id,
      resolution: "resolved",
      note: "Test resolution",
      resolvedBy: "test-harness"
    });
    assert.equal(resolved.ok, true);

    // status
    const status = aso.getAsoStatus();
    assert.equal(status.ok, true);
    assert.equal(status.counts.topics, 2);
    assert.equal(status.counts.observations, 2);
    assert.equal(status.counts.relations, 1);
    assert.equal(status.counts.conflicts, 1);
    assert.equal(status.counts.openConflicts, 0);
    assert.equal(status.counts.crosswalkMappings, 1);
  });
});

test("ASO coverage gaps: listTopics, addSurface, addEvidence, getObservations, getRelations, resolveId, fs verification", () => {
  withFreshAsolaria("aso-coverage", ({ load, instanceRoot }) => {
    const aso = load("src/index-kernel/aso.js");

    // --- Setup: create several topics with varied type/tier/status/scope ---
    const t1 = aso.addTopic({ name: "Alpha", type: "pattern", tier: "boot", status: "active", scope: "global", createdBy: "test" });
    const t2 = aso.addTopic({ name: "Beta", type: "mistake", tier: "operational", status: "obsolete", scope: "gaia-local", createdBy: "test" });
    const t3 = aso.addTopic({ name: "Gamma", type: "pattern", tier: "operational", status: "active", scope: "global", createdBy: "test" });
    assert.equal(t1.ok, true);
    assert.equal(t2.ok, true);
    assert.equal(t3.ok, true);

    // 1. listTopics — filter by type
    const patterns = aso.listTopics({ type: "pattern" });
    assert.equal(patterns.length, 2);
    assert.ok(patterns.every((r) => r.type === "pattern"));

    // listTopics — filter by tier
    const bootOnly = aso.listTopics({ tier: "boot" });
    assert.equal(bootOnly.length, 1);
    assert.equal(bootOnly[0].name, "Alpha");

    // listTopics — filter by status
    const obsolete = aso.listTopics({ status: "obsolete" });
    assert.equal(obsolete.length, 1);
    assert.equal(obsolete[0].name, "Beta");

    // listTopics — filter by scope
    const gaiaLocal = aso.listTopics({ scope: "gaia-local" });
    assert.equal(gaiaLocal.length, 1);
    assert.equal(gaiaLocal[0].name, "Beta");

    // listTopics — combined filters
    const combined = aso.listTopics({ type: "pattern", tier: "operational" });
    assert.equal(combined.length, 1);
    assert.equal(combined[0].name, "Gamma");

    // listTopics — no filter returns all
    assert.equal(aso.listTopics().length, 3);

    // 2. addSurface — add and verify in getAsoStatus counts
    const srf = aso.addSurface({ topicId: t1.id, host: "localhost", port: "8080", state: "running", verifiedBy: "test" });
    assert.equal(srf.ok, true);
    assert.ok(srf.id.startsWith("SRF-"));
    const statusAfterSurface = aso.getAsoStatus();
    assert.equal(statusAfterSurface.counts.surfaces, 1);

    // 3. addEvidence — add and verify in getAsoStatus counts
    const evd = aso.addEvidence({ topicId: t1.id, sourceKind: "command-output", sourceRef: "test-ref", commandOrPath: "echo hello", verifiedBy: "test" });
    assert.equal(evd.ok, true);
    assert.ok(evd.id.startsWith("EVD-"));
    const statusAfterEvidence = aso.getAsoStatus();
    assert.equal(statusAfterEvidence.counts.evidence, 1);

    // 4. getObservations — limit parameter and sort order (newest first)
    const obs1 = aso.addObservation({ topicId: t1.id, summary: "First obs", observedBy: "test", observedAt: "2025-01-01T00:00:00.000Z" });
    const obs2 = aso.addObservation({ topicId: t1.id, summary: "Second obs", observedBy: "test", observedAt: "2025-06-01T00:00:00.000Z" });
    const obs3 = aso.addObservation({ topicId: t1.id, summary: "Third obs", observedBy: "test", observedAt: "2025-12-01T00:00:00.000Z" });
    assert.equal(obs1.ok, true);
    assert.equal(obs2.ok, true);
    assert.equal(obs3.ok, true);

    // limit=2 returns only 2
    const limited = aso.getObservations(t1.id, 2);
    assert.equal(limited.length, 2);

    // newest first (descending observedAt)
    const allObs = aso.getObservations(t1.id);
    assert.equal(allObs.length, 3);
    assert.equal(allObs[0].summary, "Third obs");
    assert.equal(allObs[1].summary, "Second obs");
    assert.equal(allObs[2].summary, "First obs");

    // 5. getRelations — bidirectional lookup (entry in `to` position)
    const rel = aso.addRelation({ from: t1.id, verb: "fixes", to: t2.id, verifiedBy: "test" });
    assert.equal(rel.ok, true);

    // Query by the `to` entry — should still find the relation
    const relsForBeta = aso.getRelations(t2.id);
    assert.equal(relsForBeta.length, 1);
    assert.equal(relsForBeta[0].from, t1.id);
    assert.equal(relsForBeta[0].to, t2.id);
    assert.equal(relsForBeta[0].verb, "fixes");

    // Query by the `from` entry also works
    const relsForAlpha = aso.getRelations(t1.id);
    assert.equal(relsForAlpha.length, 1);
    assert.equal(relsForAlpha[0].relationId, relsForBeta[0].relationId);

    // 6. resolveId — unknown ID returns input unchanged
    assert.equal(aso.resolveId("UNKNOWN-999"), "UNKNOWN-999");
    assert.equal(aso.resolveId(""), "");
    assert.equal(aso.resolveId("random-string"), "random-string");

    // 7. File-system verification — table JSON files exist on disk
    const tablesDir = path.join(instanceRoot, "data", "aso", "tables");
    assert.ok(fs.existsSync(path.join(tablesDir, "topics.json")), "topics.json must exist");
    assert.ok(fs.existsSync(path.join(tablesDir, "observations.json")), "observations.json must exist");
    assert.ok(fs.existsSync(path.join(tablesDir, "relations.json")), "relations.json must exist");
    assert.ok(fs.existsSync(path.join(tablesDir, "surfaces.json")), "surfaces.json must exist");
    assert.ok(fs.existsSync(path.join(tablesDir, "evidence.json")), "evidence.json must exist");

    // ops-log also exists
    const opsLogPath = path.join(instanceRoot, "data", "aso", "ops-log.ndjson");
    assert.ok(fs.existsSync(opsLogPath), "ops-log.ndjson must exist");
  });
});

test("ASO validation rejects bad inputs", () => {
  withFreshAsolaria("aso-validation", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    assert.equal(aso.addTopic({}).ok, false);
    assert.equal(aso.addTopic({ name: "X", type: "banana" }).ok, false);
    assert.equal(aso.addTopic({ name: "X", tier: "legendary" }).ok, false);
    assert.equal(aso.reviseTopic({}).ok, false);
    assert.equal(aso.reviseTopic({ asoId: "ASO-ghost" }).ok, false);
    assert.equal(aso.addObservation({}).ok, false);
    assert.equal(aso.addObservation({ topicId: "X" }).ok, false);
    assert.equal(aso.addRelation({}).ok, false);
    assert.equal(aso.addConflict({}).ok, false);
    assert.equal(aso.resolveConflict({}).ok, false);
    assert.equal(aso.resolveConflict({ conflictId: "CON-ghost" }).ok, false);
  });
});

test("ASO outcome operations: addOutcome, getOutcomes, status counts", () => {
  withFreshAsolaria("aso-outcomes", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    // Setup: create a topic to attach outcomes to
    const topic = aso.addTopic({
      name: "Outcome Host Topic",
      type: "pattern",
      tier: "operational",
      createdBy: "test-harness"
    });
    assert.equal(topic.ok, true);

    // 1. addOutcome happy path — requires topicId, trigger, result
    const out1 = aso.addOutcome({
      topicId: topic.id,
      trigger: "User runs deploy without config",
      result: "Deploy fails silently"
    });
    assert.equal(out1.ok, true);
    assert.ok(out1.id.startsWith("OUT-"));

    // 2. addOutcome validation — missing topicId
    const noTopic = aso.addOutcome({ trigger: "some trigger", result: "some result" });
    assert.equal(noTopic.ok, false);

    // addOutcome validation — missing trigger
    const noTrigger = aso.addOutcome({ topicId: topic.id, result: "some result" });
    assert.equal(noTrigger.ok, false);

    // addOutcome validation — missing result
    const noResult = aso.addOutcome({ topicId: topic.id, trigger: "some trigger" });
    assert.equal(noResult.ok, false);

    // 3. getOutcomes — add a second outcome, verify count and sort by lastVerified descending
    const out2 = aso.addOutcome({
      topicId: topic.id,
      trigger: "Agent connects plaintext",
      result: "Connection silently dropped"
    });
    assert.equal(out2.ok, true);
    assert.notEqual(out1.id, out2.id);

    const outcomes = aso.getOutcomes(topic.id);
    assert.equal(outcomes.length, 2);

    // Sort check: lastVerified descending — out2 was added after out1
    assert.equal(outcomes[0].outcomeId, out2.id);
    assert.equal(outcomes[1].outcomeId, out1.id);

    // 4. getAsoStatus includes outcomes count
    const status = aso.getAsoStatus();
    assert.equal(status.ok, true);
    assert.equal(status.counts.outcomes, 2);
  });
});
