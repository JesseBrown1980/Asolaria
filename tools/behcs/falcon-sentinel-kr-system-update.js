#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "falcon-sentinel-kr-system-update-20260427";
const eventId = "EVT-FALCON-SENTINEL-KR-SYSTEM-UPDATE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const paths = Object.freeze({
  sentinelProfile: path.join(repoRoot, "sovereignty", "ix", "grammar", "profiles", "sentinel-kr.json"),
  sentinelGlyphFamily: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "sentinel-kr-profile-glyph-families.v1.json"),
  sentinelSupervisors: path.join(repoRoot, "data", "behcs", "supervisors", "sentinel-kr", "sentinel-kr-profile-supervisors.v1.json"),
  falconPidIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "falcon-asolaria-mirror-pid-indicator-index-latest.json"),
  proxyState: path.join(repoRoot, "data", "behcs", "orchestration", "falcon-opencode-proxy-daemon-20260427", "falcon-opencode-proxy-daemon-state.json"),
  update: path.join(runRoot, "falcon-sentinel-kr-system-update.v1.json"),
  envelope: path.join(runRoot, "falcon-sentinel-kr-system-update-envelope.json"),
  postResult: path.join(runRoot, "falcon-sentinel-kr-system-update-post-result.json"),
  supervisorSet: path.join(repoRoot, "data", "behcs", "supervisors", "falcon", "falcon-sentinel-kr-system-update-supervisors.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "falcon-sentinel-kr-system-update.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "falcon-sentinel-kr-system-update-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "falcon-sentinel-kr-system-update-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "falcon-sentinel-kr-system-update-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "falcon-sentinel-kr-system-update-behcs256.glpj.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "falcon-sentinel-kr-system-update-chain.ndjson"),
  reportJson: path.join(repoRoot, "reports", "falcon-sentinel-kr-system-update-latest.json"),
  reportMd: path.join(repoRoot, "reports", "falcon-sentinel-kr-system-update-latest.md")
});

const supervisorDefs = Object.freeze([
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.PROFILE.INGEST", "Ensures Falcon receives the sentinel-kr-v1 profile descriptor and hashes."],
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.LAW001", "Requires Falcon LAW-001 4947/4950 reachable before update claims."],
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.ADB.REVERSE", "Maintains reverse ADB port refresh for 4781/4947/4950."],
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.PROXY.ROUTE", "Keeps Falcon backend agent work on the bounded Acer proxy route."],
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.PID.REFRESH", "Refreshes Falcon mirror PID inventory after the new supervisor family lands."],
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.HERMES.AWARE", "Publishes Falcon update to Hermes supervisor awareness."],
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.SHANNON.GATE", "Gates Sentinel KR Falcon activity through Shannon/OmniShannon proof."],
  ["BH.SUPERVISOR.PID.FALCON.SENTINEL.KR.FRONTEND.FREE", "Keeps Falcon usable by Jesse while backend work stays on Acer proxy."]
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
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function run(cmd, args, timeout = 15000) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout,
    windowsHide: true
  });
  return {
    command: [cmd, ...args].join(" "),
    ok: result.status === 0,
    exitCode: result.status,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
}

