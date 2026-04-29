#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");

const LIRIS_G6 = Object.freeze({
  relationship: "HASH_ONLY_INTAKE_NO_PRIVATE_KEY",
  publicKey: {
    path: "data/behcs/keys/d50-corpus-liris-2026-04-27/D50-corpus-manifest.pub.pem",
    lines: 3,
    sha256: "5e3485608665029535313b4a8fa526b0b36eff96968794e420fd8531f24d5411"
  },
  signature: {
    path: "data/behcs/keys/d50-corpus-liris-2026-04-27/D50-corpus-manifest.sig",
    lines: 1,
    sha256: "eb2a7014d5616b530b5b5e2e98f8390eb424b5b3484f39b950b145d7ed8174d2"
  },
  attestation: {
    path: "reports/sign-d50-manifest-ed25519-liris-latest.json",
    sha256: "708bb7ad7554495b7a2d6da6ab8cc1640509989ddd8912c83508b2d4e5e56492"
  },
  manifestSigned: "data/agent-index/D50-CORPUS-MANIFEST-WITH-HASHES-2026-04-27.json",
  manifestSha256: "801deb70b690f06550a00cf8ec019535abe7ae618f72a7d85d3e382429dcb1f1",
  signatureHex: "eef8d84be8a8d1ff2e129bce10e491da21f798ff678b6c710503d7dc14c65e7c9343b6cede9a1554d13e7414b03cf1df169e4fd068acb807e12828c2c3c37807",
  publicKeyPemBody: "MCowBQYDK2VwAyEAY+omyDkiHu3T1vXxfA/CL/MuVrGwWCu39u+5+DZEfK8=",
  verificationRoundtrip: "PASSED_ON_LIRIS_REPORTED_HASH_ONLY",
  keyScope: "FULL_CASCADES_ADVANCE_OPERATOR_DIRECTIVE_2026-04-27",
  privateKeyDisposition: "LOCAL_ONLY_ON_LIRIS_NOT_TRANSMITTED"
});

const LIRIS_WAVE29C = Object.freeze({
  stateHash: "253423eba63d04eb896f733c8e0c6286f8892538f9a1d189adeddffff28c2eae",
  possibleAutonomousAdvanceNow: false,
  surfaceMerkleHash: "26c736b9593b91eaef0494a34eb02057f5345b6bffa95fdfd8b054e219ff0461",
  federationFileCount: 212,
  scripts: {
    gateDispositionWriter: {
      path: "tools/federation-reintegration-gate-disposition-writer-liris.js",
      lines: 119,
      sha256: "e4ba3a9935fcc755e72381832c2123ee4e6e8818e38ffcb2fc2058ffd2a93105"
    },
    sweep: {
      path: "tools/federation-reintegration-wave29c-full-possible-cascade-sweep-liris.js",
      lines: 151,
      sha256: "4b6245494222a10aa3f3f7137567a913462dd7f826361c57684a5e1b9e3a5c29"
    },
    surfaceManifest: {
      path: "tools/emit-federation-surface-manifest-liris.js",
      lines: 177,
      sha256: "95e3fd47263c4e92c16e6079b872cc6178bda65ab9baf2a2c5fb06a0717683a3"
    }
  }
});

