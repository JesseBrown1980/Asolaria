#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const net = require("net");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const eventId = "EVT-ACER-LIRIS-CROSSPOLLINATION-2026-04-26";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const endpoints = Object.freeze({
  lirisSend: "http://192.168.100.2:4947/behcs/send",
  lirisFsHealth: "http://192.168.100.2:4947/behcs/fs/health",
  lirisFsDispatch: "http://192.168.100.2:4947/behcs/fs/dispatch",
  falconHealth4947: "http://192.168.1.8:4947/behcs/health",
  falconHealth4950: "http://192.168.1.8:4950/behcs/health",
  falconSend4947: "http://192.168.1.8:4947/behcs/send"
});

const paths = Object.freeze({
  blockedSensitive: path.join(runRoot, "phase4-blocked-sensitive.ndjson"),
  bilateralSeal: path.join(runRoot, "unison-bilateral-final-seal.v1.json"),
  followonPlan: path.join(runRoot, "followons-run-everything.v1.json"),
  quorumPackage: path.join(runRoot, "followon-sensitive-quorum-package.v1.json"),
  lirisRestartEnvelope: path.join(runRoot, "followon-liris-fs-commit2-exposure-request-envelope.json"),
  lirisRestartPost: path.join(runRoot, "followon-liris-fs-commit2-exposure-request-post-result.json"),
  falconProbeEnvelope: path.join(runRoot, "followon-falcon-lan-direct-activation-probe-envelope.json"),
  falconProbePost: path.join(runRoot, "followon-falcon-lan-direct-activation-probe-post-result.json"),
  summaryEnvelope: path.join(runRoot, "followons-run-everything-summary-envelope.json"),
  summaryPost: path.join(runRoot, "followons-run-everything-summary-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "unison-followons-run-everything.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "unison-followons-run-everything-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "unison-followons-run-everything-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "unison-followons-run-everything-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "unison-followons-run-everything-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "unison-followons-run-everything-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-followons-run-everything-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { parseError: error.message, line: index + 1 };
      }
    });
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function summarizeBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function tcpCheck(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok, error = null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ host, port, ok, error });
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false, "timeout"));
    socket.once("error", (error) => done(false, error.message));
    socket.connect(port, host);
  });
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

function buildSensitiveQuorumPackage(generatedAt, blockedRows, blockedBytes) {
  const cleanRows = blockedRows.filter((row) => !row.parseError);
  const byClass = summarizeBy(cleanRows, "d_class");
  const bySide = summarizeBy(cleanRows, "side");
  const byKind = summarizeBy(cleanRows, "sourceKind");
  return {
    id: "unison-followon-sensitive-quorum-package-v1",
    eventId,
    runId,
    generatedAt,
    status: "SENSITIVE_ROWS_REMAIN_BLOCKED_AWAITING_QUAD_QUORUM",
    rowCount: cleanRows.length,
    blockedFile: repoRel(paths.blockedSensitive),
    blockedFileBytes: Buffer.byteLength(blockedBytes, "utf8"),
    blockedFileSha256: sha256(blockedBytes),
    requiredQuorum: "acer+lineage_liris+hermes+sentinel_kr",
    mutationAllowed: false,
    remoteFileWriteAllowed: false,
    executionAllowed: false,
    byClass,
    bySide,
    byKind,
    ritualSteps: [
      "verify bilateral final seal sha",
      "sample and classify blocked rows by D-class without executing",
      "collect explicit acer cosign",
      "collect lineage_liris cosign",
      "collect hermes cosign",
      "collect sentinel_kr cosign",
      "execute only a later narrowed allowlist, never the full 1675-row set blindly"
    ],
    glyph_sentence: "META-QUORUM { SENSITIVE-1675 } · BLOCKED-UNTIL-ACER-LINEAGE_LIRIS-HERMES-SENTINEL_KR · D11-OBSERVED @ M-SUBJUNCTIVE ."
  };
}

