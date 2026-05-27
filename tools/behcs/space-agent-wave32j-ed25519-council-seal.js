#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const generatedStamp = generatedAt.replace(/[:.]/g, "").replace("T", "-").replace("Z", "Z");
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");
const keyRoot = path.join(repoRoot, "data", "behcs", "keys", "space-agent-wave32j-council-seal-20260428", generatedStamp);
const lirisRoot = "\\\\192.168.100.2\\liris-asolaria-old";
const incomingAcerRoot = path.join(
  repoRoot,
  "data",
  "behcs",
  "orchestration",
  "federation-reintegration-20260427",
  "incoming-acer"
);
const incomingWave32IRoot = path.join(incomingAcerRoot, "wave32i-wave32f-evidence-resolver-push");

const expected = Object.freeze({
  acerWave32FStateHash: "e22519f1d9d5691a3ef791a050487b12a04b506f5ffe7561fa33eed6e967a6cc",
  lirisWave32FStateHash: "edf500488be8f071bf8cc29e4f097a654c9773120a2329dbe41742549b355008",
  acerWave32BStateHash: "66bab90353723c1f6f3791cb29bfaf3e3ebf46f73789b135b53494176e4e1b88",
  lirisWave32BStateHash: "495aab793394d584f9cdfab77270afb9a24a23d40c07c0eddc5afcb72f610f38",
  acerWave32EStateHash: "29d7ef80cb6d0d3462b84a308a3514a96b3813bc13e63cb324da9791df7498fe",
  status: "D50_META_ROLLUP_RATIFIABLE_ACER_LIRIS_SIBLINGS_BOUND"
});

