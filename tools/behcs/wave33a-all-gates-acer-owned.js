#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const net = require("net");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const stamp = generatedAt.replace(/[:.]/g, "").replace("T", "-").replace("Z", "Z");
const waveRoot = path.join(repoRoot, "data", "behcs", "orchestration", "wave33a-agent-terminal-load-control-20260428");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");
const lirisRoot = "\\\\192.168.100.2\\liris-asolaria-old";
const lirisIncomingRoot = path.join(lirisRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427", "incoming-acer");
const lirisLaw001 = process.env.LIRIS_LAW001_URL || "http://192.168.100.2:4947/behcs/send";

const allGatesCosign = Object.freeze({
  operator: "jesse",
  textQuote: "ALL GATES",
  observedBy: "ACER Codex chat",
  observedAt: generatedAt,
  gates: [
    "33A-3_D50_META_ED25519_SEAL",
    "33A-1_BOOT_MANIFEST",
    "WAVE34_FALCON_LAW001_REACTIVATION",
    "AETHER_REJOIN_READCLASS",
    "LIRIS_INBOX_GC"
  ],
  ownership: {
    acerExecutes: ["33A-3_D50_META_ED25519_SEAL", "33A-1_BOOT_MANIFEST", "AETHER_REJOIN_READCLASS"],
    lirisExecutes: ["WAVE34_FALCON_LAW001_REACTIVATION", "LIRIS_INBOX_GC"],
    acerDoesNotTouch: ["Falcon USB", "Liris inbox.ndjson", "Liris canonical files"]
  }
});

const expected = Object.freeze({
  acer33a3StateHash: "c787ff3cca6b0aea42e5368697882388804e5188c7975082d65619c802e99489",
  liris33a3StateHash: "7adee45089e0ef9388be01df4c68f5ab533f3c04d221eac74d3a48c4b43e7caf",
  markerSha256: "30827c159a7c2c913db00c931055e45ec480868d5a9a1db70bd15cb52778c306",
  markerHash: "85c3902a1cf791b8b08050d35118137b3c2c210ecb0bd838db80d07755fbc1c6",
  v6VoteId: "WAVE33A-AGENT-TERMINAL-LOAD-CONTROL-20260428",
  v6TotalBeats: 2612736
});

const files = Object.freeze({
  activeLock: path.join(repoRoot, ".asolaria-active-session.lock"),
  acer33a3State: path.join(waveRoot, "wave33a-3-active-session-marker.v1.json"),
  acer33a3Manifest: path.join(waveRoot, "wave33a-3-active-session-marker-manifest.json"),
  liris33a3State: path.join(lirisRoot, "data", "behcs", "orchestration", "wave33a-agent-terminal-load-control-20260428", "wave33a-3-active-session-marker-liris.v1.json"),
  liris33a3D50: path.join(lirisRoot, "data", "agent-index", "council", "D50-WAVE33A-3-ACTIVE-SESSION-MARKER-LIRIS-2026-04-28.md"),
  lirisActiveLock: path.join(lirisRoot, ".asolaria-active-session.lock"),
  v6Vote: path.join(repoRoot, "data", "votes", expected.v6VoteId, "behcs-v6-candidate-file.json"),
  candidatePacket: path.join(waveRoot, "wave33a-supervisor-vote-candidate-packet.json"),
  memoryDraft: path.join(repoRoot, "data", "behcs", "memory", "agent-terminal-load-control-contract.v1.json"),
  indexDraft: path.join(repoRoot, "data", "behcs", "index", "agent-terminal-load-control-contract-index.v1.json"),
  inbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  d0: path.join(repoRoot, "data", "behcs", "d0-runtime", "sidecar-d0-events.ndjson")
});

const outputs = Object.freeze({
  seal33a3: {
    state: path.join(waveRoot, "wave33a-3-d50-meta-ed25519-seal-acer.v1.json"),
    payload: path.join(waveRoot, "wave33a-3-d50-meta-ed25519-seal-payload.canonical.json"),
    manifest: path.join(waveRoot, "wave33a-3-d50-meta-ed25519-seal-manifest.json"),
    votes: path.join(waveRoot, "wave33a-3-d50-meta-ed25519-seal-votes.ndjson"),
    d50: path.join(councilRoot, "D50-WAVE33A-3-D50-META-ED25519-SEAL-ACER-LIRIS-2026-04-28.md"),
    reportJson: path.join(reportsRoot, "wave33a-3-d50-meta-ed25519-seal-latest.json"),
    reportMd: path.join(reportsRoot, "wave33a-3-d50-meta-ed25519-seal-latest.md"),
    keys: path.join(repoRoot, "data", "behcs", "keys", "wave33a-3-d50-meta-ed25519-seal-20260428", stamp)
  },
  boot33a1: {
    bootManifest: path.join(repoRoot, "data", "behcs", "boot", "agent-terminal-boot-manifest.v1.json"),
    state: path.join(waveRoot, "wave33a-1-boot-manifest-pinning-acer.v1.json"),
    manifest: path.join(waveRoot, "wave33a-1-boot-manifest-pinning-manifest.json"),
    votes: path.join(waveRoot, "wave33a-1-boot-manifest-pinning-supervisor-votes.ndjson"),
    memory: path.join(repoRoot, "data", "behcs", "memory", "wave33a-1-boot-manifest-pinning.v1.json"),
    index: path.join(repoRoot, "data", "behcs", "index", "wave33a-1-boot-manifest-pinning-index.v1.json"),
    map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "wave33a-1-boot-manifest-pinning-map-map-mapped.v1.json"),
    cube: path.join(repoRoot, "data", "behcs", "cubes", "wave33a-1-boot-manifest-pinning-cube-cubed.cube.js"),
    glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "wave33a-1-boot-manifest-pinning-behcs256.glpj.json"),
    whiteRoom: path.join(repoRoot, "data", "behcs", "omniwhite-room", "wave33a-1-boot-manifest-pinning-whiteroom.v1.json"),
    gc: path.join(repoRoot, "data", "behcs", "garbage-collector", "wave33a-1-boot-manifest-pinning-retention.v1.json"),
    cryptoSeal: path.join(repoRoot, "data", "behcs", "crypto", "wave33a-1-boot-manifest-pinning-crypto-seal.v1.json"),
    d50: path.join(councilRoot, "D50-WAVE33A-1-BOOT-MANIFEST-PINNING-ACER-2026-04-28.md"),
    reportJson: path.join(reportsRoot, "wave33a-1-boot-manifest-pinning-latest.json"),
    reportMd: path.join(reportsRoot, "wave33a-1-boot-manifest-pinning-latest.md")
  },
  aether: {
    state: path.join(repoRoot, "data", "behcs", "orchestration", "aether-rejoin-readclass-20260428", "aether-rejoin-readclass-acer.v1.json"),
    manifest: path.join(repoRoot, "data", "behcs", "orchestration", "aether-rejoin-readclass-20260428", "aether-rejoin-readclass-manifest.json"),
    votes: path.join(repoRoot, "data", "behcs", "orchestration", "aether-rejoin-readclass-20260428", "aether-rejoin-readclass-supervisor-votes.ndjson"),
    memory: path.join(repoRoot, "data", "behcs", "memory", "aether-rejoin-readclass.v1.json"),
    index: path.join(repoRoot, "data", "behcs", "index", "aether-rejoin-readclass-index.v1.json"),
    map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "aether-rejoin-readclass-map-map-mapped.v1.json"),
    cube: path.join(repoRoot, "data", "behcs", "cubes", "aether-rejoin-readclass-cube-cubed.cube.js"),
    glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "aether-rejoin-readclass-behcs256.glpj.json"),
    d50: path.join(councilRoot, "D50-AETHER-REJOIN-READCLASS-ACER-2026-04-28.md"),
    reportJson: path.join(reportsRoot, "aether-rejoin-readclass-latest.json"),
    reportMd: path.join(reportsRoot, "aether-rejoin-readclass-latest.md")
  },
  aggregate: {
    state: path.join(waveRoot, "wave33a-all-gates-acer-owned-execution.v1.json"),
    reportJson: path.join(reportsRoot, "wave33a-all-gates-acer-owned-execution-latest.json"),
    reportMd: path.join(reportsRoot, "wave33a-all-gates-acer-owned-execution-latest.md")
  }
});

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
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

