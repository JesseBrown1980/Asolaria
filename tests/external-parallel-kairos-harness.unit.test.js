const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("external parallel harness builds bounded tuple projection", () => {
  const harness = require("../tools/external-parallel-kairos-harness.js");
  const tuple = harness.buildCanonicalTuple({
    D1_ACTOR: ["external"],
    D3_TARGET: ["index"],
    D35_HYPERLANGUAGE: ["35D"]
  });

  assert.equal(tuple[0].dimension, "D1_ACTOR");
  assert.deepEqual(tuple[0].values, ["external"]);
  assert.equal(tuple.at(-1).dimension, "D35_HYPERLANGUAGE");
  assert.deepEqual(tuple.at(-1).values, ["35D"]);
});

test("external parallel harness writes runtime artifacts without promoting canon", () => {
  withFreshAsolaria("external-parallel-kairos", ({ instanceRoot, load }) => {
    const harness = load("tools/external-parallel-kairos-harness.js");
    const outputRoot = path.join(instanceRoot, "runtime", "external-parallel-kairos");
    const result = harness.runWave({ outputRoot });

    assert.equal(result.manifest.materialId, "EXTERNAL-PARALLEL-REDDIT-KAIROS-2026-04-10");
    assert.equal(result.manifest.planId, "IX-489");
    assert.equal(result.manifest.toolId, "IX-490");
    assert.equal(result.manifest.promoteToCanon, false);
    assert.equal(result.manifest.mutate35DMap, false);
    assert.equal(result.review.reviewState, "bounded_sidecar_approved");
    assert.match(result.packet, /canon_rule=do_not_mutate_hilbert_omni_35D_from_screenshots_alone/);

    const manifestPath = path.join(outputRoot, "manifest.json");
    const planPath = path.join(outputRoot, "plan.json");
    const reviewPath = path.join(outputRoot, "review.json");
    const tuplePath = path.join(outputRoot, "tuple.json");
    const packetPath = path.join(outputRoot, "packet.txt");

    assert.equal(fs.existsSync(manifestPath), true);
    assert.equal(fs.existsSync(planPath), true);
    assert.equal(fs.existsSync(reviewPath), true);
    assert.equal(fs.existsSync(tuplePath), true);
    assert.equal(fs.existsSync(packetPath), true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
    const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
    const tuple = JSON.parse(fs.readFileSync(tuplePath, "utf8"));

    assert.equal(manifest.runtimeImportAllowed, false);
    assert.equal(plan.phases.length, 4);
    assert.equal(plan.phases[0].name, "integrate");
    assert.equal(plan.phases[1].name, "orchestrate");
    assert.equal(plan.phases[2].name, "test");
    assert.equal(plan.phases[3].name, "review");
    assert.equal(review.recommendation, "keep_for_benchmark_and_translation_tests_not_execution");
    assert.ok(tuple.some((entry) => entry.dimension === "D35_HYPERLANGUAGE"));
  });
});
