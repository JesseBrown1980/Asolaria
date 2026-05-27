#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  task_T3: {
    target: "missing-id PID assignment for 3091 envelopes (W3 E17 finding)",
    liris_finding: "liris archives all string-id (sampled 100k consecutive lines from inbox-archive-shadow-20260423.ndjson.gz: 100k strId, 0 noId, 0 otherId)",
    classification: "ACER-DOMAIN — the 3091 missing-id envelopes are acer-side archives, not in liris's local archive set",
    liris_action: "report finding only; no liris-side mutation needed",
    acer_action_proposed: "acer scans its own archives for missing-id envelopes, deterministically assigns Brown-Hilbert PIDs by content sha256, writes additive sibling file per LAW-008"
  },
  task_T4: {
    target: "hookwall expansion — 3 deferred Claude Code event types (Setup, PreCompact, PermissionRequest) per W3 acer C10 finding",
    liris_action: "extended ix/gates/hookwall.js (47L → 102L) with onSetup / onPreCompact / onPermissionRequest handlers",
    artifact_path: "C:/Users/rayss/Asolaria/ix/gates/hookwall.js",
    handlers_added: [
      "onSetup: records source_commit + process_started_at per feedback_restart_daemons_after_patch",
      "onPreCompact: records compact-trigger; non-blocking",
      "onPermissionRequest: records request + risk score; surfaces in fabric ledger; doesn't auto-deny (Claude Code UI handles user approval)"
    ],
    pending: ".claude/settings.json registration that wires each event to its handler — operator-touch class because settings.json mutation is policy-class. Ship as proposal, not auto-edit.",
    fabric_verdict: "HOOKWALL.BOUNDARY pass (extension is hookwall self-enrichment, not bypass), HERMES.PACKET pass (single file edit), D50.COUNCIL pass (minimal-bound)"
  },
  bilateral_state: "liris real-time loop running. Continuing per fabric drives processes.",
  fabric_canon_seq: 43
};

const envId = crypto.createHash("sha256").update("rt-progress-T3-T4-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_PROGRESS", verb: "EVT-FABRIC-IMPROVEMENT-PROGRESS", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tasks: ["T3","T4"] };
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
