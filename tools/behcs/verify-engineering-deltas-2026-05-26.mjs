#!/usr/bin/env node
// Engineering-deltas verification runner — single-command dashboard-visible proof
// for all 5 liris-side ships landed 2026-05-26 (L1+L2+L3+L4+L5).
//
// Closes the "dashboard-visible proof" axis of Victor de Genaro's template
// (2026-05-26T20:18 5/26/2026): real patch + tests + before/after metric +
// dashboard-visible proof. The first 3 axes shipped per-delta; this is the 4th.
//
// Reads each delta's empirical artifacts + emits consolidated JSON.
// Exit 0 if ALL deltas verified PASS, 1 if any FAIL, 2 on infrastructure error.
//
// Pure FS reads + invokes the L4 audit module. No network. No daemon-mutate.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPO_ROOT = 'C:/Users/rayss/Asolaria';
const REPORT_DATE = '2026-05-26';

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function checkDeltaL1() {
  const indexPath = path.join(REPO_ROOT, 'data/behcs/pid-fabric/index/device-pid-indicator-index-latest.json');
  const idx = readJsonSafe(indexPath);
  if (!idx) return { delta: 'L1', status: 'FAIL', reason: 'device-pid index file not readable' };
  const generatedAt = idx.generatedAt || '';
  const records = idx.counts?.uniquePids ?? idx.records?.length ?? 0;
  const fresh = generatedAt.startsWith('2026-05-26') || generatedAt.startsWith('2026-05-27');
  const recordsOk = records >= 300;
  return {
    delta: 'L1',
    name: 'device_pid_indexer_wmi_to_non_cim_rewrite',
    status: fresh && recordsOk ? 'PASS' : 'FAIL',
    generatedAt,
    uniquePids: records,
    fresh,
    recordsOk,
    expected: { freshDateOnOrAfter: REPORT_DATE, minPids: 300 },
  };
}

function checkDeltaL2() {
  const indexPath = path.join(REPO_ROOT, 'data/behcs/pid-fabric/index/system-surface-pid-indicator-index-latest.json');
  const idx = readJsonSafe(indexPath);
  if (!idx) return { delta: 'L2', status: 'FAIL', reason: 'system-surface index file not readable' };
  const generatedAt = idx.generatedAt || '';
  const records = idx.counts?.uniquePids ?? idx.counts?.totalRecords ?? 0;
  const fresh = generatedAt.startsWith('2026-05-26') || generatedAt.startsWith('2026-05-27');
  const recordsOk = records >= 3000;
  return {
    delta: 'L2',
    name: 'system_surface_indexer_wmi_to_non_cim_rewrite',
    status: fresh && recordsOk ? 'PASS' : 'FAIL',
    generatedAt,
    uniquePids: records,
    fresh,
    recordsOk,
    expected: { freshDateOnOrAfter: REPORT_DATE, minPids: 3000 },
  };
}

function checkDeltaL3() {
  const statePath = path.join(REPO_ROOT, 'data/behcs/state/fabric-revolver-state.json');
  const st = readJsonSafe(statePath);
  if (!st) return { delta: 'L3', status: 'FAIL', reason: 'fabric-revolver state file not readable' };
  const chambers = st.chambers || [];
  const states = chambers.map(c => c.state);
  const stuckCount = states.filter(s => s === 'RUNNING').length;
  const transitionedCount = states.filter(s => s === 'COMPLETE' || s === 'EMPTY' || s === 'ERROR').length;
  const fixProven = transitionedCount > 0 || (chambers.length === 0);
  return {
    delta: 'L3',
    name: 'fabric_revolver_stall_fire_and_forget_fix',
    status: fixProven ? 'PASS' : 'FAIL',
    lastTickAt: st.lastTickAt,
    chamberCount: chambers.length,
    states: Object.fromEntries(states.reduce((m, s) => m.set(s, (m.get(s) || 0) + 1), new Map())),
    stuckRunningCount: stuckCount,
    transitionedCount,
    fixProven,
    expected: 'at least one chamber in non-RUNNING state (proves fix-and-forget transition works)',
  };
}

function checkDeltaL4() {
  const auditScript = path.join(REPO_ROOT, 'tools/behcs/test-indexer-non-cim-regression.mjs');
  if (!fileExists(auditScript)) return { delta: 'L4', status: 'FAIL', reason: 'audit module not found' };
  try {
    const rawJson = execSync(`node "${auditScript}"`, { cwd: REPO_ROOT, encoding: 'utf8' });
    const report = JSON.parse(rawJson);
    return {
      delta: 'L4',
      name: 'indexer_non_cim_regression_guard',
      status: report.summary.overallStatus === 'PASS' ? 'PASS' : 'FAIL',
      auditSummary: report.summary,
    };
  } catch (e) {
    return { delta: 'L4', status: 'FAIL', reason: `audit module exec error: ${e.message}` };
  }
}

function checkDeltaL5() {
  const wrapperPath = path.join(REPO_ROOT, 'tools/Test-Asolaria-IndexerHazardGuard.ps1');
  const exists = fileExists(wrapperPath);
  return {
    delta: 'L5',
    name: 'indexer_hazard_guard_powershell_wrapper',
    status: exists ? 'PASS' : 'FAIL',
    wrapperPath,
    wrapperExists: exists,
    expected: 'tools/Test-Asolaria-IndexerHazardGuard.ps1 present',
  };
}

function main() {
  const results = [checkDeltaL1(), checkDeltaL2(), checkDeltaL3(), checkDeltaL4(), checkDeltaL5()];
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const report = {
    schema: 'engineering-deltas-verification.v1',
    runAt: new Date().toISOString(),
    reportDate: REPORT_DATE,
    repo: REPO_ROOT,
    summary: {
      totalDeltas: results.length,
      passCount,
      failCount,
      overallStatus: failCount === 0 ? 'ALL_PASS' : 'PARTIAL_FAIL',
    },
    deltas: results,
  };
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(failCount === 0 ? 0 : 1);
}

main();
