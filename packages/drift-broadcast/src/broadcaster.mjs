import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { evaluateSpectralStability, SPECTRAL_STABILITY_LAW } from "../../../src/gac/laws/spectral-stability.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const driftLogPath = path.join(repoRoot, "data", "behcs", "drift", "mythos-drift-broadcast-latest.ndjson");

const driftEvents = [];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

export async function broadcastDrift(event = {}) {
  const row = {
    kind: "mythos_drift_event",
    ts: new Date().toISOString(),
    ...event
  };
  driftEvents.push(row);
  if (driftEvents.length > 512) {
    driftEvents.splice(0, driftEvents.length - 512);
  }
  appendNdjson(driftLogPath, row);
  return row;
}

export class MythosDriftObserver {
  constructor({ registry = new Map(), sendGlyph = null } = {}) {
    this.registry = registry;
    this.sendGlyph = sendGlyph;
  }

  async observe(enginePID) {
    const engine = this.registry.get(enginePID);
    if (!engine) {
      return broadcastDrift({
        source: enginePID,
        severity: "WATCH",
        law: SPECTRAL_STABILITY_LAW.id,
        reason: "mythos_engine_not_registered"
      });
    }

    const drift = await engine.checkDrift();
    const spectralRadius = drift.spectral_radius ?? drift.spectralRadius ?? null;
    const evalResult = evaluateSpectralStability(
      { engine: "openmythos", spectralRadius },
      { engine: "openmythos", spectralRadius }
    );
    const severity = !evalResult.passed
      ? (evalResult.action === "HALT_AND_ROLLBACK" ? "CRITICAL" : "HARD")
      : (drift.drift_signal || drift.driftSignal || "SOFT");
    const event = await broadcastDrift({
      source: enginePID,
      severity,
      law: SPECTRAL_STABILITY_LAW.id,
      reason: evalResult.reason || evalResult.warning || "spectral_radius_observed",
      spectralRadius,
      evalResult
    });

    if (!evalResult.passed && typeof this.sendGlyph === "function") {
      event.freeze = await this.sendGlyph(`MYTHOS_HALT ${enginePID}`);
    }
    return event;
  }
}

export function status() {
  return {
    ok: true,
    law: SPECTRAL_STABILITY_LAW.id,
    retainedEvents: driftEvents.length,
    driftLogPath: path.relative(repoRoot, driftLogPath).replace(/\\/g, "/"),
    latest: driftEvents[driftEvents.length - 1] || null
  };
}
