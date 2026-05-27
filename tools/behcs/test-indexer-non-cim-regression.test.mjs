// Tests for indexer non-CIM regression guard.
// Per Delta L4 — codifies the liris-side Path B discipline as a re-runnable assertion.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  auditIndexer,
  auditAll,
  INDEXER_PATHS,
  FORBIDDEN_API_PATTERN,
  STATUS,
} from './test-indexer-non-cim-regression.mjs';

const REPO_ROOT = 'C:/Users/rayss/Asolaria';

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'indexer-audit-test-'));
}

describe('indexer-non-cim-regression — STATUS surface', () => {
  test('exposes indexer paths + spec', () => {
    assert.equal(INDEXER_PATHS.length, 4);
    assert.equal(STATUS.spec, 'feedback_avoid_WMI_CIM_probes_on_liris_causes_ethernet_adapter_drop_2026_05_12');
    assert.equal(STATUS.delta_L1_anchor, 'fa272485099b1d79 (device-pid Path B WMI rewrite)');
  });

  test('FORBIDDEN_API_PATTERN matches both API calls', () => {
    assert.ok(FORBIDDEN_API_PATTERN.test('Get-CimInstance Win32_Process'));
    assert.ok(FORBIDDEN_API_PATTERN.test('Get-WmiObject Win32_Service'));
    assert.ok(!FORBIDDEN_API_PATTERN.test('Get-Service -ServiceType KernelDriver'));
    assert.ok(!FORBIDDEN_API_PATTERN.test('Get-PnpDevice -PresentOnly'));
  });
});

describe('indexer-non-cim-regression — auditIndexer (single file)', () => {
  test('clean file returns CLEAN status with zero hits', () => {
    const dir = tmpdir();
    const filePath = path.join(dir, 'clean.js');
    fs.writeFileSync(filePath, [
      "const x = Get-PnpDevice -Class Display;",
      "// historical: previously used Get-CimInstance Win32_VideoController",
      "# PowerShell comment: Get-WmiObject Win32_BIOS is forbidden",
    ].join('\n'));
    const result = auditIndexer(filePath, '');
    assert.equal(result.status, 'CLEAN');
    assert.equal(result.hits.length, 0);
  });

  test('file with active CIM call returns REGRESSION', () => {
    const dir = tmpdir();
    const filePath = path.join(dir, 'regressed.js');
    fs.writeFileSync(filePath, [
      "// some doc",
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node' }",
      "// trailing comment",
    ].join('\n'));
    const result = auditIndexer(filePath, '');
    assert.equal(result.status, 'REGRESSION');
    assert.equal(result.hits.length, 1);
    assert.equal(result.hits[0].lineNumber, 2);
  });

  test('non-existent file returns NOT_FOUND', () => {
    const result = auditIndexer('/this/path/does/not/exist.js', '');
    assert.equal(result.status, 'NOT_FOUND');
    assert.equal(result.hits.length, 0);
  });

  test('doc comments with API names are NOT flagged', () => {
    const dir = tmpdir();
    const filePath = path.join(dir, 'comments-only.js');
    fs.writeFileSync(filePath, [
      "// FIX: replaces Get-CimInstance + Win32_* with Get-PnpDevice",
      "# old code used Get-WmiObject Win32_Service",
      "* block: Get-CimInstance was here",
      "const ok = true;",
    ].join('\n'));
    const result = auditIndexer(filePath, '');
    assert.equal(result.status, 'CLEAN');
  });
});

describe('indexer-non-cim-regression — auditAll (production indexers)', () => {
  test('all 4 liris indexers are CLEAN post-Path-B', () => {
    const report = auditAll(REPO_ROOT);
    assert.equal(report.summary.total, 4);
    assert.equal(report.summary.overallStatus, 'PASS');
    assert.equal(report.summary.regressions, 0);
  });

  test('production indexer set matches canonical INDEXER_PATHS', () => {
    assert.ok(INDEXER_PATHS.includes('tools/behcs/supervisor-pid-indicator-index.js'));
    assert.ok(INDEXER_PATHS.includes('tools/behcs/device-pid-indicator-index.js'));
    assert.ok(INDEXER_PATHS.includes('tools/behcs/system-surface-pid-indicator-index.js'));
    assert.ok(INDEXER_PATHS.includes('tools/behcs/falcon-asolaria-mirror-pid-indicator.js'));
  });

  test('returns structured summary with status counts', () => {
    const report = auditAll(REPO_ROOT);
    assert.ok('clean' in report.summary);
    assert.ok('regressions' in report.summary);
    assert.ok('notFound' in report.summary);
    assert.equal(report.summary.clean + report.summary.regressions + report.summary.notFound, report.summary.total);
  });
});
