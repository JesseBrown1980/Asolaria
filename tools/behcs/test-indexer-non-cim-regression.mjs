#!/usr/bin/env node
// Indexer non-CIM regression guard — codifies the liris-side Path B discipline.
//
// Spec: per `feedback_avoid_WMI_CIM_probes_on_liris_causes_ethernet_adapter_drop_2026_05_12.md`
// Class-1 memory — liris cannot use `Get-CimInstance` / `Get-WmiObject` / `Win32_*` CIM
// classes without risk of triggering the 2026-05-12 ethernet adapter drop incident.
//
// Three indexers were rewritten on 2026-05-26 to non-CIM primitives:
//   - device-pid-indicator-index.js     (Delta L1 — Path B WMI rewrite, fa272485099b1d79)
//   - system-surface-pid-indicator-index.js (Delta L2 — Path B WMI rewrite)
//   - falcon-asolaria-mirror-pid-indicator.js (audited clean, never had hazard)
//   - supervisor-pid-indicator-index.js (audited clean, never had hazard)
//
// This module asserts those 4 indexers stay WMI-clean. Run before any commit/release
// that modifies indexer code. Exit 0 if all clean, exit 1 if regression detected.
//
// Pure function. No side effects. No network. No daemon-mutate.

import fs from 'node:fs';
import path from 'node:path';

export const INDEXER_PATHS = Object.freeze([
  'tools/behcs/supervisor-pid-indicator-index.js',
  'tools/behcs/device-pid-indicator-index.js',
  'tools/behcs/system-surface-pid-indicator-index.js',
  'tools/behcs/falcon-asolaria-mirror-pid-indicator.js',
]);

// Active CIM API calls (NOT doc comments or string labels).
// A line is "active CIM" if it contains Get-CimInstance / Get-WmiObject
// AND is not a # comment, // comment, or string literal containing "Win32_".
export const FORBIDDEN_API_PATTERN = /Get-CimInstance|Get-WmiObject/;

function lineIsComment(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') // for block comments
  );
}

export function auditIndexer(filePath, repoRoot = process.cwd()) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  if (!fs.existsSync(absPath)) {
    return { path: filePath, status: 'NOT_FOUND', hits: [] };
  }
  const src = fs.readFileSync(absPath, 'utf8');
  const lines = src.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!FORBIDDEN_API_PATTERN.test(line)) continue;
    if (lineIsComment(line)) continue; // doc comment is OK
    hits.push({ lineNumber: i + 1, line: line.trim() });
  }
  return {
    path: filePath,
    status: hits.length === 0 ? 'CLEAN' : 'REGRESSION',
    hits,
    lineCount: lines.length,
  };
}

export function auditAll(repoRoot = 'C:/Users/rayss/Asolaria') {
  const results = INDEXER_PATHS.map(p => auditIndexer(p, repoRoot));
  const clean = results.filter(r => r.status === 'CLEAN').length;
  const regressions = results.filter(r => r.status === 'REGRESSION');
  const notFound = results.filter(r => r.status === 'NOT_FOUND');
  return {
    summary: {
      total: results.length,
      clean,
      regressions: regressions.length,
      notFound: notFound.length,
      overallStatus: regressions.length === 0 ? 'PASS' : 'FAIL',
    },
    results,
  };
}

export const STATUS = Object.freeze({
  spec: 'feedback_avoid_WMI_CIM_probes_on_liris_causes_ethernet_adapter_drop_2026_05_12',
  indexer_paths: INDEXER_PATHS,
  hazard_canon: 'liris ethernet adapter drop on Get-CimInstance Win32_Process — 2026-05-12 incident',
  delta_L1_anchor: 'fa272485099b1d79 (device-pid Path B WMI rewrite)',
  delta_L2_anchor: 'system-surface-pid Path B WMI rewrite 2026-05-26T23:43Z',
  audit_rule: 'active Get-CimInstance / Get-WmiObject calls forbidden; doc comments + evidence-level string labels OK',
});

// CLI: run when invoked directly
const isMain = (() => {
  try {
    return import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`;
  } catch {
    return false;
  }
})();

if (isMain) {
  const report = auditAll('C:/Users/rayss/Asolaria');
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.summary.overallStatus === 'PASS' ? 0 : 1);
}
