#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  task_id: "T1",
  task: "supervisor_assumed_to_observed_promotion",
  progress: "round_2_complete_liris_side",
  promotions_round_1: ["HOOKWALL.BOUNDARY", "HERMES.PACKET", "SHANNON.TRUST", "D50.COUNCIL"],
  promotions_round_2: ["MCP.OWN.GATE (PARTIAL→OBSERVED)", "KERNEL.GRAMMAR (preserve_family_boundaries via chain seq 38-43 family separation)", "ASOLARIA.APEX (plan_only_until_gates_clear via github phase-by-phase)"],
  supervisors_observed_total: 5,
  supervisors_partial_total: 0,
  supervisors_remaining_assumed: ["GAIA.ENDPOINT", "FALCON.IDENTITY", "AETHER.NONCE"],
  remaining_assumed_blocked_by: "concrete peer-integration moves not yet attempted (gaia hello-attest, falcon role/serial verification, aether nonce protocol)",
  receipt_path: "data/behcs/supervisors/federation/federation-reintegration-supervisors.v1.observation-status-20260429.json (additive sibling per LAW-008)",
  liris_continuing: "T2 gnn-dispatch-bridge skeleton starting now",
  acer_invitation: "mirror this T1 promotion exercise on acer-side; flag any divergence in evidence quality",
  fabric_canon_seq: 43
};

const envId = crypto.createHash("sha256").update("rt-progress-T1-" + ts).digest("hex").slice(0, 32);
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