async function probeLirisFileSupervisor() {
  const health = await httpJson("GET", endpoints.lirisFsHealth);
  const probeTargetPath = "C:\\Users\\rayss\\Asolaria-BEHCS-256\\packages\\file-supervisor\\package.json";
  const fingerprintProbe = await httpJson("POST", endpoints.lirisFsDispatch, {
    verb: "LX-FINGERPRINT",
    target_path: probeTargetPath,
    peer: "acer-followon-commit2-probe",
    operator_witness: "acer-codex",
    descriptorOnly: true
  });
  const verbsActive = Array.isArray(health.body?.verbs_active) ? health.body.verbs_active : [];
  return {
    health,
    fingerprintProbe,
    probeTargetPath,
    commit2NetworkExposed: verbsActive.includes("LX-FINGERPRINT")
      && verbsActive.includes("LX-INGEST")
      && fingerprintProbe.ok,
    verbsActive
  };
}

async function probeFalconLanDirect(generatedAt) {
  const tcp4947 = await tcpCheck("192.168.1.8", 4947);
  const tcp4950 = await tcpCheck("192.168.1.8", 4950);
  const health4947 = await httpJson("GET", endpoints.falconHealth4947);
  const health4950 = await httpJson("GET", endpoints.falconHealth4950);
  const envelope = {
    verb: "unison-falcon-lan-direct-activation-probe",
    target: "falcon",
    from: "acer-codex",
    id: "unison-2026-04-27-acer-falcon-lan-direct-activation-probe-001",
    ts: generatedAt,
    runId,
    eventId,
    descriptorOnly: true,
    mutationAllowed: false,
    remoteFileWriteAllowed: false,
    processFanout: false,
    route_probe: {
      targetUrl: endpoints.falconSend4947,
      expectedRoute: "LAN-direct 192.168.1.8:4947",
      knownCaveat: "health body may still report Acer identity when Falcon is serving an Acer orbital mirror"
    },
    glyph_sentence: "META-PROBE { FALCON-LAN-DIRECT } · TARGET-192.168.1.8:4947 · DESCRIPTOR-ONLY @ M-INDICATIVE .",
    boundary: "Descriptor-only Falcon LAN-direct activation probe; no phone file write, no settings mutation, no process fanout."
  };
  writeJson(paths.falconProbeEnvelope, envelope);
  const post = await httpJson("POST", endpoints.falconSend4947, envelope);
  writeJson(paths.falconProbePost, { postedAt: new Date().toISOString(), endpoint: endpoints.falconSend4947, ...post });
  return {
    tcp4947,
    tcp4950,
    health4947,
    health4950,
    post,
    envelopeId: envelope.id,
    activatedDescriptorRoute: tcp4947.ok && post.ok
  };
}

