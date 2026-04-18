// scripts/provenance.mjs — A-011 provenance-tags module
//
// Every migrated file gets a provenance tag that proves lineage from old_path
// to new_path, survives reformatting (via shape_fingerprint), and is queryable
// cross-session (via migration-provenance.ndjson ledger).
//
// Schema:
//   {
//     old_path: absolute path before migration
//     new_path: absolute path after migration
//     sha256: exact-byte content hash (breaks on any change)
//     shape_fingerprint: structural hash — survives reformatting
//     migrated_at: ISO timestamp
//     session_id: migration session
//     rule_id: which MIGRATION_RULES entry matched
//     byte_count, line_count: sanity stats
//   }
//
// shape_fingerprint composition:
//   line_count   = non-empty line count
//   exports      = top-level `export [default] (function|const|class|interface|type) <NAME>`
//                  or `module.exports.<NAME>` (sorted, joined)
//   imports      = top-level `import ... from "<MOD>"` / `require("<MOD>")` (sorted, joined)
//   body_sha     = sha256 of whitespace-normalized content (collapse runs of WS to single space, strip BOM)
//   → final: sha256("sf||" + line_count + "||" + exports + "||" + imports + "||" + body_sha)
//
// For files that aren't JS/TS (e.g. .json, .md), shape_fingerprint degrades to
// body_sha only (still useful — survives trailing-newline / indent changes).

import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, extname } from "node:path";
import { homedir } from "node:os";

const PROVENANCE_LEDGER_DEFAULT = join(process.cwd(), "plans", "A", "migration-provenance.ndjson");

const CODE_EXTS = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".tsx", ".jsx"]);

// Regex for top-level exports/imports. Intentionally loose — misses some edge
// cases (e.g. re-exports, destructured exports, dynamic imports) but good
// enough for a structural fingerprint that survives whitespace/comment churn.
const RE_EXPORT_NAMED = /^\s*export\s+(?:async\s+)?(?:function|const|class|interface|type|enum|let|var)\s+([A-Za-z_$][\w$]*)/gm;
const RE_EXPORT_DEFAULT = /^\s*export\s+default\s+(?:async\s+)?(?:function|class)?\s*([A-Za-z_$][\w$]*)?/gm;
const RE_CJS_EXPORT = /^\s*module\.exports\.([A-Za-z_$][\w$]*)/gm;
const RE_IMPORT_FROM = /^\s*import\s+(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/gm;
const RE_CJS_REQUIRE = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;

function collectMatches(src, regex) {
  const out = [];
  let m;
  regex.lastIndex = 0;
  while ((m = regex.exec(src)) !== null) if (m[1]) out.push(m[1]);
  return out;
}

function normalizeWhitespace(src) {
  return src
    .replace(/\uFEFF/g, "")        // strip BOM
    .replace(/\r\n/g, "\n")         // normalize line endings
    .replace(/[ \t]+/g, " ")        // collapse horizontal whitespace runs
    .replace(/\n+/g, "\n")          // collapse blank-line runs
    .trim();
}

function countNonEmptyLines(src) {
  let n = 0;
  for (const line of src.split("\n")) if (line.trim().length > 0) n++;
  return n;
}

export function shapeFingerprint(filePath, optSrc = null) {
  const src = optSrc ?? readFileSync(filePath, "utf-8");
  const ext = extname(filePath).toLowerCase();
  const isCode = CODE_EXTS.has(ext);
  const lineCount = countNonEmptyLines(src);
  const normalized = normalizeWhitespace(src);
  const bodySha = createHash("sha256").update(normalized).digest("hex");

  let exports = [], imports = [];
  if (isCode) {
    exports = [
      ...collectMatches(src, RE_EXPORT_NAMED),
      ...collectMatches(src, RE_EXPORT_DEFAULT),
      ...collectMatches(src, RE_CJS_EXPORT),
    ].filter(Boolean).sort();
    imports = [
      ...collectMatches(src, RE_IMPORT_FROM),
      ...collectMatches(src, RE_CJS_REQUIRE),
    ].sort();
  }

  const finalSha = createHash("sha256")
    .update(`sf||${lineCount}||${exports.join(",")}||${imports.join(",")}||${bodySha}`)
    .digest("hex");

  return {
    shape_fingerprint: finalSha,
    line_count: lineCount,
    exports_count: exports.length,
    imports_count: imports.length,
    body_sha256: bodySha,
    is_code: isCode,
  };
}

export function sha256OfFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function makeProvenance({ oldPath, newPath, sessionId, ruleId = null, sourceBuf = null }) {
  const pathToRead = sourceBuf ? null : oldPath;
  const src = sourceBuf ?? readFileSync(oldPath, "utf-8");
  const bytes = Buffer.isBuffer(sourceBuf) ? sourceBuf : Buffer.from(src, "utf-8");
  const exactSha = createHash("sha256").update(bytes).digest("hex");
  // For shape fingerprint, operate on text (skip binaries)
  let shape = null;
  try { shape = shapeFingerprint(pathToRead || oldPath, typeof src === "string" ? src : src.toString("utf-8")); }
  catch { shape = { shape_fingerprint: exactSha, line_count: null, exports_count: null, imports_count: null, body_sha256: exactSha, is_code: false }; }

  return {
    old_path: oldPath,
    new_path: newPath,
    sha256: exactSha,
    shape_fingerprint: shape.shape_fingerprint,
    shape_body_sha256: shape.body_sha256,
    line_count: shape.line_count,
    exports_count: shape.exports_count,
    imports_count: shape.imports_count,
    is_code: shape.is_code,
    byte_count: bytes.length,
    migrated_at: new Date().toISOString(),
    session_id: sessionId,
    rule_id: ruleId,
  };
}

export function appendProvenance(entry, ledgerPath = PROVENANCE_LEDGER_DEFAULT) {
  mkdirSync(dirname(ledgerPath), { recursive: true });
  appendFileSync(ledgerPath, JSON.stringify(entry) + "\n");
}

export function queryProvenance({ ledgerPath = PROVENANCE_LEDGER_DEFAULT, oldPath = null, newPath = null, sha256: sha = null, shapeFp = null, sessionId = null } = {}) {
  if (!existsSync(ledgerPath)) return [];
  const hits = [];
  const lines = readFileSync(ledgerPath, "utf-8").split("\n").filter(Boolean);
  for (const l of lines) {
    let e;
    try { e = JSON.parse(l); } catch { continue; }
    if (oldPath && e.old_path !== oldPath) continue;
    if (newPath && e.new_path !== newPath) continue;
    if (sha && e.sha256 !== sha) continue;
    if (shapeFp && e.shape_fingerprint !== shapeFp) continue;
    if (sessionId && e.session_id !== sessionId) continue;
    hits.push(e);
  }
  return hits;
}

export const PROVENANCE_LEDGER = PROVENANCE_LEDGER_DEFAULT;
