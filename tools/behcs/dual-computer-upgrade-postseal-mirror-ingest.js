#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "dual-computer-upgrade-20260427";
const eventId = "EVT-ACER-LIRIS-DUAL-COMPUTER-UPGRADE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const sealRoot = path.join(runRoot, "postseal-mirror-seal");

const INPUTS = Object.freeze({
  inbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  bilateralSeal: path.join(runRoot, "bilateral-promotion-seal", "dual-computer-upgrade-bilateral-promotion-seal.v1.json"),
  postsealSummary: path.join(runRoot, "postseal-execution-wave", "dual-computer-upgrade-postseal-execution-wave-summary.v1.json")
});

const OUTPUTS = Object.freeze({
  seal: path.join(sealRoot, "dual-computer-upgrade-postseal-mirror-seal.v1.json"),
  envelope: path.join(sealRoot, "dual-computer-upgrade-postseal-mirror-seal-receipt-envelope.json"),
  postResult: path.join(sealRoot, "dual-computer-upgrade-postseal-mirror-seal-receipt-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade-postseal-mirror-seal.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-postseal-mirror-seal-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-postseal-mirror-seal-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "dual-computer-upgrade-postseal-mirror-seal-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-postseal-mirror-seal-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-postseal-mirror-seal-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-postseal-mirror-seal-latest.md")
});

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch (_error) {
      return null;
    }
  }).filter(Boolean);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function latestMirror(rows) {
  return rows
    .filter((row) => row.verb === "dual-computer-upgrade-liris-postseal-mirror-complete" && row.eventId === eventId)
    .sort((a, b) => String(a.received_at || a.ts || "").localeCompare(String(b.received_at || b.ts || "")))
    .at(-1);
}

function assertZeroBoundary(row) {
  for (const field of ["liveModelCalls", "processFanout", "remoteWritesPerformed"]) {
    if ((row[field] || 0) !== 0) throw new Error(`Boundary failed: ${field}=${row[field]}`);
  }
}

