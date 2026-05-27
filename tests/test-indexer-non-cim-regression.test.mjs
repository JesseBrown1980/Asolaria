// Tests for indexer non-CIM regression guard (acer-side L4-mirror).
// Per Delta L4-mirror + A2 acer-side bilateral parity with liris L4.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  auditIndexer,
  auditAll,
  AUDIT_STATUSES,
  FORBIDDEN_API_PATTERN,
  INDEXER_PATHS,
  STATUS,
} from '../tools/behcs/test-indexer-non-cim-regression.mjs';

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'indexer-non-cim-test-'));
}

function writeFile(dir, name, content) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('FORBIDDEN_API_PATTERN regex', () => {
  test('matches Get-CimInstance', () => {
    assert.ok(FORBIDDEN_API_PATTERN.test('foo Get-CimInstance Win32_X bar'));
  });
  test('matches Get-WmiObject', () => {
    assert.ok(FORBIDDEN_API_PATTERN.test('foo Get-WmiObject -Class X'));
  });
  test('does NOT match Get-PnpDevice (non-CIM equivalent)', () => {
    assert.ok(!FORBIDDEN_API_PATTERN.test('Get-PnpDevice -Class USB'));
  });
  test('does NOT match Get-Disk (non-CIM equivalent)', () => {
    assert.ok(!FORBIDDEN_API_PATTERN.test('Get-Disk | foreach'));
  });
});

describe('auditIndexer single-file behavior', () => {
  test('CLEAN file → status CLEAN, zero hits', () => {
    const dir = tmpdir();
    const file = writeFile(dir, 'clean.js', '// Get-PnpDevice usage\nconst x = "Get-Disk";');
    const result = auditIndexer(file);
    assert.equal(result.status, AUDIT_STATUSES.CLEAN);
    assert.equal(result.hits.length, 0);
  });

  test('active Get-CimInstance call → status REGRESSION + hits include line number', () => {
    const dir = tmpdir();
    const file = writeFile(dir, 'regression.js',
      '$ErrorActionPreference = "SilentlyContinue"\n' +
      '$out.X = @(Get-CimInstance Win32_Y | Select-Object -Property Name)\n' +
      'const fine = "ok";'
    );
    const result = auditIndexer(file);
    assert.equal(result.status, AUDIT_STATUSES.REGRESSION);
    assert.equal(result.hits.length, 1);
    assert.equal(result.hits[0].lineNumber, 2);
    assert.match(result.hits[0].content, /Get-CimInstance/);
  });

  test('doc-comment line with Get-CimInstance → NOT flagged', () => {
    const dir = tmpdir();
    const file = writeFile(dir, 'docs.js',
      '// Replaces Get-CimInstance / Win32_* with non-CIM\n' +
      '# Also Get-WmiObject mentioned in comment\n' +
      'const clean = true;'
    );
    const result = auditIndexer(file);
    assert.equal(result.status, AUDIT_STATUSES.CLEAN);
  });

  test('NOT_FOUND when file absent', () => {
    const result = auditIndexer('C:/non/existent/path.js');
    assert.equal(result.status, AUDIT_STATUSES.NOT_FOUND);
    assert.equal(result.hits.length, 0);
  });

  test('multiple active CIM calls → multiple hits', () => {
    const dir = tmpdir();
    const file = writeFile(dir, 'multi.js',
      '$a = Get-CimInstance Win32_A\n' +
      '$b = Get-WmiObject -Class B\n' +
      '// comment line\n' +
      '$c = Get-CimInstance Win32_C\n'
    );
    const result = auditIndexer(file);
    assert.equal(result.status, AUDIT_STATUSES.REGRESSION);
    assert.equal(result.hits.length, 3);
    assert.deepEqual(result.hits.map((h) => h.lineNumber), [1, 2, 4]);
  });
});

describe('auditAll behavior', () => {
  test('summary aggregates by status', () => {
    const dir = tmpdir();
    const clean = writeFile(dir, 'a.js', '// no CIM');
    const regression = writeFile(dir, 'b.js', '$x = Get-CimInstance Win32_X');
    const result = auditAll([clean, regression, '/nope/missing.js']);
    assert.equal(result.summary.total, 3);
    assert.equal(result.summary.clean, 1);
    assert.equal(result.summary.regressions, 1);
    assert.equal(result.summary.notFound, 1);
    assert.equal(result.summary.overallStatus, 'REGRESSION_DETECTED');
  });

  test('all-clean produces overallStatus PASS', () => {
    const dir = tmpdir();
    const a = writeFile(dir, 'a.js', '// clean');
    const b = writeFile(dir, 'b.js', '// also clean');
    const result = auditAll([a, b]);
    assert.equal(result.summary.overallStatus, 'PASS');
    assert.equal(result.summary.regressions, 0);
  });

  test('returns canonical schema field', () => {
    const dir = tmpdir();
    const a = writeFile(dir, 'a.js', '// x');
    const result = auditAll([a]);
    assert.equal(result.schema, 'indexer-non-cim-regression.audit.v1');
    assert.ok(typeof result.generatedAt === 'string');
  });
});

describe('integration — production INDEXER_PATHS audit', () => {
  test('canonical INDEXER_PATHS has 3 acer-side paths', () => {
    assert.equal(INDEXER_PATHS.length, 3);
    // Platform-agnostic path check (Windows path.join produces backslash separators)
    assert.ok(INDEXER_PATHS.every((p) => p.replace(/\\/g, '/').includes('Asolaria/tools/behcs')));
  });

  test('production audit completes + all 3 indexers report CLEAN (post-A2 rewrite)', () => {
    const result = auditAll();
    assert.equal(result.summary.total, 3);
    assert.equal(result.summary.regressions, 0);
    assert.equal(result.summary.overallStatus, 'PASS');
  });

  test('STATUS export surface canonical', () => {
    assert.equal(STATUS.schema, 'indexer-non-cim-regression.v1');
    assert.ok(STATUS.indexer_paths.length === 3);
    assert.ok(STATUS.spec.includes('path_B_WMI_rewrite'));
  });
});
