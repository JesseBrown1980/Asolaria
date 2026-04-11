const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria, repoRoot } = require("./_unitHarness");

const modulePath = path.join(repoRoot, "src", "aso-auto-recorder.js");

// ── 1. Module exports shape — start and stop are functions ──

test("aso-auto-recorder exports start and stop as functions", () => {
  withFreshAsolaria("recorder-shape", ({ load }) => {
    const recorder = load("src/aso-auto-recorder.js");
    assert.equal(typeof recorder.start, "function", "start should be a function");
    assert.equal(typeof recorder.stop, "function", "stop should be a function");
    const keys = Object.keys(recorder).sort();
    assert.deepEqual(keys, ["start", "stop"], "exports should be exactly start and stop");
  });
});

// ── 2. start() records a startup observation in ASO ──

test("start() records a startup observation when a boot-tier topic exists", () => {
  withFreshAsolaria("recorder-start-obs", ({ load }) => {
    const aso = load("src/aso-client.js");
    const recorder = load("src/aso-auto-recorder.js");

    // Create a boot-tier topic so start() has something to observe against
    const created = aso.topic("boot/kernel", "topic", {
      tier: "boot",
      tags: ["boot"],
      summary: "Kernel boot topic for testing",
      createdBy: "test",
    });
    assert.ok(created.id, "boot topic should have an id");

    // Check observation count before start
    const statusBefore = aso.status();
    const obsBefore = (statusBefore.counts && statusBefore.counts.observations) || 0;

    try {
      recorder.start();

      // Verify an observation was added after start
      const statusAfter = aso.status();
      const obsAfter = (statusAfter.counts && statusAfter.counts.observations) || 0;
      assert.ok(
        obsAfter > obsBefore,
        `should have more observations after start (before=${obsBefore}, after=${obsAfter})`
      );
    } finally {
      recorder.stop();
    }
  });
});

// ── 3. start() twice doesn't double-start (idempotent) ──

test("start() called twice is idempotent — does not double-start", () => {
  withFreshAsolaria("recorder-idempotent", ({ load }) => {
    const aso = load("src/aso-client.js");
    const recorder = load("src/aso-auto-recorder.js");

    // Create a boot-tier topic
    aso.topic("boot/kernel", "topic", {
      tier: "boot",
      tags: ["boot"],
      summary: "Boot topic",
      createdBy: "test",
    });

    try {
      recorder.start();
      const statusAfterFirst = aso.status();
      const obsAfterFirst = (statusAfterFirst.counts && statusAfterFirst.counts.observations) || 0;

      recorder.start(); // second call should be a no-op
      const statusAfterSecond = aso.status();
      const obsAfterSecond = (statusAfterSecond.counts && statusAfterSecond.counts.observations) || 0;

      assert.equal(
        obsAfterSecond,
        obsAfterFirst,
        "second start() should not add another observation"
      );
    } finally {
      recorder.stop();
    }
  });
});

// ── 4. stop() after start doesn't throw ──

test("stop() after start() does not throw", () => {
  withFreshAsolaria("recorder-stop-after-start", ({ load }) => {
    const recorder = load("src/aso-auto-recorder.js");
    recorder.start();
    assert.doesNotThrow(() => recorder.stop(), "stop after start should not throw");
  });
});

// ── 5. stop() without start doesn't throw ──

test("stop() without start() does not throw", () => {
  withFreshAsolaria("recorder-stop-cold", ({ load }) => {
    const recorder = load("src/aso-auto-recorder.js");
    assert.doesNotThrow(() => recorder.stop(), "stop without start should not throw");
  });
});

// ── 6. Internal functions — watchOpsLog and runHealthReport are defined in source ──

test("module source defines runHealthReport and watchOpsLog internally", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.ok(source.includes("function runHealthReport"), "source should define runHealthReport");
  assert.ok(source.includes("function watchOpsLog"), "source should define watchOpsLog");
  assert.ok(source.includes("HEALTH_INTERVAL_MS"), "source should define HEALTH_INTERVAL_MS");
  assert.ok(source.includes("WATCH_INTERVAL_MS"), "source should define WATCH_INTERVAL_MS");
});

// ── 7. After start+stop cycle, verify at least 1 observation was recorded ──

test("start+stop cycle records at least 1 observation", () => {
  withFreshAsolaria("recorder-cycle-obs", ({ load }) => {
    const aso = load("src/aso-client.js");
    const recorder = load("src/aso-auto-recorder.js");

    // Create a boot-tier topic for the recorder to target
    aso.topic("boot/kernel", "topic", {
      tier: "boot",
      tags: ["boot"],
      summary: "Boot topic for cycle test",
      createdBy: "test",
    });

    const statusBefore = aso.status();
    const obsBefore = (statusBefore.counts && statusBefore.counts.observations) || 0;

    recorder.start();
    recorder.stop();

    const statusAfter = aso.status();
    const obsAfter = (statusAfter.counts && statusAfter.counts.observations) || 0;

    assert.ok(
      obsAfter > obsBefore,
      `expected at least 1 new observation after start+stop cycle (before=${obsBefore}, after=${obsAfter})`
    );
  });
});
