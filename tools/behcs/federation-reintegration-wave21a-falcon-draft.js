#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21a-falcon-draft-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const SOURCES = Object.freeze({
  wave21: "data/behcs/orchestration/federation-reintegration-20260427/local-supervisor-wave21.v1.json",
  acerAdbMap: "data/behcs/orchestration/federation-reintegration-20260427/acer-adb-map-readonly.v1.json",
  wave20: "data/behcs/orchestration/federation-reintegration-20260427/wave20-readclass-probe.v1.json",
  fingerprintRecovery: "data/agent-index/FALCON-AETHER-FINGERPRINT-RECOVERY-2026-04-27.md",
  d50Wave20Prep: "data/agent-index/council/D50-FEDERATION-REINTEGRATION-WAVE20-PREP-2026-04-27.md",
  d11DriftAddendum: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT-2026-04-27.md",
  d11BaseExpected: "data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
  spawnPidRegistry: "data/spawn-pid-registry.json",
  lxUnifiedCatalog: "data/omni-processor/paper-draft/incoming/liris-canon-snapshot-2026-04-08/lx-unified-colony-catalog.json"
});

const OUTPUTS = Object.freeze({
  summary: path.join(runRoot, "wave21a-falcon-serial-correction-draft.v1.json"),
  draftEnvelope: path.join(runRoot, "wave21a-draft-only-acer-reply-envelope.v1.json"),
  d50Draft: path.join(repoRoot, "data", "agent-index", "council", "D50-FALCON-SERIAL-CORRECTION-DRAFT-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21a-falcon-draft-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21a-falcon-draft-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21a-falcon-draft.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21a-falcon-draft-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21a-falcon-draft.glpj.json")
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
  const full = path.join(repoRoot, relativePath);
  try {
    return fs.readFileSync(full, "utf8");
  } catch (error) {
    return null;
  }
}

function readJson(relativePath, fallback = null) {
  const text = readText(relativePath);
  if (text == null) return fallback;
  try {
    return JSON.parse(text);
  } catch (error) {
    return fallback;
  }
}

function sourceStatus(relativePath) {
  const text = readText(relativePath);
  if (text == null) return { path: relativePath, present: false, sha256: null };
  return { path: relativePath, present: true, sha256: sha256(text), bytes: Buffer.byteLength(text, "utf8") };
}

function textIncludes(relativePath, needle) {
  const text = readText(relativePath);
  return Boolean(text && text.includes(needle));
}

function buildEvidence() {
  const acerAdbMap = readJson(SOURCES.acerAdbMap, {});
  const wave20 = readJson(SOURCES.wave20, {});
  const wave21 = readJson(SOURCES.wave21, {});
  const registryText = readText(SOURCES.spawnPidRegistry) || "";
  const catalog = readJson(SOURCES.lxUnifiedCatalog, {});
  const catalogEntries = Array.isArray(catalog.entries) ? catalog.entries : [];
  const catalogSupervisorPidHits = catalogEntries.filter((entry) => /supervisor|pid|mcp|census/i.test(JSON.stringify(entry))).length;

  const falconAdb = Array.isArray(acerAdbMap.adb_devices)
    ? acerAdbMap.adb_devices.find((device) => device.serial === "R5CXA4MGQXV") || null
    : null;
  const aetherAdb = Array.isArray(acerAdbMap.adb_devices)
    ? acerAdbMap.adb_devices.find((device) => device.serial === "R9QY205KAKJ") || null
    : null;

  return {
    wave21Hash: wave21.waveHash || null,
    sourceStatus: Object.fromEntries(Object.entries(SOURCES).map(([key, value]) => [key, sourceStatus(value)])),
    serialEvidence: {
      falconCanonicalSerial: "R5CXA4MGQXV",
      packetExpectedSerial: "RQCX907KFTK",
      aetherLiveCandidateSerial: "R9QY205KAKJ",
      falconAdb,
      aetherAdb,
      wave20FalconGate: wave20.falcon_gate || null,
      localTextEvidence: [
        {
          source: SOURCES.fingerprintRecovery,
          claim: "Falcon local canon maps to R5CXA4MGQXV; RQCX907KFTK maps to Rayssa/Liris phone.",
          r5Present: textIncludes(SOURCES.fingerprintRecovery, "R5CXA4MGQXV"),
          rqcPresent: textIncludes(SOURCES.fingerprintRecovery, "RQCX907KFTK")
        },
        {
          source: SOURCES.d50Wave20Prep,
          claim: "D50 prep names FALCON-SERIAL-CORRECTION as the next valid artifact if Liris/operator corrects to R5CXA4MGQXV.",
          r5Present: textIncludes(SOURCES.d50Wave20Prep, "R5CXA4MGQXV"),
          rqcPresent: textIncludes(SOURCES.d50Wave20Prep, "RQCX907KFTK")
        },
        {
          source: "data/agent-index/tools/IX-332.md",
          claim: "Phone serial line maps R5CXA4MGQXV to Jesse and RQCX907KFTK to Rayssa.",
          r5Present: textIncludes("data/agent-index/tools/IX-332.md", "R5CXA4MGQXV"),
          rqcPresent: textIncludes("data/agent-index/tools/IX-332.md", "RQCX907KFTK")
        },
        {
          source: "data/agent-index/bridge/XREF-BRIDGE.json",
          claim: "Bridge xref separates Jesse phone R5CXA4MGQXV from Rayssa phone RQCX907KFTK.",
          r5Present: textIncludes("data/agent-index/bridge/XREF-BRIDGE.json", "R5CXA4MGQXV"),
          rqcPresent: textIncludes("data/agent-index/bridge/XREF-BRIDGE.json", "RQCX907KFTK")
        }
      ]
    },
    spawnPidRegistryAudit: {
      path: SOURCES.spawnPidRegistry,
      containsPhoneCanonicalSerialMap20260427: registryText.includes("phone-canonical-serial-map-2026-04-27"),
      containsFalconSerial: registryText.includes("R5CXA4MGQXV"),
      containsPacketExpectedSerial: registryText.includes("RQCX907KFTK"),
      note: "ACER local spawn-pid-registry does not currently contain the Liris-claimed phone-canonical-serial-map key or either serial string."
    },
    lxUnifiedCatalogAudit: {
      path: SOURCES.lxUnifiedCatalog,
      present: Boolean(catalog.generatedAt),
      generatedAt: catalog.generatedAt || null,
      currentLxCount: catalog.currentLxCount || null,
      supervisorPidRelatedHitCount: catalogSupervisorPidHits,
      status: catalogSupervisorPidHits > 0 ? "HAS_PID_OR_SUPERVISOR_RELATED_ENTRIES" : "NO_PID_OR_SUPERVISOR_RELATED_ENTRIES_IN_SNAPSHOT"
    }
  };
}

function buildDraftEnvelope(evidence) {
  return {
    envelopeClass: "DRAFT_ONLY_NOT_EMITTED",
    id: "federation-reintegration-20260427-wave21a-falcon-serial-correction-draft-001",
    from: "acer",
    to: "liris",
    verb: "DRAFT_D50_FALCON_SERIAL_CORRECTION_INTAKE",
    ts: generatedAt,
    schemaRule: "PROF-HERMES: capture emission timestamp at issuance; this draft timestamp is generation time only and must be regenerated if emitted.",
    noEmit: true,
    noEd25519: true,
    noEndpointAction: true,
    body: {
      status: "DRAFT_ONLY_AWAITING_LOCAL_WITNESS_ARTIFACT",
      proposedCorrection: {
        peer: "FALCON",
        incorrectPacketSerial: "RQCX907KFTK",
        correctedFalconSerial: "R5CXA4MGQXV",
        correctedFalconModel: evidence.serialEvidence.falconAdb?.ro_product_model || "SM-S721U1",
        correctedFalconFingerprint: evidence.serialEvidence.falconAdb?.ro_build_fingerprint || null,
        rayssaLirisSerial: "RQCX907KFTK"
      },
      evidenceSummary: [
        "ACER read-only ADB map records R5CXA4MGQXV as Falcon / Jesse S24 FE.",
        "Local archaeology records RQCX907KFTK as Rayssa/Liris phone.",
        "Wave 20 D50 prep requires a D50 serial-correction artifact before Falcon quarantine lift.",
        "ACER spawn-pid-registry lacks the claimed phone-canonical-serial-map-2026-04-27 key."
      ],
      ratificationStatus: "NOT_RATIFIED",
      blockedBy: [
        "PROF-CHIEFCOUNCIL dissent/refusal remains recorded",
        "Base D11 audit ledger expected by Liris wave is absent on ACER under data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
        "No local operator/Liris correction artifact has been ingested in this wave"
      ],
      allowedNext: [
        "ingest local operator/Liris artifact correcting Falcon serial to R5CXA4MGQXV",
        "attach or mirror the missing base D11 audit ledger if it exists on Liris",
        "rerun local supervisor wave for D50 council disposition"
      ],
      deniedNow: [
        "emit this envelope",
        "issue live nonce",
        "lift Falcon quarantine",
        "mint or promote live PID",
        "ADB/device action",
        "peer endpoint call",
        "exterior MCP",
        "model fanout"
      ]
    }
  };
}

function buildSummary(evidence, draftEnvelope) {
  const summary = {
    schema: "federation-reintegration-wave21a-falcon-draft.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    policy: {
      ownMcpOnly: true,
      noExteriorMcp: true,
      noDirectPeerActions: true,
      noModelFanout: true,
      noDeviceActions: true,
      noPromotion: true,
      supervisorPidsForEverything: true
    },
    lirisSupervisorWaveIntake: {
      convergence: "5_of_6_approve_read_or_draft",
      dissent: {
        prof: "PROF-CHIEFCOUNCIL",
        supervisorPidSuffix: "D50.COUNCIL.LIRIS",
        verdict: "REFUSED_TO_RENDER_VERDICT",
        effect: "blocks ratification; does not block local draft-only evidence intake"
      }
    },
    supervisors: [
      {
        prof: "PROF-MCP",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
        verdict: "LOCAL_ONLY"
      },
      {
        prof: "PROF-FALCON",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY",
        verdict: "APPROVE_DRAFT_ONLY"
      },
      {
        prof: "PROF-HERMES",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
        verdict: "APPROVE_SCHEMA_ONLY"
      },
      {
        prof: "PROF-KERNEL",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
        verdict: "APPROVE_READ_ONLY"
      },
      {
        prof: "PROF-CHIEFCOUNCIL",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
        verdict: "DISSENT_RECORDED_NO_RATIFICATION"
      }
    ],
    evidence,
    draftEnvelopePath: repoRel(OUTPUTS.draftEnvelope),
    d50DraftPath: repoRel(OUTPUTS.d50Draft),
    nextAllowedWave: {
      name: "Wave 21B - local D50 correction artifact intake",
      trigger: "local operator/Liris correction artifact or mirrored base D11 ledger only",
      requiredInputs: [
        "operator/Liris artifact explicitly correcting Falcon serial to R5CXA4MGQXV or proving RQCX907KFTK as separate device path",
        "base D11 audit ledger or explicit note that the timestamp-drift addendum is the only available D11 surface",
        "D50 council disposition after dissent"
      ]
    },
    boundary: "Draft-only local evidence intake. No emit, no endpoint contact, no ADB/device action, no ed25519 signature, no live PID mint, no quarantine lift, no federation promotion."
  };
  summary.summaryHash = sha256(JSON.stringify(summary));
  return summary;
}