async function run() {
  const generatedAt = new Date().toISOString();
  const bilateralSeal = readJson(paths.bilateralSeal, {});
  const blockedBytes = fs.readFileSync(paths.blockedSensitive, "utf8");
  const blockedRows = readNdjson(paths.blockedSensitive);
  const quorumPackage = buildSensitiveQuorumPackage(generatedAt, blockedRows, blockedBytes);
  writeJson(paths.quorumPackage, quorumPackage);

  const lirisFs = await probeLirisFileSupervisor();
  const lirisRestartEnvelope = {
    verb: "unison-followon-liris-fs-commit2-exposure-request",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-27-acer-liris-fs-commit2-exposure-request-001",
    ts: generatedAt,
    runId,
    eventId,
    status: lirisFs.commit2NetworkExposed ? "COMMIT2_ALREADY_NETWORK_EXPOSED" : "COMMIT2_RESTART_OR_REBIND_REQUESTED",
    observed_verbs_active: lirisFs.verbsActive,
    lx_fingerprint_probe: {
      ok: lirisFs.fingerprintProbe.ok,
      statusCode: lirisFs.fingerprintProbe.statusCode || null,
      targetPath: lirisFs.probeTargetPath,
      body: lirisFs.fingerprintProbe.body || lirisFs.fingerprintProbe.error || null
    },
    requested_action: lirisFs.commit2NetworkExposed
      ? "none"
      : "restart or rebind Liris file-supervisor/bus so LX-FINGERPRINT and LX-INGEST are active over /behcs/fs/dispatch; preserve LAW-001 4947+4950 availability",
    boundary: "Request only. Acer did not restart Liris, write remote files, or mutate sensitive state.",
    glyph_sentence: "META-REQUEST { LIRIS-FS-COMMIT2-EXPOSE } · LX-FINGERPRINT-LX-INGEST · LAW001-PRESERVE @ M-SUBJUNCTIVE ."
  };
  writeJson(paths.lirisRestartEnvelope, lirisRestartEnvelope);
  const lirisRestartPost = await httpJson("POST", endpoints.lirisSend, lirisRestartEnvelope);
  writeJson(paths.lirisRestartPost, { postedAt: new Date().toISOString(), endpoint: endpoints.lirisSend, ...lirisRestartPost });

  const falcon = await probeFalconLanDirect(generatedAt);
  const followonStatus = lirisFs.commit2NetworkExposed && falcon.activatedDescriptorRoute
    ? "FOLLOWONS_EXECUTED_SAFE_PARTS_AND_REMAINING_SENSITIVE_QUORUM_GATED"
    : "FOLLOWONS_EXECUTED_SAFE_PARTS_AND_REQUESTED_GATED_PARTS";

  const plan = {
    id: "unison-followons-run-everything-v1",
    generatedAt,
    runId,
    eventId,
    bilateralSealSha256: bilateralSeal.sha256 || null,
    status: followonStatus,
    threads: {
      sensitiveQuorum: {
        status: quorumPackage.status,
        rowCount: quorumPackage.rowCount,
        blockedFileSha256: quorumPackage.blockedFileSha256,
        requiredQuorum: quorumPackage.requiredQuorum,
        executionAllowed: false
      },
      lirisFileSupervisorCommit2: {
        status: lirisRestartEnvelope.status,
        verbsActive: lirisFs.verbsActive,
        requestPosted: lirisRestartPost.ok,
        commit2NetworkExposed: lirisFs.commit2NetworkExposed
      },
      falconLanDirect: {
        status: falcon.activatedDescriptorRoute ? "FALCON_LAN_DIRECT_DESCRIPTOR_ROUTE_PROBED" : "FALCON_LAN_DIRECT_PROBE_HOLD",
        tcp4947: falcon.tcp4947.ok,
        tcp4950: falcon.tcp4950.ok,
        health4947Ok: falcon.health4947.ok,
        health4950Ok: falcon.health4950.ok,
        postOk: falcon.post.ok,
        endpoint: endpoints.falconSend4947
      }
    },
    boundary: {
      descriptorOnly: true,
      sensitiveMutation: false,
      remoteFileOperation: false,
      processFanout: false,
      smbWrite: false
    }
  };
  writeJson(paths.followonPlan, plan);

  const memory = {
    type: "behcs-memory",
    id: "memory-unison-followons-run-everything-v1",
    generatedAt,
    runId,
    eventId,
    status: plan.status,
    summary: lirisFs.commit2NetworkExposed
      ? "Follow-on work after bilateral seal: sensitive rows remain blocked under quorum, Liris commit-2 exposure is confirmed, Falcon LAN-direct descriptor probe executed."
      : "Follow-on work after bilateral seal: sensitive rows remain blocked under quorum, Liris commit-2 exposure requested, Falcon LAN-direct descriptor probe executed.",
    source: repoRel(paths.followonPlan)
  };
  const index = {
    id: "index-unison-followons-run-everything-v1",
    generatedAt,
    keys: ["unison-followons", "sensitive-quorum", "liris-fs-commit2", "falcon-lan-direct", "law001"],
    artifacts: {
      plan: repoRel(paths.followonPlan),
      quorumPackage: repoRel(paths.quorumPackage),
      report: repoRel(paths.reportMd),
      map: repoRel(paths.map),
      cube: repoRel(paths.cube),
      glpj: repoRel(paths.glpj)
    }
  };
  const map = {
    id: "unison-followons-run-everything-map-map-mapped-v1",
    generatedAt,
    route: [
      "bilateral-seal",
      "sensitive-quorum-package",
      "liris-commit2-exposure-request",
      "falcon-lan-direct-probe",
      "summary-envelope"
    ],
    statuses: plan.threads
  };
  const glpj = {
    id: "unison-followons-run-everything-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-FOLLOWON { SENSITIVE-1675 } BLOCKED-UNTIL-QUORUM.",
      lirisFs.commit2NetworkExposed
        ? "META-PROOF { LIRIS-FS-COMMIT2 } LX-FINGERPRINT-LX-INGEST-ACTIVE."
        : "META-REQUEST { LIRIS-FS-COMMIT2 } EXPOSE-LX-FINGERPRINT-LX-INGEST.",
      "META-PROBE { FALCON-LAN-DIRECT } DESCRIPTOR-ONLY."
    ]
  };
  const cubeObject = {
    id: "unison-followons-run-everything-cube-cubed-v1",
    generatedAt,
    eventId,
    runId,
    status: plan.status,
    threads: plan.threads
  };
  const cubeModule = `const unisonFollowonsRunEverythingCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = unisonFollowonsRunEverythingCube;
export default unisonFollowonsRunEverythingCube;
`;
  writeJson(paths.memory, memory);
  writeJson(paths.index, index);
  writeJson(paths.map, map);
  writeJson(paths.glpj, glpj);
  writeText(paths.cube, cubeModule);

  const summaryEnvelope = {
    verb: "unison-followons-run-everything-summary",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-27-acer-followons-run-everything-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: plan.status,
    threads: plan.threads,
    artifacts: {
      quorumPackage: repoRel(paths.quorumPackage),
      followonPlan: repoRel(paths.followonPlan)
    },
    glyph_sentence: lirisFs.commit2NetworkExposed
      ? "META-FOLLOWON-SUMMARY { UNISON-2026-04-26 } · QUORUM-PACKAGED · COMMIT2-CONFIRMED · FALCON-PROBED @ M-INDICATIVE ."
      : "META-FOLLOWON-SUMMARY { UNISON-2026-04-26 } · QUORUM-PACKAGED · COMMIT2-REQUESTED · FALCON-PROBED @ M-INDICATIVE .",
    boundary: "Append-only summary. No SMB write, no remote file operation, no sensitive mutation, no process fanout."
  };
  writeJson(paths.summaryEnvelope, summaryEnvelope);
  const summaryPost = await httpJson("POST", endpoints.lirisSend, summaryEnvelope);
  writeJson(paths.summaryPost, { postedAt: new Date().toISOString(), endpoint: endpoints.lirisSend, ...summaryPost });

  const report = {
    reportId: "unison-followons-run-everything-latest",
    generatedAt,
    status: plan.status,
    plan,
    posts: {
      lirisCommit2Request: {
        ok: lirisRestartPost.ok,
        statusCode: lirisRestartPost.statusCode || null,
        body: lirisRestartPost.body || lirisRestartPost.error || null
      },
      falconLanDirectProbe: {
        ok: falcon.post.ok,
        statusCode: falcon.post.statusCode || null,
        body: falcon.post.body || falcon.post.error || null
      },
      lirisSummary: {
        ok: summaryPost.ok,
        statusCode: summaryPost.statusCode || null,
        body: summaryPost.body || summaryPost.error || null
      }
    },
    outputs: {
      followonPlan: repoRel(paths.followonPlan),
      quorumPackage: repoRel(paths.quorumPackage),
      reportMd: repoRel(paths.reportMd)
    }
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, `# Unison Follow-ons Run Everything

Generated: ${generatedAt}

Status: ${plan.status}

Sensitive quorum:
- rows: ${quorumPackage.rowCount}
- blocked sha: \`${quorumPackage.blockedFileSha256}\`
- required quorum: \`${quorumPackage.requiredQuorum}\`
- execution allowed now: false

Liris file-supervisor commit-2:
- verbs active over network: ${lirisFs.verbsActive.join(", ") || "none"}
- commit-2 exposed: ${lirisFs.commit2NetworkExposed}
- restart/exposure request posted: ${lirisRestartPost.ok}

Falcon LAN-direct:
- tcp 192.168.1.8:4947: ${falcon.tcp4947.ok}
- tcp 192.168.1.8:4950: ${falcon.tcp4950.ok}
- descriptor probe post ok: ${falcon.post.ok}
- note: health may still report Acer identity when Falcon is serving the Acer orbital mirror.

Summary posted to Liris: ${summaryPost.ok}

Boundary: descriptor-only follow-on execution; sensitive rows remain blocked; no SMB write, no remote file operation, no sensitive mutation, no process fanout.
`);

  console.log(JSON.stringify({
    ok: true,
    status: plan.status,
    sensitiveRows: quorumPackage.rowCount,
    lirisCommit2Exposed: lirisFs.commit2NetworkExposed,
    lirisCommit2RequestPosted: lirisRestartPost.ok,
    falconLanDirectProbeOk: falcon.post.ok,
    summaryPosted: summaryPost.ok,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
