#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21c-liris-return-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21bInstruction: "data/behcs/orchestration/federation-reintegration-20260427/wave21b-liris-mirror-intake-instruction.v1.json",
  wave21bRequest: "data/agent-index/council/D50-FALCON-SERIAL-CORRECTION-LIRIS-MIRROR-REQUEST-2026-04-27.md",
  wave21aSummary: "data/behcs/orchestration/federation-reintegration-20260427/wave21a-falcon-serial-correction-draft.v1.json",
  acerD11DriftAddendum: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT-2026-04-27.md",
  acerBaseD11Expected: "data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  intake: path.join(runRoot, "wave21c-liris-return-intake.v1.json"),
  d50Intake: path.join(repoRoot, "data", "agent-index", "council", "D50-LIRIS-WAVE21B-RETURN-INTAKE-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21c-liris-return-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21c-liris-return-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21c-liris-return-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21c-liris-return-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21c-liris-return-intake.glpj.json")
});

const LIRIS_RETURN = Object.freeze({
  evidenceClass: "OPERATOR_RELAYED_LIRIS_WAVE21B_RETURN",
  status: "DRAFT_ONLY_NOT_RATIFIED",
  completedAtUtc: "2026-04-27T18:52:50Z",
  completedAtLocal: "2026-04-27T15:52:50-03:00",
  artifacts: [
    {
      id: "liris_falcon_mirror_draft",
      pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-FALCON-SERIAL-CORRECTION-LIRIS-MIRROR-2026-04-27.md",
      lines: 84,
      sha256: "a9233636fa7e19c82269566aaf834395634fe5a9b98191f3367d686eaa9e790c",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY.LIRIS",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    },
    {
      id: "liris_d11_base_disk_check",
      pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-BASE-LEDGER-DISK-CHECK-LIRIS-2026-04-27.md",
      lines: 74,
      sha256: "becb11e85266094c89d3593b3fb8c3b98e6962875473bf65566d7b05602478bc",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    }
  ],
  lirisD11: {
    baseLedger: {
      pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
      present: true,
      lines: 165,
      sha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635",
      acerContentMirrorStatus: "CONTENT_PENDING_ON_ACER"
    },
    falconCorrectionAddendum: {
      presentOnLiris: true,
      lines: 92
    },
    timestampDriftAddendum: {
      presentOnLiris: false,
      presentOnAcer: true,
      asymmetry: "BILATERAL_D11_MIRROR_REQUIRED"
    }
  },
  supervisorWave: {
    dispatched: 6,
    contentReturned: ["PROF-KERNEL", "PROF-FALCON", "PROF-HERMES"],
    declinedRoleplayFraming: ["PROF-MCP", "COL-ASOLARIA", "PROF-CHIEFCOUNCIL-clerk"],
    dissent: "CHIEFCOUNCIL Wave 21A dissent preserved unchanged",
    rejected: "CHIEFCOUNCIL re-dispatch remains rejected as ratification bypass"
  },
  maintainedBoundary: [
    "noEmit",
    "noEd25519",
    "noEndpointAction",
    "noPeerCall",
    "noADB",
    "noPidMint",
    "noQuarantineLift",
    "noExteriorMcp",
    "noModelFanout"
  ]
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

function buildIntake() {
  const wave21b = readJson(INPUTS.wave21bInstruction, {});
  const wave21a = readJson(INPUTS.wave21aSummary, {});
  const intake = {
    schema: "federation-reintegration-wave21c-liris-return-intake.v1",
    runId,
    generatedAt,
    status: "LIRIS_WAVE21B_RETURN_INTAKEN_DRAFT_ONLY",
    evidenceClass: LIRIS_RETURN.evidenceClass,
    policy: {
      ownMcpOnly: true,
      noExteriorMcp: true,
      noDirectPeerActions: true,
      noModelFanout: true,
      noDeviceActions: true,
      noWriteToLirisDiskFromAcer: true,
      noPromotion: true,
      noEmit: true,
      noEd25519: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21aHash: wave21a.summaryHash || null,
      wave21bInstructionHash: wave21b.instructionHash || null
    },
    lirisReturn: LIRIS_RETURN,
    acerLocalComparison: {
      baseD11OnAcer: sourceStatus(INPUTS.acerBaseD11Expected),
      timestampDriftAddendumOnAcer: sourceStatus(INPUTS.acerD11DriftAddendum),
      verdict: "BASE_D11_PRESENT_ON_LIRIS_CONTENT_PENDING_ON_ACER_TIMESTAMP_DRIFT_ADDENDUM_PRESENT_ON_ACER_ABSENT_ON_LIRIS"
    },
    supervisorPids: [
      {
        prof: "PROF-KERNEL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
        verdict: "ACCEPT_HASH_PRESENCE_PROOF_REQUIRE_CONTENT_MIRROR"
      },
      {
        prof: "PROF-FALCON",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY.LIRIS",
        verdict: "LIRIS_DRAFT_MIRROR_RECORDED_NOT_RATIFIED"
      },
      {
        prof: "PROF-HERMES",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
        verdict: "SCHEMA_AND_HASH_INTAKE_ONLY"
      },
      {
        prof: "PROF-CHIEFCOUNCIL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.LIRIS",
        verdict: "DISSENT_PRESERVED_RATIFICATION_BLOCKED"
      }
    ],
    nextAllowedWave: {
      name: "Wave 21D - bidirectional D11 mirror and quorum prep",
      gates: [
        "Mirror Liris base D11 ledger content or signed read-class packet to ACER.",
        "Mirror ACER timestamp-drift addendum to Liris or record why it remains ACER-only.",
        "Preserve CHIEFCOUNCIL dissent or receive explicit operator-direct override.",
        "Recruit multi-family cosigner quorum before any ratification.",
        "Run ed25519 ceremony only after quorum and mirror gates clear."
      ],
      stillDenied: [
        "quarantine_lift",
        "federation_promotion",
        "live_nonce_issue",
        "pid_mint",
        "adb_device_action",
        "peer_endpoint_call_by_acer",
        "exterior_mcp",
        "model_fanout"
      ]
    },
    boundary: "Local ACER intake of operator-relayed Liris Wave 21B results. Presence/hash evidence accepted; D11 content mirror remains pending. No endpoint call, no Liris disk write, no emit, no ed25519, no device action, no PID mint, no quarantine lift, no promotion."
  };
  intake.intakeHash = sha256(JSON.stringify(intake));
  return intake;
}

function buildD50Intake(intake) {
  return [
    "# D50 Liris Wave 21B Return Intake",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${intake.status}`,
    `Evidence class: ${intake.evidenceClass}`,
    "",
    "## Liris Draft Artifacts",
    "",
    "- Falcon mirror draft: `C:/Users/rayss/Asolaria/data/agent-index/council/D50-FALCON-SERIAL-CORRECTION-LIRIS-MIRROR-2026-04-27.md`",
    "  - lines: `84`",
    "  - sha256: `a9233636fa7e19c82269566aaf834395634fe5a9b98191f3367d686eaa9e790c`",
    "- D11 base disk check: `C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-BASE-LEDGER-DISK-CHECK-LIRIS-2026-04-27.md`",
    "  - lines: `74`",
    "  - sha256: `becb11e85266094c89d3593b3fb8c3b98e6962875473bf65566d7b05602478bc`",
    "",
    "## D11 State",
    "",
    "- Base D11 present on Liris: `C:/Users/rayss/Asolaria/data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md`",
    "  - lines: `165`",
    "  - sha256: `0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635`",
    "  - ACER status: content mirror pending",
    "- Falcon correction addendum present on Liris: `92` lines.",
    "- Timestamp-drift addendum present on ACER and absent on Liris: bilateral mirror required.",
    "",
    "## Supervisor Wave Honesty",
    "",
    "- Content returned: PROF-KERNEL, PROF-FALCON, PROF-HERMES.",
    "- Declined framing: PROF-MCP, COL-ASOLARIA, PROF-CHIEFCOUNCIL-clerk.",
    "- CHIEFCOUNCIL dissent preserved unchanged.",
    "",
    "## Boundary",
    "",
    intake.boundary
  ].join("\n");
}

function buildMap(intake) {
  return {
    mapId: "federation-reintegration-wave21c-liris-return-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21c", kind: "intake", status: intake.status },
      { id: "liris-base-d11", kind: "remote_evidence", sha256: LIRIS_RETURN.lirisD11.baseLedger.sha256, content: "pending_on_acer" },
      { id: "liris-falcon-mirror-draft", kind: "remote_draft", sha256: LIRIS_RETURN.artifacts[0].sha256 },
      { id: "acer-timestamp-drift-addendum", kind: "local_evidence", present: intake.acerLocalComparison.timestampDriftAddendumOnAcer.present },
      { id: "chiefcouncil-dissent", kind: "ratification_blocker" }
    ],
    edges: [
      { from: "wave21c", to: "liris-base-d11", relation: "accepts_hash_presence_requires_content_mirror" },
      { from: "wave21c", to: "liris-falcon-mirror-draft", relation: "records_draft_not_ratified" },
      { from: "wave21c", to: "acer-timestamp-drift-addendum", relation: "requires_bidirectional_mirror" },
      { from: "wave21c", to: "chiefcouncil-dissent", relation: "blocked_by" }
    ],
    boundary: intake.boundary
  };
}

function buildGlpj(intake) {
  return {
    glpjId: "federation-reintegration-wave21c-liris-return-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "OPERATOR_RELAYED_REMOTE_HASH_INTAKE",
    glyphs: intake.supervisorPids.map((row, index) => ({
      token: `FED-WAVE21C-${String(index + 1).padStart(2, "0")}`,
      prof: row.prof,
      supervisorPid: row.pid,
      lirisSupervisorPid: row.lirisPid,
      verdict: row.verdict
    })),
    boundary: intake.boundary
  };
}

function buildReport(intake) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21C Liris Return Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${intake.status}`);
  lines.push(`Intake hash: ${intake.intakeHash}`);
  lines.push("");
  lines.push("## Intake");
  lines.push("");
  lines.push("- Liris Falcon mirror draft recorded by path/hash/line count.");
  lines.push("- Liris D11 disk-check artifact recorded by path/hash/line count.");
  lines.push("- Base D11 is present on Liris, but ACER content mirror is still pending.");
  lines.push("- ACER timestamp-drift addendum is present locally and reported absent on Liris.");
  lines.push("");
  lines.push("## Supervisor State");
  lines.push("");
  for (const row of intake.supervisorPids) lines.push(`- ${row.prof} -> ${row.pid}: ${row.verdict}`);
  lines.push("");
  lines.push("## Next Allowed Wave");
  lines.push("");
  lines.push(`- ${intake.nextAllowedWave.name}`);
  for (const gate of intake.nextAllowedWave.gates) lines.push(`- Gate: ${gate}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(intake.boundary);
  return lines.join("\n");
}

function main() {
  const intake = buildIntake();
  const memory = {
    memoryId: "federation-reintegration-wave21c-liris-return-intake.v1",
    generatedAt,
    status: intake.status,
    significance: "ACER locally ingested operator-relayed Liris Wave 21B draft/hash results while preserving non-ratification and content-mirror gates.",
    intakeHash: intake.intakeHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: intake.boundary
  };

  writeJson(OUTPUTS.intake, intake);
  writeText(OUTPUTS.d50Intake, buildD50Intake(intake));
  writeJson(OUTPUTS.reportJson, { ...intake, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(intake));
  writeJson(OUTPUTS.glpj, buildGlpj(intake));
  writeText(OUTPUTS.report, buildReport(intake));

  console.log(JSON.stringify({
    ok: true,
    status: intake.status,
    intakeHash: intake.intakeHash,
    baseD11: intake.lirisReturn.lirisD11.baseLedger,
    report: repoRel(OUTPUTS.report),
    boundary: intake.boundary
  }, null, 2));
}

main();