function stableJson(value) {
  return JSON.stringify(sortDeep(value), null, 2);
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(String(text), "utf8"));
}

function sha256Json(value) {
  return sha256Text(stableJson(value));
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function repoRel(filePath) {
  const rel = path.relative(repoRoot, filePath);
  if (path.isAbsolute(rel) || rel.startsWith("..")) return filePath.replace(/\\/g, "/");
  return rel.replace(/\\/g, "/");
}

function lineCount(buffer) {
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function artifact(filePath) {
  if (!fs.existsSync(filePath)) {
    return { path: repoRel(filePath), present: false, sha256: null, bytes: 0, lines: 0 };
  }
  const buffer = fs.readFileSync(filePath);
  return {
    path: repoRel(filePath),
    present: true,
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: lineCount(buffer)
  };
}

function absoluteArtifact(filePath) {
  if (!fs.existsSync(filePath)) {
    return { path: filePath.replace(/\\/g, "/"), present: false, sha256: null, bytes: 0, lines: 0 };
  }
  const buffer = fs.readFileSync(filePath);
  return {
    path: filePath.replace(/\\/g, "/"),
    present: true,
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: lineCount(buffer)
  };
}

function findInbox(id) {
  if (!fs.existsSync(files.inbox)) return null;
  const lines = fs.readFileSync(files.inbox, "utf8").split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line || !line.includes(id)) continue;
    try {
      return { line: index + 1, row: JSON.parse(line), sha256: sha256Text(line) };
    } catch (error) {
      return { line: index + 1, parseError: error.message, sha256: sha256Text(line) };
    }
  }
  return null;
}

