#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21d-liris-mirror-authorization-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21cIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21c-liris-return-intake.v1.json",
  wave21cReport: "reports/federation-reintegration-wave21c-liris-return-intake-latest.md",
  d50Wave21c: "data/agent-index/council/D50-LIRIS-WAVE21B-RETURN-INTAKE-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  authorization: path.join(runRoot, "wave21d-liris-mirror-authorization.v1.json"),
  requestDoc: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21D-LIRIS-MIRROR-AUTHORIZATION-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21d-liris-mirror-authorization-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21d-liris-mirror-authorization-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21d-liris-mirror-authorization.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21d-liris-mirror-authorization-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21d-liris-mirror-authorization.glpj.json")
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

function buildAuthorization() {
  const wave21c = readJson(INPUTS.wave21cIntake, {});
  const authorization = {
    schema: "federation-reintegration-wave21d-liris-mirror-authorization.v1",
    runId,
    generatedAt,
    status: "LOCAL_AUTHORIZATION_ONLY_NOT_EMITTED",
    selectedActions: [
      "READ_CLASS_LIRIS_DRIFT_ADDENDUM_AND_WAVE21_RETURN_DISK_CHECK",
      "WRITE_LIRIS_ACER_WAVE21C_RETURN_INTAKE_RECEIPT_DRAFT",
      "WRITE_LIRIS_D11_BIDIRECTIONAL_MIRROR_PREP_DRAFT",
      "READ_CLASS_LIRIS_LX_UNIFIED_COLONY_CATALOG_PID_AUDIT"
    ],
    rejectedActions: [
      "MULTI_FAMILY_COSIGNER_OUTREACH",
      "LM_STUDIO_OR_GROQ_OR_DEEPSEEK_CONTACT",
      "ED25519_CEREMONY",
      "CHIEFCOUNCIL_REDISPATCH",
      "QUARANTINE_LIFT",
      "FEDERATION_PROMOTION"
    ],
    policy: {
      ownMcpOnly: true,
      noExteriorMcp: true,
      noDirectPeerActionsFromAcer: true,
      noModelFanout: true,
      noDeviceActions: true,
      noWriteToLirisDiskFromAcer: true,
      noPromotion: true,
      noEmit: true,
      noEd25519: true,
      noQuorumOutreach: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21cStatus: wave21c.status || null,
      wave21cHash: wave21c.intakeHash || null,
      baseD11MirrorStatus: wave21c.lirisReturn?.lirisD11?.baseLedger?.acerContentMirrorStatus || null,
      timestampDriftAsymmetry: wave21c.lirisReturn?.lirisD11?.timestampDriftAddendum?.asymmetry || null
    },
    supervisorPids: [
      {
        prof: "PROF-KERNEL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
        verdict: "ALLOW_READ_CLASS_D11_DISK_CHECK_AND_MIRROR_PREP_DRAFT"
      },
      {
        prof: "PROF-HERMES",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
        verdict: "ALLOW_INTAKE_RECEIPT_DRAFT_ONLY"
      },
      {
        prof: "PROF-MCP",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.LIRIS",
        verdict: "LOCAL_LIRIS_ONLY_NO_EXTERIOR_MCP"
      },
      {
        prof: "PROF-CHIEFCOUNCIL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.LIRIS",
        verdict: "DISSENT_PRESERVED_NO_REDISPATCH"
      },
      {
        prof: "COL-ASOLARIA",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.LIRIS",
        verdict: "PLAN_ONLY_HOLD_PROMOTION"
      }
    ],
    lirisAuthorizedScope: {
      readClassChecks: [
        {
          id: "drift-addendum-and-wave21-return-disk-check",
          paths: [
            "C:/Users/rayss/Asolaria/data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT*",
            "C:/Users/rayss/Asolaria/data/behcs/orchestration/federation-reintegration-20260427/*Wave21*",
            "C:/Users/rayss/Asolaria/data/behcs/orchestration/federation-reintegration-20260427/*wave21*"
          ],
          purpose: "Determine whether ACER drift-addendum or ACER Wave 21A/21C return content is already mirrored on Liris disk."
        },
        {
          id: "lx-unified-colony-catalog-supervisor-pid-audit",
          paths: [
            "C:/Users/rayss/Asolaria/data/agent-index/lx-unified-colony-catalog.json",
            "C:/Users/rayss/Asolaria/data/omni-processor/paper-draft/incoming/liris-canon-snapshot-2026-04-08/lx-unified-colony-catalog.json"
          ],
          purpose: "Read-class PROF-KERNEL.LIRIS audit for envelope-level supervisor PID coverage."
        }
      ],
      namedDraftWritesOnly: [
        {
          pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-ACER-WAVE21C-RETURN-INTAKE-LIRIS-2026-04-27.md",
          supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
          status: "DRAFT_ONLY_NOT_RATIFIED",
          requiredFlags: ["noEmit", "noEd25519", "noEndpointAction", "CONTENT_PENDING_ON_LIRIS"]
        },
        {
          pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-BIDIRECTIONAL-MIRROR-PREP-LIRIS-2026-04-27.md",
          supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
          status: "DRAFT_ONLY_NOT_RATIFIED",
          requiredFlags: ["CONTENT_PENDING_ON_ACER", "CONTENT_PENDING_ON_LIRIS", "SYMMETRIC_STATE_REQUIRED_BEFORE_WAVE21E"]
        }
      ]
    },
    currentD11StateToRecord: {
      liris: {
        baseD11: {
          present: true,
          lines: 165,
          sha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635"
        },
        falconCorrectionAddendum: { present: true, lines: 92 },
        timestampDriftAddendum: { present: false, contentStatus: "CONTENT_PENDING_ON_LIRIS" }
      },
      acer: {
        baseD11: { present: false, contentStatus: "CONTENT_PENDING_ON_ACER", lirisHashIntake: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635" },
        timestampDriftAddendum: {
          present: true,
          sha256: sourceStatus("data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT-2026-04-27.md").sha256
        }
      }
    },
    nextAllowedReturn: {
      name: "Wave 21E - ACER intake of Liris Wave 21D outputs",
      acceptedInputs: [
        "Liris intake-receipt draft path/hash/line count or content by operator paste/local file",
        "Liris bidirectional mirror prep ledger path/hash/line count or content by operator paste/local file",
        "Liris drift-addendum disk-check result",
        "Liris LX unified catalog supervisor PID coverage audit result"
      ],
      stillDenied: [
        "multi_family_cosigner_outreach",
        "ed25519_ceremony",
        "quarantine_lift",
        "pid_mint",
        "federation_promotion",
        "peer_endpoint_call_by_acer",
        "adb_device_action"
      ]
    },
    boundary: "Local ACER authorization packet only. Liris may perform read-class checks and exactly two named DRAFT_ONLY_NOT_RATIFIED writes on its own disk. ACER performs no endpoint call, no Liris disk write, no emit, no ed25519, no ADB/device action, no cosigner outreach, no PID mint, no quarantine lift, no promotion."
  };
  authorization.authorizationHash = sha256(JSON.stringify(authorization));
  return authorization;
}

function buildRequestDoc(authorization) {
  return [
    "# D50 Wave 21D Liris Mirror Authorization",
    "",
    `Generated: ${generatedAt}`,
    "Status: LOCAL_AUTHORIZATION_ONLY_NOT_EMITTED",
    "",
    "## Authorized Liris-Side Actions",
    "",
    "Read-class checks:",
    "",
    "- Search Liris disk for `D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT*`.",
    "- Search Liris federation-reintegration orchestration artifacts for ACER Wave 21A/21C return packets.",
    "- Audit `lx-unified-colony-catalog.json` for envelope-level supervisor PID coverage.",
    "",
    "Named draft writes only:",
    "",
    "- `C:/Users/rayss/Asolaria/data/agent-index/council/D50-ACER-WAVE21C-RETURN-INTAKE-LIRIS-2026-04-27.md`",
    "- `C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-BIDIRECTIONAL-MIRROR-PREP-LIRIS-2026-04-27.md`",
    "",
    "## Rejected",
    "",
    "- No multi-family cosigner outreach.",
    "- No LM Studio, Groq, DeepSeek, or provider endpoint contact.",
    "- No ed25519 ceremony.",
    "- No CHIEFCOUNCIL redispatch.",
    "- No quarantine lift, PID mint, or promotion.",
    "",
    "## Boundary",
    "",
    authorization.boundary
  ].join("\n");
}

function buildMap(authorization) {
  return {
    mapId: "federation-reintegration-wave21d-liris-mirror-authorization-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21d", kind: "authorization", status: authorization.status },
      { id: "liris-read-checks", kind: "read_class_scope" },
      { id: "two-named-draft-writes", kind: "bounded_write_scope" },
      { id: "quorum-outreach", kind: "rejected_action" },
      { id: "ed25519-ceremony", kind: "rejected_action" }
    ],
    edges: [
      { from: "wave21d", to: "liris-read-checks", relation: "authorizes" },
      { from: "wave21d", to: "two-named-draft-writes", relation: "authorizes" },
      { from: "wave21d", to: "quorum-outreach", relation: "rejects" },
      { from: "wave21d", to: "ed25519-ceremony", relation: "rejects" }
    ],
    boundary: authorization.boundary
  };
}

