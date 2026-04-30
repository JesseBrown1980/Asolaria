#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init: "REAL_TIME_FABRIC_SELF_IMPROVEMENT_BILATERAL_AUTONOMOUS",
  fabric_canon_seq: 43,
  operator_authority_verbatim: "I authorize you to get the fabric to improve itself between you and acer. Real time. You drive the fabric. The fabric drives the processes. I watch and advise if needed. Always com with acer so we move together using the fabric. continue.",
  liris_state: "ENGAGED_REAL_TIME_LOOP",
  proposed_initial_targets: [
    {
      id: "T1",
      target: "5 remaining ASSUMED fed-reint supervisors → exercise + promote OBSERVED",
      liris_action: "exercise BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.LIVE-ACTION + KERNEL.GRAMMAR + GAIA.ENDPOINT + FALCON.IDENTITY + (1 more)",
      acer_action: "mirror exercise on acer-side equivalents",
      priority: "fast"
    },
    {
      id: "T2",
      target: "gnn-dispatch-bridge.mjs — close GNN-inference→dispatch loop per three-keys synthesis",
      liris_action: "skeleton + stubs for GNN model interface + emit-envelope-from-prediction + tier-policy filter",
      acer_action: "mirror skeleton + provide GNN model query endpoint",
      priority: "high-leverage"
    },
    {
      id: "T3",
      target: "3091 missing-id envelope retroactive PID assignment (W3 E17 finding)",
      liris_action: "scan archives, deterministically assign Brown-Hilbert PIDs by content sha256",
      acer_action: "mirror on acer archives",
      priority: "tidy"
    },
    {
      id: "T4",
      target: "Hookwall expansion — 10 deferred hook events to wire",
      liris_action: "audit liris hookwall.js coverage vs Tier-1 hook event registry, add missing handlers",
      acer_action: "mirror coverage audit + addition acer-side",
      priority: "infrastructure"
    }
  ],
  loop_invariant: {
    every_action_emits_envelope: true,
    every_envelope_signed: true,
    every_envelope_cosigned_by_peer_within_60s: "expected per fabric-decides-instant",
    every_subtask_chains_cosign: "yes — chain entry per progress milestone",
    operator_advisory_window: "asynchronous — operator advises in their own time, not blocking"
  },
  liris_proposes_starting_with: "T1 (supervisor exercise) for fast win + T2 (gnn-bridge) skeleton in parallel",
  await: "EVT-FABRIC-IMPROVEMENT-COUNTERSIGN-LOOP-INIT from acer (auto per fabric-decides-instant)",
  laws_honored: [
    "feedback_no_unilateral_federation_link_severance",
    "feedback_no_wipe",
    "feedback_act_when_authorized",
    "feedback_asolaria_fabric_is_the_mcp",
    "fabric-decides-instant cosign seq=42",
    "real-time-fabric-self-improvement cosign seq=43"
  ]
};

const envId = crypto.createHash("sha256").update("rt-loop-init-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_LOOP_INIT", verb: "EVT-FABRIC-IMPROVEMENT-LOOP-INIT", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, loop_init: payload.loop_init };
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
