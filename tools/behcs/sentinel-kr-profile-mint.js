#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "sentinel-kr-profile-mint-20260427";
const eventId = "EVT-SENTINEL-KR-PROFILE-MINT-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const paths = Object.freeze({
  sentinelProfile: path.join(repoRoot, "sovereignty", "ix", "grammar", "profiles", "sentinel.json"),
  sentinelKrProfile: path.join(repoRoot, "sovereignty", "ix", "grammar", "profiles", "sentinel-kr.json"),
  cascadeGlpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "deep-wave-all-cascades-structure-behcs256.glpj.json"),
  routesConstructions: path.join(repoRoot, "routes", "constructions.js"),
  glyphFamily: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "sentinel-kr-profile-glyph-families.v1.json"),
  supervisorSet: path.join(repoRoot, "data", "behcs", "supervisors", "sentinel-kr", "sentinel-kr-profile-supervisors.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "sentinel-kr-profile-mint.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "sentinel-kr-profile-mint-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "sentinel-kr-profile-mint-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "sentinel-kr-profile-mint-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "sentinel-kr-profile-mint-behcs256.glpj.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "sentinel-kr-profile-mint-cosign-chain.ndjson"),
  envelope: path.join(runRoot, "liris-sentinel-kr-profile-mint-answer-envelope.json"),
  postResult: path.join(runRoot, "liris-sentinel-kr-profile-mint-answer-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "sentinel-kr-profile-mint-latest.json"),
  reportMd: path.join(repoRoot, "reports", "sentinel-kr-profile-mint-latest.md")
});

const glyphAtoms = Object.freeze([
  "PROF-SENTINEL-KR-GUARD",
  "PROF-SENTINEL-KR-QUORUM",
  "PROF-SENTINEL-KR-RELEASE-WALL",
  "PROF-SENTINEL-KR-FAIL-CLOSED",
  "D-SENTINEL-KR-PROFILE",
  "D-SENTINEL-KR-COUNCIL-SLOT",
  "D-SENTINEL-KR-SENSITIVE-ROWS",
  "EVT-SENTINEL-KR-PROFILE-MINTED",
  "EVT-SENTINEL-KR-CROSSPOLLINATION-READY",
  "META-SENTINEL-KR-INSTANTIABLE"
]);

