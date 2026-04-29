#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "federation-reintegration-local-supervisor-wave-20260427";
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const OUTPUTS = Object.freeze({
  supervisorSet: path.join(repoRoot, "data", "behcs", "supervisors", "federation", "federation-reintegration-supervisors.v1.json"),
  wave: path.join(runRoot, "local-supervisor-wave21.v1.json"),
  report: path.join(repoRoot, "reports", "federation-reintegration-local-supervisor-wave-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-local-supervisor-wave-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-local-supervisor-wave.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-local-supervisor-wave-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-local-supervisor-wave.glpj.json")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function readJson(relativePath, fallback) {
  const full = path.join(repoRoot, relativePath);
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

const supervisors = [
  {
    id: "federation.local_mcp_only.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
    prof: "PROF-MCP",
    lane: "local_mcp_policy",
    role: "Blocks exterior MCP/tool use and routes all MCP claims through Asolaria BEHCS-256 local policy.",
    authority: "block_external_mcp_allow_asolaria_behcs256_only"
  },
  {
    id: "federation.hermes_packet.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
    prof: "PROF-HERMES",
    lane: "packet_integrity",
    role: "Keeps all next steps as ratifiable packets with explicit boundaries.",
    authority: "require_packet_before_action"
  },
  {
    id: "federation.shannon_trust.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST",
    prof: "PROF-SHANNON",
    lane: "trust_gate",
    role: "Forces one trust decision at a time and blocks promotion while gates remain open.",
    authority: "block_multi_peer_promotion"
  },
  {
    id: "federation.hookwall_boundary.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
    prof: "PROF-HOOKWALL",
    lane: "boundary",
    role: "Prevents peer/device writes, package enumeration, file pulls, installs, and exterior fanout.",
    authority: "deny_write_class_until_cosigned"
  },
  {
    id: "federation.gaia_endpoint.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.GAIA.ENDPOINT",
    prof: "PROF-GAIA",
    lane: "gaia_hello_attest",
    role: "Requires a direct GAIA endpoint or witnessed mapping before HELLO-ATTEST.",
    authority: "halt_gaia_until_endpoint_identity"
  },
  {
    id: "federation.falcon_identity.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY",
    prof: "PROF-FALCON",
    lane: "falcon_quarantine_lift",
    role: "Holds Falcon quarantine lift until role/serial contradiction is D50-corrected.",
    authority: "halt_falcon_until_role_serial_match"
  },
  {
    id: "federation.aether_live_nonce.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.AETHER.NONCE",
    prof: "PROF-AETHER",
    lane: "aether_live_nonce",
    role: "Stages nonce protocol but prevents live PID mint until issued nonce returns.",
    authority: "defer_aether_live_until_nonce_response"
  },
  {
    id: "federation.d50_council.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
    prof: "PROF-CHIEFCOUNCIL",
    lane: "d50_meta_ratification",
    role: "Requires one D50 artifact per peer and a parent quadrilateral transition artifact.",
    authority: "require_d50_before_bound_transition"
  },
  {
    id: "federation.kernel_grammar.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
    prof: "PROF-KERNEL",
    lane: "glyph_grammar",
    role: "Keeps rejoin, sim-ratify, and device glyphs distinct.",
    authority: "preserve_family_boundaries"
  },
  {
    id: "federation.asolaria_apex.supervisor",
    pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX",
    prof: "COL-ASOLARIA",
    lane: "apex_order",
    role: "Orders the wave but does not self-promote or perform direct peer actions.",
    authority: "plan_only_until_supervisor_gates_clear"
  }
];

function buildSupervisorSet() {
  return {
    supervisorSetId: "federation-reintegration-supervisors.v1",
    createdAt: generatedAt,
    status: "ACTIVE_LOCAL_PLANNING_GATES",
    authority: "Local ACER/Asolaria supervisor wave for federation reintegration. No exterior MCP. No model fanout.",
    policy: {
      mcp: "ASOLARIA-BEHCS256-MCP-ONLY-2026-04-26",
      noExteriorMcp: true,
      noModelFanout: true,
      noPeerEndpointActions: true,
      noDeviceWrites: true
    },
    supervisors
  };
}

function buildWave() {
  const prep = readJson("data/behcs/orchestration/federation-reintegration-20260427/acer-adb-map-readonly.v1.json", {});
  const wave20 = readJson("data/behcs/orchestration/federation-reintegration-20260427/wave20-readclass-probe.v1.json", {});
  const mcpPolicy = readJson("data/behcs/supervisors/mcp/asolaria-behcs256-mcp-supervisors.v1.json", {});
  const lanes = supervisors.map((supervisor) => {
    let verdict = "DEFER";
    let gate = "requires_supervisor_review";
    if (supervisor.prof === "PROF-MCP") {
      verdict = "BLOCK_EXTERIOR_ALLOW_LOCAL_ONLY";
      gate = "use_asolaria_behcs256_mcp_only";
    } else if (supervisor.prof === "PROF-GAIA") {
      verdict = "HALT";
      gate = "gaia_endpoint_identity_missing";
    } else if (supervisor.prof === "PROF-FALCON") {
      verdict = "HALT";
      gate = "falcon_role_serial_mismatch";
    } else if (supervisor.prof === "PROF-AETHER") {
      verdict = "DEFER";
      gate = "nonce_staged_not_issued";
    } else if (supervisor.prof === "PROF-SHANNON" || supervisor.prof === "PROF-HOOKWALL") {
      verdict = "BLOCK_PROMOTION";
      gate = "write_class_denied";
    } else if (supervisor.prof === "COL-ASOLARIA") {
      verdict = "APPROVE_PLAN_ONLY";
      gate = "no_direct_action";
    }
    return {
      prof: supervisor.prof,
      lane: supervisor.lane,
      supervisorPid: supervisor.pid,
      supervisorId: supervisor.id,
      verdict,
      gate,
      allowedNow: ["local_plan_artifact", "prereq_ledger_update", "d50_prep_artifact"],
      deniedNow: ["exterior_mcp", "model_fanout", "peer_endpoint_action", "adb_mutation", "device_write", "federation_promotion"]
    };
  });

  const wave = {
    schema: "federation-reintegration-local-supervisor-wave.v1",
    runId,
    generatedAt,
    status: "LOCAL_SUPERVISOR_WAVE_PLAN_ONLY",
    policy: {
      ownMcpOnly: true,
      mcpPolicyVersion: mcpPolicy.policyVersion || "ASOLARIA-BEHCS256-MCP-ONLY-2026-04-26",
      noExteriorMcp: true,
      noDirectPeerActions: true,
      noModelFanout: true,
      supervisorPidsForEverything: true
    },
    sources: {
      prep: "data/behcs/orchestration/federation-reintegration-20260427/acer-adb-map-readonly.v1.json",
      wave20: "data/behcs/orchestration/federation-reintegration-20260427/wave20-readclass-probe.v1.json",
      mcpPolicy: "data/behcs/supervisors/mcp/asolaria-behcs256-mcp-supervisors.v1.json"
    },
    currentTruth: {
      acerVisibleAdbDevices: prep.adb_devices?.map((device) => device.serial) || [],
      falconExpectedByPacket: wave20.falcon_gate?.expected_by_packet || "RQCX907KFTK",
      falconLocalCanon: wave20.falcon_gate?.local_canon_falcon || "R5CXA4MGQXV",
      falconExpectedSerialArchaeology: wave20.falcon_gate?.local_archaeology_for_expected_serial || "RQCX907KFTK appears as Rayssa/Liris phone",
      gaiaGate: wave20.gaia_gate?.verdict || "HALTED_PENDING_DIRECT_ENDPOINT_OR_WITNESS_MAPPING",
      aetherGate: wave20.aether_live_gate?.verdict || "NONCE_STAGED_NOT_ISSUED"
    },
    lanes,
    nextAllowedWave: {
      name: "Wave 21A - local D50 correction intake",
      trigger: "operator or Liris provides local artifact only; no direct endpoint call by Codex",
      requiredInputs: [
        "GAIA endpoint/witness mapping artifact",
        "Falcon role/serial correction artifact or separate Rayssa/Liris device-present artifact",
        "AETHER-LIVE nonce issue authorization after prior gates clear"
      ],
      executor: "supervisor wave runner, not direct Codex action"
    },
    boundary: "This wave mints local supervisors and plan packets only. It performs no exterior MCP call, no model call, no peer endpoint call, no ADB/device action, no promotion."
  };
  wave.waveHash = sha256(JSON.stringify(wave));
  return wave;
}

function buildMap(wave) {
  return {
    mapId: "federation-reintegration-local-supervisor-wave-map.v1",
    generatedAt,
    nodes: wave.lanes.map((lane) => ({
      id: lane.supervisorPid,
      label: lane.prof,
      kind: "supervisor_pid",
      lane: lane.lane,
      verdict: lane.verdict
    })),
    edges: wave.lanes.map((lane) => ({
      from: "federation_reintegration_wave",
      to: lane.supervisorPid,
      relation: "governed_by_prof_supervisor",
      gate: lane.gate
    })),
    boundary: wave.boundary
  };
}

function buildGlpj(wave) {
  return {
    glpjId: "federation-reintegration-local-supervisor-wave.glpj",
    generatedAt,
    family: "federation",
    glyphs: wave.lanes.map((lane, index) => ({
      token: `FED-WAVE21-${String(index + 1).padStart(2, "0")}`,
      prof: lane.prof,
      supervisorPid: lane.supervisorPid,
      verdict: lane.verdict,
      gate: lane.gate
    })),
    d11: "PROVEN_LOCAL_SUPERVISOR_PLAN_ONLY"
  };
}

function buildReport(wave) {
  const lines = [];
  lines.push("# Federation Reintegration Local Supervisor Wave");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${wave.status}`);
  lines.push(`Wave hash: ${wave.waveHash}`);
  lines.push("");
  lines.push("## Policy");
  lines.push("");
  lines.push("- Own MCP only: true");
  lines.push("- Exterior MCP: blocked");
  lines.push("- Model fanout: blocked");
  lines.push("- Direct peer endpoint actions: blocked");
  lines.push("- Device writes: blocked");
  lines.push("- Federation promotion: blocked");
  lines.push("");
  lines.push("## Supervisor Lanes");
  lines.push("");
  for (const lane of wave.lanes) {
    lines.push(`- ${lane.prof} -> ${lane.supervisorPid}: ${lane.verdict} (${lane.gate})`);
  }
  lines.push("");
  lines.push("## Next Allowed Wave");
  lines.push("");
  lines.push(`- ${wave.nextAllowedWave.name}`);
  lines.push(`- Trigger: ${wave.nextAllowedWave.trigger}`);
  for (const input of wave.nextAllowedWave.requiredInputs) lines.push(`- Required input: ${input}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(wave.boundary);
  return lines.join("\n");
}

function main() {
  const supervisorSet = buildSupervisorSet();
  const wave = buildWave();
  const map = buildMap(wave);
  const glpj = buildGlpj(wave);
  const memory = {
    memoryId: "federation-reintegration-local-supervisor-wave.v1",
    generatedAt,
    status: wave.status,
    significance: "Owner corrected the method: all federation reintegration work must run through local PROF/supervisor waves with PIDs and Asolaria-owned MCP, not exterior MCP or direct Codex action.",
    waveHash: wave.waveHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: wave.boundary
  };
  writeJson(OUTPUTS.supervisorSet, supervisorSet);
  writeJson(OUTPUTS.wave, wave);
  writeJson(OUTPUTS.reportJson, { ...wave, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, map);
  writeJson(OUTPUTS.glpj, glpj);
  writeText(OUTPUTS.report, buildReport(wave));
  console.log(JSON.stringify({
    ok: true,
    status: wave.status,
    waveHash: wave.waveHash,
    supervisorCount: supervisorSet.supervisors.length,
    report: repoRel(OUTPUTS.report),
    wave: repoRel(OUTPUTS.wave),
    boundary: wave.boundary
  }, null, 2));
}

main();