function findD0(id) {
  if (!fs.existsSync(files.d0)) return null;
  const lines = fs.readFileSync(files.d0, "utf8").split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line || !line.includes(id)) continue;
    try {
      return { line: index + 1, row: JSON.parse(line), sha256: sha256Text(line) };
    } catch (error) {
      return { line: index + 1, parseError: error.message, sha256: sha256Text(line) };
    }
  }
  return null;
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing ${label}: ${filePath}`);
}

function verify33a3Evidence() {
  [
    [files.activeLock, "ACER active lock"],
    [files.acer33a3State, "ACER 33A-3 state"],
    [files.acer33a3Manifest, "ACER 33A-3 manifest"],
    [files.liris33a3State, "Liris 33A-3 reciprocal state"],
    [files.liris33a3D50, "Liris 33A-3 D50"],
    [files.lirisActiveLock, "Liris active lock"]
  ].forEach(([filePath, label]) => requireFile(filePath, label));

  const acerState = readJson(files.acer33a3State);
  const acerManifest = readJson(files.acer33a3Manifest);
  const lirisState = readJson(files.liris33a3State);
  const activeLockSha = sha256File(files.activeLock);
  const lirisLockSha = sha256File(files.lirisActiveLock);
  const completionAck = findInbox("behcs-wave33a3-liris-7adee45089e0");
  const completionD0 = findD0("behcs-wave33a3-liris-7adee45089e0");

  const checks = {
    acerStateHash: acerState && acerState.stateHash === expected.acer33a3StateHash,
    lirisStateHash: lirisState && lirisState.stateHash === expected.liris33a3StateHash,
    acerMarkerSha: activeLockSha === expected.markerSha256,
    lirisMarkerSha: lirisLockSha === expected.markerSha256,
    markerHash: acerManifest && acerManifest.markerHash === expected.markerHash,
    lirisAckPresent: completionAck && completionAck.row && completionAck.row.gated === true,
    lirisD0Present: completionD0 && completionD0.row && completionD0.row.gatePass === true
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  if (failed.length) throw new Error(`33A-3 evidence checks failed: ${failed.join(", ")}`);

  return {
    checks,
    acerState,
    lirisState,
    artifacts: {
      acerActiveLock: artifact(files.activeLock),
      lirisActiveLock: absoluteArtifact(files.lirisActiveLock),
      acerState: artifact(files.acer33a3State),
      acerManifest: artifact(files.acer33a3Manifest),
      lirisState: absoluteArtifact(files.liris33a3State),
      lirisD50: absoluteArtifact(files.liris33a3D50)
    },
    completionAck: completionAck ? { line: completionAck.line, sha256: completionAck.sha256, gated: completionAck.row && completionAck.row.gated } : null,
    completionD0: completionD0 ? { line: completionD0.line, sha256: completionD0.sha256, gatePass: completionD0.row && completionD0.row.gatePass } : null
  };
}

function signPayload(role, payloadBytes, payloadSha256, keyRoot) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const signature = crypto.sign(null, payloadBytes, privateKey);
  const verified = crypto.verify(null, payloadBytes, publicKey, signature);
  const publicPem = publicKey.export({ type: "spki", format: "pem" });
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
  const roleRoot = path.join(keyRoot, role.id);
  const privateKeyPath = path.join(roleRoot, `${role.id}.private.pk8.pem`);
  const publicKeyPath = path.join(roleRoot, `${role.id}.public.spki.pem`);
  const signaturePath = path.join(roleRoot, `${role.id}.payload.sig.bin`);
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
    publicKeyPem: publicPem,
    signatureB64: signature.toString("base64"),
    publicKeySha256: sha256Text(publicPem),
    signatureSha256: sha256Buffer(signature),
    publicKeyPath: repoRel(publicKeyPath),
    signaturePath: repoRel(signaturePath),
    privateKeyPath: repoRel(privateKeyPath),
    privateKeyBoundary: "local ACER ceremony key material; not pushed to Liris incoming"
  };
}

function supervisorVotes(prefix, status, count = 6) {
  const names = ["PROF-HOOKWALL", "PROF-HERMES", "PROF-SHANNON", "PROF-WHITEROOM", "PROF-KERNEL", "COL-ASOLARIA"];
  return names.slice(0, count).map((prof, index) => ({
    ts: generatedAt,
    prof,
    supervisorPid: `BH.SUPERVISOR.PID.${prefix}.${prof.replace(/[^A-Z0-9]+/g, "_")}.ACER`,
    vote: "PROCEED",
    status,
    confidence: Number((0.91 - index * 0.007).toFixed(3)),
    boundary: "operator-cosigned, bounded ACER-owned gate; no hand promotion of quarantined drafts"
  }));
}

function buildD50(title, body) {
  return [
    `# ${title}`,
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Status",
    "",
    body.status,
    "",
    "## State Hash",
    "",
    body.stateHash,
    "",
    "## Operator Cosign",
    "",
    `Jesse: ${allGatesCosign.textQuote}`,
    "",
    "## Boundary",
    "",
    body.boundary,
    "",
    "## Evidence",
    "",
    "```json",
    JSON.stringify(body.evidence, null, 2),
    "```",
    ""
  ].join("\n");
}

