const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");

const { withFreshAsolaria, repoRoot } = require("./_unitHarness");

// ── 1. Exports start and stop as functions ──

test("colony-daemon exports start and stop as functions", () => {
  withFreshAsolaria("daemon-shape", ({ load }) => {
    const daemon = load("src/colony-daemon.js");
    assert.equal(typeof daemon.start, "function", "start should be a function");
    assert.equal(typeof daemon.stop, "function", "stop should be a function");
  });
});

// ── 2. start() initiates auto-recorder (verify observation recorded) ──

test("start() records at least one observation via auto-recorder subsystem", () => {
  withFreshAsolaria("daemon-start-obs", ({ load }) => {
    const aso = load("src/aso-client.js");
    const daemon = load("src/colony-daemon.js");

    // Create a boot-tier topic so the auto-recorder has something to observe against
    aso.topic("boot/kernel", "topic", {
      tier: "boot",
      tags: ["boot"],
      summary: "Boot topic for daemon test",
      createdBy: "test",
    });

    const statusBefore = aso.status();
    const obsBefore = (statusBefore.counts && statusBefore.counts.observations) || 0;

    try {
      daemon.start();

      const statusAfter = aso.status();
      const obsAfter = (statusAfter.counts && statusAfter.counts.observations) || 0;
      assert.ok(
        obsAfter > obsBefore,
        `should have more observations after start (before=${obsBefore}, after=${obsAfter})`
      );
    } finally {
      daemon.stop();
    }
  });
});

// ── 3. start() twice is idempotent ──

test("start() called twice is idempotent — does not double-start", () => {
  withFreshAsolaria("daemon-idempotent", ({ load }) => {
    const aso = load("src/aso-client.js");
    const daemon = load("src/colony-daemon.js");

    aso.topic("boot/kernel", "topic", {
      tier: "boot",
      tags: ["boot"],
      summary: "Boot topic",
      createdBy: "test",
    });

    try {
      daemon.start();
      const statusAfterFirst = aso.status();
      const obsAfterFirst = (statusAfterFirst.counts && statusAfterFirst.counts.observations) || 0;

      daemon.start(); // second call should be a no-op
      const statusAfterSecond = aso.status();
      const obsAfterSecond = (statusAfterSecond.counts && statusAfterSecond.counts.observations) || 0;

      assert.equal(
        obsAfterSecond,
        obsAfterFirst,
        "second start() should not add another observation"
      );
    } finally {
      daemon.stop();
    }
  });
});

// ── 4. stop() after start() cleans up without error ──

test("stop() after start() does not throw", () => {
  withFreshAsolaria("daemon-stop-after-start", ({ load }) => {
    const daemon = load("src/colony-daemon.js");
    daemon.start();
    assert.doesNotThrow(() => daemon.stop(), "stop after start should not throw");
  });
});

// ── 5. stop() without start() is safe ──

test("stop() without start() does not throw", () => {
  withFreshAsolaria("daemon-stop-cold", ({ load }) => {
    const daemon = load("src/colony-daemon.js");
    assert.doesNotThrow(() => daemon.stop(), "stop without start should not throw");
  });
});
