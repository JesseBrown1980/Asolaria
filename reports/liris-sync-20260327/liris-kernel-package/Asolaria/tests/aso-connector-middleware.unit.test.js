const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("findOrCreateConnectorTopic creates a new topic for unknown connector", () => {
  withFreshAsolaria("conn-new-topic", ({ load }) => {
    const { findOrCreateConnectorTopic } = load("src/aso-connector-middleware.js");

    const result = findOrCreateConnectorTopic("my-new-connector");
    assert.equal(result.ok, true);
    assert.ok(result.id, "should return a topic id");
    assert.ok(result.id.startsWith("ASO-"), "id should be an ASO id");
  });
});

test("findOrCreateConnectorTopic returns existing topic on second call (cached)", () => {
  withFreshAsolaria("conn-cached", ({ load }) => {
    const { findOrCreateConnectorTopic } = load("src/aso-connector-middleware.js");

    const first = findOrCreateConnectorTopic("cached-connector");
    const second = findOrCreateConnectorTopic("cached-connector");

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(first.id, second.id, "second call should return the same cached id");
    assert.strictEqual(first, second, "second call should return the exact same object reference (cache hit)");
  });
});

test("withAso wraps a sync function — original return value passes through", () => {
  withFreshAsolaria("conn-sync-return", ({ load }) => {
    const { withAso } = load("src/aso-connector-middleware.js");

    const original = (a, b) => a + b;
    const wrapped = withAso("sync-add", original);

    const result = wrapped(3, 4);
    assert.equal(result, 7, "wrapped function should return original result");
  });
});

test("withAso wraps a sync function — records observation + outcome on success", () => {
  withFreshAsolaria("conn-sync-obs", ({ load }) => {
    const { withAso, findOrCreateConnectorTopic } = load("src/aso-connector-middleware.js");
    const aso = load("src/index-kernel/aso.js");

    const wrapped = withAso("obs-connector", () => "ok");
    wrapped();

    const topicResult = findOrCreateConnectorTopic("obs-connector");
    const observations = aso.getObservations(topicResult.id);
    assert.ok(observations.length > 0, "should have at least one observation");
    assert.ok(
      observations.some((o) => o.summary.includes("obs-connector invoked")),
      "observation should mention connector invocation"
    );

    const outcomes = aso.getOutcomes(topicResult.id);
    assert.ok(outcomes.length > 0, "should have at least one outcome");
    assert.ok(
      outcomes.some((o) => o.result === "success"),
      "outcome should record success"
    );
  });
});

test("withAso wraps a sync function — records outcome on error, re-throws", () => {
  withFreshAsolaria("conn-sync-err", ({ load }) => {
    const { withAso, findOrCreateConnectorTopic } = load("src/aso-connector-middleware.js");
    const aso = load("src/index-kernel/aso.js");

    const wrapped = withAso("err-connector", () => {
      throw new Error("boom");
    });

    assert.throws(() => wrapped(), { message: "boom" });

    const topicResult = findOrCreateConnectorTopic("err-connector");
    const outcomes = aso.getOutcomes(topicResult.id);
    assert.ok(outcomes.length > 0, "should have at least one outcome");
    assert.ok(
      outcomes.some((o) => o.result.includes("error: boom")),
      "outcome should record the error message"
    );
  });
});

test("withAso wraps an async function — same behavior for promises", async () => {
  await withFreshAsolaria("conn-async", async ({ load }) => {
    const { withAso, findOrCreateConnectorTopic } = load("src/aso-connector-middleware.js");
    const aso = load("src/index-kernel/aso.js");

    // Success path
    const wrappedOk = withAso("async-ok", async (x) => x * 2);
    const val = await wrappedOk(5);
    assert.equal(val, 10, "async wrapped function should resolve with original value");

    const topicOk = findOrCreateConnectorTopic("async-ok");
    const outcomesOk = aso.getOutcomes(topicOk.id);
    assert.ok(
      outcomesOk.some((o) => o.result === "success"),
      "should record success outcome for async"
    );

    // Error path
    const wrappedErr = withAso("async-err", async () => {
      throw new Error("async-boom");
    });
    await assert.rejects(() => wrappedErr(), { message: "async-boom" });

    const topicErr = findOrCreateConnectorTopic("async-err");
    const outcomesErr = aso.getOutcomes(topicErr.id);
    assert.ok(
      outcomesErr.some((o) => o.result.includes("error: async-boom")),
      "should record error outcome for async"
    );
  });
});

test("registerConnector creates topic + surface", () => {
  withFreshAsolaria("conn-register", ({ load }) => {
    const { registerConnector, findOrCreateConnectorTopic } = load("src/aso-connector-middleware.js");

    const surfaceResult = registerConnector("reg-connector", "localhost", 9090);
    assert.equal(surfaceResult.ok, true, "surface creation should succeed");

    const topicResult = findOrCreateConnectorTopic("reg-connector");
    assert.equal(topicResult.ok, true, "topic should exist after registerConnector");
    assert.ok(topicResult.id, "topic should have an id");
  });
});
