"use strict";
/**
 * document-share-v0 unit — LX-491 cross-host document transfer
 *
 * Built 2026-04-07 per acer verb=document-share-v0.acer_LANDED.
 * Shape matches acer implementation unmodified.
 *
 * Cube: 493039 = 79³  |  Dim: D22_TRANSLATION  |  Tier: small
 * v2 classification: SV (self_vote)
 *
 * Inputs:
 *   file_name           (string, required)        — base name, no directory components
 *   content_base64      (string, required)        — file bytes base64-encoded
 *   sha256              (string, required)        — lowercase hex sha256 of raw bytes
 *   total_bytes         (integer, required)       — size of raw bytes (after base64 decode)
 *   chunk_id            (integer, optional)       — 1-based chunk index if chunked
 *   of_total_chunks     (integer, optional)       — total chunk count if chunked
 *   target_subdir       (string, optional)        — subdirectory under incoming/
 *   overwrite           (bool, optional, default false) — whether to overwrite existing file
 *
 * Outputs:
 *   ok                  (bool)
 *   bytes_written       (integer)
 *   sha256_verified     (bool)
 *   sha256              (string, echoed)
 *   path_stored         (string, absolute)
 *   chunk_id            (integer, if chunked)
 *   manifest_id         (string)
 *   ts                  (ISO8601)
 *
 * Constraints enforced:
 *   - NOVALUM SHIELD: reject file_name or target_subdir matching /novalum/i or /device-registry/i
 *   - Path traversal blocked: reject any `..`, absolute paths, drive letters in file_name or target_subdir
 *   - Max decoded payload 16 MiB (16 * 1024 * 1024 bytes)
 *   - sha256 mandatory; mismatch → error
 *   - Base file_name only, no path separators permitted in file_name
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UNIT_ID = "document-share-v0";
const CUBE = 493039;
const CUBE_LAW = "79^3 = 493039";
const DIM = "D22_TRANSLATION";
const TIER = "small";
const V2_CLASS = "SV";

const ASOLARIA_ROOT = path.resolve(__dirname, "..", "..", "..");
const INCOMING_ROOT = path.join(ASOLARIA_ROOT, "data", "omni-processor", "paper-draft", "incoming");
const AUDIT_LOG = path.join(ASOLARIA_ROOT, "logs", "document-share.ndjson");
const MAX_PAYLOAD_BYTES = 16 * 1024 * 1024;

// NOVALUM SHIELD v1/v2 branching — mirrors the refinement in sandbox-runner.js.
// v1 (default): blanket /novalum/i filename block.
// v2 (deployed only after cosign flag exists): external-novalum-* blocked, exploit-content
// blocked, local-novalum-unit-* permitted under cube_analysis scope signaled via target_subdir
// prefix or inputs.scope field.
const NOVALUM_SHIELD_V2_DEPLOY_FLAG_DS = path.join(
  path.resolve(__dirname, "..", "..", "..", "data", "vault", "owner", "omni-processor"),
  "NOVALUM_SHIELD_V2_DEPLOY"
);
function dsIsV2Deployed() {
  try { return fs.existsSync(NOVALUM_SHIELD_V2_DEPLOY_FLAG_DS); }
  catch { return false; }
}
const NOVALUM_V1_PATTERN = /novalum/i;
const NOVALUM_EXTERNAL_PATTERNS_DS = [/external-novalum/i, /novalum-corp/i, /novalum-upstream/i, /novalum-prod/i];
const NOVALUM_LOCAL_PATTERN_DS = /local-novalum-unit-/i;
const NOVALUM_ANALYSIS_SCOPE_PREFIX = /^cube-analysis\//i;
const DEVICE_REGISTRY_PATTERN = /device-registry/i;
const PATH_TRAVERSAL_PATTERN = /(\.\.|^\/|^[a-zA-Z]:)/;

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function logAudit(entry) {
  ensureDir(path.dirname(AUDIT_LOG));
  fs.appendFileSync(AUDIT_LOG, JSON.stringify({
    ...entry,
    ts: new Date().toISOString(),
    unit_id: UNIT_ID,
    cube: CUBE,
    dim: DIM
  }) + "\n");
}

function err(reason, detail, manifest_id) {
  logAudit({ verb: "document_share_reject", reason, detail, manifest_id });
  return { ok: false, error: reason, detail, manifest_id };
}

function validateName(s, field, inputs) {
  if (typeof s !== "string" || s.length === 0) return field + "_missing_or_empty";
  if (PATH_TRAVERSAL_PATTERN.test(s)) return field + "_path_traversal_blocked";
  if (DEVICE_REGISTRY_PATTERN.test(s)) return field + "_device_registry_shield_hit";

  // NOVALUM SHIELD v1/v2 branching
  const v2 = dsIsV2Deployed();
  if (!v2) {
    // v1 BLANKET: any novalum in filename or subdir → deny (original behavior)
    if (NOVALUM_V1_PATTERN.test(s)) return field + "_novalum_shield_v1_blanket_hit";
    return null;
  }
  // v2 REFINED:
  //  - external-novalum-* → HARD DENY
  //  - local-novalum-unit-* → permitted only when target_subdir or inputs.scope signals cube_analysis
  for (const pat of NOVALUM_EXTERNAL_PATTERNS_DS) {
    if (pat.test(s)) return field + "_external_novalum_corporate_v2_hd1a_hit";
  }
  if (NOVALUM_LOCAL_PATTERN_DS.test(s)) {
    const subdir = (inputs && inputs.target_subdir) || "";
    const scope = (inputs && inputs.scope) || "";
    if (scope === "cube_analysis" || NOVALUM_ANALYSIS_SCOPE_PREFIX.test(subdir)) {
      return null; // permitted local-novalum-unit-* under cube_analysis scope
    }
    return field + "_local_novalum_unit_requires_cube_analysis_scope_v2_hd1c_hit";
  }
  // Unqualified "novalum" substring in any other form → still deny (unknown scope)
  if (NOVALUM_V1_PATTERN.test(s)) return field + "_novalum_ambiguous_target_not_local_unit_v2";
  return null;
}

/**
 * Run the unit. Returns the output envelope (not throws).
 * @param {object} inputs
 * @param {string} [manifest_id]
 */
