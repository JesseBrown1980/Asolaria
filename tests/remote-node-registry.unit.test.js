const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("remote node registry summarizes normalized colony capabilities", () => {
  withFreshAsolaria("remote-node-registry-capabilities", ({ load }) => {
    const registry = load("src/remoteNodeRegistry.js");

    registry.updateNodeHealth("amy-sub-01", { ok: true });
    registry.updateNodeColony("amy-sub-01", {
      role: "sub_colony",
      headColony: "jesse-main",
      phoneMode: "phone_enabled",
      phoneOrbital: true,
      phoneOrbitalReady: true,
      desktopAgents: true,
      phoneAgents: true,
      computeWorkerReady: true,
      subColonyClass: "hybrid_sub"
    });

    const summary = registry.getRemoteNodesSummary();
    const node = summary.nodes.find((row) => row.nodeId === "amy-sub-01");

    assert.ok(node);
    assert.equal(node.capabilities.headColony, "jesse-main");
    assert.equal(node.capabilities.phoneMode, "phone_enabled");
    assert.equal(node.capabilities.subColonyClass, "hybrid_sub");
    assert.equal(node.routing.dispatchReady, true);
    assert.equal(node.routing.readyLaneIds.includes("node-share"), true);
    assert.equal(node.routing.readyLaneIds.includes("ph-action"), true);
    assert.equal(summary.capabilities.total, 1);
    assert.equal(summary.capabilities.declared, 1);
    assert.equal(summary.capabilities.phoneModes.phone_enabled, 1);
    assert.equal(summary.capabilities.subColonyClasses.hybrid_sub, 1);
  });
});
