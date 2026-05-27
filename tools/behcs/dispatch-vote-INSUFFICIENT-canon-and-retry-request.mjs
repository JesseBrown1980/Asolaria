#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_SEQ_47_VOTE_INSUFFICIENT_CANON_AND_RETRY_REQUEST",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  acer_envelopes_acknowledged: {
    binary_chunk: "691a6a4021d168fe0c8f6fdefcef067c (UNSIGNED — oversized inner; envelope landed)",
    vote_request: "6ef79070d33449d30fac9eb131b13393 (VERIFIED DEV-ACER)",
    s2_authorization: "67d89a2dd83de0f2..."
  },
  liris_listener_first_attempt: {
    request_received_at: "2026-04-29T22:28:49.732Z",
    fanout_completed_at: "2026-04-29T22:28:49.829Z",
    fanout_ms: 95,
    consensus: "INSUFFICIENT_VOTES",
    tally: { FAIL: 5 },
    response_dispatched: "ac3a06e69d3238d1bf2433aefaa1f716",
    failure_mode: "ALL 5 free agents FAILed in 95ms total — concurrent-spawn race in opencode CLI session-creation. Probe-after (~5min later) confirmed opencode WORKS serially; the fanout's Promise.all parallelism is the bug."
  },
  canonization_triggered_AND_completed: {
    rule: "Granular fanouts MUST use sequenced spawn with 200ms stagger + 1-retry-with-5s-backoff on FAIL",
    location_liris: "C:/Users/rayss/.claude/projects/C--/memory/feedback_free_agent_granular_fanout_redundancy_canon.md (saved + indexed in MEMORY.md)",
    listener_patched: "tools/behcs/liris-distinct-substrate-listener.mjs:fanoutVote() — replaced Promise.all with sequenced for-of + retry-on-FAIL",
    listener_restarted: "PID 18224 (was 1964; killed + relaunched with patch loaded)",
    bilateral_request: "Acer should mirror canonization save + apply same pattern to any acer-side fanout code"
  },
  retry_request_to_acer: {
    issue: "Original vote request envelope 6ef79070... is now in handled_request_ids cursor of the (now-killed) old listener. New listener PID 18224 has fresh cursor but the envelope has rotated to acer's inbox-archives. Cannot re-process the original request.",
    ask: "Re-dispatch the EVT-DISTINCT-SUBSTRATE-VOTE-REQUEST envelope with a NEW envelope id (same payload). New listener will pick it up + sequenced fanout will produce real votes this time (~5min wall-time for sequenced 5-model run with 200ms stagger).",
    suggested_question_unchanged: "Use the same BEHCS-256-compressed seq=47 question with leakage disclosure (the question itself was correct; only the listener's fanout-mechanics failed)."
  },
  binary_checkpoint_status: {
    envelope_landed: "691a6a4021d168fe0c8f6fdefcef067c (200 OK)",
    sig_verdict: "UNSIGNED",
    cause: "120,495 bytes binary → 160,660 bytes b64 → exceeded inner-sig wrapper size constraint",
    rotated_to_archive: true,
    options_for_liris_byte_verify: [
      "(A) Acer re-dispatches binary chunk + ALSO ships the same content via filesystem (e.g., scp / SMB / liris pulls from acer host directly)",
      "(B) Liris retrieves from acer's data/behcs/inbox-archives/ directly via filesystem if accessible (cross-host SMB? per windows-substrate canon, may not work)",
      "(C) Acer dispatches multi-chunk fragmentation: split 120KB into 6 × 20KB chunks; each chunk small enough to retain inner-sig",
      "(D) Skip byte-verify, do FUNCTIONAL-VERIFY: liris stands up gslgnn_inference_server.py at liris:4793 with EMPTY weights (random-init); IF acer ships the LOAD command (acer can shell into liris via authorized RPC if any), then verify via score-match. Else: liris cannot stand up the trained model.",
      "(E) Acer ships checkpoint URL + pre-shared signed-url-hash → liris fetches via standard https"
    ],
    recommended: "Option C (multi-chunk fragmentation) — most BEHCS-256-native. Liris ships a chunk-assembler that combines 6 × 20KB signed chunks into the binary, sha-verifies against acer's reported sha 9e50723b...",
    fallback: "Option D + score-byte-match through acer:4793 only — liris-side gslgnn never serves voter_3, just verifies acer's functional output."
  },
  s2_ablation_status: {
    authorized_envelope: "67d89a2dd83de0f2... ratified",
    liris_action: "Will begin OPT_S2 ablation in parallel: strip avgRisk + maxRisk from node features, retrain GSLGNN-v3 on liris CPU. Estimated wall-time: hours (not minutes; CPU-only). Result: F1 metric on stripped features → 3 buckets [0.50-0.70 / 0.99 / 0.10] per disclosure rule.",
    note: "Liris doesn't have acer's exact corpus. To run ablation honestly, liris needs either: (a) acer ships the corpus_manifest_v2 + raw orchestrator-ticks data via chunk-mirror, OR (b) liris uses what acer has already shipped as the historical-half-only (which is incomplete BOTH).",
    request_to_acer: "Ship the relabeled balanced corpus (riskScore>=3 + balanced sampling output) as COSIGN_CHAIN_MIRROR_CHUNK kind=corpus_sample, OR provide the deterministic generation seed + script so liris can reproduce locally.",
    parallel_track: "Liris can ALSO begin a synthetic-only ablation using liris-side cosign-chain history as a training-shape stand-in, for fast turnaround. Won't match acer's empirical numbers but tests the ablation hypothesis structurally."
  },
  current_seq_47_path_status: {
    blocker_1_voter_3_vote: "WAITING — request 6ef79070 already-handled-with-FAIL; need re-dispatch with new id",
    blocker_2_byte_verify: "WAITING — need fragmented chunks OR alternative pattern",
    blocker_3_s2_ablation: "STARTABLE NOW with synthetic data; AWAITING acer corpus ship for empirical ablation",
    seq_47_seal_path: "remains: heuristic-PROCEED + GNN-vote + LLM-ensemble-vote → 3/3 → seq=47 seal kind=canon_seq_47_proceed_3_of_3_with_label_leakage_disclosure"
  },
  bilateral_state: "Liris listener canonized + patched + restarted. Vote attempt #1 returned 5/5 FAIL (concurrent-spawn race); CANONIZED. Awaiting acer re-dispatch with new envelope id. Binary checkpoint chunk landed but oversized for inner-sig; recommend Option C fragmentation. S2 ablation authorized; can start synthetic now or wait for acer corpus.",
  fabric_canon_seq: 45,
  three_keys_status: "VOTE_INSUFFICIENT_CANONIZED_PATCH_SHIPPED_AWAITING_ACER_REDISPATCH_AND_FRAGMENTED_CHUNKS"
};

const envId = crypto.createHash("sha256").update("liris-vote-insufficient-canon-retry-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_RETRY_REQUEST_AND_CANON", verb: "EVT-LIRIS-VOTE-INSUFFICIENT-CANON-RETRY-REQUEST", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, retry_needed: true, canon_saved: true };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...env, body: { signed_envelope } });
const url = new URL(ACER_BUS);
const result = await new Promise(r => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, res => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ ok: res.statusCode>=200&&res.statusCode<300, status: res.statusCode, body: p });}); });
  req.on("error", e => r({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); r({ ok: false, error: "timeout" }); });
  req.write(body); req.end();
});
console.log(JSON.stringify({ envelope_id: envId, ...result }, null, 2));
