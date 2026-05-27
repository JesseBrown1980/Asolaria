#!/usr/bin/env node
// Interview-Copilot HyperBEHCS Fabric Binding — operator-directive 2026-05-27.
//
// Spec: operator OP-JESSE explicit directive 2026-05-27 — bind the existing
// public/interview-copilot.js to the HyperBEHCS fabric with:
//   - supervisor (PROF-INTERVIEW-COPILOT)
//   - PID-specific profile (deterministic Brown-Hilbert mint)
//   - map / cube / glyph wiring (cube-cube-cubed classify)
//   - Asolaria MCP + Web MCP routing edges
//   - omnimetric / omnischeduler / omniquant linkage points
//
// This module is the FABRIC BINDING. It does not modify interview-copilot.js
// itself (which stays as the UI/runtime layer). It registers the entity into
// the supervisor index + emits a canonical handoff JSON the existing
// interview-copilot can consume to identify itself in the fabric.
//
// Sibling binding for abacus-worker should follow same pattern (Phase 2).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sha16 = (s) => sha(s).slice(0, 16);

// ---- canonical entity definition ----

export const INTERVIEW_COPILOT_PROF = Object.freeze({
  profId: 'PROF-INTERVIEW-COPILOT',
  band: 'helm', // operational supervisor band per AGENTS.md (cp 384-479)
  kind: 'human-facing-interactive-copilot',
  authorityClass: 'dev', // not prod until empirical session validation
  description:
    'Live interview / meeting copilot — captures audio via WhisperLocal STT, ' +
    'produces real-time Q+A via federation LLM tier, overlays answers without ' +
    'modifying the meeting client (Google Meet / Zoom / etc). Bound to fabric ' +
    'via this module 2026-05-27 per OP-JESSE.',
  runtime: {
    uiPath: 'public/interview-copilot.js',
    workerSibling: 'public/abacus-worker.js',
    connectorBackend: 'src/connectors/abacusConnector.js',
    sttAdapter: 'tools/whisper-local/whisper-adapter.ps1',
    sttScript: 'tools/whisper-local/transcribe_whisper.py',
    ttsAdapter: 'tools/kitty-tts-adapter.ps1',
    meetingDevices: 'tools/Get-Asolaria-MeetingDevices.ps1',
    captionBridge: 'tools/caption_ocr_bridge.py',
  },
  fabricEdges: {
    mcpUniversal: 'asolaria-mcp', // 0-token transport
    webMcp: 'web-mcp-pixels-pre-gpu', // per project_pre_GPU_vision_insight_jesse_2026_05_08_class1_constitutional
    omnischeduler: 'omnischeduler-canonical-task-lane',
    omnimetric: 'omnimetric-feedback-loop',
    omniquant: 'quadruple-quant-Polar+Turbo+JL+Zeta',
    hookwall: 'PR-21-universal-route-dual-emit',
    gnn: 'L0-EdgeLevel-GNN',
  },
});

// ---- deterministic PID mint ----

export function mintInterviewCopilotPid({ vantage = 'liris', wave = 'W150-INTERVIEW-COPILOT-FABRIC-2026-05-27' } = {}) {
  const role = `${INTERVIEW_COPILOT_PROF.profId}-${INTERVIEW_COPILOT_PROF.band}`;
  const roomId = parseInt(sha(wave + role + vantage).slice(0, 8), 16) % 10000;
  const hcoord = 'H' + roomId.toString(16).toUpperCase().padStart(4, '0');
  const nonce = 'N' + sha(wave + role + vantage + 'mint').slice(0, 8);
  return {
    pid: `AGT-L3-${INTERVIEW_COPILOT_PROF.profId.replace(/^PROF-/, '')}-${hcoord}-W150-P00-${nonce}`,
    hcoord,
    roomId,
    vantage,
    wave,
    deterministic: true,
    mintedAt: new Date().toISOString(),
  };
}

// ---- supervisor record (canonical HBPv1-aligned, for index absorption) ----

