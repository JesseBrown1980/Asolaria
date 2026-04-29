#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21b-liris-mirror-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21aSummary: "data/behcs/orchestration/federation-reintegration-20260427/wave21a-falcon-serial-correction-draft.v1.json",
  wave21aDraftEnvelope: "data/behcs/orchestration/federation-reintegration-20260427/wave21a-draft-only-acer-reply-envelope.v1.json",
  wave21aReport: "reports/federation-reintegration-wave21a-falcon-draft-latest.md"
});

const OUTPUTS = Object.freeze({
  instruction: path.join(runRoot, "wave21b-liris-mirror-intake-instruction.v1.json"),
  requestDoc: path.join(repoRoot, "data", "agent-index", "council", "D50-FALCON-SERIAL-CORRECTION-LIRIS-MIRROR-REQUEST-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21b-liris-mirror-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21b-liris-mirror-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21b-liris-mirror-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21b-liris-mirror-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21b-liris-mirror-intake.glpj.json")
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

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  } catch (_error) {
    return null;
  }
}

function readJson(relativePath, fallback = null) {
  const text = readText(relativePath);
  if (text == null) return fallback;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return fallback;
  }
}

function sourceStatus(relativePath) {
  const text = readText(relativePath);
  if (text == null) return { path: relativePath, present: false, sha256: null };
  return { path: relativePath, present: true, sha256: sha256(text), bytes: Buffer.byteLength(text, "utf8") };
}

function buildInstruction() {
  const wave21a = readJson(INPUTS.wave21aSummary, {});
  const draft = readJson(INPUTS.wave21aDraftEnvelope, {});
  const instruction = {
    schema: "federation-reintegration-wave21b-liris-mirror-intake.v1",
    runId,
    generatedAt,
    status: "LOCAL_INSTRUCTION_ONLY_NOT_EMITTED",
    selectedPath: ["A_DRAFT_LIRIS_FALCON_MIRROR", "B_CHECK_LIRIS_BASE_D11"],
    rejectedPath: {
      option: "C_REDISPATCH_CHIEFCOUNCIL_TIEBREAK",
      reason: "CHIEFCOUNCIL dissent is preserved as a ratification blocker; redispatch may clarify next evidence but must not be used to bypass dissent."
    },
    policy: {
      ownMcpOnly: true,
      noExteriorMcp: true,
      noDirectPeerActions: true,
      noModelFanout: true,
      noDeviceActions: true,
      noWriteToLirisDiskFromAcer: true,
      noPromotion: true,
      noEmit: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    supervisorPids: [
      {
        prof: "PROF-MCP",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.LIRIS",
        verdict: "LOCAL_LIRIS_ONLY_NO_EXTERIOR_MCP"
      },
      {
        prof: "PROF-FALCON",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY.LIRIS",
        verdict: "DRAFT_LIRIS_MIRROR_ARTIFACT"
      },
      {
        prof: "PROF-KERNEL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
        verdict: "CHECK_BASE_D11_LEDGER_OR_RECORD_ABSENCE"
      },
      {
        prof: "PROF-HERMES",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
        verdict: "DRAFT_SCHEMA_ONLY_RECAPTURE_TIMESTAMP_IF_EMITTED"
      },
      {
        prof: "PROF-CHIEFCOUNCIL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.LIRIS",
        verdict: "DISSENT_PRESERVED_NO_RATIFICATION"
      },
      {
        prof: "COL-ASOLARIA",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX",
        verdict: "SELECT_A_PLUS_B_PLAN_ONLY"
      }
    ],
    lirisRequestedActions: [
      {
        id: "wave21b-a-falcon-mirror-draft",
        action: "Draft Liris-side Falcon serial correction mirror artifact.",
        targetPathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-FALCON-SERIAL-CORRECTION-LIRIS-MIRROR-2026-04-27.md",
        requiredFields: {
          status: "DRAFT_ONLY_NOT_RATIFIED",
          falconCanonicalSerial: "R5CXA4MGQXV",
          packetExpectedSerial: "RQCX907KFTK",
          rayssaLirisSerial: "RQCX907KFTK",
          supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY.LIRIS",
          acerDraftEnvelope: INPUTS.wave21aDraftEnvelope
        },
        denied: ["emit", "ed25519_sign", "quarantine_lift", "pid_mint", "device_action", "peer_endpoint_call"]
      },
      {
        id: "wave21b-b-d11-base-check",
        action: "Check Liris disk for base D11 audit ledger.",
        targetPathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
        ifPresent: "mirror as read-class evidence packet or provide sha/path/bytes only until transport is authorized",
        ifAbsent: "record that timestamp-drift addendum is the only D11 surface on Liris too",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
        denied: ["rewrite_d11", "remint", "retroactive_timestamp_change", "ratification"]
      }
    ],
    acerContext: {
      wave21aStatus: wave21a.status || null,
      wave21aHash: wave21a.summaryHash || null,
      draftEnvelopeId: draft.id || null,
      draftFlags: {
        noEmit: Boolean(draft.noEmit),
        noEd25519: Boolean(draft.noEd25519),
        noEndpointAction: Boolean(draft.noEndpointAction)
      }
    },
    nextAllowedReturn: {
      name: "Wave 21C - ACER local intake of Liris mirror evidence",
      acceptedInputs: [
        "Liris mirror artifact path/hash/content delivered by local file or operator paste",
        "base D11 ledger presence proof, read-class mirror, or explicit absence statement",
        "CHIEFCOUNCIL dissent disposition preserved or separately clarified"
      ],
      stillDenied: ["direct_liris_contact_by_acer", "device_action", "federation_promotion", "quarantine_lift", "live_nonce_issue"]
    },
    boundary: "Instruction-only local ACER artifact. It selects A+B for Liris-side draft/read-only work and rejects C as a ratification bypass. No endpoint call, no Liris disk write, no emit, no ed25519, no device action, no promotion."
  };
  instruction.instructionHash = sha256(JSON.stringify(instruction));
  return instruction;
}

function buildRequestDoc(instruction) {
  return [
    "# D50 Falcon Serial Correction Liris Mirror Request",
    "",
    `Generated: ${generatedAt}`,
    "Status: LOCAL_INSTRUCTION_ONLY_NOT_EMITTED",
    "",
    "## Selection",
    "",
    "Run `(a)` and `(b)` together on the Liris side:",
    "",
    "1. Draft the Liris mirror Falcon correction artifact.",
    "2. Check Liris disk for the missing base D11 audit ledger.",
    "",
    "Do not run `(c)` as a tie-break to bypass CHIEFCOUNCIL dissent. Dissent remains a ratification blocker.",
    "",
    "## Liris Target Artifact",
    "",
    "- `C:/Users/rayss/Asolaria/data/agent-index/council/D50-FALCON-SERIAL-CORRECTION-LIRIS-MIRROR-2026-04-27.md`",
    "- Supervisor PID: `BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY.LIRIS`",
    "- Status: `DRAFT_ONLY_NOT_RATIFIED`",
    "- Falcon serial: `R5CXA4MGQXV`",
    "- Packet expected serial: `RQCX907KFTK`",
    "- Rayssa/Liris serial: `RQCX907KFTK`",
    "",
    "## D11 Check",
    "",
    "- Check: `C:/Users/rayss/Asolaria/data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md`",
    "- If present: mirror as read-class evidence only, or report path/hash/bytes until transport is authorized.",
    "- If absent: record that the timestamp-drift addendum is the only D11 surface on Liris too.",
    "",
    "## Boundary",
    "",
    instruction.boundary
  ].join("\n");
}

function buildMap(instruction) {
  return {
    mapId: "federation-reintegration-wave21b-liris-mirror-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21b", kind: "instruction", status: instruction.status },
      { id: "option-a", kind: "selected_action", label: "draft Liris Falcon mirror" },
      { id: "option-b", kind: "selected_action", label: "check Liris base D11" },
      { id: "option-c", kind: "rejected_action", label: "redispatch CHIEFCOUNCIL tie-break" }
    ],
    edges: [
      { from: "wave21b", to: "option-a", relation: "selects" },
      { from: "wave21b", to: "option-b", relation: "selects" },
      { from: "wave21b", to: "option-c", relation: "rejects_as_ratification_bypass" }
    ],
    boundary: instruction.boundary
  };
}

