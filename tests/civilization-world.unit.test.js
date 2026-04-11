const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("civilization world projects caller-provided task slices and separates open from projected counts", () => {
  withFreshAsolaria("civilization-world", ({ load }) => {
    const { buildCivilizationWorldState } = load("src/civilizationWorld.js");
    const closedTasks = Array.from({ length: 30 }, (_, index) => ({
      id: `task_closed_${index + 1}`,
      title: `Closed Task ${index + 1}`,
      status: "done",
      priority: "normal",
      createdAt: `2026-03-25T10:${String(index).padStart(2, "0")}:00.000Z`,
      updatedAt: `2026-03-25T10:${String(index).padStart(2, "0")}:30.000Z`
    }));
    const openTask = {
      id: "task_open_keep",
      title: "Keep Open Task",
      status: "review",
      priority: "high",
      createdAt: "2026-03-25T12:00:00.000Z",
      updatedAt: "2026-03-25T12:05:00.000Z"
    };

    const world = buildCivilizationWorldState({
      taskLedger: {
        tasks: [...closedTasks, openTask],
        summary: {
          totalTasks: 31,
          openTasks: 1,
          activeTasks: 1
        }
      }
    });

    assert.ok(world.entities.some((entity) => entity.kind === "task" && entity.label === "Keep Open Task"));
    assert.equal(world.summary.tasks, 1);
    assert.equal(world.summary.projectedTasks, 31);
    assert.equal(world.summary.closedTaskProjections, 30);
  });
});

test("civilization world projects remote sub-colony capability tags and subtype", () => {
  withFreshAsolaria("civilization-world-remote-node-capabilities", ({ load }) => {
    const { buildCivilizationWorldState } = load("src/civilizationWorld.js");

    const world = buildCivilizationWorldState({
      remoteNodes: [
        {
          nodeId: "amy-sub-01",
          status: "online",
          hasHealth: true,
          hasColony: true,
          capabilities: {
            role: "sub_colony",
            phoneMode: "phone_only",
            phoneOrbital: true,
            desktopAgents: false,
            phoneAgents: true,
            subColonyClass: "phone_only_sub"
          }
        }
      ]
    });

    const subColony = world.entities.find((entity) => entity.kind === "sub_colony");
    assert.ok(subColony);
    assert.equal(subColony.subtype, "phone_only_sub");
    assert.ok(subColony.tags.includes("phone_mode:phone_only"));
    assert.ok(subColony.tags.includes("sub_colony_class:phone_only_sub"));
    assert.equal(world.summary.routes >= 2, true);
  });
});
