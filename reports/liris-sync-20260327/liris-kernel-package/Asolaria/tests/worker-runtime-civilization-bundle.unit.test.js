const assert = require("node:assert/strict");
const test = require("node:test");

const { withFreshAsolaria } = require("./_unitHarness");

test("worker runtime civilization bundle composes injected readers into a stable contract", () => {
  withFreshAsolaria("worker-runtime-civilization-bundle-injected", ({ load }) => {
    const { buildCivilizationWorldBundle } = load("src/workerRuntimeCivilizationBundle.js");

    const bundle = buildCivilizationWorldBundle({
      includeTrusted: true,
      includeAdminCockpit: false,
      taskLimit: 2,
      eventLimit: 3,
      windowMinutes: 120,
      maxNodes: 12,
      maxEdges: 18,
      includeLowRisk: false,
      readers: {
        graphSnapshot: () => ({
          generatedAt: "2026-03-25T12:00:00.000Z",
          windowMinutes: 120,
          includeLowRisk: false,
          graph: {
            nodes: [
              { id: "task_alpha", label: "Task Alpha" },
              { id: "agent_alpha", label: "Agent Alpha" }
            ],
            edges: [
              { id: "edge_alpha", source: "task_alpha", target: "agent_alpha" }
            ]
          },
          records: {
            events: [{ id: "evt_alpha" }],
            manifests: [{ id: "man_alpha" }]
          },
          recent: {
            events: [{ id: "evt_alpha" }],
            manifests: [{ id: "man_alpha" }]
          }
        }),
        taskLedger: () => ({
          version: 2,
          createdAt: "2026-03-25T12:00:00.000Z",
          updatedAt: "2026-03-25T12:00:00.000Z",
          summary: {
            totalTasks: 1,
            openTasks: 1,
            activeTasks: 1,
            archivedTasks: 0,
            eventsCount: 1
          },
          tasks: [
            {
              id: "task_alpha",
              title: "Task Alpha",
              status: "review",
              priority: "high",
              projectScope: "bundle",
              lastLeaseId: "",
              leaseContext: {
                leaseId: "lease_alpha",
                holderId: "holder_alpha",
                status: "active"
              }
            }
          ],
          events: [{ id: "task_evt_alpha" }]
        }),
        leaseLedger: () => ({
          version: 2,
          createdAt: "2026-03-25T12:00:00.000Z",
          updatedAt: "2026-03-25T12:00:00.000Z",
          summary: {
            totalLeases: 1,
            activeLeases: 1,
            eventsCount: 1
          },
          leases: [
            {
              leaseId: "lease_alpha",
              taskId: "task_alpha",
              status: "active",
              holderId: "holder_alpha"
            }
          ],
          events: [{ id: "lease_evt_alpha" }]
        }),
        trustedEntities: () => ({
          entities: [
            { id: "trusted-alpha", label: "Trusted Alpha", kind: "surface", connected: true }
          ]
        }),
        agentColony: () => ({
          counts: { total: 1, online: 1, active: 1 },
          agents: [
            { id: "agent-alpha", name: "Agent Alpha", running: true, state: "active", plane: "lane" }
          ]
        }),
        remoteNodes: () => ([
          {
            nodeId: "amy-sub-01",
            status: "online",
            hasHealth: true,
            hasColony: true,
            capabilities: {
              role: "sub_colony",
              phoneMode: "phone_enabled",
              phoneOrbital: true,
              desktopAgents: true,
              phoneAgents: true,
              subColonyClass: "hybrid_sub"
            }
          }
        ]),
        adminCockpit: () => ({
          terminals: []
        })
      }
    });

    assert.equal(bundle.ok, true);
    assert.equal(bundle.sourceContract, "civilization-world-bundle");
    assert.equal(bundle.options.includeTrusted, true);
    assert.equal(bundle.options.includeAdminCockpit, false);
    assert.equal(bundle.trustedEntities.entities.length, 1);
    assert.equal(bundle.adminCockpit.terminals.length, 0);
    assert.equal(bundle.taskLedger.tasks[0].leaseContext.holderId, "holder_alpha");
    assert.equal(bundle.worldState.summary.projectedTasks, 1);
    assert.equal(bundle.worldState.projections.taskLedger.openTasks, 1);
    assert.equal(bundle.summary.taskLedger.totalTasks, 1);
    assert.equal(bundle.summary.leaseLedger.totalLeases, 1);
    assert.equal(bundle.summary.graph.nodes, 2);
    assert.equal(bundle.summary.graph.edges, 1);
    assert.equal(bundle.worldState.entities.some((entity) => entity.kind === "sub_colony" && entity.subtype === "hybrid_sub"), true);
  });
});

test("worker runtime civilization bundle composes live graph, task, and lease readers", () => {
  withFreshAsolaria("worker-runtime-civilization-bundle-live", ({ load }) => {
    const { buildCivilizationWorldBundle } = load("src/workerRuntimeCivilizationBundle.js");
    const { createTaskLedgerTask } = load("src/taskLedgerStore.js");
    const { createTaskLease } = load("src/taskLeaseLedgerStore.js");
    const { appendGraphEvent, appendActionManifest } = load("src/graphRuntimeStore.js");

    const taskResult = createTaskLedgerTask({
      title: "Bundle live task",
      description: "Task used to verify the civilization bundle assembler.",
      priority: "high",
      actor: "bundle-test",
      source: "bundle-test"
    });
    const task = taskResult.task;

    const leaseResult = createTaskLease({
      taskId: task.id,
      holderId: "bundle-agent",
      holderType: "manager",
      status: "active",
      actor: "bundle-test",
      source: "bundle-test"
    });
    assert.equal(leaseResult.lease.status, "active");

    appendGraphEvent({
      component: "bundle-test",
      category: "civilization_world",
      action: "bundle_snapshot",
      actor: { type: "task_actor", id: "bundle-test" },
      target: { type: "task", id: task.id, label: task.title },
      context: { taskId: task.id },
      status: "completed"
    });
    appendActionManifest({
      component: "bundle-test",
      action: "bundle_manifest",
      status: "proposed",
      actor: { type: "task_actor", id: "bundle-test" },
      target: { type: "task", id: task.id, label: task.title },
      context: { taskId: task.id }
    });

    const bundle = buildCivilizationWorldBundle({
      taskLimit: 10,
      eventLimit: 10,
      windowMinutes: 24 * 60,
      maxNodes: 48,
      maxEdges: 48,
      includeLowRisk: true,
      includeTrusted: false,
      includeAdminCockpit: true
    });

    const liveTask = bundle.taskLedger.tasks.find((row) => row.id === task.id);
    assert.ok(liveTask);
    assert.equal(liveTask.leaseContext.status, "active");
    assert.equal(bundle.leaseLedger.summary.totalLeases >= 1, true);
    assert.equal(bundle.summary.taskLedger.openTasks >= 1, true);
    assert.equal(bundle.worldState.summary.projectedTasks >= 1, true);
    assert.equal(bundle.worldState.summary.tasks >= 1, true);
    assert.equal(bundle.worldState.projections.taskLedger.openTasks, bundle.taskLedger.summary.openTasks);
    assert.equal(bundle.summary.graph.events >= 1, true);
    assert.equal(bundle.summary.graph.manifests >= 1, true);
  });
});
