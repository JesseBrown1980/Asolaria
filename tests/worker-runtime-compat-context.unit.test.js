const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria, repoRoot } = require("./_unitHarness");

function installStub(relativePath, exportsValue) {
  const absolutePath = path.join(repoRoot, relativePath);
  delete require.cache[require.resolve(absolutePath)];
  require.cache[require.resolve(absolutePath)] = {
    id: require.resolve(absolutePath),
    filename: require.resolve(absolutePath),
    loaded: true,
    exports: exportsValue
  };
}

test("worker runtime compat context exposes public route builders with stable payloads", async () => {
  await withFreshAsolaria("worker-runtime-compat-context", async ({ instanceRoot, load }) => {
    let liveFetchCalls = 0;
    installStub("src/jobQueue.js", {
      stats: () => ({ queued: 2, running: 1, total: 3, concurrency: 2 })
    });
    installStub("src/workerRuntimeWorkBundle.js", {
      buildWorkerRuntimeWorkBundle: () => ({
        ok: true,
        generatedAt: "2026-03-25T19:00:00.000Z",
        workerRouter: {
          defaultWorker: "local_codex",
          workers: [
            { id: "local_codex", title: "Local Codex", available: true, dispatchable: true },
            { id: "abacus", title: "Abacus", available: true, dispatchable: true }
          ],
          integrationSummary: {
            localCodexAvailable: true,
            claudeMaxReady: false
          },
          leaseLedger: {
            summary: { activeLeases: 1, totalLeases: 2 },
            activeLeases: [{ holderId: "local_codex" }],
            queuedLeases: [{ holderId: "abacus" }]
          },
          knownIssues: ["Claude Max review lane is offline."]
        },
        taskLedger: {
          summary: { openTasks: 1, totalTasks: 1 },
          openTasks: [{ id: "task_alpha", title: "Alpha task", status: "review", projectScope: "antigravity" }]
        }
      })
    });
    installStub("src/connectors/abacusConnector.js", {
      getAbacusIntegrationStatus: () => ({
        accountEmail: "rayssa@example.com",
        browserMode: "managed_isolated",
        workerLane: { totalPackets: 2 },
        capabilities: {
          browser: { ready: true, authenticatedLikely: true },
          cli: { mcpReady: true, printReady: true, interactiveFallbackDetected: false, brokenResourcePathsDetected: false },
          workerLane: { tier: "fast", packetCount: 2 },
          desktop: { installed: true, listenerInstalled: true }
        },
        surfaces: {
          desktop: { installed: true, cliExists: true, running: [{ pid: 10 }], listening: [{ localPort: 9999 }] },
          listener: { installed: true, running: [{ pid: 11 }], listening: [{ localPort: 7777 }] }
        },
        knownIssues: []
      })
    });
    installStub("src/connectors/symphonyConnector.js", {
      getSymphonyIntegrationStatus: () => ({
        configured: true,
        port: 4792,
        process: { running: false },
        workflowPath: "config/symphony/WORKFLOW.md"
      }),
      fetchSymphonyLiveState: async () => {
        liveFetchCalls += 1;
        return {
          ok: false,
          running: false,
          summary: { running: 0, retrying: 0, issueIdentifiers: [] }
        };
      }
    });
    installStub("src/connectors/workerRouter.js", {
      getWorkerRouterStatus: () => ({
        workers: [
          { id: "local_codex", title: "Local Codex", available: true, dispatchable: true },
          { id: "abacus", title: "Abacus", available: true, dispatchable: true }
        ],
        integrationSummary: {
          localCodexAvailable: true,
          claudeMaxReady: false
        },
        leaseLedger: {
          activeLeases: [{ holderId: "local_codex" }],
          queuedLeases: [{ holderId: "abacus" }]
        },
        knownIssues: ["Claude Max review lane is offline."]
      })
    });
    installStub("src/remoteNodeRegistry.js", {
      getRemoteNodesSummary: () => ({
        total: 1,
        online: 1,
        offline: 0,
        capabilities: {
          total: 1,
          declared: 1,
          roles: { head_colony: 0, sub_colony: 1 },
          phoneModes: { phone_enabled: 1, phone_only: 0, no_phone: 0 },
          subColonyClasses: { desktop_sub: 0, hybrid_sub: 1, phone_only_sub: 0, no_phone_sub: 0 }
        },
        nodes: [{
          nodeId: "gaia",
          status: "online",
          capabilities: {
            role: "sub_colony",
            phoneMode: "phone_enabled",
            phoneOrbital: true,
            desktopAgents: true,
            phoneAgents: true,
            subColonyClass: "hybrid_sub"
          }
        }]
      })
    });
    installStub("src/workerRuntimeCivilizationBundle.js", {
      buildCivilizationWorldBundle: () => ({
        worldState: {
          entities: [{ id: "tower_1", kind: "tower" }],
          summary: { routes: 4 }
        }
      })
    });
    installStub("src/swarmDeskExport.js", {
      buildSwarmDeskExportPayload: (input = {}) => ({ ok: true, summary: { nodes: (input.worldState?.graph?.nodes || []).length } })
    });
    const taskStore = load("src/taskLedgerStore.js");
    const leaseStore = load("src/taskLeaseLedgerStore.js");
    const task = taskStore.createTaskLedgerTask({
      title: "Alpha task",
      description: "Synthetic open task",
      status: "review",
      priority: "normal",
      source: "unit-test",
      assigneeId: "local_codex"
    }).task;
    leaseStore.createTaskLease({
      taskId: task.id,
      holderId: "local_codex",
      holderType: "worker",
      status: "active",
      actor: "unit-test",
      source: "unit-test"
    });

    const { createWorkerRuntimeCompatContext } = load("src/workerRuntimeCompatContext.js");
    const ctx = createWorkerRuntimeCompatContext({
      repoRoot: instanceRoot,
      runtimeState: {
        settings: {
          approvalMode: "smart",
          voiceOutputMode: "text"
        }
      },
      phoneBridgeKeeperStatus: () => ({ running: true, latestLogUpdatedAt: "2026-03-25T19:00:00.000Z" }),
      phoneTunnelMonitorStatus: () => ({ running: false, latestLogUpdatedAt: "2026-03-25T19:00:00.000Z" })
    });

    const fast = await ctx.buildWorkerRuntimeFastPayload();
    assert.equal(fast.ok, true);
    assert.equal(fast.queue.running, 1);
    assert.equal(fast.taskLedger.summary.openTasks, 1);
    assert.equal(fast.agentColony.counts.online, 2);
    assert.equal(fast.mistakes[0], "Claude Max review lane is offline.");
    assert.equal(liveFetchCalls, 0);
    assert.equal(fast.cleanup.root, "logs");
    assert.equal(fast.agentColony.federation.capabilities.phoneModes.phone_enabled, 1);
    assert.equal(fast.agentColony.federation.nodes[0].capabilities.subColonyClass, "hybrid_sub");
    assert.equal(fast.abacus.browserReady, true);
    assert.equal(fast.abacus.browserMode, "managed_isolated");
    assert.equal(fast.abacus.accountEmail, "ra****@example.com");
    assert.equal(fast.abacus.desktop.listeningCount, 1);
    assert.equal(fast.abacus.listener.runningCount, 1);
    assert.equal(fast.abacus.cli.mcpReady, true);

    const status = await ctx.getCachedWorkerRuntimePayload();
    assert.equal(liveFetchCalls, 1);
    assert.equal(status.workerRouter.leaseLedger.summary.totalLeases, 2);
    assert.equal(status.symphony.status.workflowPath, "WORKFLOW.md");

    ctx.workerRuntimeSnapshotCache.payload = {
      symphony: {
        liveState: {
          ok: true,
          summary: { running: 9, retrying: 1, totalTokens: 90, issueIdentifiers: ["SYM-1"] },
          state: { running: [{ issue_identifier: "SYM-1" }], retrying: [] }
        }
      }
    };
    ctx.workerRuntimeSnapshotCache.expiresAt = Date.now() - 1000;
    const expiredFast = await ctx.buildWorkerRuntimeFastPayload();
    assert.equal(expiredFast.symphony.liveState.summary.running, 0);

    const trusted = await ctx.getCachedTrustedEcosystemEntitiesPayload();
    assert.equal(trusted.summary.total, 3);
    assert.equal(trusted.summary.connected, 3);

    const abacus = await ctx.buildWorkerRuntimeAbacusPayload();
    assert.equal(abacus.abacus.desktop.installed, true);
    assert.equal(abacus.abacus.cli.printReady, true);

    const superCoder = await ctx.buildSuperCoderCockpitPayload();
    assert.equal(superCoder.ok, true);
    assert.equal(superCoder.readiness, "warning");
    assert.equal(superCoder.summary.worldRoutes, 4);
    assert.equal(superCoder.summary.worldTowers, 1);
  });
});

