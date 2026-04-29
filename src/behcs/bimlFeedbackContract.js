"use strict";

const crypto = require("crypto");

const CONTRACT_ID = "biml-feedback-contract.v1";
const REQUIRED_FIELDS = Object.freeze(["data", "model", "route", "result", "mistake", "prevention"]);

function stableStringify(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeRecord(input = {}) {
  const now = input.generatedAt || new Date().toISOString();
  const data = input.data && typeof input.data === "object" ? input.data : {};
  const model = input.model && typeof input.model === "object" ? input.model : {};
  const route = input.route && typeof input.route === "object" ? input.route : {};
  const result = input.result && typeof input.result === "object" ? input.result : {};
  const mistake = input.mistake && typeof input.mistake === "object" ? input.mistake : {};
  const prevention = input.prevention && typeof input.prevention === "object" ? input.prevention : {};
  const reverseGain = input.reverseGain && typeof input.reverseGain === "object" ? input.reverseGain : {};

  const record = {
    contractId: CONTRACT_ID,
    generatedAt: now,
    data: {
      source: clip(data.source || data.path || "unknown", 1000),
      kind: clip(data.kind || data.type || "unknown", 120),
      digest: clip(data.digest || sha256(stableStringify(data)), 128),
      summary: clip(data.summary || "", 1000)
    },
    model: {
      engine: clip(model.engine || "unknown", 160),
      pid: clip(model.pid || "", 200),
      version: clip(model.version || "", 120),
      configDigest: clip(model.configDigest || "", 128)
    },
    route: {
      atlasSurface: clip(route.atlasSurface || route.surface || "", 160),
      glyphVerb: clip(route.glyphVerb || route.verb || "", 160),
      brownHilbertRange: clip(route.brownHilbertRange || route.pidRange || "", 240),
      supervisor: clip(route.supervisor || "", 240)
    },
    result: {
      status: clip(result.status || "pending", 120),
      confidence: Number.isFinite(Number(result.confidence)) ? Number(result.confidence) : null,
      outputDigest: clip(result.outputDigest || sha256(stableStringify(result)), 128),
      evidencePath: clip(result.evidencePath || "", 1000)
    },
    mistake: {
      outcome: clip(mistake.outcome || mistake.status || "unclassified", 160),
      class: clip(mistake.class || mistake.type || "", 160),
      ledgerPath: clip(mistake.ledgerPath || "", 1000),
      replaySeed: clip(mistake.replaySeed || "", 240)
    },
    prevention: {
      rule: clip(prevention.rule || prevention.action || "", 1000),
      appliesTo: clip(prevention.appliesTo || "", 240),
      gate: clip(prevention.gate || "reverse_gain_before_promotion", 240)
    },
    reverseGain: {
      status: clip(reverseGain.status || "required", 120),
      score: Number.isFinite(Number(reverseGain.score)) ? Number(reverseGain.score) : null,
      promoted: reverseGain.promoted === true
    }
  };

  return {
    ...record,
    digest: sha256(stableStringify(record))
  };
}

function validateRecord(record = {}) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!record[field] || typeof record[field] !== "object") errors.push(`missing_${field}`);
  }
  if (record.contractId !== CONTRACT_ID) errors.push("wrong_contract_id");
  if (!record.data?.digest) errors.push("missing_data_digest");
  if (!record.model?.engine) errors.push("missing_model_engine");
  if (!record.route?.glyphVerb) errors.push("missing_glyph_verb");
  if (!record.prevention?.gate) errors.push("missing_prevention_gate");
  if (record.reverseGain?.status !== "passed" && record.reverseGain?.promoted === true) {
    errors.push("cannot_promote_without_reverse_gain_pass");
  }
  return {
    ok: errors.length === 0,
    contractId: CONTRACT_ID,
    errors,
    digest: record.digest || sha256(stableStringify(record))
  };
}

function createFeedbackEnvelope(input = {}) {
  const record = normalizeRecord(input);
  const validation = validateRecord(record);
  return {
    ok: validation.ok,
    generatedAt: record.generatedAt,
    contractId: CONTRACT_ID,
    record,
    validation
  };
}

module.exports = {
  CONTRACT_ID,
  normalizeRecord,
  validateRecord,
  createFeedbackEnvelope,
  stableStringify,
  sha256
};
