#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MythosCognitiveEngine } from "../packages/mythos-cognitive-engine/src/engine.mjs";
import { MythosDriftObserver, broadcastDrift } from "../packages/drift-broadcast/src/broadcaster.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const statePath = path.join(repoRoot, "data", "behcs", "state", "openmythos", "mythos-federation-bootstrap.state.json");
const reportPath = path.join(repoRoot, "reports", "mythos-federation-bootstrap-latest.json");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function argValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function intArg(name, fallback, min, max) {
  const parsed = Number(argValue(name, fallback));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

async function bootstrapMythosFederation() {
  const generatedAt = new Date().toISOString();
  const count = intArg("count", 1, 1, 16);
  const configPath = argValue("config", process.env.ASOLARIA_MYTHOS_CONFIG || "");
  const weightsPath = argValue("weights", process.env.ASOLARIA_MYTHOS_WEIGHTS || "");
  const deviceBase = argValue("device", process.env.ASOLARIA_MYTHOS_DEVICE || "cpu");
  const load = process.argv.includes("--load");
  const keepAlive = process.argv.includes("--keep-alive");
  const registry = new Map();
  const engines = [];

  for (let i = 0; i < count; i += 1) {
    const device = deviceBase === "cuda" ? `cuda:${i}` : deviceBase;
    const engine = new MythosCognitiveEngine({
      pid: `BH.MYTHOS.ENGINE.${String(i + 1).padStart(4, "0")}`,
      device,
      configPath: load ? configPath : "",
      weightsPath: load ? weightsPath : ""
    });
    const pid = engine.spawn();
    registry.set(pid, engine);
    const status = await engine.status();
    let loadResult = { status: "skipped", reason: "bootstrap_without_load_flag" };
    if (load) {
      loadResult = await engine.loadModel(configPath, weightsPath);
    }
    engines.push({ pid, device, status, load: loadResult });
  }

  const observer = new MythosDriftObserver({
    registry,
    sendGlyph: async (glyph) => {
      const parts = String(glyph || "").split(/\s+/);
      const pid = parts[1];
      const engine = registry.get(pid);
      return engine ? engine.halt() : { status: "missing_engine", pid };
    }
  });
  const drift = [];
  for (const row of engines) {
    drift.push(await observer.observe(row.pid));
  }

  const summary = {
    ok: true,
    generatedAt,
    status: "MYTHOS_FEDERATION_BOOTSTRAPPED_GATED",
    mode: {
      noDownload: true,
      noInstall: true,
      loadRequested: load,
      keepAlive
    },
    count,
    configPath: configPath || null,
    weightsPath: weightsPath || null,
    engines,
    drift,
    state: path.relative(repoRoot, statePath).replace(/\\/g, "/"),
    report: path.relative(repoRoot, reportPath).replace(/\\/g, "/")
  };

  writeJson(statePath, summary);
  writeJson(reportPath, summary);
  await broadcastDrift({
    source: "mythos-federation-bootstrap",
    severity: "SOFT",
    law: "LAW-099-openmythos-recurrence-stability",
    reason: "bootstrap_completed",
    engineCount: count
  });

  if (!keepAlive) {
    for (const engine of registry.values()) {
      await engine.halt().catch(() => {});
    }
    summary.status = "MYTHOS_FEDERATION_BOOTSTRAPPED_AND_HALTED";
    writeJson(statePath, summary);
    writeJson(reportPath, summary);
  }

  console.log(JSON.stringify(summary, null, 2));

  if (keepAlive) {
    setInterval(async () => {
      for (const pid of registry.keys()) {
        await observer.observe(pid);
      }
    }, 5000);
  }
}

bootstrapMythosFederation().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    status: "MYTHOS_FEDERATION_BOOTSTRAP_FAILED",
    error: error?.message || String(error)
  }, null, 2));
  process.exitCode = 1;
});
