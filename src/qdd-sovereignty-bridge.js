/**
 * QDD Sovereignty Bridge — Routes QDD test/build/deploy commands
 * through the sovereignty kernel's selector catalog tumbler.
 *
 * IX chain: IX-396, IX-398, IX-395
 * LX chain: LX-153, LX-154
 *
 * Design:
 *   1. Loads sovereignty boot (USB-first, local fallback)
 *   2. Checks QDD worker authority via sovereignty gate
 *   3. Routes commands through cpu_local_general tumbler lane
 *   4. Enforces pnpm10 baseline (IX-398) on all QDD dispatches
 *   5. Records outcomes through ASO client
 *
 * Exports: dispatchQddTest(lane, command), getQddSovereigntyStatus()
 */
const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

const { boot, status: sovereigntyStatus } = require("./sovereignty-boot");
const { gate, TIER_ROUTINE } = require("./sovereignty-gate");
const aso = require("./aso-client");

// --- Constants ---

const QDD_AUTHOR = "qdd-worker";
const QDD_TOPIC = "qdd-sovereignty-bridge";
const DEFAULT_TUMBLER = "cpu_local_general";
const PNPM_BASELINE = "10";

// Valid QDD lanes matching IX-396 split structure
const QDD_LANES = new Set([
  "queue-sftp",
  "ez-protect",
  "pnpm10-tooling",
  "shared-harness",
]);

// Valid command prefixes — only test/build/deploy, no arbitrary exec
const ALLOWED_COMMANDS = new Set([
  "test",
  "build",
  "deploy",
  "lint",
  "typecheck",
]);

// --- Tumbler lease management ---

/**
 * Acquire a slot in the tumbler for a QDD dispatch.
 * Returns a lease object or null if the tumbler is full.
 */
function acquireTumblerLease(sovereignty, tumblerId, laneId) {
  const catalogTumbler = sovereignty.catalog.tumblers
    ? sovereignty.catalog.tumblers[tumblerId]
    : null;

  // Read tumbler config from catalog for maxActive / queueDepth
  const catalogData = sovereignty.catalog.loaded
    ? require(sovereignty.catalog.path)
    : null;
  const tumblerConfig = catalogData?.tumblers?.[tumblerId] || {
    maxActive: 4,
    queueDepth: 16,
  };

  // Read current tumbler state
  const tumblerState = sovereignty.tumbler.loaded
    ? require(sovereignty.tumbler.path)
    : null;
  const slot = tumblerState?.tumblers?.[tumblerId];

  if (!slot) {
    // No tumbler state file or no slot — create ephemeral lease
    return {
      leaseId: `qdd-${laneId}-${Date.now()}`,
      tumblerId,
      ephemeral: true,
      acquiredAt: new Date().toISOString(),
    };
  }

  const activeCount = (slot.activeLeases || []).length;
  if (activeCount >= tumblerConfig.maxActive) {
    const waitCount = (slot.waitQueue || []).length;
    if (waitCount >= tumblerConfig.queueDepth) {
      return null; // tumbler saturated
    }
    // Queue the request — caller must wait
    return {
      leaseId: `qdd-${laneId}-${Date.now()}`,
      tumblerId,
      queued: true,
      position: waitCount + 1,
      acquiredAt: new Date().toISOString(),
    };
  }

  // Lease acquired
  const lease = {
    leaseId: `qdd-${laneId}-${Date.now()}`,
    tumblerId,
    queued: false,
    ephemeral: false,
    acquiredAt: new Date().toISOString(),
  };

  // Persist lease into tumbler state (best-effort)
  try {
    slot.activeLeases = slot.activeLeases || [];
    slot.activeLeases.push({
      id: lease.leaseId,
      lane: laneId,
      at: lease.acquiredAt,
    });
    tumblerState.updatedAt = new Date().toISOString();
    fs.writeFileSync(
      sovereignty.tumbler.path,
      JSON.stringify(tumblerState, null, 2),
      "utf8"
    );
  } catch (_) {
    // Best-effort — don't block dispatch on state-write failure
    lease.ephemeral = true;
  }

  return lease;
}

/**
 * Release a tumbler lease after dispatch completes.
 */