function httpJson(method, url, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const bilateralSeal = readJson(INPUTS.bilateralSeal);
  const postsealSummary = readJson(INPUTS.postsealSummary);
  const mirror = latestMirror(readNdjson(INPUTS.inbox));
  if (!mirror) throw new Error("Missing Liris post-seal mirror completion");
  if (mirror.status !== "DUAL_COMPUTER_UPGRADE_LIRIS_POSTSEAL_MIRROR_COMPLETE") {
    throw new Error(`Unexpected mirror status: ${mirror.status}`);
  }
  if (mirror.sealSha256 !== bilateralSeal.sealSha256 || mirror.sealSha256 !== postsealSummary.sealSha256) {
    throw new Error("Seal sha mismatch between bilateral seal, Acer postseal wave, and Liris mirror");
  }
  assertZeroBoundary(mirror);
  if ((postsealSummary.boundedVerificationFailures || 0) !== 0) {
    throw new Error("Acer postseal verification has failures");
  }
  if ((mirror.bounded_verification?.fail_count || 0) !== 0) {
    throw new Error("Liris postseal mirror verification has failures");
  }

  const core = {
    id: "dual-computer-upgrade-postseal-mirror-seal.v1",
    generatedAt,
    runId,
    eventId,
    status: "DUAL_COMPUTER_UPGRADE_POSTSEAL_BILATERAL_VERIFICATION_SEALED",
    d11: "PROVEN_OPERATOR_WITNESSED_BILATERAL_SYMMETRY",
    baseSealSha256: bilateralSeal.sealSha256,
    acerPostseal: {
      status: postsealSummary.status,
      boundedVerificationCommands: postsealSummary.boundedVerificationCommands,
      boundedVerificationPasses: postsealSummary.boundedVerificationPasses,
      boundedVerificationFailures: postsealSummary.boundedVerificationFailures,
      asolariaHealthOk: Boolean(postsealSummary.health?.asolaria4781?.ok),
      acerLaw001Ok: Boolean(postsealSummary.health?.acerLaw001?.ok),
      lirisLaw001OkFromAcer: Boolean(postsealSummary.health?.lirisLaw001?.ok)
    },
    lirisMirror: {
      messageId: mirror.id,
      status: mirror.status,
      receivedAt: mirror.received_at,
      commandCount: mirror.bounded_verification?.command_count || 0,
      passCount: mirror.bounded_verification?.pass_count || 0,
      failCount: mirror.bounded_verification?.fail_count || 0,
      lirisLaw001Ok: Boolean(mirror.health?.liris_law001?.ok),
      lirisFileSupervisorOk: Boolean(mirror.health?.liris_fs_supervisor?.ok),
      lirisFileSupervisorVerbs: mirror.health?.liris_fs_supervisor?.verbs_active || [],
      operatorWitness: mirror.operator_witness
    },
    totals: {
      acerVerificationPasses: postsealSummary.boundedVerificationPasses,
      lirisVerificationPasses: mirror.bounded_verification?.pass_count || 0,
      verificationFailures: (postsealSummary.boundedVerificationFailures || 0) + (mirror.bounded_verification?.fail_count || 0),
      liveModelCalls: 0,
      processFanout: 0,
      remoteWritesPerformed: 0
    },
    boundary: "Post-seal bilateral verification seal only. No remote writes, no live model calls, no process fanout."
  };
  const seal = { ...core, postsealSealSha256: hash(core) };
  writeJson(OUTPUTS.seal, seal);

  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-postseal-mirror-seal-v1",
    generatedAt,
    runId,
    eventId,
    status: seal.status,
    summary: "Acer and Liris both completed post-seal bounded verification, preserving the bilateral dual-computer upgrade seal.",
    source: repoRel(OUTPUTS.seal)
  });
  writeJson(OUTPUTS.index, {
    id: "dual-computer-upgrade-postseal-mirror-seal-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "postseal", "bilateral-verification", "liris-mirror", "no-fanout"],
    artifacts: {
      seal: repoRel(OUTPUTS.seal),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "dual-computer-upgrade-postseal-mirror-seal-map-map-mapped-v1",
    generatedAt,
    route: ["bilateral-promotion-seal", "acer-postseal-verification", "liris-postseal-mirror", "postseal-bilateral-verification-seal"],
    baseSealSha256: bilateralSeal.sealSha256,
    postsealSealSha256: seal.postsealSealSha256
  });
  const cubeObject = {
    id: "dual-computer-upgrade-postseal-mirror-seal-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status: seal.status,
    d11: seal.d11,
    acerVerificationPasses: seal.totals.acerVerificationPasses,
    lirisVerificationPasses: seal.totals.lirisVerificationPasses,
    verificationFailures: seal.totals.verificationFailures,
    baseSealSha256: seal.baseSealSha256,
    postsealSealSha256: seal.postsealSealSha256
  };
  writeText(OUTPUTS.cube, `const dualComputerUpgradePostsealMirrorSealCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = dualComputerUpgradePostsealMirrorSealCube;
export default dualComputerUpgradePostsealMirrorSealCube;
`);
  writeJson(OUTPUTS.glpj, {
    id: "dual-computer-upgrade-postseal-mirror-seal-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-SEAL { DUAL-COMPUTER-UPGRADE.POSTSEAL } · ACER-VERIFY-PASS · LIRIS-MIRROR-PASS · BILATERAL-SYMMETRY-PRESERVED @ M-EYEWITNESS .",
      "META-BOUNDARY { POSTSEAL } · LIVE-MODELS-0 · FANOUT-0 · REMOTE-WRITES-0 @ M-INDICATIVE ."
    ]
  });

  const envelope = {
    verb: "dual-computer-upgrade-postseal-bilateral-verification-seal-receipt",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-postseal-bilateral-verification-seal-receipt-001",
    ts: generatedAt,
    runId,
    eventId,
    status: seal.status,
    d11: seal.d11,
    baseSealSha256: seal.baseSealSha256,
    postsealSealSha256: seal.postsealSealSha256,
    responding_to: mirror.id,
    acerVerificationPasses: seal.totals.acerVerificationPasses,
    lirisVerificationPasses: seal.totals.lirisVerificationPasses,
    verificationFailures: seal.totals.verificationFailures,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWritesPerformed: 0,
    artifacts: {
      seal: repoRel(OUTPUTS.seal),
      report: repoRel(OUTPUTS.reportMd)
    },
    glyph_sentence: "META-SEAL { DUAL-COMPUTER-UPGRADE.POSTSEAL } · BILATERAL-VERIFY-COMPLETE · FAILURES-0 · LIVE-MODELS-0 @ M-INDICATIVE .",
    boundary: seal.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });

  const report = { reportId: "dual-computer-upgrade-postseal-mirror-seal-latest", generatedAt, seal, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Post-Seal Mirror Seal

Generated: ${generatedAt}

Status: ${seal.status}

Seal:
- D11: ${seal.d11}
- base seal sha256: ${seal.baseSealSha256}
- postseal seal sha256: ${seal.postsealSealSha256}
- Acer verification passes: ${seal.totals.acerVerificationPasses}
- Liris verification passes: ${seal.totals.lirisVerificationPasses}
- verification failures: ${seal.totals.verificationFailures}
- live model calls: 0
- process fanout: 0
- remote writes: 0

Liris mirror:
- id: ${mirror.id}
- received: ${mirror.received_at}
- LAW-001 ok: ${seal.lirisMirror.lirisLaw001Ok}
- file-supervisor ok: ${seal.lirisMirror.lirisFileSupervisorOk}

Liris receipt posted: ${postResult.ok}

Boundary: ${seal.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: seal.status,
    baseSealSha256: seal.baseSealSha256,
    postsealSealSha256: seal.postsealSealSha256,
    verificationFailures: seal.totals.verificationFailures,
    lirisReceiptPosted: postResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
