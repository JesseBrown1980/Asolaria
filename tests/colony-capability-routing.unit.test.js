const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("colony routing exports desktop lanes only when compute worker readiness is live", () => {
  withFreshAsolaria("colony-capability-routing-desktop", ({ load }) => {
    const { buildColonyLaneRouting } = load("src/colonyCapabilityRouting.js");

    const routing = buildColonyLaneRouting({
      status: "online",
      capabilities: {
        role: "sub_colony",
        phoneMode: "no_phone",
        desktopAgents: true,
        phoneAgents: false,
        phoneOrbital: false,
        subColonyClass: "no_phone_sub"
      },
      computeWorkerReady: false
    });

    assert.deepEqual(routing.transportLaneIds, ["bus-mqtt"]);
    assert.ok(routing.declaredLaneIds.includes("idx-search"));
    assert.ok(routing.declaredLaneIds.includes("node-share"));
    assert.equal(routing.readyLaneIds.length, 0);
    assert.ok(routing.reasons.includes("compute_worker_not_ready"));
  });
});

test("colony routing exports phone lanes only when phone orbital readiness is live", () => {
  withFreshAsolaria("colony-capability-routing-phone", ({ load }) => {
    const { buildColonyLaneRouting } = load("src/colonyCapabilityRouting.js");

    const routing = buildColonyLaneRouting({
      status: "online",
      phoneOrbitalReady: true,
      capabilities: {
        role: "sub_colony",
        phoneMode: "phone_only",
        desktopAgents: false,
        phoneAgents: true,
        phoneOrbital: true,
        subColonyClass: "phone_only_sub"
      }
    });

    assert.deepEqual(routing.readyLaneIds.sort(), ["ph-action", "ph-capture", "ph-comms"]);
    assert.equal(routing.dispatchReady, true);
    assert.equal(routing.declaredLaneIds.includes("idx-search"), false);
  });
});

test("colony routing keeps head colonies off the dispatch target list", () => {
  withFreshAsolaria("colony-capability-routing-head", ({ load }) => {
    const { buildColonyLaneRouting } = load("src/colonyCapabilityRouting.js");

    const routing = buildColonyLaneRouting({
      status: "online",
      computeWorkerReady: true,
      capabilities: {
        role: "head_colony",
        phoneMode: "phone_enabled",
        desktopAgents: true,
        phoneAgents: true,
        phoneOrbital: true
      }
    });

    assert.deepEqual(routing.transportLaneIds, ["bus-mqtt"]);
    assert.equal(routing.declaredLaneIds.length, 0);
    assert.equal(routing.readyLaneIds.length, 0);
    assert.ok(routing.reasons.includes("head_colony_not_dispatch_target"));
  });
});
