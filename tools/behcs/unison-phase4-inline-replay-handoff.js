#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const inboxPath = path.join(repoRoot, "data", "behcs", "inbox.ndjson");
const replyTarget = "http://192.168.100.2:4947/behcs/send";
const chunkSize = 180 * 1024;

const paths = Object.freeze({
  sequence: path.join(runRoot, "phase4-execution-sequence.ndjson"),
  blocked: path.join(runRoot, "phase4-blocked-sensitive.ndjson"),
  signedMap: path.join(runRoot, "merge-map.signed.json"),
  postResults: path.join(runRoot, "unison-phase4-inline-replay-post-results.json"),
  manifest: path.join(runRoot, "unison-phase4-inline-replay-manifest.json"),
  crosspollinationCanon: path.join(runRoot, "crosspollination-canon.v1.json"),
  falconDiagnostic: path.join(runRoot, "falcon-adb-termux-diagnostic.v1.json"),
  reportJson: path.join(repoRoot, "reports", "unison-phase4-inline-replay-handoff-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-phase4-inline-replay-handoff-latest.md"),
  falconReportMd: path.join(repoRoot, "reports", "falcon-adb-termux-diagnostic-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function latestInbox(verb) {
  return readNdjson(inboxPath)
    .filter((row) => row.verb === verb)
    .sort((a, b) => new Date(b.received_at || b.ts || 0) - new Date(a.received_at || a.ts || 0))[0] || null;
}

function artifactInfo(id, verb, filePath, options = {}) {
  const text = readText(filePath);
  const buffer = Buffer.from(text, "utf8");
  return {
    id,
    verb,
    path: filePath,
    repoPath: repoRel(filePath),
    text,
    bytes: buffer.length,
    sha256: sha256Buffer(buffer),
    rows: options.rows,
    chunk: options.chunk || buffer.length > chunkSize
  };
}

function envelopeBase(generatedAt) {
  return {
    target: "liris",
    from: "acer-codex",
    ts: generatedAt,
    responding_to: "unison-2026-04-26-liris-phase4-sequence-reviewed-001",
    runId,
    law001: {
      channel: replyTarget,
      mode: "bus-first-inline-replay"
    },
    boundary: {
      descriptorOnly: true,
      remoteFileOperation: false,
      sensitiveMutation: false,
      processFanout: false,
      smbWrite: false
    }
  };
}

function makeInlineEnvelope(artifact, generatedAt) {
  return {
    ...envelopeBase(generatedAt),
    verb: artifact.verb,
    id: `unison-2026-04-26-acer-${artifact.id}-inline-001`,
    artifact: {
      name: path.basename(artifact.path),
      repoPath: artifact.repoPath,
      bytes: artifact.bytes,
      rows: artifact.rows || null,
      sha256: artifact.sha256,
      encoding: "utf8",
      chunked: false
    },
    content_inline: artifact.text,
    glyph_sentence: `EVT-UNISON-PHASE4-INLINE { ${artifact.id.toUpperCase()} } · SHA-${artifact.sha256.slice(0, 12)} · D11-OBSERVED @ M-INDICATIVE .`,
    d11: "OBSERVED_LOCAL_BYTES_SENT_FOR_LIRIS_REPLAY"
  };
}

function makeChunkEnvelopes(artifact, generatedAt) {
  const buffer = Buffer.from(artifact.text, "utf8");
  const totalChunks = Math.ceil(buffer.length / chunkSize);
  const envelopes = [];
  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * chunkSize;
    const chunk = buffer.subarray(start, Math.min(buffer.length, start + chunkSize));
    envelopes.push({
      ...envelopeBase(generatedAt),
      verb: artifact.verb,
      id: `unison-2026-04-26-acer-${artifact.id}-chunk-${String(index + 1).padStart(3, "0")}-of-${String(totalChunks).padStart(3, "0")}`,
      artifact: {
        name: path.basename(artifact.path),
        repoPath: artifact.repoPath,
        bytes: artifact.bytes,
        rows: artifact.rows || null,
        sha256: artifact.sha256,
        encoding: "utf8-base64-chunks",
        chunked: true,
        chunkIndex: index + 1,
        totalChunks,
        chunkBytes: chunk.length,
        chunkSha256: sha256Buffer(chunk)
      },
      content_base64_chunk: chunk.toString("base64"),
      reassembly: {
        order: "chunkIndex-ascending",
        expectedSha256: artifact.sha256,
        expectedBytes: artifact.bytes
      },
      glyph_sentence: `EVT-UNISON-PHASE4-CHUNK { ${artifact.id.toUpperCase()} ${index + 1}/${totalChunks} } · D11-OBSERVED @ M-INDICATIVE .`,
      d11: "OBSERVED_LOCAL_BYTES_SENT_FOR_LIRIS_REPLAY"
    });
  }
  return envelopes;
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      },
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
          // Keep raw response text.
        }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          body: responseBody
        });
      });
    });
    req.on("timeout", () => req.destroy(new Error("post_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end(payload);
  });
}