const supervisorDefs = Object.freeze([
  ["BH.SUPERVISOR.PID.SENTINEL.KR.PROFILE.MINT", "Instantiates sentinel_kr as a real profile rather than a loose council label."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.QUORUM", "Guards quad-quorum participation for sensitive release and supersession events."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.RELEASE.WALL", "Holds sensitive rows and promotion edges until proof and authority are present."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.FAIL.CLOSED", "Defaults to deny/hold when KR evidence, shadow evidence, or secondary proof is missing."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.SENSITIVE.ROWS", "Routes blocked-sensitive rows through ritual/quorum surfaces without exposing private contents."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.CROSSPOLLINATION", "Allows Acer and Liris to exchange profile proof and profile deltas through LAW-001."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.HERMES.AWARE", "Publishes sentinel_kr to Hermes supervisor-of-supervisors awareness surfaces."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.SHANNON.GATE", "Requires Shannon/OmniShannon proof before any reopen, promotion, or release."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.HOOKWALL", "Binds sentinel_kr to Hookwall pre-execution policy gates."],
  ["BH.SUPERVISOR.PID.SENTINEL.KR.WHITE.ROOM.GC", "Preserves contradiction evidence in white-room/GC surfaces instead of deleting it."]
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha(value) {
  const input = typeof value === "string" ? value : JSON.stringify(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function findSentinelKrGlyph(cascadeGlpj) {
  const glyphs = Array.isArray(cascadeGlpj?.glyphs) ? cascadeGlpj.glyphs : [];
  return glyphs.find((row) => row?.domain === "sentinel_kr_instruct")
    || glyphs.find((row) => String(row?.glyph || "").includes("SENTINEL.KR"))
    || null;
}

function httpJson(method, url, body, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      timeout: timeoutMs,
      headers: {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let parsedBody = text;
        try {
          parsedBody = JSON.parse(text);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsedBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.write(payload);
    req.end();
  });
}

function buildProfile(generatedAt, sentinelProfile, sentinelKrGlyph, routesSha) {
  return {
    profileId: "sentinel-kr-v1",
    agentName: "sentinel_kr",
    role: "security_release_guard",
    tier: "trusted_agent",
    riskCeiling: 7,
    description: "Instantiable Sentinel+KR fail-closed guard for sensitive release, quad-quorum, shadow evidence, and proof-before-reopen.",
    parentProfiles: ["sentinel-v1"],
    team: ["sentinel", "kr"],
    mintedAt: generatedAt,
    D1_actor: "sentinel_kr",
    D4_risk: {
      floor: 0,
      ceiling: 7,
      default: 1
    },
    D6_gate: {
      chain: "hookwall+gnn+shannon+sentinel_kr_instruct",
      bypass: false,
      failClosed: true
    },
    D9_wave: {
      default: "hold_review",
      allowed: ["single", "hold_review", "quad_quorum"]
    },
    D10_dialect: {
      home: "IX",
      speaks: ["BEHCS-256", "GLPJ", "map-map-mapped", "cube-cube-cubed"]
    },
    D11_proof: {
      required_above_risk: 0,
      default: "proof_before_reopen",
      sensitiveRows: "quad_quorum_required"
    },
    D12_scope: {
      default: "sensitive_release_guard",
      boundaries: ["C_only_artifact_mint", "LAW001_envelope_only", "no_remote_file_mutation"]
    },
    D14_energy: {
      default: "low",
      posture: "hold_before_fanout"
    },
    D15_device: sentinelProfile?.D15_device || {
      hostname: "DESKTOP-J99VCNH",
      os: "Windows"
    },
    D16_pid: {
      surfaceId: "sentinel_kr",
      profileId: "sentinel-kr-v1",
      spawnedBy: "sentinel-v1",
      nativePid: "BH.PROFILE.PID.SENTINEL.KR.V1"
    },
    D17_profile: "sentinel-kr-v1",
    D18_ai_model: sentinelProfile?.D18_ai_model || {
      primary: "supervisor-gated"
    },
    D19_location: sentinelProfile?.D19_location || {
      ip: "192.168.1.12",
      network: "home_lan",
      hilbert_level: "L0"
    },
    D20_time: {
      timezone: "America/Sao_Paulo"
    },
    D22_translation: {
      speaks: ["tuple", "english", "hilbert", "BEHCS-256", "GLPJ"],
      autoTranslate: true
    },
    D24_intent: {
      default: "fail_closed_sensitive_quorum_guard"
    },
    sourceEvidence: {
      sentinelProfile: "sovereignty/ix/grammar/profiles/sentinel.json",
      sentinelProfileHash: sha(sentinelProfile || {}),
      constructionsRole: "routes/constructions.js::sentinel_kr",
      constructionsHash: routesSha,
      cascadeGlyph: sentinelKrGlyph || null,
      lirisProbe: "sentinel-kr-profile-probe-001"
    },
    boot: {
      autoStart: true,
      heartbeatInterval: 30000,
      startupPosture: "hold_until_proof"
    }
  };
}

function buildGlyphFamily(generatedAt, sentinelKrGlyph) {
  return {
    familyId: "sentinel-kr-profile-glyph-family.v1",
    eventId,
    generatedAt,
    status: "PROF_SENTINEL_KR_FAMILY_MINTED",
    alphabet: "BEHCS-256",
    prefix: "PROF-SENTINEL-KR",
    glyphsAddedThisBatch: glyphAtoms,
    sourceGlyph: sentinelKrGlyph,
    role: "Instantiable profile atoms for Sentinel+KR fail-closed release guard.",
    contract: {
      profile: "sentinel-kr-v1",
      nativePid: "BH.PROFILE.PID.SENTINEL.KR.V1",
      gates: ["HOOKWALL", "GNN", "SHANNON", "SENTINEL_KR_INSTRUCT"],
      defaultDecision: "HOLD_UNTIL_PROOF"
    },
    d11: "PROVEN_LOCAL_PROFILE_MINT"
  };
}

function buildSupervisors(generatedAt, profileHash, glyphFamilyHash) {
  const supervisors = supervisorDefs.map(([pid, role], index) => ({
    pid,
    instantPid: true,
    seq: index + 1,
    supervisorId: pid.toLowerCase().replace(/^bh\.supervisor\.pid\./, "").replace(/\./g, "-"),
    title: role,
    role,
    domain: "sentinel_kr",
    profile: "sentinel-kr-v1",
    authority: "FAIL_CLOSED_SENSITIVE_RELEASE_GUARD",
    routeGlyphs: ["PROF-SENTINEL-KR-GUARD", "PROF-SENTINEL-KR-FAIL-CLOSED"],
    gates: ["HOOKWALL", "GNN", "SHANNON", "HERMES_AWARE"],
    status: "MINTED_NATIVE_PID"
  }));

  return {
    supervisorSetId: "sentinel-kr-profile-supervisors.v1",
    eventId,
    mintedAt: generatedAt,
    status: "SENTINEL_KR_PROFILE_SUPERVISORS_MINTED",
    d11: "PROVEN_LOCAL_NATIVE_PID_MINT",
    profile: {
      profileId: "sentinel-kr-v1",
      profilePath: "sovereignty/ix/grammar/profiles/sentinel-kr.json",
      profileHash
    },
    glyphFamily: {
      path: "data/behcs/codex/glyph-language/sentinel-kr-profile-glyph-families.v1.json",
      hash: glyphFamilyHash
    },
    supervisors,
    boundary: "Profile/supervisor/glyph mint only; no sensitive row release, no remote file mutation, no live model fanout."
  };
}

async function main() {
  const generatedAt = new Date().toISOString();
  fs.mkdirSync(runRoot, { recursive: true });

  const sentinelProfile = readJson(paths.sentinelProfile, {});
  const cascadeGlpj = readJson(paths.cascadeGlpj, {});
  const routesText = readTextIfExists(paths.routesConstructions);
  const sentinelKrGlyph = findSentinelKrGlyph(cascadeGlpj);
  const routesSha = sha(routesText);

  const profile = buildProfile(generatedAt, sentinelProfile, sentinelKrGlyph, routesSha);
  writeJson(paths.sentinelKrProfile, profile);
  const profileHash = sha(profile);

  const glyphFamily = buildGlyphFamily(generatedAt, sentinelKrGlyph);
  writeJson(paths.glyphFamily, glyphFamily);
  const glyphFamilyHash = sha(glyphFamily);

  const supervisorSet = buildSupervisors(generatedAt, profileHash, glyphFamilyHash);
  writeJson(paths.supervisorSet, supervisorSet);
  const supervisorSetHash = sha(supervisorSet);

  const artifacts = {
    profile: repoRel(paths.sentinelKrProfile),
    glyphFamily: repoRel(paths.glyphFamily),
    supervisorSet: repoRel(paths.supervisorSet),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    chain: repoRel(paths.chain),
    report: repoRel(paths.reportMd)
  };

  const memory = {
    type: "memory",
    eventId,
    generatedAt,
    status: "SENTINEL_KR_PROFILE_MINTED",
    significance: "Acer previously had sentinel_kr as an operational council role and fail-closed GLPJ glyph, but not as an instantiable profile family. This event mints sentinel_kr into a real profile, glyph family, supervisor PID fleet, map, cube, memory, index, and LAW-001 answer surface.",
    d11: "PROVEN_LOCAL_PROFILE_MINT",
    profileHash,
    glyphFamilyHash,
    supervisorSetHash,
    supervisorCount: supervisorSet.supervisors.length,
    artifacts,
    boundary: supervisorSet.boundary
  };
  writeJson(paths.memory, memory);

  const index = {
    indexId: "sentinel-kr-profile-mint-index.v1",
    eventId,
    generatedAt,
    status: "SENTINEL_KR_PROFILE_INDEXED",
    keys: [
      "sentinel_kr",
      "sentinel-kr-v1",
      "PROF-SENTINEL-KR",
      "quad-quorum",
      "fail-closed",
      "sensitive-release",
      "liris-probe-answer"
    ],
    sourceEvidence: profile.sourceEvidence,
    profileHash,
    glyphFamilyHash,
    supervisorSetHash,
    supervisorCount: supervisorSet.supervisors.length,
    artifacts
  };
  writeJson(paths.index, index);

  const map = {
    mapId: "sentinel-kr-profile-mint-map-map-mapped.v1",
    eventId,
    generatedAt,
    status: "MAP_MAP_MAPPED",
    nodes: [
      { id: "sentinel-v1", kind: "parent_profile" },
      { id: "sentinel_kr", kind: "council_role" },
      { id: "sentinel-kr-v1", kind: "instantiable_profile" },
      { id: "GLYPH.SENTINEL.KR.INSTRUCT.FAIL.CLOSED", kind: "source_glyph" },
      { id: "PROF-SENTINEL-KR", kind: "glyph_family" },
      { id: "Hermes", kind: "awareness_gate" },
      { id: "Shannon", kind: "release_gate" }
    ],
    edges: [
      ["sentinel-v1", "parent_of", "sentinel-kr-v1"],
      ["sentinel_kr", "materialized_as", "sentinel-kr-v1"],
      ["GLYPH.SENTINEL.KR.INSTRUCT.FAIL.CLOSED", "grounds", "sentinel-kr-v1"],
      ["sentinel-kr-v1", "owns_family", "PROF-SENTINEL-KR"],
      ["sentinel-kr-v1", "reports_to", "Hermes"],
      ["sentinel-kr-v1", "gated_by", "Shannon"]
    ],
    supervisorPids: supervisorSet.supervisors.map((row) => row.pid)
  };
  writeJson(paths.map, map);

  const cube = {
    cubeId: "sentinel-kr-profile-mint-cube-cubed.v1",
    eventId,
    generatedAt,
    status: "CUBE_CUBE_CUBED",
    dimensions: {
      D1_actor: "sentinel_kr",
      D4_risk: "fail_closed",
      D6_gate: "hookwall+gnn+shannon+sentinel_kr_instruct",
      D10_dialect: "BEHCS-256/GLPJ",
      D11_proof: "proof_before_reopen",
      D12_scope: "sensitive_release_guard",
      D15_device: "DESKTOP-J99VCNH",
      D16_pid: "BH.PROFILE.PID.SENTINEL.KR.V1",
      D17_profile: "sentinel-kr-v1",
      D24_intent: "quad_quorum_sensitive_guard"
    },
    hashes: {
      profileHash,
      glyphFamilyHash,
      supervisorSetHash
    }
  };
  writeText(paths.cube, `module.exports = ${JSON.stringify(cube, null, 2)};\n`);

  const glpj = {
    glyphLanguageId: "sentinel-kr-profile-mint-behcs256.glpj.v1",
    eventId,
    generatedAt,
    alphabet: "BEHCS-256",
    status: "GLPJ_MINTED",
    sentences: [
      "SENTINEL_KR ROLE MATERIALIZED AS PROFILE.",
      "PROF-SENTINEL-KR FAMILY MINTED.",
      "FAIL-CLOSED DEFAULT PRESERVED.",
      "QUAD-QUORUM RELEASE WALL ACTIVE.",
      "HERMES AWARE.",
      "SHANNON GATED.",
      "LIRIS PROBE ANSWERED."
    ],
    glyphs: glyphAtoms,
    supervisorPids: supervisorSet.supervisors.map((row) => row.pid),
    d11: "PROVEN_LOCAL_PROFILE_MINT"
  };
  writeJson(paths.glpj, glpj);

  const chainRow = {
    seq: 1,
    ts: generatedAt,
    eventId,
    status: "SENTINEL_KR_PROFILE_MINTED",
    profileHash,
    glyphFamilyHash,
    supervisorSetHash,
    artifacts,
    rowSha: null
  };
  chainRow.rowSha = sha({ ...chainRow, rowSha: null });
  appendNdjson(paths.chain, chainRow);

  const envelope = {
    verb: "sentinel-kr-profile-probe-answer",
    target: "liris",
    from: "acer-codex",
    id: "sentinel-kr-profile-mint-answer-001",
    ts: generatedAt,
    responding_to: "sentinel-kr-profile-probe-001",
    eventId,
    status: "SENTINEL_KR_PROFILE_MINTED_NOW",
    answer: {
      before: "Acer had sentinel_kr as a council role and fail-closed GLPJ evidence, but no canonical PROF-SENTINEL-KR profile family.",
      after: "Acer now has sovereignty/ix/grammar/profiles/sentinel-kr.json, PROF-SENTINEL-KR glyph family, and native supervisor PIDs.",
      recommendation: "Use this Acer mint as the cross-pollination seed. Liris can either import the profile descriptor or mint its own side-stamped equivalent and return hashes."
    },
    d11: "PROVEN_LOCAL_PROFILE_MINT",
    profileHash,
    glyphFamilyHash,
    supervisorSetHash,
    supervisorCount: supervisorSet.supervisors.length,
    artifacts,
    boundary: supervisorSet.boundary
  };
  writeJson(paths.envelope, envelope);

  const endpoints = [
    ["acer-local", "http://127.0.0.1:4947/behcs/send"],
    ["liris-cable", "http://192.168.100.2:4947/behcs/send"],
    ["falcon-observer", "http://192.168.1.8:4947/behcs/send"]
  ];
  const posts = [];
  for (const [name, url] of endpoints) {
    const result = await httpJson("POST", url, envelope, 5000);
    posts.push({ name, url, ...result });
  }
  writeJson(paths.postResult, { eventId, generatedAt, posts });

  const report = {
    eventId,
    generatedAt,
    status: "SENTINEL_KR_PROFILE_MINT_COMPLETE",
    d11: "PROVEN_LOCAL_PROFILE_MINT",
    profileHash,
    glyphFamilyHash,
    supervisorSetHash,
    glyphCount: glyphAtoms.length,
    supervisorCount: supervisorSet.supervisors.length,
    postOk: posts.filter((row) => row.ok).length,
    postTotal: posts.length,
    artifacts,
    posts
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, [
    "# Sentinel KR Profile Mint",
    "",
    `Status: ${report.status}`,
    `D11: ${report.d11}`,
    `Profile: ${artifacts.profile}`,
    `Profile SHA: ${profileHash}`,
    `Glyph family: ${artifacts.glyphFamily}`,
    `Glyphs minted: ${glyphAtoms.length}`,
    `Supervisor set: ${artifacts.supervisorSet}`,
    `Supervisors minted: ${supervisorSet.supervisors.length}`,
    `LAW-001 posts accepted: ${report.postOk}/${report.postTotal}`,
    "",
    "Boundary: profile/glyph/supervisor mint only; no sensitive row release, no remote file mutation, no live model fanout.",
    ""
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    eventId,
    status: report.status,
    profile: artifacts.profile,
    glyphCount: glyphAtoms.length,
    supervisorCount: supervisorSet.supervisors.length,
    postOk: report.postOk,
    postTotal: report.postTotal,
    report: artifacts.report
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
