// Tests for Interview-Copilot HyperBEHCS Fabric Binding.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  INTERVIEW_COPILOT_PROF,
  mintInterviewCopilotPid,
  buildSupervisorRecord,
  interviewCopilotCubeCubed,
  writeSupervisorSetFile,
} from './interview-copilot-fabric-binding.mjs';

describe('interview-copilot-fabric-binding — PROF surface', () => {
  test('PROF id + band are canonical', () => {
    assert.equal(INTERVIEW_COPILOT_PROF.profId, 'PROF-INTERVIEW-COPILOT');
    assert.equal(INTERVIEW_COPILOT_PROF.band, 'helm');
  });

  test('runtime paths reference existing tooling', () => {
    assert.ok(INTERVIEW_COPILOT_PROF.runtime.uiPath.endsWith('interview-copilot.js'));
    assert.ok(INTERVIEW_COPILOT_PROF.runtime.sttScript.endsWith('transcribe_whisper.py'));
  });

  test('fabric edges name canonical components', () => {
    assert.equal(INTERVIEW_COPILOT_PROF.fabricEdges.mcpUniversal, 'asolaria-mcp');
    assert.equal(INTERVIEW_COPILOT_PROF.fabricEdges.hookwall, 'PR-21-universal-route-dual-emit');
  });
});

describe('interview-copilot-fabric-binding — mintInterviewCopilotPid', () => {
  test('returns canonical AGT-L3 PID shape', () => {
    const result = mintInterviewCopilotPid();
    assert.match(result.pid, /^AGT-L3-INTERVIEW-COPILOT-H[0-9A-F]{4}-W150-P00-N[0-9a-f]{8}$/);
  });

  test('deterministic across runs (same vantage + wave)', () => {
    const a = mintInterviewCopilotPid({ vantage: 'liris' });
    const b = mintInterviewCopilotPid({ vantage: 'liris' });
    assert.equal(a.pid, b.pid);
    assert.equal(a.hcoord, b.hcoord);
  });

  test('vantage differentiates output (acer != liris)', () => {
    const acer = mintInterviewCopilotPid({ vantage: 'acer' });
    const liris = mintInterviewCopilotPid({ vantage: 'liris' });
    assert.notEqual(acer.pid, liris.pid);
  });

  test('hcoord in H4-hex shape', () => {
    const result = mintInterviewCopilotPid();
    assert.match(result.hcoord, /^H[0-9A-F]{4}$/);
    assert.ok(result.roomId >= 0 && result.roomId < 10000);
  });
});

describe('interview-copilot-fabric-binding — buildSupervisorRecord', () => {
  test('record has canonical supervisor shape', () => {
    const rec = buildSupervisorRecord();
    assert.equal(rec.supervisorId, 'PROF-INTERVIEW-COPILOT');
    assert.equal(rec.bandSupervisor, 'helm');
    assert.equal(rec.pidKind, 'supervisor');
    assert.equal(rec.authorityLevel, 'dev');
    assert.equal(rec.cosignPolicy, 'PENDING-APEX-MINT');
    assert.ok(rec.nativePid.startsWith('AGT-L3-INTERVIEW-COPILOT-'));
  });

  test('includes runtime + fabric edges', () => {
    const rec = buildSupervisorRecord();
    assert.ok(rec.runtime);
    assert.ok(rec.fabricEdges);
    assert.equal(rec.fabricEdges.mcpUniversal, 'asolaria-mcp');
  });

  test('evidence level is MANIFEST_OBSERVED until empirical session validation', () => {
    const rec = buildSupervisorRecord();
    assert.equal(rec.evidenceLevel, 'MANIFEST_OBSERVED');
  });
});

describe('interview-copilot-fabric-binding — cube-cube-cubed routing', () => {
  test('cube exposes 8 dimensions', () => {
    const dims = Object.keys(interviewCopilotCubeCubed.dimensions);
    assert.equal(dims.length, 8);
    assert.ok(dims.includes('D1_who'));
    assert.ok(dims.includes('D8_evidence'));
  });

  test('classify routes PROF-INTERVIEW-COPILOT to interview-copilot-lane', () => {
    const route = interviewCopilotCubeCubed.classify({ profId: 'PROF-INTERVIEW-COPILOT' });
    assert.ok(route);
    assert.equal(route.route, 'interview-copilot-lane');
    assert.equal(route.metadata.band, 'helm');
  });

  test('classify returns null for unrelated PIDs', () => {
    assert.equal(interviewCopilotCubeCubed.classify({ pidKind: 'process' }), null);
    assert.equal(interviewCopilotCubeCubed.classify(null), null);
    assert.equal(interviewCopilotCubeCubed.classify('string'), null);
  });

  test('mutationAllowed false (read-only routing per cube-cube-cubed canon)', () => {
    assert.equal(interviewCopilotCubeCubed.mutationAllowed, false);
  });
});

describe('interview-copilot-fabric-binding — writeSupervisorSetFile (tmpdir)', () => {
  test('writes structured supervisor-set JSON to disk', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'icop-binding-test-'));
    const { setFile, set } = writeSupervisorSetFile({ repoRoot: tmp });
    assert.ok(fs.existsSync(setFile));
    const parsed = JSON.parse(fs.readFileSync(setFile, 'utf8'));
    assert.equal(parsed.supervisorSetId, 'interview-copilot-supervisors.v1');
    assert.equal(parsed.supervisors.length, 1);
    assert.equal(parsed.supervisors[0].supervisorId, 'PROF-INTERVIEW-COPILOT');
    assert.equal(parsed.status, 'ACTIVE_INTERVIEW_COPILOT_FABRIC_BINDING');
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
