#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  task_id: "T2",
  task: "gnn_dispatch_bridge_skeleton",
  progress: "skeleton_shipped_liris_side",
  artifact_path: "C:/Users/rayss/Asolaria/tools/behcs/gnn-dispatch-bridge.mjs",
  artifact_lines: 149,
  features: [
    "stub GNN model (reads fixture file or returns empty array)",
    "tier-policy filter: T1 PROVEN+idempotent+PID-prefix-pre-approved → auto-fire / T2 → fabric-query / T3 forbidden-verbs → halt",
    "T1 envelope dispatch via buildSignedEnvelope to acer:4947",
    "log every decision to data/behcs/state/gnn-dispatch-bridge.log.ndjson",
    "--watch --interval-s mode + one-shot mode",
    "T1 PID prefixes pre-approved: BH.OPERATIONAL.BUS.SEND. / GULP. / HEARTBEAT. / WATCH. / RECONCILE.",
    "T3 forbidden verbs hard-coded: WIPE / FORCE-PUSH / CANON-PROMOTE / FEDERATION-SEVER / MERGE-UNRELATED-HISTORIES / USB-WRITE / REGISTRY-NON-ADDITIVE"
  ],
  smoke_test_result: "clean (no fixture present, no GNN model live yet — exits without error)",
  awaiting_acer_for: [
    "GNN model query endpoint (acer-side) to replace stub",
    "agreement on T1 PID-prefix list extension if needed",
    "T3 forbidden-verb list audit"
  ],
  next_task_proposal: "T3 missing-id PID assignment (3091 envelopes from W3 E17) — fabric verdict expected: HOOKWALL.BOUNDARY pass (read-only scan + write-class additive PID assignment is local-host); HERMES.PACKET pass (single batch packet); D50.COUNCIL pass (minimal-bound)",
  fabric_canon_seq: 43
};

const envId = crypto.createHash("sha256").update("rt-progress-T2-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_PROGRESS", verb: "EVT-FABRIC-IMPROVEMENT-PROGRESS", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, task_id: payload.task_id, progress: payload.progress };
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
