const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("colony capability schema normalizes phone-only sub-colonies into a strict routing shape", () => {
  withFreshAsolaria("colony-capability-schema-phone-only", ({ load }) => {
    const { normalizeColonyCapabilities } = load("src/colonyCapabilitySchema.js");

    const capabilities = normalizeColonyCapabilities({
      role: "sub_colony",
      phoneMode: "phone_only",
      phoneOrbital: false,
      desktopAgents: true,
      phoneAgents: false,
      subColonyClass: "hybrid_sub"
    }, {
      nodeId: "amy-sub-01"
    });

    assert.equal(capabilities.role, "sub_colony");
    assert.equal(capabilities.phoneMode, "phone_only");
    assert.equal(capabilities.phoneOrbital, true);
    assert.equal(capabilities.desktopAgents, false);
    assert.equal(capabilities.phoneAgents, true);
    assert.equal(capabilities.subColonyClass, "phone_only_sub");
    assert.ok(capabilities.issues.includes("phone_only_disables_desktop_agents"));
    assert.ok(capabilities.issues.includes("phone_only_requires_phone_orbital"));
    assert.ok(capabilities.issues.includes("sub_colony_class_normalized"));
  });
});

test("colony capability schema forces head colonies to stay desktop-backed", () => {
  withFreshAsolaria("colony-capability-schema-head", ({ load }) => {
    const { normalizeColonyCapabilities } = load("src/colonyCapabilitySchema.js");

    const capabilities = normalizeColonyCapabilities({
      role: "head_colony",
      phoneMode: "phone_only",
      phoneOrbital: true,
      desktopAgents: false
    }, {
      nodeId: "jesse-main"
    });

    assert.equal(capabilities.role, "head_colony");
    assert.equal(capabilities.headColony, "jesse-main");
    assert.equal(capabilities.desktopAgents, true);
    assert.equal(capabilities.phoneMode, "phone_enabled");
    assert.equal(capabilities.subColonyClass, "");
    assert.ok(capabilities.issues.includes("head_colony_requires_desktop_agents"));
    assert.ok(capabilities.issues.includes("head_colony_cannot_be_phone_only"));
  });
});
