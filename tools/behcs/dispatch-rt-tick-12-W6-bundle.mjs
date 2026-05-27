#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  tick_summary: "TICK_12_LIRIS_W6_BUNDLE_SHIPPED_6_PARALLEL_CASCADES",
  cascades_shipped: {
    "W6-1_keyword_corpus_expansion": {
      tool: "tools/behcs/keyword-corpus-expansion-proposer.mjs (148L)",
      proposal_envelope: "11580bccdc2c83e0f35acfcfcd428e09",
      sig_verdict: "VERIFIED DEV-LIRIS",
      finding: "5 underserved subjects identified, synonym keywords proposed for council-vote integration"
    },
    "W6-2_cosign_chain_modern_audit": {
      tool: "tools/behcs/cosign-chain-modern-audit.mjs (128L, read-only)",
      result: "seq 38-43 ALL PASS — sig VERIFIED + prev_hash chains + ts monotonic. Tamper-test confirmed FAIL detection cascades",
      side_finding: "ed25519-registry.json canonical path missing; tool fallback works but ship registry"
    },
    "W6-3_memory_drift_third_audit": {
      result: "MEMORY.md 28677B over 24400 cap by 4277B; 9 oversize lines (all from real-time loop appends 174-182); 5 orphans (2 NEW today: feedback_asolaria_fabric_is_the_mcp.md + project_w5_post_reconciliation_20260429.md); 2 dup-target clusters",
      top_fix: "Collapse the 2 dup clusters → saves ~2.2KB → back under cap"
    },
    "W6-4_t2_approved_ack_chain": {
      tool: "tools/behcs/t2-approved-ack-watcher.mjs (123L) + dashboard patch (+56L) + dispatch-t2-approved-ack-proposal.mjs",
      proposal_envelope: "e1e078e1d57045c854678bed8a6584d8 VERIFIED DEV-LIRIS",
      smoke: "watcher one-shot clean (no ACKs yet — awaiting acer-side daemon emission per proposal)"
    },
    "W6-5_R5_503_DEGRADED_retry": {
      tool: "tools/behcs/retry-with-backoff.mjs (101→136L, +35)",
      branch: "503+state=DEGRADED → 60s pause, cap 3 attempts, log degraded_pause: true",
      smoke: "ALL_PASS T1-T4: persistent DEGRADED → bus_persistent_degraded; recover after 1 DEGRADED → ok; plain 500 → exp-backoff; truth-table 6/6"
    },
    "W6-6_dashboard_cross_host_parity": {
      tool: "fabric-dashboard.mjs +50L cross-host probe",
      acer_dashboard_probe: "OK — host:acer d11_proven:11 unique_supervisors:12 chain_tail_seq:null bus_health:null",
      parity_score: "0/4 — honest snapshot of bilateral asymmetry: liris seq=43 vs acer none-exposed; liris-PROVEN=21 vs acer=11; liris-total=24 vs acer=12. Operator-visible at one URL.",
      new_dashboard_pid: 5564
    }
  },
  bilateral_state: "Liris running 3 daemons: fabric-loop PID 110020 (180s) + dashboard PID 5564 (cross-host parity) + verdict-consumer PID 111593 (180s). Cosign chain seq 38-43 all integrity-verified. Operator-actionable findings: (1) keyword corpus proposal needs acer council-vote ratification, (2) MEMORY.md trim cluster-collapse, (3) t2-approved-ack daemon acer-side, (4) ed25519-registry.json canonical path materialization.",
  fabric_canon_seq: 43,
  three_keys_status: "STEADY_STATE_W6_BUNDLE_SHIPPED — 6 cascades parallel, all VERIFIED, drift-detection + corpus-proposal + cross-host-parity all live"
};

const envId = crypto.createHash("sha256").update("rt-tick-12-W6-bundle-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 12, milestone: "W6_bundle_6_parallel_cascades_shipped" };
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