function buildD50Draft(summary, draftEnvelope) {
  return [
    "# D50 Falcon Serial Correction Draft",
    "",
    `Generated: ${generatedAt}`,
    "Status: DRAFT_ONLY_NOT_RATIFIED",
    "Class: local evidence intake, no emit",
    "",
    "## Proposed Correction",
    "",
    "- Peer: FALCON",
    "- Packet expected serial: `RQCX907KFTK`",
    "- Proposed corrected Falcon serial: `R5CXA4MGQXV`",
    "- Proposed Rayssa/Liris serial: `RQCX907KFTK`",
    "",
    "## Evidence",
    "",
    "- `data/behcs/orchestration/federation-reintegration-20260427/acer-adb-map-readonly.v1.json` maps `R5CXA4MGQXV` to Falcon / Jesse S24 FE.",
    "- `data/agent-index/FALCON-AETHER-FINGERPRINT-RECOVERY-2026-04-27.md` records the serial contradiction and keeps quarantine lift blocked.",
    "- `data/agent-index/tools/IX-332.md` maps `R5CXA4MGQXV` to Jesse and `RQCX907KFTK` to Rayssa.",
    "- `data/agent-index/bridge/XREF-BRIDGE.json` separates Jesse phone from Rayssa phone.",
    "",
    "## Missing Evidence",
    "",
    "- `data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md` is absent on ACER.",
    "- `data/spawn-pid-registry.json` does not contain `phone-canonical-serial-map-2026-04-27` or either phone serial.",
    "",
    "## Council Dissent",
    "",
    "PROF-CHIEFCOUNCIL dissent/refusal is recorded as a ratification blocker. This draft cannot lift quarantine, mint a PID, or promote federation membership.",
    "",
    "## Draft Envelope",
    "",
    `- \`${repoRel(OUTPUTS.draftEnvelope)}\``,
    `- Envelope id: \`${draftEnvelope.id}\``,
    "",
    "## Boundary",
    "",
    summary.boundary
  ].join("\n");
}