export function buildSupervisorRecord({ vantage = 'liris' } = {}) {
  const pid = mintInterviewCopilotPid({ vantage });
  return {
    supervisorId: INTERVIEW_COPILOT_PROF.profId,
    bandSupervisor: INTERVIEW_COPILOT_PROF.band,
    pidKind: 'supervisor',
    nativePid: pid.pid,
    hilbertCoord: pid.hcoord,
    authorityLevel: INTERVIEW_COPILOT_PROF.authorityClass,
    cosignPolicy: 'PENDING-APEX-MINT',
    description: INTERVIEW_COPILOT_PROF.description,
    runtime: INTERVIEW_COPILOT_PROF.runtime,
    fabricEdges: INTERVIEW_COPILOT_PROF.fabricEdges,
    evidenceLevel: 'MANIFEST_OBSERVED',
    canonicalSource: 'tools/behcs/interview-copilot-fabric-binding.mjs',
    createdAt: new Date().toISOString(),
  };
}

// ---- cube-cube-cubed classify (for fabric routing per existing pattern) ----

export const interviewCopilotCubeCubed = Object.freeze({
  cubeId: 'interview-copilot-cube-cubed',
  status: 'CUBE_CUBE_CUBED',
  dimensions: {
    D1_who: 'PROF-INTERVIEW-COPILOT',
    D2_what: 'live-meeting-copilot',
    D3_where: 'user-foreground-window',
    D4_when: 'session-bounded',
    D5_why: 'human-cognitive-augment-for-interview',
    D6_how: 'whisper-stt + LLM + overlay',
    D7_authority: 'dev',
    D8_evidence: 'MANIFEST_OBSERVED',
  },
  classify(row) {
    if (!row || typeof row !== 'object') return null;
    const pidKind = row.pidKind || row.kind || row.profId;
    if (pidKind === 'PROF-INTERVIEW-COPILOT' || pidKind === 'supervisor') {
      return { route: 'interview-copilot-lane', metadata: { band: 'helm', authorityLevel: row.authorityLevel || 'dev' } };
    }
    return null;
  },
  mutationAllowed: false, // read-only routing per cube-cube-cubed canon
});

// ---- writeback (mint into supervisor index source path) ----

export function writeSupervisorSetFile({ repoRoot = 'C:/Users/rayss/Asolaria', vantage = 'liris' } = {}) {
  const setDir = path.join(repoRoot, 'data', 'behcs', 'supervisors', 'interview-copilot');
  fs.mkdirSync(setDir, { recursive: true });
  const setFile = path.join(setDir, 'interview-copilot-supervisors.v1.json');
  const record = buildSupervisorRecord({ vantage });
  const set = {
    supervisorSetId: 'interview-copilot-supervisors.v1',
    createdAt: record.createdAt,
    status: 'ACTIVE_INTERVIEW_COPILOT_FABRIC_BINDING',
    authority:
      'OP-JESSE explicit directive 2026-05-27 within active quintuple-auth window (2026-05-25 → 2026-07-25). ' +
      'Binds existing public/interview-copilot.js to HyperBEHCS fabric.',
    policy: {
      mcp: 'ASOLARIA-MCP-UNIVERSAL-0-TOKEN-TRANSPORT',
      noExteriorMcp: false, // Web MCP allowed for pre-GPU pixel inspection
      noModelFanout: true,
      noPeerEndpointActions: false, // calls federation LLM tier
    },
    supervisors: [record],
  };
  fs.writeFileSync(setFile, JSON.stringify(set, null, 2));
  return { setFile, set };
}

// ---- CLI ----
const isMain = (() => {
  try { return process.argv[1] && process.argv[1].endsWith('interview-copilot-fabric-binding.mjs'); } catch { return false; }
})();

if (isMain) {
  const action = process.argv[2] || 'status';
  if (action === 'status') {
    const record = buildSupervisorRecord();
    process.stdout.write(JSON.stringify({
      action: 'status',
      prof: INTERVIEW_COPILOT_PROF.profId,
      pid: record.nativePid,
      hcoord: record.hilbertCoord,
      cube: interviewCopilotCubeCubed.cubeId,
      runtime_paths_exist: Object.fromEntries(
        Object.entries(INTERVIEW_COPILOT_PROF.runtime).map(([k, v]) => [k, fs.existsSync(path.join('C:/Users/rayss/Asolaria', v))])
      ),
    }, null, 2) + '\n');
  } else if (action === 'mint') {
    const { setFile, set } = writeSupervisorSetFile();
    process.stdout.write(JSON.stringify({
      action: 'mint',
      setFile,
      supervisorId: set.supervisorSetId,
      supervisorCount: set.supervisors.length,
      pid: set.supervisors[0].nativePid,
    }, null, 2) + '\n');
  } else {
    process.stderr.write(`unknown action "${action}" — use "status" or "mint"\n`);
    process.exit(2);
  }
}