test("worker runtime compat work payload does not bootstrap ledgers on empty read-only instances", async () => {
  await withFreshAsolaria("worker-runtime-compat-empty-work", async ({ instanceRoot, load }) => {
    let workBundleCalls = 0;
    installStub("src/workerRuntimeWorkBundle.js", {
      buildWorkerRuntimeWorkBundle: () => {
        workBundleCalls += 1;
        return {
          ok: true,
          generatedAt: "2026-03-25T19:00:00.000Z",
          workerRouter: {},
          taskLedger: { summary: {}, openTasks: [] }
        };
      }
    });
    installStub("src/jobQueue.js", { stats: () => ({ queued: 0, running: 0, total: 0, concurrency: 1 }) });
    installStub("src/connectors/abacusConnector.js", { getAbacusIntegrationStatus: () => ({}) });
    installStub("src/connectors/symphonyConnector.js", {
      getSymphonyIntegrationStatus: () => ({ configured: false, process: { running: false } }),
      fetchSymphonyLiveState: async () => ({ ok: false, summary: { running: 0, retrying: 0, issueIdentifiers: [] } })
    });
    installStub("src/connectors/workerRouter.js", { getWorkerRouterStatus: () => ({}) });
    installStub("src/remoteNodeRegistry.js", { getRemoteNodesSummary: () => ({ total: 0, online: 0, offline: 0, nodes: [] }) });
    installStub("src/workerRuntimeCivilizationBundle.js", { buildCivilizationWorldBundle: () => ({ worldState: { summary: {} } }) });
    installStub("src/swarmDeskExport.js", { buildSwarmDeskExportPayload: () => ({ ok: true }) });

    const { createWorkerRuntimeCompatContext } = load("src/workerRuntimeCompatContext.js");
    const ctx = createWorkerRuntimeCompatContext({
      repoRoot: instanceRoot,
      runtimeState: { settings: {} },
      phoneBridgeKeeperStatus: () => ({ running: false }),
      phoneTunnelMonitorStatus: () => ({ running: false })
    });
    const payload = await ctx.buildWorkerRuntimeWorkPayload();

    assert.equal(payload.ok, true);
    assert.equal(payload.taskLedger.summary.totalTasks, 0);
    assert.equal(payload.workerRouter.leaseLedger.summary.totalLeases, 0);
    assert.equal(payload.workerRouter.dispatches.length, 0);
    assert.equal(workBundleCalls, 0);
    assert.equal(fs.existsSync(path.join(instanceRoot, "data", "task-ledger.json")), false);
    assert.equal(fs.existsSync(path.join(instanceRoot, "data", "task-lease-ledger.json")), false);
  });
});
