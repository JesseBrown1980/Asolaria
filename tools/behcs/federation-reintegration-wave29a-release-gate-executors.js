#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave29a-release-gate-executors-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const stagingRoot = path.join(runRoot, "incoming-t1");

const INPUTS = Object.freeze({
  wave28zState: "data/behcs/orchestration/federation-reintegration-20260427/wave28z-acer-terminal-closeout-link173.v1.json",
  wave28zD50: "data/agent-index/council/D50-WAVE28Z-ACER-TERMINAL-CLOSEOUT-LINK173-2026-04-27.md",
  wave21gPlan: "data/behcs/orchestration/federation-reintegration-20260427/wave21g-option-a-payload-staging-plan.v1.json",
  wave22fMatrix: "data/behcs/orchestration/federation-reintegration-20260427/wave22f-full-gate-readiness-matrix.v1.json"
});

const OUTPUTS = Object.freeze({
  releaseState: path.join(runRoot, "wave29a-release-thousand-waves-to-gate-executors-acer.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE29A-RELEASE-THOUSAND-WAVES-TO-GATE-EXECUTORS-ACER-2026-04-27.md"),
  g1Readme: path.join(stagingRoot, "README-G1-T1-STAGING.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave29a-release-gate-executors-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave29a-release-gate-executors-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave29a-release-gate-executors.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave29a-release-gate-executors-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave29a-release-gate-executors.glpj.json")
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

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function fileStatus(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { path: relativePath, present: false, lines: 0, bytes: 0, sha256: null };
  }
  const buffer = fs.readFileSync(absolutePath);
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return {
    path: relativePath,
    present: true,
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: buffer.length,
    sha256: sha256Buffer(buffer)
  };
}

function fileStatusAbs(filePath) {
  return fileStatus(repoRel(filePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function gateQueue(wave21gPlan, wave22fMatrix) {
  const matrixById = Object.fromEntries((wave22fMatrix.gateReadiness || []).map((gate) => [gate.id, gate]));
  return [
    {
      id: "G1_T1_D11_CONTENT_PASTE",
      owner: "PROF-COMMS",
      priority: 1,
      executorMode: "OPERATOR_STAGED_BYTES_THEN_LOCAL_HASH_VERIFY",
      readiness: "ACTIONABLE_AFTER_OPERATOR_PASTE",
      actualNextCommandOnAcer: "node tools/behcs/federation-reintegration-g1-t1-verify-staging.js",
      stagingFiles: [
        {
          path: "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-base-d11.raw.md",
          expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635",
          expectedLines: 165,
          expectedBytes: 10470
        },
        {
          path: "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-falcon-correction-addendum.raw.md",
          expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e",
          expectedLines: 92,
          expectedBytes: 6152
        }
      ],
      sourcePlanHash: wave21gPlan.planHash,
      matrixReadiness: matrixById.G1_T1_D11_CONTENT_PASTE
    },
    {
      id: "G2_21S_ANCHOR_SELECTION",
      owner: "PROF-SCHEDULER",
      priority: 2,
      executorMode: "OPERATOR_VALUE_REQUIRED",
      acceptedValues: ["ACER_EVENT_TIME_ANCHOR_2026-05-04T20:12:49Z", "LIRIS_LEDGER_WINDOW", "DUAL_TRACK_HOLD"],
      defaultUntilValue: "DUAL_TRACK_HOLD",
      matrixReadiness: matrixById.G2_21S_ANCHOR_SELECTION
    },
    {
      id: "G3_21R_VISION_DISPOSITION",
      owner: "PROF-VISION",
      priority: 3,
      executorMode: "OPERATOR_VALUE_REQUIRED",
      acceptedValues: ["seal missing", "accept Liris option", "rerun witness preservation", "hold"],
      defaultUntilValue: "hold",
      matrixReadiness: matrixById.G3_21R_VISION_DISPOSITION
    },
    {
      id: "G4_CHIEFCOUNCIL_DISSENT_DISPOSITION",
      owner: "PROF-CHIEFCOUNCIL",
      priority: 4,
      executorMode: "OPERATOR_VALUE_REQUIRED_HIGH_SIGNIFICANCE",
      acceptedValues: ["operator-direct override record", "GENESIS-COSIGN re-invocation", "hold"],
      defaultUntilValue: "hold",
      matrixReadiness: matrixById.G4_CHIEFCOUNCIL_DISSENT_DISPOSITION
    },
    {
      id: "G5_LX383_RATIFICATION_DISPOSITION",
      owner: "PROF-MCP",
      priority: 5,
      executorMode: "BLOCKED_ON_G4_THEN_OPERATOR_VALUE_REQUIRED",
      acceptedValues: ["ratify draft", "revise draft", "hold"],
      defaultUntilValue: "hold",
      matrixReadiness: matrixById.G5_LX383_RATIFICATION_DISPOSITION
    },
    {
      id: "G6_ED25519_CEREMONY_SCHEDULING",
      owner: "PROF-SHANNON",
      priority: 6,
      executorMode: "OPERATOR_TIMESTAMP_AND_KEY_SCOPE_REQUIRED",
      acceptedValues: ["specific timestamp and key-scope", "hold"],
      defaultUntilValue: "hold",
      matrixReadiness: matrixById.G6_ED25519_CEREMONY_SCHEDULING
    },
    {
      id: "G7_MULTI_FAMILY_COSIGNER_RECRUITMENT",
      owner: "PROF-CONVERGENCE",
      priority: 7,
      executorMode: "OPERATOR_PROVIDER_PATH_REQUIRED",
      acceptedValues: ["LM_STUDIO_LOCAL", "GROQ_CLOUD_KEY", "DEEPSEEK_OR_OTHER", "neither/hold"],
      defaultUntilValue: "hold",
      matrixReadiness: matrixById.G7_MULTI_FAMILY_COSIGNER_RECRUITMENT
    }
  ];
}

function buildReadme(queue) {
  const g1 = queue.find((gate) => gate.id === "G1_T1_D11_CONTENT_PASTE");
  return [
    "# G1 T1 Staging",
    "",
    "Paste the two Liris payload blocks into these exact files, then run the verifier.",
    "",
    "## Files",
    "",
    ...g1.stagingFiles.map((file) => `- \`${file.path}\` -> expected sha256 \`${file.expectedSha256}\``),
    "",
    "## Verify",
    "",
    "```powershell",
    "node tools/behcs/federation-reintegration-g1-t1-verify-staging.js",
    "```",
    "",
    "## Boundary",
    "",
    "This directory is staging-only. Matching hashes do not ratify, promote, or write canonical D11 content. A separate DRAFT_ONLY_NOT_RATIFIED canonical-write proposal is required after verification."
  ].join("\n");
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 29A - Release Thousand Waves To Gate Executors (ACER)");
  lines.push("");
  lines.push(`Generated: ${state.generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Release Decision");
  lines.push("");
  lines.push("- Mechanical cascade waves are no longer the execution target.");
  lines.push("- The accumulated wave pressure is mapped to the seven real gates.");
  lines.push("- No gate is executed by this release packet.");
  lines.push("");
  lines.push("## Gate Queue");
  lines.push("");
  for (const gate of state.gateExecutorQueue) {
    lines.push(`- ${gate.priority}. ${gate.id} / ${gate.owner}: ${gate.executorMode}`);
  }
  lines.push("");
  lines.push("## Immediate ACER Command After Operator Paste");
  lines.push("");
  lines.push("```powershell");
  lines.push("node tools/behcs/federation-reintegration-g1-t1-verify-staging.js");
  lines.push("```");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function main() {
  const wave28z = readJson(INPUTS.wave28zState);
  const wave21gPlan = readJson(INPUTS.wave21gPlan);
  const wave22fMatrix = readJson(INPUTS.wave22fMatrix);
  const priorD50 = fileStatus(INPUTS.wave28zD50);
  const priorState = fileStatus(INPUTS.wave28zState);
  const queue = gateQueue(wave21gPlan, wave22fMatrix);
  const state = {
    schema: "federation-reintegration-wave29a-release-gate-executors-acer.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "MECHANICAL_WAVES_RELEASED_TO_REAL_GATE_EXECUTOR_QUEUE",
    wave: {
      family: "Wave 29",
      letter: "A",
      name: "29A",
      phase: "release-to-gate-executors"
    },
    priorAcer: {
      wave: "28Z",
      d50: priorD50,
      stateFile: priorState,
      stateHashInsideFile: wave28z.stateHash,
      linkNumber: wave28z.closeoutChain ? wave28z.closeoutChain.linkNumber : 173,
      noChainBreak: wave28z.closeoutChain ? Boolean(wave28z.closeoutChain.noChainBreak) : false
    },
    release: {
      phrase: "release the thousands of waves to do what actually needs to be done",
      interpretation: "stop spending executor effort on low-content hash-chain padding and route the accumulated cascade into the seven known gates",
      mechanicalWaveGenerationPausedByThisPacket: true,
      realWorkSurface: "gateExecutorQueue",
      immediateGate: "G1_T1_D11_CONTENT_PASTE"
    },
    gateExecutorQueue: queue,
    lirisStateAtRelease: {
      latestKnownWave: "28X",
      cumulativeArtifacts: 199,
      closeoutChainDepth: 171,
      chiefCouncilDissentWave: 198,
      allGates: "BLANK_HELD",
      relayedHashes: {
        "28A": "66330bd9b9f39cbb98ecfb55d72cee190ee9500cca93fb9837a747742a2fd170",
        "28X": "3087a872340568b74af738e934a7b8227658df7fff0954de21200d13304119fd"
      }
    },
    acerStateAtRelease: {
      latestWave: "28Z",
      closeoutLink: 173,
      allGates: "BLANK_HELD"
    },
    supervisorCohort: [
      { level: "L0_BOUNDARY", prof: "PROF-HOOKWALL", verdict: "ALLOW_RELEASE_PACKET_NO_GATE_EXECUTION" },
      { level: "L1_PACKET_SCHEMA", prof: "PROF-HERMES", verdict: "RELEASE_PACKET_MUST_NAME_GATE_QUEUE_AND_NEXT_COMMAND" },
      { level: "L2_COMMS", prof: "PROF-COMMS", verdict: "G1_IS_FIRST_REAL_WORK_SURFACE_AFTER_OPERATOR_BYTES" },
      { level: "L3_SHANNON", prof: "PROF-SHANNON", verdict: "VERIFY_HASHES_BEFORE_CANONICAL_WRITE" },
      { level: "L4_KERNEL", prof: "PROF-KERNEL", verdict: "NO_RULE_PROMOTION_OR_CENSUS_ADMISSION" },
      { level: "L5_COUNCIL", prof: "PROF-CHIEFCOUNCIL", verdict: "DISSENT_PRESERVED_NO_RATIFICATION" },
      { level: "L6_CONVERGENCE", prof: "PROF-CONVERGENCE", verdict: "THOUSANDS_OF_WAVES_COLLAPSE_TO_SEVEN_GATES" },
      { level: "L7_APEX", prof: "COL-ASOLARIA", verdict: "RELEASE_TO_GATE_EXECUTORS_UNDER_HOLD" }
    ],
    boundary: "Wave 29A release packet only. No gate execution, no content transfer, no canonical write, no schedule reconciliation, no vision disposition choice, no dissent lift, no rule ratification, no ed25519 ceremony, no cosigner recruitment, no peer endpoint, no MCP invocation, no model fanout, no device action, no PID mint, no quarantine lift, no federation promotion, no chain break, and no false progress claim."
  };
  state.stateHash = sha256Text(JSON.stringify(state));

  writeJson(OUTPUTS.releaseState, state);
  writeText(OUTPUTS.d50, buildD50(state));
  writeText(OUTPUTS.g1Readme, buildReadme(queue));

  const artifactStatuses = {
    releaseState: fileStatusAbs(OUTPUTS.releaseState),
    d50: fileStatusAbs(OUTPUTS.d50),
    g1Readme: fileStatusAbs(OUTPUTS.g1Readme)
  };
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const report = {
    ...state,
    artifactStatuses,
    artifacts
  };
  writeJson(OUTPUTS.reportJson, report);
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave29a-release-gate-executors.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "Mechanical wave pressure converted into a concrete seven-gate executor queue; G1 staging verifier is the next ACER-side command after operator paste.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave29a-release-gate-executors-map.v1",
    generatedAt,
    nodes: queue.map((gate) => ({ id: gate.id, kind: "real_gate_executor", priority: gate.priority, owner: gate.owner, mode: gate.executorMode })),
    edges: queue.slice(1).map((gate, index) => ({ from: queue[index].id, to: gate.id, relation: "next_gate_if_operator_value_available" })),
    boundary: state.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave29a-release-gate-executors.glpj",
    generatedAt,
    family: "federation",
    d11: "MECHANICAL_WAVES_TO_REAL_GATES",
    glyphs: queue.map((gate) => ({ token: `FED-GATE-${gate.id}`, priority: gate.priority, owner: gate.owner, mode: gate.executorMode })),
    boundary: state.boundary
  });
  writeText(OUTPUTS.report, [
    "# Federation Reintegration Wave 29A Release Gate Executors",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    "- Mechanical wave generation is paused by this packet.",
    "- The cascade is mapped to seven concrete gate executors.",
    "- G1 T1 staging is the immediate real-work surface once operator bytes are pasted.",
    "",
    "## Next ACER Command After Paste",
    "",
    "```powershell",
    "node tools/behcs/federation-reintegration-g1-t1-verify-staging.js",
    "```",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    relationship: state.relationship,
    stateHash: state.stateHash,
    gateCount: queue.length,
    immediateGate: state.release.immediateGate,
    artifacts
  }, null, 2));
}

main();