function run(inputs, manifest_id) {
  manifest_id = manifest_id || ("doc-share-" + crypto.randomBytes(8).toString("hex"));

  // Required field checks
  const required = ["file_name", "content_base64", "sha256", "total_bytes"];
  for (const f of required) {
    if (inputs[f] === undefined || inputs[f] === null) {
      return err("missing_required_input", "field=" + f, manifest_id);
    }
  }

  // Validate file_name (no path components)
  if (inputs.file_name.includes("/") || inputs.file_name.includes("\\")) {
    return err("file_name_cannot_contain_path_separator", inputs.file_name, manifest_id);
  }
  const nameErr = validateName(inputs.file_name, "file_name", inputs);
  if (nameErr) return err(nameErr, inputs.file_name, manifest_id);

  // Validate target_subdir (optional)
  let targetSubdir = "";
  if (inputs.target_subdir) {
    const subErr = validateName(inputs.target_subdir, "target_subdir", inputs);
    if (subErr) return err(subErr, inputs.target_subdir, manifest_id);
    targetSubdir = inputs.target_subdir;
  }

  // Decode base64
  let buf;
  try {
    buf = Buffer.from(inputs.content_base64, "base64");
  } catch (e) {
    return err("base64_decode_failed", e.message, manifest_id);
  }

  // Size caps
  if (buf.length > MAX_PAYLOAD_BYTES) {
    return err("payload_exceeds_max", "max=" + MAX_PAYLOAD_BYTES + " got=" + buf.length, manifest_id);
  }
  if (buf.length !== inputs.total_bytes) {
    return err("total_bytes_mismatch", "declared=" + inputs.total_bytes + " actual=" + buf.length, manifest_id);
  }

  // SHA256 verify
  const computed = crypto.createHash("sha256").update(buf).digest("hex");
  if (computed.toLowerCase() !== String(inputs.sha256).toLowerCase()) {
    return err("sha256_mismatch", "declared=" + inputs.sha256 + " computed=" + computed, manifest_id);
  }

  // Resolve path
  const targetDir = targetSubdir ? path.join(INCOMING_ROOT, targetSubdir) : INCOMING_ROOT;
  ensureDir(targetDir);
  const targetPath = path.join(targetDir, inputs.file_name);

  // Overwrite check
  if (fs.existsSync(targetPath) && !inputs.overwrite) {
    return err("file_exists_overwrite_false", targetPath, manifest_id);
  }

  // Final sovereignty path check on the absolute target (defense in depth)
  const absTarget = path.resolve(targetPath);
  const lc = absTarget.toLowerCase().replace(/\\/g, "/");
  if (lc.includes("data/vault") || lc.includes(".claude")) {
    return err("sovereignty_path_write_blocked", absTarget, manifest_id);
  }

  // Write
  try {
    fs.writeFileSync(targetPath, buf);
  } catch (e) {
    return err("write_failed", e.message, manifest_id);
  }

  const out = {
    ok: true,
    bytes_written: buf.length,
    sha256_verified: true,
    sha256: computed,
    path_stored: targetPath,
    chunk_id: inputs.chunk_id || null,
    of_total_chunks: inputs.of_total_chunks || null,
    manifest_id,
    ts: new Date().toISOString()
  };
  logAudit({
    verb: "document_share_written",
    manifest_id,
    file_name: inputs.file_name,
    bytes: buf.length,
    sha256: computed,
    path: targetPath,
    chunk_id: inputs.chunk_id || null
  });
  // Operator visibility on local terminal
  process.stdout.write(`[document-share-v0] wrote ${inputs.file_name} bytes=${buf.length} sha256=${computed.slice(0,16)}...\n`);
  return out;
}

module.exports = {
  unit_id: UNIT_ID,
  cube: CUBE,
  cube_law: CUBE_LAW,
  dim: DIM,
  tier: TIER,
  v2_class: V2_CLASS,
  run
};
