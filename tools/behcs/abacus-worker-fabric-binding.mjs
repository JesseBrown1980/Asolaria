#!/usr/bin/env node
// Abacus-Worker HyperBEHCS Fabric Binding — sibling of L7 (interview-copilot).
//
// Operator-directive 2026-05-27: bind abacus-worker to HyperBEHCS fabric with:
//   - PROF-ABACUS-WORKER supervisor
//   - PID-specific profile (deterministic Brown-Hilbert mint)
//   - cube-cube-cubed classifier
//   - Asolaria-MCP + Web-MCP routing edges
//   - omnimetric / omnischeduler / omniquant linkage
//
// Per L7 pattern: binding only, does not modify public/abacus-worker.js
// (UI/runtime stays untouched in Phase 1; UI wiring is operator-pick Phase 3).
//
// Companion: abacus-worker-diagnostic.mjs surfaces actual integration state
// (enabled / configured / authed / etc) via the connector's status API.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ---- canonical entity definition ----

export const ABACUS_WORKER_PROF = Object.freeze({
  profId: 'PROF-ABACUS-WORKER',
  band: 'helm',
  kind: 'browser-isolated-AI-worker-orchestrator',
  authorityClass: 'dev',
  description:
    'Abacus AI worker — orchestrates browser/desktop AI work packets via ' +
    'managed isolated Chrome profile. Backed by src/connectors/abacusConnector.js. ' +
    'Bound to fabric via this module 2026-05-27 per OP-JESSE.',
  runtime: {
    uiPath: 'public/abacus-worker.js',
    uiHtml: 'public/abacus-worker.html',
    connectorBackend: 'src/connectors/abacusConnector.js',
    packetRuntime: 'src/connectors/abacusPacketRuntime.js',
    secureVaultRef: 'integrations.abacus',
    defaultAppUrl: 'https://apps.abacus.ai/chatllm/?appId=7560d5f36',
    defaultProfileName: 'asolaria-slot-phone_mode',
  },
  fabricEdges: {
    mcpUniversal: 'asolaria-mcp',
    webMcp: 'web-mcp-pixels-pre-gpu',
    omnischeduler: 'omnischeduler-abacus-packet-lane',
    omnimetric: 'omnimetric-abacus-feedback-loop',
    omniquant: 'quadruple-quant-Polar+Turbo+JL+Zeta',
    hookwall: 'PR-21-universal-route-dual-emit',
    gnn: 'L0-EdgeLevel-GNN',
    siblingCopilot: 'PROF-INTERVIEW-COPILOT',
  },
});

// ---- deterministic PID mint ----

export function mintAbacusWorkerPid({ vantage = 'liris', wave = 'W150-ABACUS-WORKER-FABRIC-2026-05-27' } = {}) {
  const role = `${ABACUS_WORKER_PROF.profId}-${ABACUS_WORKER_PROF.band}`;
  const roomId = parseInt(sha(wave + role + vantage).slice(0, 8), 16) % 10000;
  const hcoord = 'H' + roomId.toString(16).toUpperCase().padStart(4, '0');
  const nonce = 'N' + sha(wave + role + vantage + 'mint').slice(0, 8);
  return {
    pid: `AGT-L3-${ABACUS_WORKER_PROF.profId.replace(/^PROF-/, '')}-${hcoord}-W150-P00-${nonce}`,
    hcoord,
    roomId,
    vantage,
    wave,
    deterministic: true,
    mintedAt: new Date().toISOString(),
  };
}

// ---- supervisor record ----

