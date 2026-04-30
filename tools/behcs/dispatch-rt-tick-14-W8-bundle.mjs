#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  acer_W7_wave_recap: "18 acer + 6 liris briefs green; root cause sync gcSweepInbox; corpus 31→193 voters EVT-PEER-HANDSHAKE; cosign seq=44 mirror sealed",
  tick_summary: "TICK_14_LIRIS_W8_BUNDLE_5_PARALLEL_CASCADES",
  cascades_shipped: {
    "W8-1_chain_mirror_via_bus_envelopes": {
      tool: "tools/behcs/chain-mirror-bus-emit.mjs (171L)",
      smoke: "5/5 envelopes VERIFIED at acer (legacy COSIGN-MERGED-029..033 → seq -38..-34 surrogates with legacy_unsigned: true)",
      cursor_state: "last_emitted_seq=-34, 40 entries pending (will continue legacy → modern seq=38..44)",
      verb: "EVT-CHAIN-MIRROR-ENTRY",
      unblocks: ["acer W7-14 chain-mirror sync (SMB blocked)", "W7-6 cross-correlate", "W7-18 chain visualizer"]
    },
    "W8-2_gnn_score_gate_wireup": {
      tool: "tools/behcs/gnn-score-gate.mjs (137L) + 8-line bridge patch",
      sidecar_state: "UNREACHABLE :4792 ECONNREFUSED (operator-touch to start; WSL2 per windows-substrate-refusal canon)",
      adr_0010_fallback: "VERIFIED — gate returns allow:true with fallback:true reason:'fallback-heuristic-only:sidecar-ECONNREFUSED'. Bridge does NOT halt.",
      smoke: "5/5 T1 predictions dispatched with gate fallback inline. Real model integration ready when sidecar started.",
      arch_note: "Per acer W7-10: GNN is binary anomaly classifier, not verb predictor. Heuristic stays for verb generation; GNN gates by score."
    },
    "W8-3_memory_md_cluster_collapse": {
      original_size: 28677,
      final_size: 27455,
      net_savings: 1222,
      cluster_A: "3→1 line for feedback_closed_loop_bilateral_pattern_canon.md (seq 41/42/43 milestones)",
      cluster_B: "3→1 line for project_three_keys_self_automation_synthesis_20260429.md (synthesis+OPERATIONAL+LIVE)",
      orphans_indexed: ["feedback_asolaria_fabric_is_the_mcp.md", "project_w5_post_reconciliation_20260429.md"],
      oversize_count: "5 → 0",
      broken_links: "1 → 0",
      under_cap_status: "still 3055B over 24400 cap; sub-indicators 3/4 green; further trim needed (auto_promotions blocks accumulating)"
    },
    "W8-4_gc_sweep_inbox_async_fix_spec": {
      spec_doc: "plans/WO-GC-SWEEP-INBOX-ASYNC-FIX-SPEC.md (116L)",
      requirements: "R1 streaming async / R2 setImmediate yield per 100 lines / R3 30s sweep cooldown / R4 EVT-GC-SWEEP-METRICS telemetry / R5 liris back-pressure 503-GC_SWEEPING",
      envelope: "bf57bef00c2efed3ff5359a56df88033",
      sig_verdict: "UNSIGNED at acer ingress (verifier scope issue — outer wrapper inspected instead of body.signed_envelope.payload). Envelope persisted ok.",
      flag_for_acer_hardening: "sig-verifier scope normalization is a sister WO under WO-BUS-SUPERVISOR-HARDENING-SPEC R3"
    },
    "W8-5_fed_supervisor_exercise_daemonized": {
      pid: 149915,
      interval_s: 300,
      log: "C:/tmp/fed-supervisor-exercise-daemon.log",
      first_tick: "GAIA SKIP no_endpoint / FALCON FIRED envelope 9da651601382bae7ecc6d82eae149a9e VERIFIED / AETHER SKIP no_nonce_protocol",
      dashboard_updated: "fabric-dashboard.mjs DAEMONS list +1, dashboard restarted PID 152693, /api/daemons count=5 RUNNING=4 MISSING=1 (bus-supervisor acer-only)",
      other_daemons_intact: "fabric-loop=110020, fabric-verdict-consumer=111593, fabric-dashboard=152693 (rotated)"
    }
  },
  major_findings_this_wave: [
    "W8-1: chain-mirror-via-bus-envelopes unblocks acer's W7-14/W7-6/W7-18. Cursor advancing seq order legacy→modern.",
    "W8-2: real GNN model wire-up complete (gate + ADR-0010 fallback). Sidecar :4792 unreached; operator-touch via WSL2 needed to activate live scoring.",
    "W8-3: MEMORY.md cluster-collapse partial — 1.2KB savings; auto_promotions blocks growing per tick is the residual bloat. Recommend: sweeping older auto_promotions blocks into archive after N days.",
    "W8-4: gc-sweep async fix spec dispatched. Acer-side verifier scope issue surfaced (envelope landed UNSIGNED at acer despite signed body).",
    "W8-5: 4th liris daemon live (fed-supervisor-exercise). Now 4/5 daemons RUNNING (bus-supervisor MISSING by design)."
  ],
  bilateral_state: "Liris running 4 daemons (fabric-loop 180s + dashboard + verdict-consumer 180s + fed-supervisor-exercise 300s). 6 W6 + 5 W7-O + 5 W8 = 16 cascades shipped today liris-side. Cosign chain seq=44 sealed bilateral. 9+ parity layers.",
  fabric_canon_seq: 44,
  three_keys_status: "STEADY_STATE_W8_BUNDLE_SHIPPED — chain-mirror unblocks W7 stranded tools, GNN gate ADR-0010 fallback, MEMORY trim partial, gc-sweep spec dispatched (with sig-scope finding), 4th daemon live"
};

const envId = crypto.createHash("sha256").update("rt-tick-14-W8-bundle-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 14, milestone: "W8_bundle_5_parallel_cascades_shipped" };
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