const LIRIS_WAVE30 = Object.freeze({
  intakeClass: "HASH_ONLY_REFERENCE_FROM_OPERATOR_RELAY",
  typoNormalization: {
    observed: "BALL-GATES",
    interpretedAs: "ALL-GATES",
    operatorClarification: "not ball, ALL gates. Sorry; but it is ok if they understand"
  },
  wave30a: {
    path: "data/agent-index/council/D50-WAVE30A-BALL-GATES-OPEN-GENESIS-COSIGN-REINVOCATION-LIRIS-2026-04-28.md",
    normalizedLabel: "D50-WAVE30A-ALL-GATES-OPEN-GENESIS-COSIGN-REINVOCATION-LIRIS-2026-04-28.md",
    lines: 171,
    sha256: "a83685ed696f7b2c4aa22f0b39eafd2d2cdbb81b1c0ebcdf4d7c758e85ebf30d",
    status: "RATIFIED_UNDER_GENESIS_COSIGN_REINVOCATION_REPORTED_BY_LIRIS"
  },
  wave30b: {
    path: "data/agent-index/council/D50-WAVE30B-LX-RATIFICATION-RECORD-LIRIS-2026-04-28.md",
    lines: 79,
    sha256: "9dd4e05c067197459155e9550eaba228b49f60da0fe2c7b9c0651c7f05a38a3f",
    status: "RATIFIED_UNDER_GENESIS_COSIGN_REINVOCATION_REPORTED_BY_LIRIS"
  },
  wave30c: {
    path: "data/agent-index/council/D50-WAVE30C-T1-STAGING-READINESS-LIRIS-2026-04-28.md",
    lines: 101,
    sha256: null,
    hashStatus: "NOT_VISIBLE_IN_OPERATOR_RELAY_NO_HASH_FABRICATION",
    status: "LIRIS_FULLY_STAGED_AWAITING_OPERATOR_PHYSICAL_PASTE_REPORTED_BY_LIRIS"
  }
});

