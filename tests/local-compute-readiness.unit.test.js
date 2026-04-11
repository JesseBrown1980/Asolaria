const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("local compute readiness exports normalized colony routing for federation", () => {
  withFreshAsolaria("local-compute-readiness-routing", ({ instanceRoot, load }) => {
    const configRoot = path.join(instanceRoot, "config");
    fs.mkdirSync(configRoot, { recursive: true });
    fs.writeFileSync(path.join(configRoot, "liris-node-identity.json"), JSON.stringify({
      nodeId: "amy-sub-01",
      role: "sub_colony",
      capabilities: ["code_execution", "phone_orbital", "phone_agents"],
      phoneMode: "phone_enabled"
    }, null, 2));
    fs.writeFileSync(path.join(configRoot, "asolaria.gateway.json"), JSON.stringify({
      tools: {
        allow: ["localops.run"]
      }
    }, null, 2));

    const originalSpawnSync = childProcess.spawnSync;
    childProcess.spawnSync = () => ({
      status: 0,
      stdout: "python.exe\r\n",
      stderr: ""
    });
    try {
      const { getLocalComputeReadinessStatus } = load("src/localComputeReadiness.js");
      const status = getLocalComputeReadinessStatus();

      assert.equal(status.colonyCapabilities.phoneMode, "phone_enabled");
      assert.equal(status.federationRouting.declaredLaneIds.includes("node-share"), true);
      assert.equal(status.federationRouting.readyLaneIds.includes("node-share"), true);
      assert.equal(status.federationRouting.declaredLaneIds.includes("ph-action"), true);
      assert.equal(status.federationRouting.readyLaneIds.includes("ph-action"), false);
      assert.equal(status.federationRouting.transportLaneIds.includes("bus-mqtt"), true);
    } finally {
      childProcess.spawnSync = originalSpawnSync;
    }
  });
});