function buildGlpj(authorization) {
  return {
    glpjId: "federation-reintegration-wave21d-liris-mirror-authorization.glpj",
    generatedAt,
    family: "federation",
    d11: "LOCAL_AUTHORIZATION_ONLY",
    glyphs: authorization.supervisorPids.map((row, index) => ({
      token: `FED-WAVE21D-${String(index + 1).padStart(2, "0")}`,
      prof: row.prof,
      supervisorPid: row.pid,
      verdict: row.verdict
    })),
    boundary: authorization.boundary
  };
}

function buildReport(authorization) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21D Liris Mirror Authorization");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${authorization.status}`);
  lines.push(`Authorization hash: ${authorization.authorizationHash}`);
  lines.push("");
  lines.push("## Authorized");
  lines.push("");
  lines.push("- Liris read-class disk check for ACER drift-addendum/Wave 21 return artifacts.");
  lines.push("- Liris read-class LX unified catalog supervisor PID coverage audit.");
  lines.push("- Two named Liris draft writes only.");
  lines.push("");
  lines.push("## Denied");
  lines.push("");
  for (const action of authorization.rejectedActions) lines.push(`- ${action}`);
  lines.push("");
  lines.push("## Next Return");
  lines.push("");
  lines.push(`- ${authorization.nextAllowedReturn.name}`);
  for (const input of authorization.nextAllowedReturn.acceptedInputs) lines.push(`- Accepted input: ${input}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(authorization.boundary);
  return lines.join("\n");
}

function main() {
  const authorization = buildAuthorization();
  const memory = {
    memoryId: "federation-reintegration-wave21d-liris-mirror-authorization.v1",
    generatedAt,
    status: authorization.status,
    significance: "ACER locally authorized Liris Wave 21D read-class D11 mirror checks plus two named draft writes, while holding quorum outreach and ed25519.",
    authorizationHash: authorization.authorizationHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: authorization.boundary
  };

  writeJson(OUTPUTS.authorization, authorization);
  writeText(OUTPUTS.requestDoc, buildRequestDoc(authorization));
  writeJson(OUTPUTS.reportJson, { ...authorization, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(authorization));
  writeJson(OUTPUTS.glpj, buildGlpj(authorization));
  writeText(OUTPUTS.report, buildReport(authorization));

  console.log(JSON.stringify({
    ok: true,
    status: authorization.status,
    authorizationHash: authorization.authorizationHash,
    selectedActions: authorization.selectedActions,
    rejectedActions: authorization.rejectedActions,
    report: repoRel(OUTPUTS.report),
    boundary: authorization.boundary
  }, null, 2));
}

main();