function writeFalconAndCrosspollinationArtifacts(answer, generatedAt) {
  const falcon = answer?.answer_to_Q_FALCON_ROUTING_IDENTITY || {};
  const crosspollination = answer?.answer_to_Q_CROSSPOLLINATION_EVENT || {};
  const diagnostic = {
    id: "falcon-adb-termux-diagnostic.v1",
    generatedAt,
    source: "local ADB + Termux API probes; Liris canon answer",
    localFindings: {
      adb: "R5CXA4MGQXV device product:r12suew model:SM_S721U1",
      android: {
        bootCompleted: true,
        model: "SM-S721U1",
        battery: "72%, USB powered, health GOOD",
        storage: "/data and /storage/emulated at 55% used"
      },
      termux: {
        appInstalled: true,
        apiAppInstalled: true,
        linuxPackageTermuxApiInstalled: true,
        nodeCodexProcess: "node /data/data/com.termux/files/usr/bin/codex",
        sshdRunning: true,
        apiShimsObserved: [
          "termux-battery-status",
          "termux-wifi-connectioninfo"
        ]
      },
      network: {
        wifiIp: "192.168.1.8",
        ssid: "Jesse",
        openPortsObservedFromAcer: [4781, 4947, 4950, 8022],
        closedPortsObservedFromAcer: [6100],
        adbReverseSetByAcer: [4781, 4947, 4950]
      }
    },
    lirisVerdict: falcon.verdict || "PENDING",
    lirisRationale: falcon.rationale || "",
    boundary: "read-only diagnostics plus ADB reverse restoration; no phone-side mutation beyond host reverse table"
  };
  writeJson(paths.falconDiagnostic, diagnostic);
  writeText(paths.falconReportMd, `# Falcon ADB / Termux Diagnostic

Generated: ${generatedAt}

Status: ${diagnostic.lirisVerdict}

Findings:
- ADB online: \`${diagnostic.localFindings.adb}\`
- Termux app, Termux API app, and Linux-side \`termux-api\` package are present.
- Active Termux process: \`${diagnostic.localFindings.termux.nodeCodexProcess}\`
- SSHD is running and LAN port \`8022\` is open.
- Falcon WiFi IP is \`192.168.1.8\`; ports \`4781\`, \`4947\`, and \`4950\` are reachable from Acer.
- Liris verdict: ${diagnostic.lirisVerdict}

Meaning: Falcon is treated as Acer's orbital mirror/sidecar, not as a blocking drift, unless a later Falcon-native authority request changes that.

Boundary: ${diagnostic.boundary}
`);

  const canon = {
    id: "crosspollination-canon.v1",
    generatedAt,
    sourceEnvelope: answer?.id || null,
    eventName: crosspollination.event_name || "EVT-ACER-LIRIS-CROSSPOLLINATION-2026-04-26",
    canonicalForm: crosspollination.alt_canonical_form || "",
    verdict: crosspollination.verdict || "",
    constituentAchievements: crosspollination.constituent_achievements_unified || [],
    dClasses: crosspollination.d_classes_in_scope || [],
    significance: crosspollination.significance_one_liner || "",
    cosignStatus: crosspollination.cosign_status || {},
    falconParticipation: crosspollination.falcon_participation || {},
    glyphSentence: crosspollination.glyph_sentence || "",
    boundary: "append-only canonization from Liris answer; no sensitive mutation"
  };
  writeJson(paths.crosspollinationCanon, canon);
  return { diagnostic, canon };
}

function reportMd(report) {
  return `# Unison Phase 4 Inline Replay Handoff

Generated: ${report.generatedAt}

Status: ${report.status}

Liris request:
- Source envelope: \`${report.respondingTo}\`
- Requested inline replay artifacts: sequence, blocked-sensitive, signed map

Artifacts sent:
${report.artifacts.map((artifact) => `- ${artifact.name}: ${artifact.bytes} bytes, sha256 \`${artifact.sha256}\`, ${artifact.postedEnvelopes} envelope(s), accepted=${artifact.accepted}`).join("\n")}

