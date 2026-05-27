// Tests for F1 von-Mangoldt HyperBEHCS Fabric Binding (liris-vantage mirror).

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  F1_VON_MANGOLDT_PROF,
  mintF1Pid,
  buildSupervisorRecord,
  f1VonMangoldtCubeCubed,
} from './f1-von-mangoldt-fabric-binding.mjs';

describe('f1-von-mangoldt-fabric-binding — PROF surface', () => {
  test('PROF id + band canonical', () => {
    assert.equal(F1_VON_MANGOLDT_PROF.profId, 'PROF-F1-VON-MANGOLDT');
    assert.equal(F1_VON_MANGOLDT_PROF.band, 'helm');
  });

  test('math anchors include arxiv 2605.00301 + Tao writeup + DeepMind Lean', () => {
    assert.equal(F1_VON_MANGOLDT_PROF.mathAnchors.arxiv, '2605.00301');
    assert.match(F1_VON_MANGOLDT_PROF.mathAnchors.taoBlog, /terrytao.*von-mangoldt-chains/);
    assert.match(F1_VON_MANGOLDT_PROF.mathAnchors.deepMindLean, /#2376.*#2377/);
  });

  test('bilateral verification metadata empirically captured', () => {
    const v = F1_VON_MANGOLDT_PROF.bilateralVerification;
    assert.equal(v.totalTests, 497);
    assert.equal(v.passCount, 460);
    assert.equal(v.failCount, 0);
    assert.equal(v.f1SpecificTests, 52);
    assert.equal(v.f1SpecificFailCount, 0);
    assert.equal(v.sentinelHeld, true);
    assert.equal(v.acerCommit, '9f9f2bd');
  });
});

describe('f1-von-mangoldt-fabric-binding — mintF1Pid', () => {
  test('returns canonical AGT-L3 PID shape', () => {
    const result = mintF1Pid();
    assert.match(result.pid, /^AGT-L3-F1-VON-MANGOLDT-H[0-9A-F]{4}-W150-P00-N[0-9a-f]{8}$/);
  });

  test('deterministic across runs', () => {
    const a = mintF1Pid({ vantage: 'liris' });
    const b = mintF1Pid({ vantage: 'liris' });
    assert.equal(a.pid, b.pid);
  });

  test('vantage differentiates output (acer != liris)', () => {
    assert.notEqual(mintF1Pid({ vantage: 'acer' }).pid, mintF1Pid({ vantage: 'liris' }).pid);
  });
});

describe('f1-von-mangoldt-fabric-binding — buildSupervisorRecord', () => {
  test('record evidence level is EMPIRICAL_BILATERAL_VERIFIED', () => {
    const rec = buildSupervisorRecord();
    assert.equal(rec.evidenceLevel, 'EMPIRICAL_BILATERAL_VERIFIED');
  });

  test('record includes math anchors + bilateral verification', () => {
    const rec = buildSupervisorRecord();
    assert.ok(rec.mathAnchors);
    assert.ok(rec.bilateralVerification);
    assert.equal(rec.bilateralVerification.acerCommit, '9f9f2bd');
  });
});

describe('f1-von-mangoldt-fabric-binding — cube-cube-cubed routing', () => {
  test('cube exposes 8 dimensions with EMPIRICAL_BILATERAL_VERIFIED evidence', () => {
    const dims = Object.keys(f1VonMangoldtCubeCubed.dimensions);
    assert.equal(dims.length, 8);
    assert.match(f1VonMangoldtCubeCubed.dimensions.D8_evidence, /EMPIRICAL_BILATERAL_VERIFIED/);
  });

  test('classify routes PROF-F1-VON-MANGOLDT to f1-von-mangoldt-lane', () => {
    const route = f1VonMangoldtCubeCubed.classify({ profId: 'PROF-F1-VON-MANGOLDT' });
    assert.ok(route);
    assert.equal(route.route, 'f1-von-mangoldt-lane');
  });

  test('mutationAllowed false', () => {
    assert.equal(f1VonMangoldtCubeCubed.mutationAllowed, false);
  });
});
