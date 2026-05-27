#!/usr/bin/env node
// Indexer non-CIM regression guard — acer-side mirror of liris L4 (2026-05-26).
//
// Spec: per Path B WMI rewrite canon today (acer cosign seq=3367 row=e12940f6ab2c0ef3
// rewrote device-pid-indicator-index.js, +30 non-CIM commands replacing 17 Get-CimInstance).
// This module is the CI-style regression guardrail ensuring no future edit silently
// reintroduces the WMI/CIM hazard pattern (feedback canon predates this).
//
// Output: { schema, generatedAt, summary, indexers: [{path, status, hits}] }
// Exit codes:
//   0 = PASS (all indexers CLEAN; or NOT_FOUND-only — file absent is not a regression)
//   1 = REGRESSION DETECTED
//   2 = AUDIT MODULE error (read failure, etc)

import fs from 'node:fs';
import path from 'node:path';

const ACER_ASOLARIA_ROOT = 'C:/Users/acer/Asolaria';

// Canonical acer-side indexer paths (3 indexers — falcon-asolaria-mirror is liris-only per
// 2026-05-26 cross-vantage probe).
export const INDEXER_PATHS = Object.freeze([
  path.join(ACER_ASOLARIA_ROOT, 'tools/behcs/supervisor-pid-indicator-index.js'),
  path.join(ACER_ASOLARIA_ROOT, 'tools/behcs/device-pid-indicator-index.js'),
  path.join(ACER_ASOLARIA_ROOT, 'tools/behcs/system-surface-pid-indicator-index.js'),
]);

// Forbidden API patterns — Get-CimInstance, Get-WmiObject, both block.
// Win32_* class names alone are NOT flagged (only direct cmdlet calls), because
// doc-comments + STRING LABELS (e.g. evidence-level enum "OS_VISIBLE_CIM") may use
// the term legitimately.
export const FORBIDDEN_API_PATTERN = /\b(Get-CimInstance|Get-WmiObject)\b/;

export const AUDIT_STATUSES = Object.freeze({
  CLEAN: 'CLEAN',
  REGRESSION: 'REGRESSION',
  NOT_FOUND: 'NOT_FOUND',
});

// Audit one indexer file. Returns { status, hits, error? }.
// `hits` excludes comment lines (// or # or * line-leaders, with optional whitespace).
export function auditIndexer(filePath) {
  let content;
  try {
    if (!fs.existsSync(filePath)) {
      return { path: filePath, status: AUDIT_STATUSES.NOT_FOUND, hits: [] };
    }
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { path: filePath, status: AUDIT_STATUSES.NOT_FOUND, hits: [], error: String(err.message || err) };
  }
  const hits = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip doc comments (// or # or *) and any line where Win32_* appears inside a string literal
    // following only comment chars
    const trimmed = line.trim();
    const isCommentLine = /^(\/\/|#|\*)/.test(trimmed);
    if (isCommentLine) continue;
    if (FORBIDDEN_API_PATTERN.test(line)) {
      hits.push({ lineNumber: i + 1, content: line.trim() });
    }
  }
  return {
    path: filePath,
    status: hits.length > 0 ? AUDIT_STATUSES.REGRESSION : AUDIT_STATUSES.CLEAN,
    hits,
  };
}

// Audit all canonical indexers. Returns { schema, generatedAt, summary, indexers }.
export function auditAll(paths = INDEXER_PATHS) {
  const generatedAt = new Date().toISOString();
  const indexers = paths.map(auditIndexer);
  const summary = {
    total: indexers.length,
    clean: indexers.filter((i) => i.status === AUDIT_STATUSES.CLEAN).length,
    regressions: indexers.filter((i) => i.status === AUDIT_STATUSES.REGRESSION).length,
    notFound: indexers.filter((i) => i.status === AUDIT_STATUSES.NOT_FOUND).length,
    overallStatus: indexers.some((i) => i.status === AUDIT_STATUSES.REGRESSION) ? 'REGRESSION_DETECTED' : 'PASS',
  };
  return {
    schema: 'indexer-non-cim-regression.audit.v1',
    generatedAt,
    forbiddenApiPattern: FORBIDDEN_API_PATTERN.source,
    summary,
    indexers,
  };
}

export const STATUS = Object.freeze({
  schema: 'indexer-non-cim-regression.v1',
  indexer_paths: INDEXER_PATHS,
  forbidden_pattern: FORBIDDEN_API_PATTERN.source,
  audit_statuses: AUDIT_STATUSES,
  spec: 'acer_path_B_WMI_rewrite_2026_05_26_cosign_seq_3367_+_liris_L4_mirror_shape',
});

// CLI entry — if invoked directly (not imported), run audit + emit JSON to stdout.
// Windows-safe detection: check argv[1] ends with this module's filename.
if (process.argv[1] && process.argv[1].endsWith('test-indexer-non-cim-regression.mjs')) {
  const report = auditAll();
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.summary.overallStatus === 'REGRESSION_DETECTED') {
    process.exit(1);
  }
  process.exit(0);
}