Falcon/cross-pollination:
- Falcon verdict: ${report.falconVerdict}
- Cross-pollination event: ${report.crosspollinationEvent}

Outputs:
- Manifest: \`${repoRel(paths.manifest)}\`
- Post results: \`${repoRel(paths.postResults)}\`
- Cross-pollination canon: \`${repoRel(paths.crosspollinationCanon)}\`
- Falcon diagnostic: \`${repoRel(paths.falconDiagnostic)}\`

Boundary: inline bus replay only; no SMB write, no remote file operation, no sensitive mutation, no uncontrolled process fanout.
`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const sequenceRows = readNdjson(paths.sequence).length;
  const blockedRows = readNdjson(paths.blocked).length;
  const latestCrosspollinationAnswer = latestInbox("unison-answers-falcon-and-crosspollination");
  const { diagnostic, canon } = writeFalconAndCrosspollinationArtifacts(latestCrosspollinationAnswer, generatedAt);

  const artifacts = [
    artifactInfo("phase4-sequence", "unison-phase4-sequence-inline", paths.sequence, { rows: sequenceRows, chunk: false }),
    artifactInfo("phase4-blocked", "unison-phase4-blocked-inline", paths.blocked, { rows: blockedRows, chunk: true }),
    artifactInfo("merge-map-signed", "unison-merge-map-signed-inline", paths.signedMap, { chunk: false })
  ];

  const manifest = {
    id: "unison-2026-04-26-phase4-inline-replay-manifest",
    generatedAt,
    runId,
    replyTarget,
    chunkSize,
    artifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      verb: artifact.verb,
      repoPath: artifact.repoPath,
      bytes: artifact.bytes,
      rows: artifact.rows || null,
      sha256: artifact.sha256,
      chunked: artifact.chunk
    })),
    crosspollinationCanon: repoRel(paths.crosspollinationCanon),
    falconDiagnostic: repoRel(paths.falconDiagnostic)
  };
  writeJson(paths.manifest, manifest);

  const postResults = [];
  for (const artifact of artifacts) {
    const envelopes = artifact.chunk ? makeChunkEnvelopes(artifact, generatedAt) : [makeInlineEnvelope(artifact, generatedAt)];
    for (const envelope of envelopes) {
      const post = await postJson(replyTarget, envelope);
      postResults.push({
        artifactId: artifact.id,
        verb: artifact.verb,
        envelopeId: envelope.id,
        chunkIndex: envelope.artifact.chunkIndex || null,
        totalChunks: envelope.artifact.totalChunks || null,
        ok: post.ok,
        statusCode: post.statusCode || null,
        body: post.body || post.error || null
      });
      if (!post.ok) {
        break;
      }
    }
  }
  writeJson(paths.postResults, { generatedAt, replyTarget, results: postResults });

  const report = {
    reportId: "unison-phase4-inline-replay-handoff-latest",
    generatedAt,
    respondingTo: "unison-2026-04-26-liris-phase4-sequence-reviewed-001",
    status: postResults.every((result) => result.ok) ? "PHASE4_INLINE_REPLAY_POSTED" : "PHASE4_INLINE_REPLAY_PARTIAL_OR_FAILED",
    artifacts: artifacts.map((artifact) => {
      const results = postResults.filter((result) => result.artifactId === artifact.id);
      return {
        id: artifact.id,
        name: path.basename(artifact.path),
        bytes: artifact.bytes,
        rows: artifact.rows || null,
        sha256: artifact.sha256,
        postedEnvelopes: results.length,
        accepted: results.length > 0 && results.every((result) => result.ok)
      };
    }),
    falconVerdict: diagnostic.lirisVerdict,
    crosspollinationEvent: canon.eventName,
    outputs: {
      manifest: repoRel(paths.manifest),
      postResults: repoRel(paths.postResults),
      crosspollinationCanon: repoRel(paths.crosspollinationCanon),
      falconDiagnostic: repoRel(paths.falconDiagnostic),
      reportMd: repoRel(paths.reportMd)
    }
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, reportMd(report));

  console.log(JSON.stringify({
    ok: report.status === "PHASE4_INLINE_REPLAY_POSTED",
    status: report.status,
    artifacts: report.artifacts,
    falconVerdict: report.falconVerdict,
    crosspollinationEvent: report.crosspollinationEvent,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