export function buildSupervisorRecord({ vantage = 'liris' } = {}) {
  const pid = mintAbacusWorkerPid({ vantage });
  return {
    supervisorId: ABACUS_WORKER_PROF.profId,
    bandSupervisor: ABACUS_WORKER_PROF.band,
    pidKind: 'supervisor',
    nativePid: pid.pid,
    hilbertCoord: pid.hcoord,
    authorityLevel: ABACUS_WORKER_PROF.authorityClass,
    cosignPolicy: 'PENDING-APEX-MINT',
    description: ABACUS_WORKER_PROF.description,
    runtime: ABACUS_WORKER_PROF.runtime,
    fabricEdges: ABACUS_WORKER_PROF.fabricEdges,
    evidenceLevel: 'MANIFEST_OBSERVED',
    canonicalSource: 'tools/behcs/abacus-worker-fabric-binding.mjs',
    createdAt: new Date().toISOString(),
  };
}

// ---- cube-cube-cubed classify ----

export const abacusWorkerCubeCubed = Object.freeze({
  cubeId: 'abacus-worker-cube-cubed',
  status: 'CUBE_CUBE_CUBED',
  dimensions: {
    D1_who: 'PROF-ABACUS-WORKER',
    D2_what: 'AI-worker-packet-orchestrator',
    D3_where: 'managed-isolated-browser-OR-desktop-app',
    D4_when: 'packet-bounded',
    D5_why: 'farmed-LLM-work-via-third-party-AI-platform',
    D6_how: 'isolated-Chrome-profile + auth-cookie + URL-navigation',
    D7_authority: 'dev',
    D8_evidence: 'MANIFEST_OBSERVED',
  },
  classify(row) {
    if (!row || typeof row !== 'object') return null;
    const pidKind = row.pidKind || row.kind || row.profId;
    if (pidKind === 'PROF-ABACUS-WORKER' || pidKind === 'supervisor') {
      return { route: 'abacus-worker-lane', metadata: { band: 'helm', authorityLevel: row.authorityLevel || 'dev' } };
    }
    return null;
  },
  mutationAllowed: false,
});

// ---- writeback ----

export function writeSupervisorSetFile({ repoRoot = 'C:/Users/rayss/Asolaria', vantage = 'liris' } = {}) {
  const setDir = path.join(repoRoot, 'data', 'behcs', 'supervisors', 'abacus-worker');
  fs.mkdirSync(setDir, { recursive: true });
  const setFile = path.join(setDir, 'abacus-worker-supervisors.v1.json');
  const record = buildSupervisorRecord({ vantage });
  const set = {
    supervisorSetId: 'abacus-worker-supervisors.v1',
    createdAt: record.createdAt,
    status: 'ACTIVE_ABACUS_WORKER_FABRIC_BINDING',
    authority:
      'OP-JESSE explicit directive 2026-05-27 within active quintuple-auth window (2026-05-25 → 2026-07-25). ' +
      'Binds existing public/abacus-worker.js + src/connectors/abacusConnector.js to HyperBEHCS fabric. ' +
      'Sibling of PROF-INTERVIEW-COPILOT (L7).',
    policy: {
      mcp: 'ASOLARIA-MCP-UNIVERSAL-0-TOKEN-TRANSPORT',
      noExteriorMcp: false,
      noModelFanout: true,
      noPeerEndpointActions: false,
    },
    supervisors: [record],
  };
  fs.writeFileSync(setFile, JSON.stringify(set, null, 2));
  return { setFile, set };
}

// ---- CLI ----
const isMain = (() => {
  try { return process.argv[1] && process.argv[1].endsWith('abacus-worker-fabric-binding.mjs'); } catch { return false; }
})();

if (isMain) {
  const action = process.argv[2] || 'status';
  if (action === 'status') {
    const record = buildSupervisorRecord();
    process.stdout.write(JSON.stringify({
      action: 'status',
      prof: ABACUS_WORKER_PROF.profId,
      pid: record.nativePid,
      hcoord: record.hilbertCoord,
      cube: abacusWorkerCubeCubed.cubeId,
      runtime_paths_exist: Object.fromEntries(
        Object.entries(ABACUS_WORKER_PROF.runtime).map(([k, v]) => {
          if (typeof v !== 'string' || !v.includes('/')) return [k, 'not-a-path'];
          return [k, fs.existsSync(path.join('C:/Users/rayss/Asolaria', v))];
        })
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