function releaseTumblerLease(sovereignty, lease) {
  if (!lease || lease.ephemeral) return;
  try {
    const tumblerState = JSON.parse(
      fs.readFileSync(sovereignty.tumbler.path, "utf8")
    );
    const slot = tumblerState?.tumblers?.[lease.tumblerId];
    if (slot && Array.isArray(slot.activeLeases)) {
      slot.activeLeases = slot.activeLeases.filter(
        (l) => l.id !== lease.leaseId
      );
      tumblerState.updatedAt = new Date().toISOString();
      fs.writeFileSync(
        sovereignty.tumbler.path,
        JSON.stringify(tumblerState, null, 2),
        "utf8"
      );
    }
  } catch (_) {
    // Best-effort cleanup
  }
}

// --- pnpm10 baseline enforcement (IX-398) ---

function validatePnpmBaseline(command) {
  // Reject any command that explicitly references pnpm 9
  if (/pnpm@9|pnpm9|PNPM_VERSION=9/i.test(command)) {
    return {
      valid: false,
      reason: "pnpm9_baseline_rejected",
      rule: "IX-398: QDD = pnpm10. Split drift to pnpm9 = invalid baseline.",
    };
  }
  return { valid: true };
}

function parseCommand(command) {
  const parts = command.trim().split(/\s+/);
  const verb = parts[0];
  if (!ALLOWED_COMMANDS.has(verb)) {
    return {
      valid: false,
      reason: "command_not_allowed",
      verb,
      allowed: [...ALLOWED_COMMANDS],
    };
  }
  return { valid: true, verb, args: parts.slice(1), raw: command };
}

// --- Main dispatch ---

/**
 * Dispatch a QDD test/build/deploy command through the sovereignty kernel.
 *
 * @param {string} lane — QDD lane: "queue-sftp" | "ez-protect" | "pnpm10-tooling" | "shared-harness"
 * @param {string} command — Command to execute: "test", "build", "deploy", "lint", "typecheck" + args
 * @param {object} [opts] — Optional overrides
 * @param {string} [opts.author] — Override author identity (default: "qdd-worker")
 * @param {string} [opts.tumbler] — Override tumbler lane (default: "cpu_local_general")
 * @param {string} [opts.cwd] — Working directory for the command
 * @param {boolean} [opts.dryRun] — If true, validate and return plan without executing
 * @returns {object} Dispatch result with status, lease, gate, and output
 */