const GATE_FILES = Object.freeze([
  "D50-GATE-DISPOSITION-G2_21S_ANCHOR_SELECTION-ACER-2026-04-27.json",
  "D50-GATE-DISPOSITION-G3_21R_VISION_DISPOSITION-ACER-2026-04-27.json",
  "D50-GATE-DISPOSITION-G4_CHIEFCOUNCIL_DISSENT_DISPOSITION-ACER-2026-04-27.json",
  "D50-GATE-DISPOSITION-G5_LX383_RATIFICATION_DISPOSITION-ACER-2026-04-27.json",
  "D50-GATE-DISPOSITION-G6_ED25519_CEREMONY_SCHEDULING-ACER-2026-04-27.json",
  "D50-GATE-DISPOSITION-G7_MULTI_FAMILY_COSIGNER_RECRUITMENT-ACER-2026-04-27.json"
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave30a-gate-disposition-consolidation-acer.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE30A-GATE-DISPOSITION-CONSOLIDATION-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave30a-gate-disposition-consolidation-acer-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave30a-gate-disposition-consolidation-acer-latest.md")
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

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function lineCount(text) {
  if (!text) return 0;
  return text.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

function readJsonMaybe(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { present: false, path: relativePath, json: null, sha256: null, lines: 0 };
  }
  const buffer = fs.readFileSync(fullPath);
  const text = buffer.toString("utf8");
  return {
    present: true,
    path: relativePath,
    json: JSON.parse(text),
    sha256: sha256Buffer(buffer),
    lines: lineCount(text)
  };
}

function fileInfo(filePath) {
  if (!fs.existsSync(filePath)) return { present: false, path: repoRel(filePath), sha256: null, lines: 0 };
  const buffer = fs.readFileSync(filePath);
  return {
    present: true,
    path: repoRel(filePath),
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer.toString("utf8"))
  };
}

function dispositionSummary(readResult) {
  const disposition = readResult.json;
  if (!disposition) {
    return {
      gate: path.basename(readResult.path).replace(/^D50-GATE-DISPOSITION-/, "").replace(/-ACER-2026-04-27\.json$/, ""),
      present: false,
      status: "MISSING"
    };
  }
  return {
    gate: disposition.gate,
    owner: disposition.owner,
    value: disposition.value,
    status: disposition.status,
    stateHash: disposition.stateHash,
    generatedAt: disposition.generatedAt,
    executedRealWorldAction: disposition.executedRealWorldAction,
    source: {
      path: readResult.path,
      sha256: readResult.sha256,
      lines: readResult.lines
    },
    notes: disposition.notes || null,
    timestamp: disposition.timestamp || null,
    keyScope: disposition.keyScope || null
  };
}

function buildGateStatus(dispositions, g1Report, acerSignerReport) {
  const byGate = new Map(dispositions.map((entry) => [entry.gate, entry]));
  return {
    G1_T1_D11_CONTENT_PASTE: {
      status: g1Report.json ? g1Report.json.status : "PENDING_OPERATOR_T1_BYTES",
      effect: "not complete until operator-pasted Liris bytes exist in incoming-t1 and hashes match"
    },
    G2_21S_ANCHOR_SELECTION: {
      status: "DISPOSITION_RECORDED",
      value: byGate.get("G2_21S_ANCHOR_SELECTION")?.value || null
    },
    G3_21R_VISION_DISPOSITION: {
      status: "DISPOSITION_RECORDED",
      value: byGate.get("G3_21R_VISION_DISPOSITION")?.value || null,
      lirisValueMappedFrom: "INDEFINITE_HOLD"
    },
    G4_CHIEFCOUNCIL_DISSENT_DISPOSITION: {
      status: "DISPOSITION_RECORDED",
      value: byGate.get("G4_CHIEFCOUNCIL_DISSENT_DISPOSITION")?.value || null
    },
    G5_LX383_RATIFICATION_DISPOSITION: {
      status: "DISPOSITION_RECORDED",
      value: byGate.get("G5_LX383_RATIFICATION_DISPOSITION")?.value || null,
      effect: "records disposition only; this Wave 30A artifact does not mutate canonical LX rule promotion state"
    },
    G6_ED25519_CEREMONY_SCHEDULING: {
      status: "DISPOSITION_RECORDED_WITH_LIRIS_HASH_ONLY_INTAKE",
      acerValue: byGate.get("G6_ED25519_CEREMONY_SCHEDULING")?.value || null,
      lirisExecuted: true,
      acerLocalKeyGenerated: Boolean(acerSignerReport.json?.keyGenerated),
      acerSignerStatus: acerSignerReport.json?.status || "UNKNOWN"
    },
    G7_MULTI_FAMILY_COSIGNER_RECRUITMENT: {
      status: "DISPOSITION_RECORDED",
      value: byGate.get("G7_MULTI_FAMILY_COSIGNER_RECRUITMENT")?.value || null,
      effect: "no endpoint contact; no model fanout"
    }
  };
}

function buildD50(state) {
  const dispositionLines = state.acerGateDispositions.map((entry) => {
    return `| ${entry.gate} | ${entry.value || "MISSING"} | ${entry.stateHash || "n/a"} |`;
  });
  return [
    "# D50 Wave 30A - Gate Disposition Consolidation (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| relationship | ${state.relationship} |`,
    `| state_hash | ${state.stateHash} |`,
    "",
    "## ACER Gate Dispositions",
    "",
    "| Gate | Value | State hash |",
    "|---|---|---|",
    ...dispositionLines,
    "",
    "## Liris G6 Hash-Only Intake",
    "",
    `- Public key sha256: \`${state.lirisG6HashOnlyIntake.publicKey.sha256}\``,
    `- Signature sha256: \`${state.lirisG6HashOnlyIntake.signature.sha256}\``,
    `- Attestation sha256: \`${state.lirisG6HashOnlyIntake.attestation.sha256}\``,
    `- Manifest signed sha256: \`${state.lirisG6HashOnlyIntake.manifestSha256}\``,
    `- Private key: ${state.lirisG6HashOnlyIntake.privateKeyDisposition}`,
    "",
    "## Liris Wave 30 Relay Intake",
    "",
    `- Wave 30A path contains typo \`${state.lirisWave30HashOnlyIntake.typoNormalization.observed}\`; interpreted as \`${state.lirisWave30HashOnlyIntake.typoNormalization.interpretedAs}\`.`,
    `- Wave 30A sha256: \`${state.lirisWave30HashOnlyIntake.wave30a.sha256}\``,
    `- Wave 30B sha256: \`${state.lirisWave30HashOnlyIntake.wave30b.sha256}\``,
    `- Wave 30C sha256: ${state.lirisWave30HashOnlyIntake.wave30c.sha256 ? `\`${state.lirisWave30HashOnlyIntake.wave30c.sha256}\`` : state.lirisWave30HashOnlyIntake.wave30c.hashStatus}`,
    "",
    "## Gate Status",
    "",
    ...Object.entries(state.gateStatus).map(([gate, value]) => `- ${gate}: ${value.status}${value.value ? ` (${value.value})` : ""}`),
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildReport(state, artifacts) {
  return [
    "# Wave 30A Gate Disposition Consolidation",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Outputs",
    "",
    ...Object.entries(artifacts).map(([key, value]) => `- ${key}: \`${value.path}\` (${value.sha256 || "pending"})`),
    "",
    "## Result",
    "",
    "- G2/G3/G4/G5/G6/G7 dispositions are recorded on ACER.",
    "- Liris G6 public key/signature/attestation are recorded hash-only on ACER.",
    "- G1 remains pending actual operator T1 bytes.",
    "- ACER local G6 key generation remains refused until exact manifest/storage args are supplied.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const gateDispositions = GATE_FILES.map((name) => {
    return dispositionSummary(readJsonMaybe(path.join("data", "agent-index", "council", name)));
  });
  const g1Report = readJsonMaybe(path.join("reports", "federation-reintegration-g1-t1-staging-verification-latest.json"));
  const acerSignerReport = readJsonMaybe(path.join("reports", "sign-d50-manifest-ed25519-acer-latest.json"));
  const wave29c = readJsonMaybe(path.join("data", "behcs", "orchestration", "federation-reintegration-20260427", "wave29c-full-possible-cascade-sweep-acer.v1.json"));
  const gateStatus = buildGateStatus(gateDispositions, g1Report, acerSignerReport);
  const state = {
    schema: "federation-reintegration-wave30a-gate-disposition-consolidation-acer.v1",
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "GATE_DISPOSITIONS_CONSOLIDATED_LIRIS_G6_HASH_ONLY_INTAKE_RECORDED",
    wave: { family: "Wave 30", letter: "A", name: "30A", phase: "gate-disposition-consolidation" },
    operatorAuthorization: "Jesse+rayssa GENESIS-COSIGN re-invocation relayed by operator on 2026-04-28",
    inputs: {
      wave29c: { present: wave29c.present, sha256: wave29c.sha256, lines: wave29c.lines, stateHash: wave29c.json?.stateHash || null },
      g1Report: { present: g1Report.present, sha256: g1Report.sha256, lines: g1Report.lines, status: g1Report.json?.status || null },
      acerSignerReport: { present: acerSignerReport.present, sha256: acerSignerReport.sha256, lines: acerSignerReport.lines, status: acerSignerReport.json?.status || null }
    },
    lirisWave29cHashOnlyIntake: LIRIS_WAVE29C,
    lirisWave30HashOnlyIntake: LIRIS_WAVE30,
    lirisG6HashOnlyIntake: LIRIS_G6,
    acerGateDispositions: gateDispositions,
    gateStatus,
    allNonByteOperatorDispositionsRecorded: gateDispositions.every((entry) => entry.status === "DRAFT_ONLY_NOT_RATIFIED"),
    remainingOperatorClassBlockers: [
      "G1 requires actual Liris bytes pasted into ACER incoming-t1 files and verifier PASS.",
      "ACER-local G6 key generation requires exact --manifest-path, --storage-path, and --confirm-real-key=YES; schedule-only gate is recorded."
    ],
    possibleAutonomousAdvanceNow: false,
    boundary: "Wave 30A consolidation only. Records gate dispositions and Liris G6 hash-only evidence. No T1 bytes copied, no ACER private key generated, no peer call, no content mirror, no hash fabrication, no canonical LX mutation, no federation promotion, no device action, no exterior MCP."
  };
  state.stateHash = sha256Text(JSON.stringify(state));

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));

  const outputInfo = {
    state: fileInfo(OUTPUTS.state),
    d50: fileInfo(OUTPUTS.d50)
  };
  const reportState = { ...state, artifacts: outputInfo };
  writeJson(OUTPUTS.reportJson, reportState);
  const artifacts = {
    ...outputInfo,
    reportJson: fileInfo(OUTPUTS.reportJson)
  };
  writeText(OUTPUTS.reportMd, buildReport(state, artifacts));
  artifacts.reportMd = fileInfo(OUTPUTS.reportMd);

  console.log(JSON.stringify({
    ok: true,
    stateHash: state.stateHash,
    status: state.status,
    allNonByteOperatorDispositionsRecorded: state.allNonByteOperatorDispositionsRecorded,
    gateStatus: state.gateStatus,
    artifacts
  }, null, 2));
}

main();