function buildGlpj(instruction) {
  return {
    glpjId: "federation-reintegration-wave21b-liris-mirror-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "LOCAL_INSTRUCTION_ONLY",
    glyphs: instruction.supervisorPids.map((row, index) => ({
      token: `FED-WAVE21B-${String(index + 1).padStart(2, "0")}`,
      prof: row.prof,
      supervisorPid: row.pid,
      verdict: row.verdict
    })),
    boundary: instruction.boundary
  };
}

function buildReport(instruction) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21B Liris Mirror Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${instruction.status}`);
  lines.push(`Instruction hash: ${instruction.instructionHash}`);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push("- Select `(a)` draft the Liris mirror Falcon artifact.");
  lines.push("- Select `(b)` check Liris disk for the missing base D11 ledger.");
  lines.push("- Reject `(c)` as a ratification bypass; CHIEFCOUNCIL dissent remains preserved.");
  lines.push("");
  lines.push("## Supervisor PIDs");
  lines.push("");
  for (const row of instruction.supervisorPids) lines.push(`- ${row.prof} -> ${row.pid}: ${row.verdict}`);
  lines.push("");
  lines.push("## Next Return");
  lines.push("");
  lines.push(`- ${instruction.nextAllowedReturn.name}`);
  for (const input of instruction.nextAllowedReturn.acceptedInputs) lines.push(`- Accepted input: ${input}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(instruction.boundary);
  return lines.join("\n");
}

function main() {
  const instruction = buildInstruction();
  const memory = {
    memoryId: "federation-reintegration-wave21b-liris-mirror-intake.v1",
    generatedAt,
    status: instruction.status,
    significance: "ACER local supervisor artifact selected Liris options A+B and rejected CHIEFCOUNCIL tie-break as a ratification bypass.",
    instructionHash: instruction.instructionHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: instruction.boundary
  };

  writeJson(OUTPUTS.instruction, instruction);
  writeText(OUTPUTS.requestDoc, buildRequestDoc(instruction));
  writeJson(OUTPUTS.reportJson, { ...instruction, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(instruction));
  writeJson(OUTPUTS.glpj, buildGlpj(instruction));
  writeText(OUTPUTS.report, buildReport(instruction));

  console.log(JSON.stringify({
    ok: true,
    status: instruction.status,
    selectedPath: instruction.selectedPath,
    rejectedPath: instruction.rejectedPath.option,
    instructionHash: instruction.instructionHash,
    report: repoRel(OUTPUTS.report),
    boundary: instruction.boundary
  }, null, 2));
}

main();
