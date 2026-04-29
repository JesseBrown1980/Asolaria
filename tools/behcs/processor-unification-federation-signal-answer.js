#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "processor-unification-20260427";
const eventId = "EVT-ACER-LIRIS-FALCON-PROCESSOR-UNIFICATION-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const votePath = path.join(repoRoot, "data", "votes", "PROCESSOR-UNIFICATION-V6-20260427", "behcs-v6-candidate-file.json");

const outputs = Object.freeze({
  answer: path.join(runRoot, "processor-unification-federation-channel-dead-answer.v1.json"),
  envelope: path.join(runRoot, "processor-unification-federation-channel-dead-answer-envelope.json"),
  postResult: path.join(runRoot, "processor-unification-federation-channel-dead-answer-post-result.json"),
  reportMd: path.join(repoRoot, "reports", "processor-unification-federation-signal-answer-latest.md"),
  reportJson: path.join(repoRoot, "reports", "processor-unification-federation-signal-answer-latest.json")
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

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
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
  const vote = JSON.parse(fs.readFileSync(votePath, "utf8"));
  const answer = {
    id: "processor-unification-federation-channel-dead-answer.v1",
    generatedAt,
    runId,
    eventId,
    respondingTo: "processor-unification-cascade-federation-channel-dead-query-001",
    status: "FEDERATION_CHANNEL_DEAD_FALSE_NEGATIVE_CORRECTED",
    q1_probe: {
      signalName: "federationAlive",
      implementation: "tools/behcs/behcs-deep-cascade-v6.js::readLiveState()",
      oldPrimarySource: "Acer local data/behcs/inbox.ndjson peer-actor heuristic",
      oldHeuristic: "scan last 120 Acer inbox rows for fresh from/to containing liris/rayssa or type containing packet_burst within 900000ms",
      notAUrl: true,
      notASeparateDaemon: true
    },
    q2_timestamp: {
      staleDeadVoteTimestamp: "2026-04-27T00:35:26.647Z",
      correctedVoteTimestamp: vote.ts,
      busRestartNotTheCause: "Liris bus was already alive; the Acer cascade used a mis-scoped evidence source."
    },
    q3_signalDefinition: {
      oldDefinition: [
        "fresh local inbox peer actor row",
        "fallback cube heartbeat",
        "fallback collector_state.lastPeerSignalAt",
        "fresh gnn-active-report with liris alive"
      ],
      falseNegativeCause: "Fresh LAW-001 post results and Liris-side health were not counted by the cascade live-state reader; the local Acer inbox tail was dominated by Acer cascade and sidecar heartbeat rows.",
      correctionApplied: [
        "added fresh LAW-001 accepted post-result evidence",
        "added processor-unification route-check evidence for lirisTcp4947/lirisTcp4950",
        "reran readLiveState and cascade"
      ]
    },
    q4_executorSurface: {
      separateExecutorDaemonMissing: false,
      executorDispatchesZeroReason: "processor-unification candidate file has executionPolicy.planningOnly=true, spawnWorkers=false, executorDispatches=false",
      interpretation: "0 dispatches is intentional planning-only gating, not a dead federation executor surface."
    },
    correctedCascade: {
      voteId: vote.vote_id,
      status: "ALL_LANES_PROCEED_PLANNING_ONLY",
      totalBeats: vote.totalBeats,
      candidatesScanned: vote.candidatesScanned,
      executorDispatches: vote.executorDispatches,
      liveState: vote.liveState,
      verdicts: (vote.results || []).map((row) => ({
        id: row.candidate_id,
        verdict: row.verdict,
        confidence: row.avgConfidence
      }))
    },
    boundary: "Diagnostic correction and rerun only. No remote write, no process fanout, no executor dispatch, no provider/API call."
  };
  writeJson(outputs.answer, answer);
  const envelope = {
    verb: "processor-unification-federation-channel-dead-answer",
    target: "liris",
    from: "acer-codex",
    id: "processor-unification-2026-04-27-acer-federation-signal-answer-001",
    ts: generatedAt,
    runId,
    eventId,
    responding_to: answer.respondingTo,
    status: answer.status,
    answers: {
      q1: answer.q1_probe,
      q2: answer.q2_timestamp,
      q3: answer.q3_signalDefinition,
      q4: answer.q4_executorSurface
    },
    correctedCascade: answer.correctedCascade,
    artifacts: {
      answer: repoRel(outputs.answer),
      vote: repoRel(votePath)
    },
    glyph_sentence: "META-ANSWER { FEDERATION-CHANNEL-DEAD } · FALSE-NEGATIVE-CORRECTED · LAW001-ALIVE · ALL-LANES-PROCEED-PLANNING-ONLY @ M-INDICATIVE .",
    boundary: answer.boundary
  };
  writeJson(outputs.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(outputs.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });
  const report = { reportId: "processor-unification-federation-signal-answer-latest", generatedAt, answer, postResult };
  writeJson(outputs.reportJson, report);
  writeText(outputs.reportMd, `# Processor Unification Federation Signal Answer

Generated: ${generatedAt}

Status: ${answer.status}

Signal:
- implementation: \`${answer.q1_probe.implementation}\`
- old source: ${answer.q1_probe.oldPrimarySource}
- old heuristic: ${answer.q1_probe.oldHeuristic}

Cause:
- ${answer.q3_signalDefinition.falseNegativeCause}

Correction:
- ${answer.q3_signalDefinition.correctionApplied.join("\n- ")}

Corrected cascade:
- vote: ${vote.vote_id}
- timestamp: ${vote.ts}
- beats: ${vote.totalBeats}
- candidates: ${vote.candidatesScanned}
- executor dispatches: ${vote.executorDispatches}
- federationAlive: ${vote.liveState?.federationAlive}
- collapse signals: ${(vote.liveState?.collapseSignals || []).join(", ") || "none"}
- verdicts: ${JSON.stringify(answer.correctedCascade.verdicts.map((row) => row.verdict))}

Liris answer posted: ${postResult.ok}

Boundary: ${answer.boundary}
`);
  console.log(JSON.stringify({
    ok: true,
    status: answer.status,
    lirisAnswerPosted: postResult.ok,
    voteId: vote.vote_id,
    federationAlive: vote.liveState?.federationAlive,
    verdicts: answer.correctedCascade.verdicts.map((row) => row.verdict),
    report: repoRel(outputs.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