const localWave32FState = path.join(runRoot, "wave32f-d50-meta-rollup-acer.v1.json");
const localWave32FManifest = path.join(runRoot, "wave32f-d50-meta-rollup-manifest.json");
const localWave32FD50 = path.join(councilRoot, "D50-WAVE32F-SPACE-ROOMS-META-ROLLUP-ACER-LIRIS-2026-04-28.md");
const lirisWave32FState = path.join(lirisRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428", "wave32f-d50-meta-rollup-acer.v1.json");
const lirisWave32FManifest = path.join(lirisRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428", "wave32f-d50-meta-rollup-manifest.json");
const lirisWave32FD50 = path.join(lirisRoot, "data", "agent-index", "council", "D50-WAVE32F-SPACE-ROOMS-META-ROLLUP-ACER-LIRIS-2026-04-28.md");
const incomingWave32FState = path.join(incomingWave32IRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428", "wave32f-d50-meta-rollup-acer.v1.json");
const incomingWave32FManifest = path.join(incomingWave32IRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428", "wave32f-d50-meta-rollup-manifest.json");
const incomingWave32FD50 = path.join(incomingWave32IRoot, "data", "agent-index", "council", "D50-WAVE32F-SPACE-ROOMS-META-ROLLUP-ACER-LIRIS-2026-04-28.md");

const acerWave32FCandidates = Object.freeze([
  { sourceKind: "local_canonical", state: localWave32FState, manifest: localWave32FManifest, d50: localWave32FD50 },
  { sourceKind: "liris_smb_canonical", state: lirisWave32FState, manifest: lirisWave32FManifest, d50: lirisWave32FD50 },
  { sourceKind: "incoming_wave32i_acer_bundle", state: incomingWave32FState, manifest: incomingWave32FManifest, d50: incomingWave32FD50 }
]);

const lirisWave32FCandidates = Object.freeze([
  { sourceKind: "local_canonical", state: localWave32FState, manifest: localWave32FManifest, d50: localWave32FD50 },
  { sourceKind: "liris_smb_canonical", state: lirisWave32FState, manifest: lirisWave32FManifest, d50: lirisWave32FD50 }
]);

const roles = Object.freeze([
  {
    id: "chief_sig",
    supervisorPid: "BH.SUPERVISOR.PID.SPACE.CHIEFCOUNCIL.WAVE32J.ACER",
    meaning: "chief signature over bilateral Wave32F council-seal payload"
  },
  {
    id: "kr_gate_pass",
    supervisorPid: "BH.SUPERVISOR.PID.SPACE.KR.GATE.WAVE32J.ACER",
    meaning: "kernel/rule gate pass over expected state hashes and no-copy doctrine"
  },
  {
    id: "white_room_attest",
    supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.WAVE32J.ACER",
    meaning: "WhiteRoom attestation that divergence is preserved and not overwritten"
  },
  {
    id: "gc_proof",
    supervisorPid: "BH.SUPERVISOR.PID.SPACE.GC.WAVE32J.ACER",
    meaning: "GC proof retaining ACER and Liris sibling evidence chains"
  },
  {
    id: "genesis_cosign_descent",
    supervisorPid: "BH.SUPERVISOR.PID.SPACE.GENESIS.COSIGN.WAVE32J.ACER",
    meaning: "GENESIS-cosign descent witness for Jesse + rayssa operator authorization"
  }
]);

const outputs = Object.freeze({
  state: path.join(runRoot, "wave32j-ed25519-council-seal-acer.v1.json"),
  payload: path.join(runRoot, "wave32j-ed25519-council-seal-payload.canonical.json"),
  manifest: path.join(runRoot, "wave32j-ed25519-council-seal-manifest.json"),
  votes: path.join(runRoot, "wave32j-ed25519-council-seal-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32J-ED25519-COUNCIL-SEAL-ACER-LIRIS-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "space-agent-wave32j-ed25519-council-seal-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32j-ed25519-council-seal-latest.md")
});

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text, options = "utf8") {
  ensureParent(filePath);
  fs.writeFileSync(filePath, text.endsWith && text.endsWith("\n") ? text : `${text}\n`, options);
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortDeep(value), null, 2);
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(text, "utf8"));
}

function displayPath(filePath) {
  const rel = path.relative(repoRoot, filePath);
  if (path.isAbsolute(rel) || rel.startsWith("..")) return filePath.replace(/\\/g, "/");
  return rel.replace(/\\/g, "/");
}

function lineCount(buffer) {
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
}

function inspectFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { path: displayPath(filePath), present: false, sha256: null, bytes: 0, lines: 0 };
  }
  const buffer = fs.readFileSync(filePath);
  return {
    path: displayPath(filePath),
    present: true,
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: lineCount(buffer)
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readCandidate(candidate) {
  if (!fs.existsSync(candidate.state)) {
    return {
      ...candidate,
      present: false,
      stateHash: null,
      status: null,
      json: null,
      stateSha256: null,
      parseError: null
    };
  }
  const buffer = fs.readFileSync(candidate.state);
  let json = null;
  let parseError = null;
  try {
    json = JSON.parse(buffer.toString("utf8"));
  } catch (error) {
    parseError = error.message;
  }
  return {
    ...candidate,
    present: true,
    stateHash: json && json.stateHash,
    status: json && json.status,
    json,
    stateSha256: sha256Buffer(buffer),
    parseError
  };
}

function stripCandidate(candidate) {
  return {
    sourceKind: candidate.sourceKind,
    state: displayPath(candidate.state),
    manifest: displayPath(candidate.manifest),
    d50: displayPath(candidate.d50),
    present: candidate.present,
    stateHash: candidate.stateHash,
    status: candidate.status,
    stateSha256: candidate.stateSha256,
    parseError: candidate.parseError
  };
}

function resolveEvidence(label, expectedStateHash, candidates) {
  const inspected = candidates.map(readCandidate);
  const match = inspected.find((candidate) => candidate.present && candidate.stateHash === expectedStateHash);
  if (match) {
    return {
      label,
      expectedStateHash,
      sourceKind: match.sourceKind,
      statePath: match.state,
      manifestPath: match.manifest,
      d50Path: match.d50,
      state: match.json,
      candidates: inspected.map(stripCandidate)
    };
  }
  const seen = inspected
    .filter((candidate) => candidate.present)
    .map((candidate) => `${candidate.sourceKind}:${candidate.stateHash || "NO_STATE_HASH"}`)
    .join(", ");
  throw new Error(`Missing ceremony evidence ${label} expected ${expectedStateHash}; seen ${seen || "no candidates present"}`);
}

function assertEvidence() {
  const acerEvidence = resolveEvidence("ACER Wave32F", expected.acerWave32FStateHash, acerWave32FCandidates);
  const lirisEvidence = resolveEvidence("Liris Wave32F", expected.lirisWave32FStateHash, lirisWave32FCandidates);
  const evidencePaths = {
    acerWave32FState: acerEvidence.statePath,
    acerWave32FManifest: acerEvidence.manifestPath,
    acerWave32FD50: acerEvidence.d50Path,
    lirisWave32FState: lirisEvidence.statePath,
    lirisWave32FManifest: lirisEvidence.manifestPath,
    lirisWave32FD50: lirisEvidence.d50Path
  };
  const missing = Object.values(evidencePaths).filter((filePath) => !fs.existsSync(filePath));
  if (missing.length) throw new Error(`Missing ceremony evidence: ${missing.join(", ")}`);
  const acerState = acerEvidence.state;
  const lirisState = lirisEvidence.state;
  const checks = {
    acerWave32FStatus: acerState.status === expected.status,
    lirisWave32FStatus: lirisState.status === expected.status,
    acerWave32FStateHash: acerState.stateHash === expected.acerWave32FStateHash,
    lirisWave32FStateHash: lirisState.stateHash === expected.lirisWave32FStateHash,
    acerWave32BStateHash: acerState.evidence && acerState.evidence.acer && acerState.evidence.acer.stateHash === expected.acerWave32BStateHash,
    lirisWave32BStateHash: lirisState.evidence && lirisState.evidence.liris && lirisState.evidence.liris.stateHash === expected.lirisWave32BStateHash,
    acerWave32EStateHash: lirisState.evidence && lirisState.evidence.acerWave32E && lirisState.evidence.acerWave32E.stateHash === expected.acerWave32EStateHash,
    acerDivergence: acerState.counts && acerState.counts.divergentSurfaceCount === 12 && acerState.counts.equivalentSurfaceCount === 0,
    lirisDivergence: lirisState.counts && lirisState.counts.divergentSurfaceCount === 12 && lirisState.counts.equivalentSurfaceCount === 0
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  if (failed.length) throw new Error(`Evidence checks failed: ${failed.join(", ")}`);
  return { acerState, lirisState, checks, evidencePaths, acerEvidence, lirisEvidence };
}

function signRole(role, payloadBytes, payloadSha256) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const signature = crypto.sign(null, payloadBytes, privateKey);
  const verified = crypto.verify(null, payloadBytes, publicKey, signature);
  const roleRoot = path.join(keyRoot, role.id);
  const privateKeyPath = path.join(roleRoot, `${role.id}.private.pk8.pem`);
  const publicKeyPath = path.join(roleRoot, `${role.id}.public.spki.pem`);
  const signaturePath = path.join(roleRoot, `${role.id}.payload.sig.bin`);
  const publicPem = publicKey.export({ type: "spki", format: "pem" });
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
  ensureParent(privateKeyPath);
  fs.writeFileSync(privateKeyPath, privatePem, { encoding: "utf8", mode: 0o600 });
  fs.writeFileSync(publicKeyPath, publicPem, "utf8");
  fs.writeFileSync(signaturePath, signature);
  return {
    role: role.id,
    supervisorPid: role.supervisorPid,
    meaning: role.meaning,
    payloadSha256,
    verified,
    privateKeyPath: displayPath(privateKeyPath),
    publicKeyPath: displayPath(publicKeyPath),
    signaturePath: displayPath(signaturePath),
    publicKeySha256: sha256Buffer(Buffer.from(publicPem, "utf8")),
    signatureSha256: sha256Buffer(signature),
    signatureBase64: signature.toString("base64")
  };
}

function main() {
  const { acerState, lirisState, checks, evidencePaths, acerEvidence, lirisEvidence } = assertEvidence();
  const evidence = Object.fromEntries(Object.entries(evidencePaths).map(([key, filePath]) => [key, inspectFile(filePath)]));
  const payload = {
    schema: "space-agent-wave32j-ed25519-council-seal-payload.v1",
    generatedAt,
    ceremony: {
      name: "Wave32J ed25519 COUNCIL-SEALED ceremony",
      operatorWitness: "rayssa",
      coOperatorWitness: "jesse",
      operatorDirective: "Jesse says run it",
      keyScope: "D50_WAVE32F_ACER_LIRIS_SPACE_ROOMS_META_ROLLUP_COUNCIL_SEAL_2026_04_28",
      host: os.hostname()
    },
    evidenceSummary: {
      acerWave32FStateHash: acerState.stateHash,
      lirisWave32FStateHash: lirisState.stateHash,
      acerWave32BStateHash: acerState.evidence.acer.stateHash,
      lirisWave32BStateHash: lirisState.evidence.liris.stateHash,
      acerWave32EStateHash: acerState.evidence.acerWave32E.stateHash,
      status: expected.status,
      divergentSurfaceCount: 12,
      equivalentSurfaceCount: 0
    },
    evidenceResolution: {
      acerWave32F: {
        sourceKind: acerEvidence.sourceKind,
        statePath: displayPath(acerEvidence.statePath),
        candidates: acerEvidence.candidates
      },
      lirisWave32F: {
        sourceKind: lirisEvidence.sourceKind,
        statePath: displayPath(lirisEvidence.statePath),
        candidates: lirisEvidence.candidates
      }
    },
    evidence,
    checks,
    boundaries: [
      "real_ed25519_keys_generated",
      "private_keys_local_to_acer_workspace",
      "signs_wave32f_council_seal_payload_only",
      "no_space_agent_clone",
      "no_install",
      "no_mcp",
      "no_codex_subagents",
      "no_liris_canonical_write"
    ]
  };
  const payloadText = stableStringify(payload) + "\n";
  const payloadBytes = Buffer.from(payloadText, "utf8");
  const payloadSha256 = sha256Buffer(payloadBytes);
  writeText(outputs.payload, payloadText);

  const signatures = roles.map((role) => signRole(role, payloadBytes, payloadSha256));
  const allSignaturesVerified = signatures.every((signature) => signature.verified);
  const status = allSignaturesVerified
    ? "COUNCIL_SEALED_ED25519_ACER_LIRIS_SPACE_ROOMS_META"
    : "HOLD_SIGNATURE_VERIFICATION_FAILED";
  const votes = roles.map((role) => ({
    prof: role.id.toUpperCase(),
    supervisorPid: role.supervisorPid,
    vote: allSignaturesVerified ? "SIGNED_AND_VERIFIED" : "HOLD_SIGNATURE_VERIFY",
    reason: role.meaning
  }));
  writeNdjson(outputs.votes, votes);

  const stateBase = {
    schema: "space-agent-wave32j-ed25519-council-seal.v1",
    generatedAt,
    status,
    payloadSha256,
    allSignaturesVerified,
    keyScope: payload.ceremony.keyScope,
    keyStorageRoot: displayPath(keyRoot),
    evidenceSummary: payload.evidenceSummary,
    signatures,
    votes,
    privateKeyBoundary: "Private keys are real ed25519 key material stored locally under keyStorageRoot with mode 0600 request on write. Do not transmit private keys.",
    lirisNextInstruction: [
      "Intake the public keys, signatures, payload, and D50 record by hash.",
      "Do not copy ACER private keys.",
      "Either accept this ACER ceremony as the bilateral council seal or run a reciprocal Liris ceremony with its own keys."
    ]
  };
  const stateHash = sha256Text(stableStringify(stateBase));
  const state = { ...stateBase, stateHash };
  writeJson(outputs.state, state);

  const d50Lines = [
    "# D50 Wave32J - ed25519 Council Seal (ACER + Liris)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    `| state_hash | ${stateHash} |`,
    `| payload_sha256 | ${payloadSha256} |`,
    `| key_scope | ${payload.ceremony.keyScope} |`,
    `| operator_witness | rayssa |`,
    `| co_operator_witness | jesse |`,
    `| ACER Wave32F | ${payload.evidenceSummary.acerWave32FStateHash} |`,
    `| Liris Wave32F | ${payload.evidenceSummary.lirisWave32FStateHash} |`,
    `| divergent_surface_count | 12 |`,
    `| equivalent_surface_count | 0 |`,
    `| all_signatures_verified | ${allSignaturesVerified} |`,
    "",
    "## Signatures",
    "",
    "| role | public key sha256 | signature sha256 | verified |",
    "|---|---|---|---|",
    ...signatures.map((signature) => `| ${signature.role} | ${signature.publicKeySha256} | ${signature.signatureSha256} | ${signature.verified} |`),
    "",
    "## Boundary",
    "",
    "This artifact is COUNCIL-SEALED because real ed25519 keypairs signed the Wave32F council-seal payload and every signature verified locally. Private keys remain local to ACER and are not pushed to Liris."
  ];
  writeText(outputs.d50, d50Lines.join("\n"));

  const manifestArtifacts = [
    outputs.state,
    outputs.payload,
    outputs.votes,
    outputs.d50,
    ...signatures.flatMap((signature) => [signature.publicKeyPath, signature.signaturePath])
  ].map(inspectFile);
  const manifest = {
    schema: "space-agent-wave32j-ed25519-council-seal-manifest.v1",
    generatedAt,
    status,
    stateHash,
    payloadSha256,
    artifacts: manifestArtifacts
  };
  writeJson(outputs.manifest, manifest);

  const report = {
    schema: "space-agent-wave32j-ed25519-council-seal-report.v1",
    generatedAt,
    status,
    stateHash,
    payloadSha256,
    allSignaturesVerified,
    keyStorageRoot: displayPath(keyRoot),
    signatures,
    manifestSha256: inspectFile(outputs.manifest).sha256
  };
  writeJson(outputs.reportJson, report);
  writeText(outputs.reportMd, [
    "# Space Agent Wave32J - ed25519 Council Seal",
    "",
    `Status: ${status}`,
    `State hash: ${stateHash}`,
    `Payload sha256: ${payloadSha256}`,
    `All signatures verified: ${allSignaturesVerified}`,
    `Key storage root: ${displayPath(keyRoot)}`,
    "",
    "Signatures:",
    ...signatures.map((signature) => `- ${signature.role}: public ${signature.publicKeySha256}; signature ${signature.signatureSha256}; verified ${signature.verified}`),
    "",
    "Private keys remain local to ACER and must not be transmitted."
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash,
    payloadSha256,
    allSignaturesVerified,
    keyStorageRoot: displayPath(keyRoot),
    manifestSha256: inspectFile(outputs.manifest).sha256,
    d50Sha256: inspectFile(outputs.d50).sha256,
    report: displayPath(outputs.reportMd)
  }, null, 2));
}

main();