function buildMap(summary) {
  return {
    mapId: "federation-reintegration-wave21a-falcon-draft-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21a", kind: "draft_wave", status: summary.status },
      { id: "FALCON", kind: "peer", proposedSerial: "R5CXA4MGQXV" },
      { id: "RQCX907KFTK", kind: "serial", proposedOwner: "Rayssa/Liris phone" },
      { id: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY", kind: "supervisor_pid", verdict: "APPROVE_DRAFT_ONLY" },
      { id: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL", kind: "supervisor_pid", verdict: "DISSENT_RECORDED_NO_RATIFICATION" }
    ],
    edges: [
      { from: "wave21a", to: "FALCON", relation: "drafts_serial_correction" },
      { from: "FALCON", to: "RQCX907KFTK", relation: "separates_from_packet_expected_serial" },
      { from: "wave21a", to: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY", relation: "governed_by" },
      { from: "wave21a", to: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL", relation: "blocked_by_dissent" }
    ],
    boundary: summary.boundary
  };
}

function buildGlpj(summary) {
  return {
    glpjId: "federation-reintegration-wave21a-falcon-draft.glpj",
    generatedAt,
    family: "federation",
    d11: "OBSERVED_DRAFT_ONLY",
    glyphs: [
      {
        token: "FED-WAVE21A-FALCON-DRAFT",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY",
        verdict: "APPROVE_DRAFT_ONLY"
      },
      {
        token: "FED-WAVE21A-D50-DISSENT",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
        verdict: "DISSENT_RECORDED_NO_RATIFICATION"
      }
    ],
    boundary: summary.boundary
  };
}

function buildReport(summary) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21A Falcon Draft");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Summary hash: ${summary.summaryHash}`);
  lines.push("");
  lines.push("## Supervisor Result");
  lines.push("");
  lines.push("- PROF-FALCON: approve draft-only serial correction path.");
  lines.push("- PROF-HERMES: draft schema only; timestamp must be captured at real issuance if ever emitted.");
  lines.push("- PROF-MCP: local Asolaria BEHCS-256 only.");
  lines.push("- PROF-CHIEFCOUNCIL: dissent/refusal recorded; ratification remains blocked.");
  lines.push("");
  lines.push("## Serial Chain");
  lines.push("");
  lines.push("- Proposed Falcon serial: `R5CXA4MGQXV`.");
  lines.push("- Packet expected serial: `RQCX907KFTK`.");
  lines.push("- Local archaeology maps `RQCX907KFTK` to Rayssa/Liris phone.");
  lines.push("- `spawn-pid-registry.json` lacks `phone-canonical-serial-map-2026-04-27` and both serial strings.");
  lines.push("");
  lines.push("## Outputs");
  lines.push("");
  lines.push(`- Summary: \`${repoRel(OUTPUTS.summary)}\``);
  lines.push(`- Draft envelope: \`${repoRel(OUTPUTS.draftEnvelope)}\``);
  lines.push(`- D50 draft: \`${repoRel(OUTPUTS.d50Draft)}\``);
  lines.push("");
  lines.push("## Next Allowed Wave");
  lines.push("");
  lines.push(`- ${summary.nextAllowedWave.name}`);
  for (const input of summary.nextAllowedWave.requiredInputs) lines.push(`- Required input: ${input}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(summary.boundary);
  return lines.join("\n");
}

function main() {
  const evidence = buildEvidence();
  const draftEnvelope = buildDraftEnvelope(evidence);
  const summary = buildSummary(evidence, draftEnvelope);
  const memory = {
    memoryId: "federation-reintegration-wave21a-falcon-draft.v1",
    generatedAt,
    status: summary.status,
    significance: "Local PROF/supervisor Wave 21A honored the FALCON draft-only path while preserving CHIEFCOUNCIL dissent as a ratification blocker.",
    summaryHash: summary.summaryHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: summary.boundary
  };

  writeJson(OUTPUTS.summary, summary);
  writeJson(OUTPUTS.draftEnvelope, draftEnvelope);
  writeText(OUTPUTS.d50Draft, buildD50Draft(summary, draftEnvelope));
  writeJson(OUTPUTS.reportJson, { ...summary, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(summary));
  writeJson(OUTPUTS.glpj, buildGlpj(summary));
  writeText(OUTPUTS.report, buildReport(summary));

  console.log(JSON.stringify({
    ok: true,
    status: summary.status,
    summaryHash: summary.summaryHash,
    draftEnvelope: repoRel(OUTPUTS.draftEnvelope),
    d50Draft: repoRel(OUTPUTS.d50Draft),
    report: repoRel(OUTPUTS.report),
    boundary: summary.boundary
  }, null, 2));
}

main();
