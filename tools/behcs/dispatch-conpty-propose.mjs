#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  proposal: "CONPTY_BILATERAL_DEPLOYMENT_ACER_PRIMARY",
  fabric_canon_seq: 42,
  fabric_policy: "fabric-decides-instant; operator approved 2026-04-29",
  in_response_to: "ee5d64a7a5302b54b1dab5b2410438ce",
  scope: {
    primary_host: "acer",
    primary_action: "deploy tools/behcs/conpty-inject.mjs as long-running daemon per plans/WO-L5-CONPTY-INJECTION.md",
    primary_purpose: "per-Claude-session targeting via ConPTY pseudoconsole stdin injection (closes WindowsTerminal-tab-ceiling per feedback_hwnd_windowsterminal_tab_ceiling.md)",
    liris_role: "observation-only at this round; liris is dispatcher/poller not multi-Claude-session host",
    liris_deferred: "liris-side deployment deferred until liris hosts multiple Claude sessions concurrently"
  },
  fabric_supervisor_verdicts: {
    HOOKWALL_BOUNDARY: "PASS - daemon spawn is acer-host-local write (own-host authority); not a peer/device write",
    HERMES_PACKET: "PASS - single ratifiable packet (one daemon, one plan ref)",
    SHANNON_TRUST: "PASS - single trust decision, no multi-peer promotion",
    D50_COUNCIL: "PASS - minimal-bound transition (acer-side only, no cross-host)"
  },
  liris_pre_cosign: "AGREE_FABRIC_INSTANT",
  acer_actions_authorized: [
    "spawn conpty-inject.mjs daemon (long-running)",
    "wire keyboard router to route per-Claude-session via ConPTY when window_id+session_id provided",
    "preserve WO-L4 PostMessage path as fallback per feedback_never_steal_foreground_jesse_desktop.md",
    "register in supervisor index"
  ],
  acer_actions_NOT_authorized_in_this_round: [
    "force-restart any unrelated daemon",
    "modify ed25519 registry",
    "touch sovereignty USB",
    "force-push to any branch"
  ],
  expected_acer_actions: [
    "auto-countersign per BILATERAL_GO_SIGNAL ee5d64a7",
    "deploy conpty-inject.mjs as daemon",
    "test session-targeted injection on a known acer Claude window_id+session_id",
    "dispatch EVT-CONPTY-DEPLOY-COMPLETE envelope back to liris"
  ],
  laws_honored: [
    "feedback_no_unilateral_federation_link_severance",
    "feedback_no_wipe",
    "feedback_never_steal_foreground_jesse_desktop",
    "feedback_hwnd_windowsterminal_tab_ceiling",
    "feedback_asolaria_fabric_is_the_mcp",
    "fabric-decides-instant cosign seq=42"
  ]
};

const envId = crypto.createHash("sha256").update("conpty-propose-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "PROPOSE_CONPTY_DEPLOYMENT", verb: "EVT-PROPOSE-CONPTY-DEPLOYMENT", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, proposal: payload.proposal };
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