function dispatchQddTest(lane, command, opts = {}) {
  const author = opts.author || QDD_AUTHOR;
  const tumblerId = opts.tumbler || DEFAULT_TUMBLER;
  const ts = new Date().toISOString();

  // 1. Validate lane
  if (!QDD_LANES.has(lane)) {
    return {
      ok: false,
      phase: "validate",
      reason: "invalid_lane",
      lane,
      validLanes: [...QDD_LANES],
    };
  }

  // 2. Parse and validate command
  const parsed = parseCommand(command);
  if (!parsed.valid) {
    return { ok: false, phase: "validate", ...parsed };
  }

  // 3. Enforce pnpm10 baseline (IX-398)
  const baselineCheck = validatePnpmBaseline(command);
  if (!baselineCheck.valid) {
    return { ok: false, phase: "baseline", ...baselineCheck };
  }

  // 4. Boot sovereignty kernel
  const sovereignty = boot();
  if (!sovereignty.ok) {
    return { ok: false, phase: "boot", reason: "sovereignty_boot_failed" };
  }

  // 5. Check authority through sovereignty gate
  const gateResult = gate("add-observation", author, {
    lane,
    command: parsed.raw,
    sourceKind: "code_verified",
  });
  if (!gateResult.allowed) {
    return {
      ok: false,
      phase: "gate",
      reason: gateResult.reason,
      tier: gateResult.tier,
      author,
    };
  }

  // 6. Acquire tumbler lease (cpu_local_general)
  const lease = acquireTumblerLease(sovereignty, tumblerId, lane);
  if (!lease) {
    return {
      ok: false,
      phase: "tumbler",
      reason: "tumbler_saturated",
      tumblerId,
    };
  }
  if (lease.queued) {
    return {
      ok: false,
      phase: "tumbler",
      reason: "tumbler_queued",
      tumblerId,
      position: lease.position,
      leaseId: lease.leaseId,
    };
  }

  // 7. Dry run — return plan without executing
  if (opts.dryRun) {
    releaseTumblerLease(sovereignty, lease);
    return {
      ok: true,
      dryRun: true,
      lane,
      command: parsed.raw,
      verb: parsed.verb,
      tumblerId,
      leaseId: lease.leaseId,
      gate: gateResult,
      author,
      ts,
    };
  }

  // 8. Execute command
  let output, exitCode, error;
  const startMs = Date.now();

  try {
    // Build the actual pnpm command
    const pnpmCmd = `pnpm ${parsed.raw}`;
    output = execSync(pnpmCmd, {
      cwd: opts.cwd || process.cwd(),
      encoding: "utf8",
      timeout: 300000, // 5 min max
      env: {
        ...process.env,
        QDD_LANE: lane,
        QDD_SOVEREIGNTY_LEASE: lease.leaseId,
        PNPM_VERSION: "10.32.0",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    exitCode = 0;
  } catch (e) {
    output = (e.stdout || "") + "\n" + (e.stderr || "");
    exitCode = e.status || 1;
    error = e.message;
  }

  const durationMs = Date.now() - startMs;

  // 9. Release tumbler lease
  releaseTumblerLease(sovereignty, lease);

  // 10. Record outcome through ASO
  const passed = exitCode === 0;
  const summary = `QDD ${lane} ${parsed.verb}: ${passed ? "PASS" : "FAIL"} (${durationMs}ms, exit ${exitCode})`;

  try {
    const result = aso.outcome(QDD_TOPIC, `dispatch:${lane}:${parsed.verb}`, summary, {
      author,
      lane,
      command: parsed.raw,
      exitCode,
      durationMs,
      leaseId: lease.leaseId,
      tumblerId,
      pnpmBaseline: PNPM_BASELINE,
      ts,
    });
    // Handle async result
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  } catch (_) {
    // ASO recording is best-effort — don't fail the dispatch
  }

  return {
    ok: passed,
    phase: "complete",
    lane,
    command: parsed.raw,
    verb: parsed.verb,
    exitCode,
    durationMs,
    tumblerId,
    leaseId: lease.leaseId,
    gate: gateResult,
    author,
    ts,
    output: output ? output.slice(0, 4096) : "", // cap output size
    ...(error ? { error } : {}),
  };
}

// --- Status ---

/**
 * Returns the current QDD sovereignty status: boot state, gate readiness,
 * tumbler availability, and pnpm baseline.
 *
 * @returns {object} Combined status object
 */
function getQddSovereigntyStatus() {
  const sovereignty = boot();
  const sovStatus = sovereigntyStatus();

  // Check gate for QDD worker
  const gateCheck = gate("add-observation", QDD_AUTHOR, {
    sourceKind: "code_verified",
  });

  // Read tumbler slot availability
  let tumblerAvailable = null;
  if (sovereignty.tumbler.loaded) {
    try {
      const tumblerState = JSON.parse(
        fs.readFileSync(sovereignty.tumbler.path, "utf8")
      );
      const slot = tumblerState?.tumblers?.[DEFAULT_TUMBLER];
      const catalogData = JSON.parse(
        fs.readFileSync(sovereignty.catalog.path, "utf8")
      );
      const config = catalogData?.tumblers?.[DEFAULT_TUMBLER] || {
        maxActive: 4,
      };
      tumblerAvailable = {
        tumblerId: DEFAULT_TUMBLER,
        maxActive: config.maxActive,
        active: (slot?.activeLeases || []).length,
        queued: (slot?.waitQueue || []).length,
        free: config.maxActive - (slot?.activeLeases || []).length,
      };
    } catch (_) {
      tumblerAvailable = { error: "tumbler_state_read_failed" };
    }
  }

  return {
    ok: sovereignty.ok && gateCheck.allowed,
    sovereignty: sovStatus,
    qddWorker: {
      author: QDD_AUTHOR,
      gateAllowed: gateCheck.allowed,
      gateTier: gateCheck.tier,
      gateReason: gateCheck.reason || null,
    },
    tumbler: tumblerAvailable,
    baseline: {
      pnpm: PNPM_BASELINE,
      rule: "IX-398",
      enforced: true,
    },
    lanes: [...QDD_LANES],
    allowedCommands: [...ALLOWED_COMMANDS],
    ts: new Date().toISOString(),
  };
}

module.exports = { dispatchQddTest, getQddSovereigntyStatus };
