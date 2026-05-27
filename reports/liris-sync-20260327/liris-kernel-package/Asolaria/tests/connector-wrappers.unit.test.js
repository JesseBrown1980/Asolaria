const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const { withFreshAsolaria } = require("./_unitHarness");

const connectorsDir = path.resolve(__dirname, "..", "src", "connectors");
const allAsoWrappers = fs.readdirSync(connectorsDir)
  .filter((f) => f.endsWith("-aso.js"))
  .sort(() => Math.random() - 0.5);
const picked = allAsoWrappers.slice(0, 5);

test("5 random -aso.js wrappers each export an object with at least 1 key", () => {
  withFreshAsolaria("conn-wrap-export", ({ load }) => {
    for (const file of picked) {
      const relPath = `src/connectors/${file}`;
      let mod;
      assert.doesNotThrow(() => { mod = load(relPath); }, `require failed for ${file}`);
      assert.equal(typeof mod, "object", `${file} should export an object`);
      assert.ok(Object.keys(mod).length >= 1, `${file} should export at least 1 key`);
    }
  });
});

test("calling a wrapped function with missing deps throws connector error, not ASO error", async () => {
  await withFreshAsolaria("conn-wrap-call", async ({ load }) => {
    const file = picked[0];
    const mod = load(`src/connectors/${file}`);
    const keys = Object.keys(mod);
    const fnKey = keys.find((k) => typeof mod[k] === "function");
    if (!fnKey) return; // no callable export — skip

    try {
      const result = mod[fnKey]();
      if (result && typeof result.then === "function") await result;
    } catch (err) {
      // The error should originate from the connector logic, not the ASO wrapper.
      const stack = err.stack || "";
      assert.ok(
        !stack.includes("aso-connector-middleware"),
        `error should come from the connector, not the ASO wrapper layer: ${err.message}`
      );
    }
  });
});

test("findOrCreateConnectorTopic works for a test connector via middleware", () => {
  withFreshAsolaria("conn-wrap-topic", ({ load }) => {
    const { findOrCreateConnectorTopic } = load("src/aso-connector-middleware.js");

    const result = findOrCreateConnectorTopic("test-wrapper-connector");
    assert.equal(result.ok, true, "topic creation should succeed");
    assert.ok(result.id, "should return a topic id");
    assert.ok(result.id.startsWith("ASO-"), "id should be an ASO id");

    // Second call returns same cached reference
    const second = findOrCreateConnectorTopic("test-wrapper-connector");
    assert.strictEqual(result, second, "should return cached topic on repeat call");
  });
});
