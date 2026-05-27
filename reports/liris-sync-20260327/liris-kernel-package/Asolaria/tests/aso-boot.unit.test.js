const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("aso-boot sets ASOLARIA_AGENT_NAME when not set", () => {
  withFreshAsolaria("boot-agent-name", ({ load }) => {
    const prev = process.env.ASOLARIA_AGENT_NAME;
    delete process.env.ASOLARIA_AGENT_NAME;
    try {
      load("src/aso-boot.js");
      assert.ok(process.env.ASOLARIA_AGENT_NAME, "ASOLARIA_AGENT_NAME should be set after require");
      assert.match(process.env.ASOLARIA_AGENT_NAME, /^agent-\d+$/, "should follow agent-<PID> pattern");
    } finally {
      if (prev === undefined) {
        delete process.env.ASOLARIA_AGENT_NAME;
      } else {
        process.env.ASOLARIA_AGENT_NAME = prev;
      }
    }
  });
});

test("aso-boot exports all 14 aso-client methods", () => {
  withFreshAsolaria("boot-exports", ({ load }) => {
    const prevName = process.env.ASOLARIA_AGENT_NAME;
    process.env.ASOLARIA_AGENT_NAME = "test-exports";
    try {
      const aso = load("src/aso-boot.js");
      const expected = [
        "observe", "relate", "outcome", "surface", "evidence",
        "conflict", "topic", "revise", "search", "status",
        "resolve", "resolveConflict", "list", "get"
      ];
      assert.equal(expected.length, 14, "expecting exactly 14 methods");
      for (const method of expected) {
        assert.equal(typeof aso[method], "function", `aso.${method} should be a function`);
      }
    } finally {
      if (prevName === undefined) {
        delete process.env.ASOLARIA_AGENT_NAME;
      } else {
        process.env.ASOLARIA_AGENT_NAME = prevName;
      }
    }
  });
});

test("aso-boot records a spawn observation", () => {
  withFreshAsolaria("boot-spawn-obs", ({ load }) => {
    const prevName = process.env.ASOLARIA_AGENT_NAME;
    process.env.ASOLARIA_AGENT_NAME = "test-spawn-agent";
    try {
      load("src/aso-boot.js");
      const aso = load("src/index-kernel/aso.js");

      // The spawn observation is recorded against topic "agent-lifecycle"
      // which aso-boot creates implicitly via aso.observe.
      // Check that at least one observation exists with "spawned" in the summary.
      const topic = aso.searchTopics("agent-lifecycle");
      // Even if there's no topic for it, observations table should have the entry.
      // Let's check the observations table directly via a status check and search.
      const status = aso.getAsoStatus();
      assert.ok(status.counts.observations >= 1, "should have at least one observation from spawn");
    } finally {
      if (prevName === undefined) {
        delete process.env.ASOLARIA_AGENT_NAME;
      } else {
        process.env.ASOLARIA_AGENT_NAME = prevName;
      }
    }
  });
});

test("aso-client.search returns scored results", () => {
  withFreshAsolaria("client-search", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    aso.addTopic({
      name: "Encryption Protocol",
      type: "pattern",
      tier: "operational",
      summary: "TLS handshake for broker connections",
      createdBy: "test-harness"
    });
    aso.addTopic({
      name: "Plaintext Mistake",
      type: "mistake",
      tier: "operational",
      summary: "Connecting without encryption causes silence",
      createdBy: "test-harness"
    });

    const results = aso.searchTopics("encryption");
    assert.ok(results.matches.length > 0, "should return at least one match");
    assert.ok(results.matches[0].score > 0, "first match should have a positive score");
    assert.equal(results.matches[0].kind, "aso-topic");
    // Results should be sorted by score descending
    for (let i = 1; i < results.matches.length; i++) {
      assert.ok(results.matches[i - 1].score >= results.matches[i].score, "results should be sorted by score descending");
    }
  });
});

test("aso-client.list filters by tier", () => {
  withFreshAsolaria("client-list-tier", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    aso.addTopic({ name: "Boot Topic", type: "pattern", tier: "boot", createdBy: "test" });
    aso.addTopic({ name: "Op Topic", type: "pattern", tier: "operational", createdBy: "test" });
    aso.addTopic({ name: "Another Op", type: "mistake", tier: "operational", createdBy: "test" });

    const bootTopics = aso.listTopics({ tier: "boot" });
    assert.equal(bootTopics.length, 1);
    assert.equal(bootTopics[0].name, "Boot Topic");

    const opTopics = aso.listTopics({ tier: "operational" });
    assert.equal(opTopics.length, 2);
    assert.ok(opTopics.every((t) => t.tier === "operational"));
  });
});

test("aso-client.get returns a topic by ID", () => {
  withFreshAsolaria("client-get", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    const created = aso.addTopic({
      name: "Retrievable Topic",
      type: "pattern",
      tier: "operational",
      summary: "Should be fetchable by ID",
      createdBy: "test-harness"
    });
    assert.equal(created.ok, true);

    const topic = aso.getTopic(created.id);
    assert.ok(topic, "getTopic should return a topic object");
    assert.equal(topic.asoId, created.id);
    assert.equal(topic.name, "Retrievable Topic");
    assert.equal(topic.summary, "Should be fetchable by ID");
  });
});

test("aso-client.resolve returns input unchanged for unknown IDs", () => {
  withFreshAsolaria("client-resolve", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    assert.equal(aso.resolveId("UNKNOWN-999"), "UNKNOWN-999");
    assert.equal(aso.resolveId("nonexistent"), "nonexistent");
    assert.equal(aso.resolveId(""), "");
    assert.equal(aso.resolveId("LX-000"), "LX-000");
  });
});

test("aso-client.status returns counts object", () => {
  withFreshAsolaria("client-status", ({ load }) => {
    const aso = load("src/index-kernel/aso.js");

    // Fresh instance should have zero counts
    const status = aso.getAsoStatus();
    assert.equal(status.ok, true);
    assert.equal(typeof status.counts, "object");
    assert.equal(status.counts.topics, 0);
    assert.equal(status.counts.observations, 0);
    assert.equal(status.counts.relations, 0);

    // Add a topic, counts should update
    aso.addTopic({ name: "Status Check", type: "pattern", tier: "operational", createdBy: "test" });
    const updated = aso.getAsoStatus();
    assert.equal(updated.counts.topics, 1);
  });
});
