"use strict";

const { sha256, stableStringify } = require("./bimlFeedbackContract");

const CONTRACT_ID = "mamba-temporal-spine.v1";
const DEFAULT_SCHEMA = Object.freeze([
  "ts",
  "lane",
  "eventType",
  "sourceDigest",
  "state",
  "supervisor",
  "shannon",
  "mistakeClass",
  "payloadDigest"
]);

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function buildEventSchema(input = {}) {
  const fields = Array.isArray(input.fields) && input.fields.length ? input.fields : DEFAULT_SCHEMA;
  const generatedAt = input.generatedAt || new Date().toISOString();
  const schema = {
    contractId: CONTRACT_ID,
    generatedAt,
    id: clip(input.id || "behcs-temporal-event-row.v1", 160),
    executionDefault: "model_execution_blocked_until_local_weights_and_shape_smoke",
    fields: fields.map((field) => ({
      name: clip(typeof field === "string" ? field : field.name, 120),
      type: clip(typeof field === "string" ? "string" : field.type || "string", 80),
      required: typeof field === "string" ? true : field.required !== false
    })).filter((field) => field.name),
    compaction: {
      payloadMode: "digest_only_by_default",
      maxInlinePayloadBytes: 0,
      preservesSourcePath: true
    }
  };
  return {
    ...schema,
    digest: sha256(stableStringify(schema))
  };
}

function normalizeEvent(row = {}, schema = buildEventSchema()) {
  const normalized = {};
  for (const field of schema.fields || []) {
    const value = row[field.name];
    normalized[field.name] = field.name === "payloadDigest"
      ? clip(value || sha256(stableStringify(row.payload || row)), 128)
      : clip(value || "", field.name === "ts" ? 80 : 500);
  }
  if (!normalized.ts) normalized.ts = new Date().toISOString();
  return {
    ...normalized,
    contractId: CONTRACT_ID,
    rowDigest: sha256(stableStringify(normalized))
  };
}

function summarizeEvents(rows = [], options = {}) {
  const schema = options.schema || buildEventSchema(options);
  const normalized = rows.map((row) => normalizeEvent(row, schema));
  const lanes = {};
  const states = {};
  const mistakeClasses = {};
  for (const row of normalized) {
    lanes[row.lane || "unknown"] = (lanes[row.lane || "unknown"] || 0) + 1;
    states[row.state || "unknown"] = (states[row.state || "unknown"] || 0) + 1;
    mistakeClasses[row.mistakeClass || "none"] = (mistakeClasses[row.mistakeClass || "none"] || 0) + 1;
  }
  const summary = {
    contractId: CONTRACT_ID,
    generatedAt: options.generatedAt || new Date().toISOString(),
    schemaDigest: schema.digest,
    inputRows: rows.length,
    compactRows: normalized.length,
    lanes,
    states,
    mistakeClasses,
    executionDefault: "no_live_model_default",
    rows: normalized
  };
  return {
    ...summary,
    digest: sha256(stableStringify(summary))
  };
}

function validateShape(summary = {}) {
  const errors = [];
  if (summary.contractId !== CONTRACT_ID) errors.push("wrong_contract_id");
  if (!summary.schemaDigest) errors.push("missing_schema_digest");
  if (!Array.isArray(summary.rows)) errors.push("missing_rows");
  for (const row of summary.rows || []) {
    if (!row.rowDigest) errors.push("row_missing_digest");
    if (!row.ts) errors.push("row_missing_ts");
    if (!row.payloadDigest) errors.push("row_missing_payload_digest");
  }
  return {
    ok: errors.length === 0,
    contractId: CONTRACT_ID,
    errors,
    digest: summary.digest || sha256(stableStringify(summary))
  };
}

module.exports = {
  CONTRACT_ID,
  DEFAULT_SCHEMA,
  buildEventSchema,
  normalizeEvent,
  summarizeEvents,
  validateShape
};