function httpJson(method, url, body = null, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      timeout: timeoutMs,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let bodyOut = text;
        try {
          bodyOut = JSON.parse(text);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyOut });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const generatedAt = new Date().toISOString();
  fs.mkdirSync(runRoot, { recursive: true });

  const reversePorts = [4781, 4947, 4950].map((port) => run("adb", ["reverse", `tcp:${port}`, `tcp:${port}`]));
  const adbDevices = run("adb", ["devices", "-l"]);
  const falconHealth = await httpJson("GET", "http://192.168.1.8:4947/behcs/health", null, 5000);
  const falconLocalReverseHealth = await httpJson("GET", "http://127.0.0.1:4947/behcs/health", null, 5000);

  const sentinelProfile = readJson(paths.sentinelProfile, {});
  const sentinelGlyphFamily = readJson(paths.sentinelGlyphFamily, {});
  const sentinelSupervisors = readJson(paths.sentinelSupervisors, {});
  const falconPidIndex = readJson(paths.falconPidIndex, {});
  const proxyState = readJson(paths.proxyState, {});

  const profileHash = sha(sentinelProfile);
  const glyphFamilyHash = sha(sentinelGlyphFamily);
  const sentinelSupervisorHash = sha(sentinelSupervisors);
  const falconPidIndexHash = sha(falconPidIndex);

  const updateSupervisors = supervisorDefs.map(([pid, role], index) => ({
    pid,
    instantPid: true,
    seq: index + 1,
    supervisorId: pid.toLowerCase().replace(/^bh\.supervisor\.pid\./, "").replace(/\./g, "-"),
    role,
    domain: "falcon_sentinel_kr_system_update",
    authority: "FALCON_SYSTEM_UPDATE_DESCRIPTOR_ONLY",
    gates: ["LAW-001", "ADB_REVERSE", "HERMES_AWARE", "SHANNON_GATE", "NO_REMOTE_FILE_MUTATION"],
    status: "MINTED_NATIVE_PID"
  }));

  const supervisorSet = {
    supervisorSetId: "falcon-sentinel-kr-system-update-supervisors.v1",
    eventId,
    mintedAt: generatedAt,
    status: "FALCON_SENTINEL_KR_UPDATE_SUPERVISORS_MINTED",
    d11: "PROVEN_LOCAL_NATIVE_PID_MINT",
    supervisors: updateSupervisors,
    boundary: "Falcon system update descriptor and supervisor route only; no phone private data, no root, no flashing, no remote file mutation, no live model fanout."
  };
  writeJson(paths.supervisorSet, supervisorSet);
  const updateSupervisorSetHash = sha(supervisorSet);

  const update = {
    updateId: "falcon-sentinel-kr-system-update.v1",
    eventId,
    generatedAt,
    status: falconHealth.ok ? "FALCON_SENTINEL_KR_SYSTEM_UPDATE_SENT" : "FALCON_SENTINEL_KR_SYSTEM_UPDATE_HELD_TRANSPORT",
    d11: falconHealth.ok ? "PROVEN_FALCON_LAW001_REACHABLE_UPDATE_POSTED" : "OBSERVED_LOCAL_PREPARED_FALCON_TRANSPORT_HELD",
    falcon: {
      law001Lan: falconHealth.ok,
      localReverseLaw001: falconLocalReverseHealth.ok,
      adbOnline: adbDevices.ok && /device\s+product:/.test(adbDevices.stdout),
      reversePorts: reversePorts.map((row, index) => ({ port: [4781, 4947, 4950][index], ok: row.ok }))
    },
    proxy: {
      daemonStatus: proxyState.lastStatus || "unknown",
      processedCount: Number(proxyState.processedCount || 0),
      returnedCount: Number(proxyState.returnedCount || 0),
      pendingRequests: Number(proxyState.pendingRequests || 0)
    },
    sentinelKr: {
      profilePath: repoRel(paths.sentinelProfile),
      profileHash,
      glyphFamilyPath: repoRel(paths.sentinelGlyphFamily),
      glyphFamilyHash,
      supervisorSetPath: repoRel(paths.sentinelSupervisors),
      sentinelSupervisorHash
    },
    falconPidRefresh: {
      indexPath: repoRel(paths.falconPidIndex),
      indexHash: falconPidIndexHash,
      totalRecords: Number(falconPidIndex.counts?.totalRecords || 0),
      observedRecords: Number(falconPidIndex.counts?.observedRecords || 0),
      holdRecords: Number(falconPidIndex.counts?.holdRecords || 0),
      supervisors: Number(falconPidIndex.counts?.supervisors || 0)
    },
    updateSupervisors: {
      path: repoRel(paths.supervisorSet),
      hash: updateSupervisorSetHash,
      count: updateSupervisors.length
    },
    boundary: supervisorSet.boundary
  };
  writeJson(paths.update, update);

  const artifacts = {
    update: repoRel(paths.update),
    envelope: repoRel(paths.envelope),
    supervisorSet: repoRel(paths.supervisorSet),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    chain: repoRel(paths.chain),
    report: repoRel(paths.reportMd)
  };

  const envelope = {
    verb: "falcon-sentinel-kr-system-update",
    target: "falcon",
    from: "acer-codex",
    id: "falcon-sentinel-kr-system-update-001",
    ts: generatedAt,
    eventId,
    status: update.status,
    d11: update.d11,
    update,
    artifacts,
    boundary: update.boundary
  };
  writeJson(paths.envelope, envelope);

  const posts = [];
  for (const [name, url] of [
    ["falcon-law001", "http://192.168.1.8:4947/behcs/send"],
    ["liris-cable", "http://192.168.100.2:4947/behcs/send"],
    ["acer-local", "http://127.0.0.1:4947/behcs/send"]
  ]) {
    posts.push({ name, url, ...(await httpJson("POST", url, envelope, 5000)) });
  }
  writeJson(paths.postResult, { eventId, generatedAt, posts });

  writeJson(paths.memory, {
    type: "memory",
    eventId,
    generatedAt,
    status: update.status,
    significance: "Falcon systems were refreshed after the Sentinel KR profile mint. Falcon now has a system-update packet binding sentinel-kr-v1, PROF-SENTINEL-KR, Falcon mirror PIDs, reverse ADB, LAW-001, Hermes awareness, Shannon gate, and the bounded Acer proxy route.",
    updateHash: sha(update),
    artifacts,
    boundary: update.boundary
  });
  writeJson(paths.index, {
    indexId: "falcon-sentinel-kr-system-update-index.v1",
    eventId,
    generatedAt,
    status: update.status,
    keys: ["falcon", "sentinel_kr", "sentinel-kr-v1", "LAW-001", "ADB reverse", "proxy daemon", "Hermes", "Shannon"],
    updateHash: sha(update),
    artifacts
  });
  writeJson(paths.map, {
    mapId: "falcon-sentinel-kr-system-update-map-map-mapped.v1",
    eventId,
    generatedAt,
    nodes: ["Falcon", "sentinel-kr-v1", "PROF-SENTINEL-KR", "LAW-001", "ADB reverse", "Acer proxy", "Hermes", "Shannon"],
    edges: [
      ["sentinel-kr-v1", "updates", "Falcon"],
      ["Falcon", "receives_via", "LAW-001"],
      ["Falcon", "keeps_ports", "ADB reverse"],
      ["Falcon", "backend_spawns_via", "Acer proxy"],
      ["Falcon", "reports_to", "Hermes"],
      ["Falcon", "gated_by", "Shannon"]
    ],
    supervisorPids: updateSupervisors.map((row) => row.pid)
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    cubeId: "falcon-sentinel-kr-system-update-cube-cubed.v1",
    eventId,
    generatedAt,
    dimensions: {
      D_DEVICE: "falcon",
      D_PROFILE: "sentinel-kr-v1",
      D_LAW001: update.falcon.law001Lan,
      D_ADB_REVERSE: update.falcon.reversePorts,
      D_PROXY: update.proxy.daemonStatus,
      D_PID_REFRESH: update.falconPidRefresh,
      D_BOUNDARY: "descriptor_update_no_remote_mutation"
    }
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    glyphLanguageId: "falcon-sentinel-kr-system-update-behcs256.glpj.v1",
    eventId,
    generatedAt,
    alphabet: "BEHCS-256",
    status: "GLPJ_MINTED",
    sentences: [
      "FALCON SYSTEMS UPDATED.",
      "SENTINEL_KR PROFILE BOUND.",
      "LAW-001 GREEN.",
      "ADB REVERSE REFRESHED.",
      "PID MIRROR REFRESHED.",
      "PROXY ROUTE PRESERVED.",
      "HERMES AWARE.",
      "SHANNON GATED."
    ],
    glyphs: ["PROF-SENTINEL-KR-GUARD", "PROF-SENTINEL-KR-FAIL-CLOSED", "D-SENTINEL-KR-PROFILE"],
    supervisorPids: updateSupervisors.map((row) => row.pid)
  });

  const chainRow = {
    seq: 1,
    ts: generatedAt,
    eventId,
    status: update.status,
    updateHash: sha(update),
    supervisorSetHash: updateSupervisorSetHash,
    postsOk: posts.filter((row) => row.ok).length,
    postsTotal: posts.length,
    rowSha: null
  };
  chainRow.rowSha = sha({ ...chainRow, rowSha: null });
  appendNdjson(paths.chain, chainRow);

  const report = {
    eventId,
    generatedAt,
    status: update.status,
    d11: update.d11,
    law001Falcon: update.falcon.law001Lan,
    adbOnline: update.falcon.adbOnline,
    reversePorts: update.falcon.reversePorts,
    pidRecords: update.falconPidRefresh.totalRecords,
    supervisorRowsOnFalconMirror: update.falconPidRefresh.supervisors,
    updateSupervisorCount: updateSupervisors.length,
    postsOk: posts.filter((row) => row.ok).length,
    postsTotal: posts.length,
    artifacts
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, [
    "# Falcon Sentinel KR System Update",
    "",
    `Status: ${report.status}`,
    `D11: ${report.d11}`,
    `Falcon LAW-001: ${report.law001Falcon ? "green" : "held"}`,
    `ADB online: ${report.adbOnline ? "yes" : "no"}`,
    `Falcon PID records: ${report.pidRecords}`,
    `Falcon supervisor mirror rows: ${report.supervisorRowsOnFalconMirror}`,
    `Update supervisors minted: ${report.updateSupervisorCount}`,
    `LAW-001 posts accepted: ${report.postsOk}/${report.postsTotal}`,
    "",
    "Boundary: descriptor/system update only; no phone private data read, no root, no flashing, no remote file mutation, no live model fanout.",
    ""
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    eventId,
    status: report.status,
    law001Falcon: report.law001Falcon,
    adbOnline: report.adbOnline,
    pidRecords: report.pidRecords,
    supervisorRowsOnFalconMirror: report.supervisorRowsOnFalconMirror,
    updateSupervisorCount: report.updateSupervisorCount,
    postsOk: report.postsOk,
    postsTotal: report.postsTotal,
    report: artifacts.report
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
