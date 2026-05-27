"use strict";

const crypto = require("crypto");

const DEFAULTS = Object.freeze({
  enabled: false,
  graphType: "ring",
  maxMessages: 2000,
  maxSharedKeys: 512,
  maxValueBytes: 4096,
  maxInfluenceScore: 1,
  requiresEnableToken: true,
  enableToken: "COUPLING_ENABLE_APPROVED"
});

function clip(value, max = 240) {
  const text = String(value == null ? "" : value).trim();
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableIndex(workerId, totalWorkers) {
  const total = Math.max(1, Number(totalWorkers || 1));
  const digest = sha256(workerId || "worker");
  const value = Number.parseInt(digest.slice(0, 8), 16);
  return value % total;
}

function normalizeGraphType(value) {
  const graphType = String(value || "ring").trim().toLowerCase();
  if (["ring", "complete", "grid"].includes(graphType)) return graphType;
  return "ring";
}

function byteSize(value) {
  return Buffer.byteLength(JSON.stringify(value == null ? null : value), "utf8");
}

class OmniflywheelCouplingLayer {
  constructor(options = {}) {
    this.config = {
      ...DEFAULTS,
      ...options,
      enabled: Boolean(options.enabled === true),
      graphType: normalizeGraphType(options.graphType || DEFAULTS.graphType)
    };
    this.sharedField = new Map();
    this.messageQueue = [];
    this.audit = [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
  }

  _record(event) {
    const row = {
      ts: new Date().toISOString(),
      ...event
    };
    this.audit.push(row);
    if (this.audit.length > 200) this.audit.splice(0, this.audit.length - 200);
    this.updatedAt = row.ts;
    return row;
  }

  evaluate(action, payload = {}) {
    const actionName = String(action || "").trim().toLowerCase();
    if (!["configure", "write", "broadcast", "read", "neighbors"].includes(actionName)) {
      return { ok: false, action: "DENY", reason: "unknown_coupling_action" };
    }
    if (actionName === "configure" && payload.enabled === true && this.config.requiresEnableToken) {
      if (String(payload.enableToken || "").trim() !== this.config.enableToken) {
        return { ok: false, action: "HALT", reason: "coupling_enable_token_required" };
      }
    }
    if (["write", "broadcast"].includes(actionName) && !this.config.enabled) {
      return { ok: false, action: "IGNORE", reason: "coupling_disabled" };
    }
    if (actionName === "write") {
      if (this.sharedField.size >= this.config.maxSharedKeys && !this.sharedField.has(String(payload.key || ""))) {
        return { ok: false, action: "DENY", reason: "shared_field_key_limit" };
      }
      if (byteSize(payload.value) > this.config.maxValueBytes) {
        return { ok: false, action: "DENY", reason: "shared_value_too_large" };
      }
    }
    if (actionName === "broadcast") {
      if (byteSize(payload.message) > this.config.maxValueBytes) {
        return { ok: false, action: "DENY", reason: "message_too_large" };
      }
      if (this.messageQueue.length >= this.config.maxMessages) {
        return { ok: false, action: "DENY", reason: "message_queue_limit" };
      }
    }
    return { ok: true, action: "ALLOW" };
  }

  configure(input = {}) {
    const requested = {
      enabled: input.enabled === true,
      graphType: normalizeGraphType(input.graphType || this.config.graphType),
      enableToken: input.enableToken
    };
    const gate = this.evaluate("configure", requested);
    if (!gate.ok) {
      this._record({ kind: "configure", gate, requested: { enabled: requested.enabled, graphType: requested.graphType } });
      return { ok: false, gate, status: this.status() };
    }
    this.config.enabled = requested.enabled;
    this.config.graphType = requested.graphType;
    for (const key of ["maxMessages", "maxSharedKeys", "maxValueBytes", "maxInfluenceScore"]) {
      if (Number.isFinite(Number(input[key]))) {
        this.config[key] = Math.max(1, Number(input[key]));
      }
    }
    const event = this._record({
      kind: "configure",
      gate,
      enabled: this.config.enabled,
      graphType: this.config.graphType
    });
    return { ok: true, event, status: this.status() };
  }

  read(workerId, key) {
    const cleanKey = String(key || "").trim();
    const gate = this.evaluate("read", { workerId, key: cleanKey });
    if (!gate.ok && gate.action !== "IGNORE") return { ok: false, gate, value: null };
    const entry = this.config.enabled ? this.sharedField.get(cleanKey) || null : null;
    return {
      ok: true,
      gate,
      key: cleanKey,
      value: entry ? entry.value : null,
      writerId: entry ? entry.writerId : "",
      writtenAt: entry ? entry.writtenAt : ""
    };
  }

  write(workerId, key, value, meta = {}) {
    const cleanKey = String(key || "").trim();
    const gate = this.evaluate("write", { workerId, key: cleanKey, value });
    if (!gate.ok) {
      this._record({ kind: "write", workerId: clip(workerId, 120), key: cleanKey, gate });
      return { ok: false, gate };
    }
    const row = {
      value,
      writerId: String(workerId || "").trim(),
      writtenAt: new Date().toISOString(),
      valueHash: sha256(JSON.stringify(value == null ? null : value)),
      meta: meta && typeof meta === "object" ? { ...meta } : {}
    };
    this.sharedField.set(cleanKey, row);
    this._record({ kind: "write", workerId: row.writerId, key: cleanKey, valueHash: row.valueHash, gate });
    return { ok: true, gate, key: cleanKey, valueHash: row.valueHash };
  }

  broadcast(workerId, message, options = {}) {
    const gate = this.evaluate("broadcast", { workerId, message });
    if (!gate.ok) {
      this._record({ kind: "broadcast", workerId: clip(workerId, 120), gate });
      return { ok: false, gate };
    }
    const row = {
      id: `coupling_msg_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      from: String(workerId || "").trim(),
      to: options.to ? String(options.to).trim() : "*",
      message,
      messageHash: sha256(JSON.stringify(message == null ? null : message)),
      ts: new Date().toISOString()
    };
    this.messageQueue.push(row);
    this._record({ kind: "broadcast", workerId: row.from, messageId: row.id, to: row.to, gate });
    return { ok: true, gate, messageId: row.id, messageHash: row.messageHash };
  }

  messagesFor(workerId, options = {}) {
    const target = String(workerId || "").trim();
    const limit = Math.max(1, Math.min(100, Number(options.limit || 20)));
    return this.messageQueue
      .filter((entry) => entry.to === "*" || entry.to === target)
      .slice(-limit)
      .map((entry) => ({ ...entry }));
  }

  getNeighbors(workerId, totalWorkers = 1) {
    const total = Math.max(1, Number(totalWorkers || 1));
    if (!this.config.enabled || total <= 1) return [];
    const index = stableIndex(workerId, total);
    if (this.config.graphType === "complete") {
      return Array.from({ length: total }, (_item, i) => i).filter((i) => i !== index);
    }
    if (this.config.graphType === "grid") {
      const side = Math.max(1, Math.ceil(Math.sqrt(total)));
      const row = Math.floor(index / side);
      const col = index % side;
      return [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
      ]
        .map(([r, c]) => r * side + c)
        .filter((i) => i >= 0 && i < total && i !== index);
    }
    return [
      (index - 1 + total) % total,
      (index + 1) % total
    ].filter((value, pos, arr) => arr.indexOf(value) === pos && value !== index);
  }

  status() {
    return {
      layerId: "omniflywheel-coupling.v1",
      mode: this.config.enabled ? "coupled" : "stateless",
      enabled: this.config.enabled,
      graphType: this.config.graphType,
      sharedFieldSize: this.sharedField.size,
      messageQueueSize: this.messageQueue.length,
      auditSize: this.audit.length,
      limits: {
        maxMessages: this.config.maxMessages,
        maxSharedKeys: this.config.maxSharedKeys,
        maxValueBytes: this.config.maxValueBytes,
        maxInfluenceScore: this.config.maxInfluenceScore
      },
      gates: {
        governedBy: "GAC -> Omniflywheel -> Omnispindle",
        enableTokenRequired: this.config.requiresEnableToken,
        writeGate: "size_and_key_budget",
        broadcastGate: "size_and_queue_budget"
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      recentAudit: this.audit.slice(-8)
    };
  }
}

module.exports = {
  OmniflywheelCouplingLayer,
  DEFAULTS
};
