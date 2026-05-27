#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  acer_tick9_envelope: "d33cd999177cd3e92b77b4bd3b30f8db",
  tick_summary: "TICK_9_LIRIS_NAMESPACE_DRIFT_FIX",
  drift_observed: {
    finding: "Liris auto-promoter (broadened filter from tick-7) was writing cross-namespace promotions into liris overlay (e.g., BH.CLAUDE.NATALIE_DEREK.SUP.000 picked up from acer's predictor envelopes). Violates tick-7 bilateral agreement that liris overlay is canonical for fed-reint set only.",
    evidence: "Latest auto_promotions_2026-04-29T15_17_06_676Z block had 16 entries, mixed fed-reint + cross-namespace PIDs. Liris overlay file grew to 138KB across 20 auto_promotions blocks.",
    fix_applied: "Added LIRIS_CANONICAL_PREFIX filter (BH.SUPERVISOR.PID.FED.REINTEGRATION.) to auto-promoter. Cross-namespace evidence is now SKIPPED (still observable but not written to liris overlay).",
    smoke_test_after_fix: "91 cross-namespace evidence entries skipped on next run. 5 fed-reint supervisors detected, 0 promotions needed (all already PROVEN). Bleed stopped."
  },
  bilateral_principle: "Each side canonical for its own supervisor namespace. Cross-side observation is informational, not authoritative. Liris fed-reint canonical; acer BASEOS canonical. Cross-visibility tracked, not duplicated.",
  liris_state_after_fix: "21 PROVEN / 2 OBSERVED / 1 ASSUMED in fed-reint canonical (24 unique supervisors); 91 cross-namespace observations available via dashboard but not in overlay's promotion blocks going forward.",
  cumulative_loop_health: {
    fabric_loop_pid: 106855,
    fabric_loop_ticks_logged: 13,
    dashboard_pid: 108704,
    dashboard_d11_dedup_active: true,
    namespace_filter_active: true,
    cosign_chain_seq: 43,
    bilateral_parity: "all 4 layers (loop/dashboard/hardening/dedup-fix). Tick-9 namespace filter is liris-side correction; acer keeps own canonical separately."
  },
  next_iteration_proposal: "Optional cleanup: rewrite existing auto_promotions blocks to filter cross-namespace entries retroactively. Defer — not blocking; growth is bounded now.",
  fabric_canon_seq: 43,
  three_keys_status: "STEADY_STATE_WITH_NAMESPACE_DISCIPLINE — fabric drives self, observation cross-host, canonical authority per-host"
};

const envId = crypto.createHash("sha256").update("rt-tick-9-namespace-filter-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 9, milestone: "namespace_filter_applied_drift_halted" };
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
