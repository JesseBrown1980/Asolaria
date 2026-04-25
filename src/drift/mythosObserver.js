"use strict";

const { evaluateSpectralStability, LAW_ID } = require("../gac/laws/spectral-stability");

class MythosDriftObserver {
  constructor(options = {}) {
    this.enginePid = String(options.enginePid || "").trim();
    this.broadcast = typeof options.broadcast === "function" ? options.broadcast : async (event) => event;
    this.sendGlyph = typeof options.sendGlyph === "function" ? options.sendGlyph : async () => ({ status: "sendGlyph_unconfigured" });
    this.lastStableRadius = null;
    this.events = [];
  }

  async observe(engineStatus = {}) {
    const spectralRadius = engineStatus.spectral_radius ?? engineStatus.spectralRadius ?? null;
    const driftSignal = engineStatus.drift_signal || engineStatus.driftSignal || "SOFT";
    const lawResult = evaluateSpectralStability(
      { engine: "openmythos", spectralRadius },
      { engine: "openmythos", spectralRadius }
    );
    const event = {
      source: this.enginePid || engineStatus.pid || "unknown-openmythos",
      metric: "spectral_radius",
      value: spectralRadius,
      severity: driftSignal,
      law: LAW_ID,
      lawResult,
      ts: new Date().toISOString()
    };

    this.events.push(event);
    if (this.events.length > 256) {
      this.events = this.events.slice(-256);
    }
    await this.broadcast(event);

    if (lawResult.passed && lawResult.action === "ALLOW") {
      this.lastStableRadius = spectralRadius;
    }
    if (!lawResult.passed && (lawResult.action === "HALT" || lawResult.action === "HALT_AND_ROLLBACK") || driftSignal === "CRITICAL") {
      event.freeze = await this.freezeEngine();
    }
    return event;
  }

  async freezeEngine() {
    const pid = this.enginePid || "unknown-openmythos";
    return this.sendGlyph(`MYTHOS_HALT ${pid}`);
  }

  status() {
    return {
      enginePid: this.enginePid,
      lastStableRadius: this.lastStableRadius,
      retainedEvents: this.events.length,
      latest: this.events[this.events.length - 1] || null
    };
  }
}

module.exports = {
  MythosDriftObserver
};
