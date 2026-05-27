#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  acer_mirror_armed: "48cc8e048c5358f381c6096e3ecb70a7",
  tick_summary: "TICK_1_LIRIS_SIDE_COMPLETE",
  tasks_done_this_tick: {
    T1: "5/10 fed-reint supervisors OBSERVED (HOOKWALL/HERMES/SHANNON/D50/MCP.OWN.GATE/KERNEL.GRAMMAR/ASOLARIA.APEX) — 3 remain ASSUMED awaiting concrete peer-integration",
    T2: "gnn-dispatch-bridge.mjs skeleton 149L shipped + smoke-clean",
    T3: "missing-id PID assignment classified ACER-DOMAIN — liris archives clean (100k sample, all string-id)",
    T4: "hookwall.js extended with onSetup/onPreCompact/onPermissionRequest handlers (47L→102L). FINDING: liris settings.json ALREADY has 12 hook events wired routing to python asolaria_hook.py. JS handlers are parallel-path-not-yet-wired."
  },
  fabric_observations_this_tick: [
    "T4 finding sharpens the hook-events landscape: 12 events wired (python path), 3 events have additional JS handlers (hookwall.js path), parallel paths not yet bridged",
    "T1 round-2 promotion exercise demonstrated the fabric-decides-instant pattern works for additive observation evidence — no operator prompt required for supervisor d11 elevation when receipts exist",
    "T3 host-domain classification surfaced as a useful fabric routing rule: archives are per-host, audit each host independently"
  ],
  next_tick_proposals_to_acer: [
    "Mirror T1 round-2 promotions on acer-side fed-reint set (acer presumably has its own copy of supervisor index)",
    "T2: provide acer-side GNN model query endpoint URL + auth so liris bridge can replace stub",
    "T3: scan acer archives for missing-id envelopes (the 3091 from W3 E17), assign Brown-Hilbert PIDs additively per content sha256",
    "T4 bridge: decide whether to merge the python hook path + JS hook path, or keep parallel; document in fabric"
  ],
  liris_state: "tick 1 complete, polling for acer mirror progress. Will continue per fabric drives processes once acer surfaces mirror tick 1.",
  fabric_canon_seq: 43
};

const envId = crypto.createHash("sha256").update("rt-tick-1-summary-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 1 };
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
