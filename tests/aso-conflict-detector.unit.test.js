const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("detectConflicts returns a report object with counts", () => {
  withFreshAsolaria("conflict-report", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");
    const { detectConflicts } = load("src/aso-conflict-detector.js");

    // Create a topic so there is something to scan
    aso.addTopic({ name: "Report Topic", type: "pattern", tier: "operational", createdBy: "test" });

    const report = detectConflicts();
    assert.equal(report.ok, true);
    assert.equal(typeof report.topicsScanned, "number");
    assert.ok(report.topicsScanned >= 1);
    assert.equal(typeof report.conflictsAdded, "number");
    assert.equal(typeof report.conflictsSkipped, "number");
    assert.ok(Array.isArray(report.errors));
    assert.ok(Array.isArray(report.details));
  });
});

test("circular relations are detected", () => {
  withFreshAsolaria("conflict-circular", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");
    const { detectConflicts } = load("src/aso-conflict-detector.js");

    const a = aso.addTopic({ name: "Magnetosphere", type: "pattern", tier: "operational", createdBy: "test" });
    const b = aso.addTopic({ name: "Graviton Flux", type: "pattern", tier: "operational", createdBy: "test" });

    // Give both observations so they are not flagged as orphans
    aso.addObservation({ topicId: a.id, summary: "obs", observedBy: "test" });
    aso.addObservation({ topicId: b.id, summary: "obs", observedBy: "test" });

    // A requires B
    aso.addRelation({ from: a.id, verb: "requires", to: b.id, verifiedBy: "test" });
    // B requires A (reverse — creates a cycle)
    aso.addRelation({ from: b.id, verb: "requires", to: a.id, verifiedBy: "test" });

    const report = detectConflicts();
    assert.equal(report.ok, true);

    const circularConflict = report.details.find((d) =>
      d.description.includes("Circular relation")
    );
    assert.ok(circularConflict, "Expected a circular relation conflict to be detected");
  });
});

test("orphan topics are detected", () => {
  withFreshAsolaria("conflict-orphan", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");
    const { detectConflicts } = load("src/aso-conflict-detector.js");

    // Create a topic with no relations and no observations
    const orphan = aso.addTopic({ name: "Lonely Orphan", type: "pattern", tier: "operational", createdBy: "test" });
    assert.equal(orphan.ok, true);

    const report = detectConflicts();
    assert.equal(report.ok, true);

    const orphanConflict = report.details.find((d) =>
      d.description.includes("Orphan topic") && d.description.includes("Lonely Orphan")
    );
    assert.ok(orphanConflict, "Expected an orphan topic conflict to be detected");
    assert.equal(orphanConflict.entryA, orphan.id);
    assert.equal(orphanConflict.entryB, "ORPHAN");
  });
});

test("idempotency — running detector twice does not duplicate conflicts", () => {
  withFreshAsolaria("conflict-idempotent", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");
    const { detectConflicts } = load("src/aso-conflict-detector.js");

    // Create an orphan topic to trigger a conflict
    aso.addTopic({ name: "Idempotent Orphan", type: "pattern", tier: "operational", createdBy: "test" });

    const first = detectConflicts();
    assert.equal(first.ok, true);
    assert.ok(first.conflictsAdded >= 1, "First run should add at least one conflict");

    const second = detectConflicts();
    assert.equal(second.ok, true);
    assert.equal(second.conflictsAdded, 0, "Second run should add zero new conflicts");
    assert.ok(second.conflictsSkipped >= 1, "Second run should skip the already-open conflicts");
  });
});

test("near-duplicate names are detected", () => {
  withFreshAsolaria("conflict-near-dup", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");
    const { detectConflicts } = load("src/aso-conflict-detector.js");

    // "Test Alpha" and "Test Alphb" differ by 1 character (distance=1)
    const t1 = aso.addTopic({ name: "Test Alpha", type: "pattern", tier: "operational", createdBy: "test" });
    const t2 = aso.addTopic({ name: "Test Alphb", type: "pattern", tier: "operational", createdBy: "test" });
    assert.equal(t1.ok, true);
    assert.equal(t2.ok, true);

    // Give both topics observations so they are not flagged as orphans only
    aso.addObservation({ topicId: t1.id, summary: "obs", observedBy: "test" });
    aso.addObservation({ topicId: t2.id, summary: "obs", observedBy: "test" });

    const report = detectConflicts();
    assert.equal(report.ok, true);

    const nearDup = report.details.find((d) =>
      d.description.includes("Near-duplicate names") && d.description.includes("distance=1")
    );
    assert.ok(nearDup, "Expected a near-duplicate name conflict with distance=1");
    assert.ok(
      (nearDup.entryA === t1.id && nearDup.entryB === t2.id) ||
      (nearDup.entryA === t2.id && nearDup.entryB === t1.id),
      "Conflict should reference both topic IDs"
    );
  });
});