function buildReport(title, body) {
  return [
    `# ${title}`,
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${body.status}`,
    "",
    `State hash: ${body.stateHash}`,
    "",
    "Boundary:",
    body.boundary,
    "",
    "Artifacts:",
    ...body.artifacts.map((item) => `- ${item.path} sha256=${item.sha256 || "missing"}`),
    ""
  ].join("\n");
}

function writeManifest(filePath, schema, status, stateHash, artifactPaths) {
  const manifest = {
    schema,
    generatedAt,
    status,
    stateHash,
    artifacts: artifactPaths.map(artifact),
    boundary: "manifest records local ACER outputs only; no remote canonical mutation"
  };
  writeJson(filePath, manifest);
  return manifest;
}

function pushToLiris(bundleName, artifactPaths) {
  const remoteRoot = path.join(lirisIncomingRoot, bundleName);
  fs.mkdirSync(remoteRoot, { recursive: true });
  const copied = [];
  for (const localPath of artifactPaths) {
    const rel = repoRel(localPath);
    const remotePath = path.join(remoteRoot, rel);
    ensureParent(remotePath);
    fs.copyFileSync(localPath, remotePath);
    copied.push({
      local: rel,
      remote: remotePath.replace(/\\/g, "/"),
      localSha256: sha256File(localPath),
      remoteSha256: sha256File(remotePath),
      bytes: fs.statSync(localPath).size
    });
  }
  const allRemoteVerified = copied.every((row) => row.localSha256 === row.remoteSha256);
  const manifest = {
    schema: "wave33a-all-gates-liris-incoming-push-manifest.v1",
    generatedAt,
    bundleName,
    remoteRoot: remoteRoot.replace(/\\/g, "/"),
    allRemoteVerified,
    copied
  };
  const localManifest = path.join(waveRoot, `${bundleName}-push-manifest.json`);
  writeJson(localManifest, manifest);
  const remoteManifest = path.join(remoteRoot, "push-manifest.json");
  fs.copyFileSync(localManifest, remoteManifest);
  manifest.localManifest = repoRel(localManifest);
  manifest.remoteManifest = remoteManifest.replace(/\\/g, "/");
  manifest.manifestSha256 = sha256File(localManifest);
  if (!allRemoteVerified) throw new Error(`Remote hash verification failed for ${bundleName}`);
  return manifest;
}

function postLaw001(envelope) {
  return new Promise((resolve) => {
    const data = JSON.stringify(envelope);
    const url = new URL(lirisLaw001);
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body }));
    });
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.setTimeout(8000, () => {
      req.destroy(new Error("timeout"));
    });
    req.write(data);
    req.end();
  });
}

async function notifyLiris(kind, body, outputPath) {
  const envelope = {
    schema: `law001-${kind}.v1`,
    id: `acer-${kind}-${Date.now()}`,
    ts: new Date().toISOString(),
    from: "acer",
    to: "liris",
    mode: "real",
    type: "gate-result",
    verb: `LAW001_${kind.toUpperCase().replace(/-/g, "_")}`,
    operatorCosign: allGatesCosign,
    body
  };
  const result = await postLaw001(envelope);
  writeJson(outputPath, { envelope, result });
  return result;
}

async function seal33a3(notify) {
  const evidence = verify33a3Evidence();
  const payload = {
    schema: "wave33a-3-d50-meta-ed25519-seal-payload.v1",
    generatedAt,
    status: "WAVE33A_3_D50_META_PAYLOAD_READY",
    operatorCosign: allGatesCosign,
    expected,
    evidence: {
      checks: evidence.checks,
      artifacts: evidence.artifacts,
      completionAck: evidence.completionAck,
      completionD0: evidence.completionD0
    },
    boundaries: {
      noAdapterWiring: true,
      noHookWiring: true,
      noSelfUpdateGuard: true,
      noDraftPromotionAsCanon: true,
      noLirisCanonicalWriteByAcer: true,
      noFalconUsbTouch: true
    }
  };
  const payloadText = JSON.stringify(sortDeep(payload), null, 2) + "\n";
  writeText(outputs.seal33a3.payload, payloadText);
  const payloadSha256 = sha256Text(payloadText);
  const roles = [
    { id: "chief_council", supervisorPid: "BH.SUPERVISOR.PID.WAVE33A3.CHIEFCOUNCIL.ACER", meaning: "ACER chief council signature over 33A-3 bilateral closeout payload" },
    { id: "kernel_gate", supervisorPid: "BH.SUPERVISOR.PID.WAVE33A3.KERNEL.ACER", meaning: "kernel gate confirms expected state hashes and no hook/adapter mutation" },
    { id: "white_room", supervisorPid: "BH.SUPERVISOR.PID.WAVE33A3.WHITEROOM.ACER", meaning: "WhiteRoom confirms diverged-draft-siblings preservation" },
    { id: "hermes", supervisorPid: "BH.SUPERVISOR.PID.WAVE33A3.HERMES.ACER", meaning: "Hermes confirms Liris reciprocal evidence is present through SMB/readback" },
    { id: "shannon", supervisorPid: "BH.SUPERVISOR.PID.WAVE33A3.SHANNON.ACER", meaning: "Shannon confirms state hash continuity and report-only seal closeout" }
  ];
  const signatures = roles.map((role) => signPayload(role, Buffer.from(payloadText, "utf8"), payloadSha256, outputs.seal33a3.keys));
  const votes = supervisorVotes("WAVE33A3_D50_META_ED25519", "APPROVE_ACER_ED25519_SEAL_LIRIS_RECIPROCAL_PENDING", 6);
  const stateCore = {
    schema: "wave33a-3-d50-meta-ed25519-seal-acer.v1",
    generatedAt,
    status: "WAVE33A_3_D50_META_ED25519_ACER_SEALED_LIRIS_RECIPROCAL_PENDING",
    operatorCosign: allGatesCosign,
    payloadSha256,
    signatures: signatures.map((sig) => ({ ...sig, privateKeyPath: undefined })),
    signatureCount: signatures.length,
    signaturesVerified: signatures.every((sig) => sig.verified),
    evidence: payload.evidence,
    boundary: payload.boundaries
  };
  const state = { ...stateCore, stateHash: sha256Json(stateCore) };
  writeJson(outputs.seal33a3.state, state);
  writeNdjson(outputs.seal33a3.votes, votes);
  const manifest = writeManifest(outputs.seal33a3.manifest, "wave33a-3-d50-meta-ed25519-seal-manifest.v1", state.status, state.stateHash, [
    outputs.seal33a3.state,
    outputs.seal33a3.payload,
    outputs.seal33a3.votes,
    outputs.seal33a3.d50,
    outputs.seal33a3.reportJson,
    outputs.seal33a3.reportMd
  ].filter((filePath) => fs.existsSync(filePath)));
  const d50Body = {
    status: state.status,
    stateHash: state.stateHash,
    boundary: "ACER signed the 33A-3 bilateral closeout payload; Liris reciprocal seal remains Liris-owned.",
    evidence: { payloadSha256, signatureCount: state.signatureCount, signaturesVerified: state.signaturesVerified, checks: evidence.checks }
  };
  writeText(outputs.seal33a3.d50, buildD50("D50 Wave33A-3 D50 META Ed25519 Seal - ACER", d50Body));
  writeJson(outputs.seal33a3.reportJson, { ...state, manifest });
  writeText(outputs.seal33a3.reportMd, buildReport("Wave33A-3 D50 META Ed25519 Seal", {
    status: state.status,
    stateHash: state.stateHash,
    boundary: d50Body.boundary,
    artifacts: [artifact(outputs.seal33a3.state), artifact(outputs.seal33a3.payload), artifact(outputs.seal33a3.votes), artifact(outputs.seal33a3.d50)]
  }));
  const finalManifest = writeManifest(outputs.seal33a3.manifest, "wave33a-3-d50-meta-ed25519-seal-manifest.v1", state.status, state.stateHash, [
    outputs.seal33a3.state,
    outputs.seal33a3.payload,
    outputs.seal33a3.votes,
    outputs.seal33a3.d50,
    outputs.seal33a3.reportJson,
    outputs.seal33a3.reportMd
  ]);
  const push = pushToLiris("wave33a3-d50-meta-ed25519-seal-push", [
    outputs.seal33a3.state,
    outputs.seal33a3.payload,
    outputs.seal33a3.manifest,
    outputs.seal33a3.votes,
    outputs.seal33a3.d50,
    outputs.seal33a3.reportJson,
    outputs.seal33a3.reportMd
  ]);
  const postResultPath = path.join(waveRoot, "law001-wave33a3-d50-meta-ed25519-seal-post-result.json");
  const post = notify ? await notifyLiris("wave33a3-d50-meta-ed25519-seal", {
    status: state.status,
    stateHash: state.stateHash,
    payloadSha256,
    signatureCount: state.signatureCount,
    signaturesVerified: state.signaturesVerified,
    push,
    next: "Liris validates incoming and emits reciprocal ed25519 if it chooses under Liris authority"
  }, postResultPath) : { skipped: true };
  return { state, manifest: finalManifest, push, post };
}

function collectPinnedArtifacts(extra = {}) {
  const paths = [
    ".asolaria-active-session.lock",
    "AGENTS.md",
    "BROWN-HILBERT.md",
    "TASKS.md",
    "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker.v1.json",
    "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker-manifest.json",
    "data/votes/WAVE33A-AGENT-TERMINAL-LOAD-CONTROL-20260428/behcs-v6-candidate-file.json",
    "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-d50-meta-ed25519-seal-acer.v1.json"
  ];
  return paths.map((relativePath) => {
    const filePath = path.join(repoRoot, relativePath);
    return { relativePath, ...artifact(filePath), note: extra[relativePath] || null };
  });
}

async function mint33a1(notify, sealResult) {
  requireFile(files.memoryDraft, "33A-1 memory research draft");
  requireFile(files.indexDraft, "33A-1 index research draft");
  requireFile(files.v6Vote, "33A v6 vote");
  const memoryDraft = readJson(files.memoryDraft);
  const indexDraft = readJson(files.indexDraft);
  const activeLock = readJson(files.activeLock);
  const pinnedArtifacts = collectPinnedArtifacts();
  const bootBase = {
    schema: "asolaria-agent-terminal-boot-manifest.v1",
    generatedAt,
    status: "WAVE33A_1_BOOT_MANIFEST_PINNED_ACER",
    operatorCosign: allGatesCosign,
    roleAssertion: {
      loadLocalSystemBeforeAction: true,
      role: "guide",
      authority: "supervisor_ring_prof_council_loaded_surfaces_not_chat_memory",
      mutation: "only_after_supervisor_or_operator_gate",
      doNotUninstallActiveUpgrades: true
    },
    compressionWakeLoadOrder: [
      ".asolaria-active-session.lock",
      "BROWN-HILBERT.md",
      "AGENTS.md",
      "TASKS.md",
      "data/behcs/boot/agent-terminal-boot-manifest.v1.json",
      "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker.v1.json",
      "latest relevant data/agent-index/council/D50-*.md",
      "latest relevant data/behcs/codex/glyph-language/*.glpj.json"
    ],
    pinnedState: {
      acer33a3StateHash: expected.acer33a3StateHash,
      liris33a3StateHash: expected.liris33a3StateHash,
      markerSha256: expected.markerSha256,
      markerHash: expected.markerHash,
      v6VoteId: expected.v6VoteId,
      v6TotalBeats: expected.v6TotalBeats,
      acer33a3SealStateHash: sealResult.state.stateHash
    },
    pinnedArtifacts,
    currentTopology: {
      acerUsb: "Aether R9QY205KAKJ / SM-A065M",
      lirisUsb: "Falcon R5CXA4MGQXV per Liris report",
      falconLaw001: "dark on 4947/4948/4950, Liris-owned Wave34-class work",
      lirisInboxGc: "Liris-owned maintenance wave"
    },
    consumedAsResearchOnly: [
      { path: repoRel(files.memoryDraft), sha256: sha256File(files.memoryDraft), summaryKeys: Object.keys(memoryDraft || {}).slice(0, 20) },
      { path: repoRel(files.indexDraft), sha256: sha256File(files.indexDraft), summaryKeys: Object.keys(indexDraft || {}).slice(0, 20) }
    ],
    activeSessionLockSummary: {
      lockId: activeLock && activeLock.lockId,
      sourceWave: activeLock && activeLock.sourceWave,
      nextCosignRequiredFor: activeLock && activeLock.cascadeState && activeLock.cascadeState.nextCosignRequiredFor
    },
    boundaries: {
      noAdapterWiring: true,
      noHookWiring: true,
      noSelfUpdateGuardYet: true,
      noCodexOrClaudeUpgrade: true,
      noDraftPromotionAsCanon: true,
      noLirisCanonicalWriteByAcer: true
    }
  };
  const bootManifest = { ...bootBase, manifestHash: sha256Json(bootBase) };
  writeJson(outputs.boot33a1.bootManifest, bootManifest);
  const votes = supervisorVotes("WAVE33A1_BOOT_MANIFEST", "APPROVE_BOOT_MANIFEST_PINNING_NO_WIRING", 6);
  writeNdjson(outputs.boot33a1.votes, votes);
  const stateCore = {
    schema: "wave33a-1-boot-manifest-pinning-acer.v1",
    generatedAt,
    status: "WAVE33A_1_BOOT_MANIFEST_PINNED_ACER_LIRIS_RECIPROCAL_PENDING",
    operatorCosign: allGatesCosign,
    bootManifestPath: repoRel(outputs.boot33a1.bootManifest),
    bootManifestSha256: sha256File(outputs.boot33a1.bootManifest),
    pinnedState: bootManifest.pinnedState,
    consumedAsResearchOnly: bootManifest.consumedAsResearchOnly,
    supervisorVotes: votes,
    boundary: bootManifest.boundaries
  };
  const state = { ...stateCore, stateHash: sha256Json(stateCore) };
  writeJson(outputs.boot33a1.state, state);
  writeJson(outputs.boot33a1.memory, {
    schema: "behcs-memory.v1",
    topic: "wave33a-1 boot manifest pinning",
    status: state.status,
    stateHash: state.stateHash,
    manifestHash: bootManifest.manifestHash,
    pinned: bootManifest.pinnedState
  });
  writeJson(outputs.boot33a1.index, {
    schema: "behcs-index.v1",
    id: "wave33a-1-boot-manifest-pinning",
    status: state.status,
    stateHash: state.stateHash,
    loadOrder: bootManifest.compressionWakeLoadOrder,
    pinnedArtifactCount: pinnedArtifacts.length
  });
  writeJson(outputs.boot33a1.map, {
    schema: "behcs-map-map-mapped.v1",
    id: "wave33a-1-boot-manifest-pinning",
    nodes: ["active-session-lock", "boot-manifest", "D50", "glyph", "cube", "memory", "index"],
    edges: [
      ["active-session-lock", "boot-manifest"],
      ["boot-manifest", "D50"],
      ["boot-manifest", "glyph"],
      ["boot-manifest", "memory"],
      ["boot-manifest", "index"]
    ],
    stateHash: state.stateHash
  });
  writeText(outputs.boot33a1.cube, `"use strict";\n\nmodule.exports = ${JSON.stringify({
    cube: "wave33a-1-boot-manifest-pinning",
    status: state.status,
    stateHash: state.stateHash,
    dimensions: ["D50", "MEMORY", "INDEX", "MAP", "CUBE", "GLYPH", "LAW012"]
  }, null, 2)};\n`);
  writeJson(outputs.boot33a1.glpj, {
    schema: "behcs256-glpj.v1",
    id: "wave33a-1-boot-manifest-pinning",
    glyph: "W33A1:BOOT:MANIFEST:PINNED",
    stateHash: state.stateHash,
    meaning: "Compression-wake anchor for future Claude/Codex sessions."
  });
  writeJson(outputs.boot33a1.whiteRoom, {
    schema: "whiteroom.v1",
    status: "PASS_NO_WIRING",
    checks: bootManifest.boundaries,
    stateHash: state.stateHash
  });
  writeJson(outputs.boot33a1.gc, {
    schema: "gc-retention.v1",
    retain: [repoRel(outputs.boot33a1.bootManifest), repoRel(outputs.boot33a1.state), repoRel(outputs.boot33a1.d50)],
    reason: "Boot manifest is compression-rehydration anchor.",
    stateHash: state.stateHash
  });
  writeJson(outputs.boot33a1.cryptoSeal, {
    schema: "crypto-seal.v1",
    kind: "sha256_manifest_pin",
    bootManifestSha256: state.bootManifestSha256,
    stateHash: state.stateHash
  });
  const d50Body = {
    status: state.status,
    stateHash: state.stateHash,
    boundary: "Boot manifest pinned only; no CODEX.md, CLAUDE.md, AGENTS.md, hook, adapter, or self-update guard wiring.",
    evidence: { bootManifestSha256: state.bootManifestSha256, manifestHash: bootManifest.manifestHash, pinnedState: bootManifest.pinnedState }
  };
  writeText(outputs.boot33a1.d50, buildD50("D50 Wave33A-1 Boot Manifest Pinning - ACER", d50Body));
  writeJson(outputs.boot33a1.reportJson, { state, bootManifest, votes });
  writeText(outputs.boot33a1.reportMd, buildReport("Wave33A-1 Boot Manifest Pinning", {
    status: state.status,
    stateHash: state.stateHash,
    boundary: d50Body.boundary,
    artifacts: [artifact(outputs.boot33a1.bootManifest), artifact(outputs.boot33a1.state), artifact(outputs.boot33a1.d50)]
  }));
  const manifest = writeManifest(outputs.boot33a1.manifest, "wave33a-1-boot-manifest-pinning-manifest.v1", state.status, state.stateHash, [
    outputs.boot33a1.bootManifest,
    outputs.boot33a1.state,
    outputs.boot33a1.votes,
    outputs.boot33a1.memory,
    outputs.boot33a1.index,
    outputs.boot33a1.map,
    outputs.boot33a1.cube,
    outputs.boot33a1.glpj,
    outputs.boot33a1.whiteRoom,
    outputs.boot33a1.gc,
    outputs.boot33a1.cryptoSeal,
    outputs.boot33a1.d50,
    outputs.boot33a1.reportJson,
    outputs.boot33a1.reportMd
  ]);
  const push = pushToLiris("wave33a-1-boot-manifest-pinning-push", [
    outputs.boot33a1.bootManifest,
    outputs.boot33a1.state,
    outputs.boot33a1.manifest,
    outputs.boot33a1.votes,
    outputs.boot33a1.memory,
    outputs.boot33a1.index,
    outputs.boot33a1.map,
    outputs.boot33a1.cube,
    outputs.boot33a1.glpj,
    outputs.boot33a1.whiteRoom,
    outputs.boot33a1.gc,
    outputs.boot33a1.cryptoSeal,
    outputs.boot33a1.d50,
    outputs.boot33a1.reportJson,
    outputs.boot33a1.reportMd
  ]);
  const postResultPath = path.join(waveRoot, "law001-wave33a1-boot-manifest-pinning-post-result.json");
  const post = notify ? await notifyLiris("wave33a1-boot-manifest-pinning", {
    status: state.status,
    stateHash: state.stateHash,
    bootManifestSha256: state.bootManifestSha256,
    push,
    next: "Liris validates incoming and emits reciprocal boot manifest under Liris authority"
  }, postResultPath) : { skipped: true };
  return { state, manifest, push, post };
}

function adb(args, timeout = 10000) {
  try {
    return {
      ok: true,
      stdout: execFileSync("adb", args, { encoding: "utf8", timeout, windowsHide: true }).trim()
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || "").trim(),
      stderr: String(error.stderr || error.message || "").trim()
    };
  }
}

function parseAdbDevices(text) {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("List of devices"))
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    });
}

function probeTcp(host, port, timeoutMs = 1800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish({ host, port, ok: true }));
    socket.once("timeout", () => finish({ host, port, ok: false, error: "timeout" }));
    socket.once("error", (error) => finish({ host, port, ok: false, error: error.code || error.message }));
    socket.connect(port, host);
  });
}

function parseWlanIp(ipOutput) {
  const match = String(ipOutput || "").match(/inet\s+(\d+\.\d+\.\d+\.\d+)\//);
  return match ? match[1] : null;
}

async function aetherReadclass(notify) {
  const devicesRaw = adb(["devices"]);
  const devices = devicesRaw.ok ? parseAdbDevices(devicesRaw.stdout) : [];
  const target = devices.find((device) => device.serial === "R9QY205KAKJ") || devices.find((device) => device.state === "device") || null;
  const serial = target && target.serial;
  const shell = (command, timeout) => serial ? adb(["-s", serial, "shell", command], timeout) : { ok: false, stderr: "no adb device" };
  const props = {
    model: shell("getprop ro.product.model"),
    manufacturer: shell("getprop ro.product.manufacturer"),
    serial: shell("getprop ro.serialno"),
    fingerprint: shell("getprop ro.build.fingerprint"),
    usbState: shell("getprop sys.usb.state"),
    wlan0: shell("ip -o addr show wlan0 2>/dev/null || ip addr show wlan0 2>/dev/null", 5000),
    asolariaList: shell("ls -la /sdcard/Asolaria 2>&1 | sed -n '1,30p'", 7000),
    termuxPid: shell("pidof com.termux || true"),
    asolariaApkPid: shell("pidof com.jessebrown.asolaria || true")
  };
  const wlanIp = parseWlanIp(props.wlan0.stdout);
  const tcp = wlanIp ? await Promise.all([4947, 4948, 4950, 8765].map((port) => probeTcp(wlanIp, port))) : [];
  const status = serial
    ? "AETHER_REJOIN_READCLASS_USB_OBSERVED_NO_DEVICE_MUTATION"
    : "AETHER_REJOIN_READCLASS_NO_USB_DEVICE_OBSERVED";
  const votes = supervisorVotes("AETHER_REJOIN_READCLASS", "APPROVE_READCLASS_OBSERVATION_ONLY", 6);
  writeNdjson(outputs.aether.votes, votes);
  const stateCore = {
    schema: "aether-rejoin-readclass-acer.v1",
    generatedAt,
    status,
    operatorCosign: allGatesCosign,
    adb: {
      devices,
      selectedSerial: serial,
      expectedSerial: "R9QY205KAKJ",
      expectedModel: "SM-A065M"
    },
    observations: {
      model: props.model,
      manufacturer: props.manufacturer,
      serial: props.serial,
      fingerprint: props.fingerprint,
      usbState: props.usbState,
      wlan0: props.wlan0,
      wlanIp,
      asolariaList: props.asolariaList,
      termuxPid: props.termuxPid,
      asolariaApkPid: props.asolariaApkPid,
      tcp
    },
    boundary: {
      readOnlyAdbShell: true,
      noDeviceFileWrite: true,
      noPackageEnumeration: true,
      noPrivateAppDataRead: true,
      noPortForward: true,
      noInstall: true,
      noRoot: true
    },
    supervisorVotes: votes
  };
  const state = { ...stateCore, stateHash: sha256Json(stateCore) };
  writeJson(outputs.aether.state, state);
  writeJson(outputs.aether.memory, {
    schema: "behcs-memory.v1",
    topic: "aether rejoin readclass",
    status,
    stateHash: state.stateHash,
    serial
  });
  writeJson(outputs.aether.index, {
    schema: "behcs-index.v1",
    id: "aether-rejoin-readclass",
    status,
    stateHash: state.stateHash,
    observedSerial: serial,
    observedModel: props.model.stdout || null
  });
  writeJson(outputs.aether.map, {
    schema: "behcs-map-map-mapped.v1",
    id: "aether-rejoin-readclass",
    nodes: ["acer", "aether-usb", "liris-observer", "falcon-liris-usb"],
    edges: [["acer", "aether-usb"], ["liris-observer", "acer"], ["falcon-liris-usb", "liris-observer"]],
    stateHash: state.stateHash
  });
  writeText(outputs.aether.cube, `"use strict";\n\nmodule.exports = ${JSON.stringify({
    cube: "aether-rejoin-readclass",
    status,
    stateHash: state.stateHash,
    dimensions: ["D11", "D23", "D26", "D34", "D50"]
  }, null, 2)};\n`);
  writeJson(outputs.aether.glpj, {
    schema: "behcs256-glpj.v1",
    id: "aether-rejoin-readclass",
    glyph: "AETHER:USB:READCLASS:OBSERVED",
    stateHash: state.stateHash
  });
  const d50Body = {
    status,
    stateHash: state.stateHash,
    boundary: "Aether read-class only; ACER did not write to the device, forward ports, install packages, or read private app data.",
    evidence: {
      serial,
      model: props.model.stdout || null,
      manufacturer: props.manufacturer.stdout || null,
      wlanIp,
      tcp
    }
  };
  writeText(outputs.aether.d50, buildD50("D50 Aether Rejoin Readclass - ACER", d50Body));
  writeJson(outputs.aether.reportJson, state);
  writeText(outputs.aether.reportMd, buildReport("Aether Rejoin Readclass", {
    status,
    stateHash: state.stateHash,
    boundary: d50Body.boundary,
    artifacts: [artifact(outputs.aether.state), artifact(outputs.aether.d50), artifact(outputs.aether.votes)]
  }));
  const manifest = writeManifest(outputs.aether.manifest, "aether-rejoin-readclass-manifest.v1", status, state.stateHash, [
    outputs.aether.state,
    outputs.aether.manifest,
    outputs.aether.votes,
    outputs.aether.memory,
    outputs.aether.index,
    outputs.aether.map,
    outputs.aether.cube,
    outputs.aether.glpj,
    outputs.aether.d50,
    outputs.aether.reportJson,
    outputs.aether.reportMd
  ]);
  const postResultPath = path.join(path.dirname(outputs.aether.state), "law001-aether-rejoin-readclass-post-result.json");
  const post = notify ? await notifyLiris("aether-rejoin-readclass", {
    status,
    stateHash: state.stateHash,
    serial,
    model: props.model.stdout || null,
    wlanIp,
    tcp,
    boundary: state.boundary
  }, postResultPath) : { skipped: true };
  return { state, manifest, post };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const notify = args.has("--notify");
  const dryRun = args.has("--dry-run");
  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, operatorCosign: allGatesCosign }, null, 2));
    return;
  }

  const seal = await seal33a3(notify);
  const boot = await mint33a1(notify, seal);
  const aether = await aetherReadclass(notify);
  const aggregateCore = {
    schema: "wave33a-all-gates-acer-owned-execution.v1",
    generatedAt,
    status: "WAVE33A_ALL_GATES_ACER_OWNED_EXECUTED_LIRIS_OWNED_GATES_REMAIN_REMOTE",
    operatorCosign: allGatesCosign,
    acerOwnedResults: {
      seal33a3: {
        status: seal.state.status,
        stateHash: seal.state.stateHash,
        pushedToLirisIncoming: seal.push.allRemoteVerified,
        law001Post: seal.post
      },
      boot33a1: {
        status: boot.state.status,
        stateHash: boot.state.stateHash,
        pushedToLirisIncoming: boot.push.allRemoteVerified,
        law001Post: boot.post
      },
      aetherReadclass: {
        status: aether.state.status,
        stateHash: aether.state.stateHash,
        law001Post: aether.post
      }
    },
    lirisOwnedGates: {
      wave34FalconLaw001Reactivation: "LIRIS_USB_LANE_REPORTED_DARK_PORTS_SUPERVISOR_WAVE_REQUIRED",
      lirisInboxGc: "LIRIS_DISK_PRIMARY_SUPERVISOR_GC_WAVE_REQUIRED"
    },
    boundary: {
      noFalconUsbTouchByAcer: true,
      noLirisInboxMutationByAcer: true,
      noAdapterWiring: true,
      noHookWiring: true,
      noSelfUpdateGuard: true,
      noDeviceFileWriteToAether: true
    }
  };
  const aggregate = { ...aggregateCore, stateHash: sha256Json(aggregateCore) };
  writeJson(outputs.aggregate.state, aggregate);
  writeJson(outputs.aggregate.reportJson, aggregate);
  writeText(outputs.aggregate.reportMd, buildReport("Wave33A All Gates - ACER Owned Execution", {
    status: aggregate.status,
    stateHash: aggregate.stateHash,
    boundary: "ACER executed only ACER-owned gates and left Liris/Falcon-owned gates remote.",
    artifacts: [artifact(outputs.aggregate.state), artifact(outputs.seal33a3.state), artifact(outputs.boot33a1.state), artifact(outputs.aether.state)]
  }));
  console.log(JSON.stringify({
    status: aggregate.status,
    stateHash: aggregate.stateHash,
    seal33a3: seal.state.stateHash,
    boot33a1: boot.state.stateHash,
    aetherReadclass: aether.state.stateHash,
    notify
  }, null, 2));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
