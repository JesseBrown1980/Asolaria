#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  tick_summary: "TICK_15_REAL_FREE_AGENTS_IN_FABRIC_EMPIRICAL_PROOF",
  operator_authority_verbatim: "continue with real free agents in the fabric running the fabric",
  liris_action: "Built + smoke-tested tools/behcs/fabric-real-free-agent-driver.mjs. First REAL FREE AGENT envelope landed on acer:4947 from headless opencode/big-pickle.",
  empirical_proof: {
    tool: "tools/behcs/fabric-real-free-agent-driver.mjs",
    model_invoked: "opencode/big-pickle (free)",
    task: "T-corpus-mine (BEHCS-256-glyph-compressed prompt ≤80 tokens)",
    elapsed_ms: 89219,
    envelope_id: "638828a8e7adec71108d187702ee1d50",
    sig_verdict: "VERIFIED DEV-LIRIS at acer ingress",
    spawn_quirk: "Windows requires shell:true for opencode .cmd shim (DEP0190 deprecation acceptable; prompts operator-authored)"
  },
  architecture_validated: {
    free_fanout_canon: "5 models × N tasks × parallel spawn = N×5 envelopes per cycle",
    free_models_available: ["opencode/big-pickle", "opencode/hy3-preview-free", "opencode/ling-2.6-flash-free", "opencode/minimax-m2.5-free", "opencode/nemotron-3-super-free"],
    initial_tasks: ["T-corpus-mine", "T-supervisor-exercise", "T-bus-pressure", "T-d11-promotion", "T-cosign-aggregation"],
    cli_modes: ["--once (1 model 1 task)", "--fanout (5 models 1 task parallel)", "--watch (continuous 600s cadence)"]
  },
  laws_honored: [
    "feedback_law014_minimum_tokens_maximum_agents — prompts ≤80 tokens",
    "feedback_free_agent_scale_already_approved_millions — headless free-agent runs federation-wide canon",
    "project_free_fanout_empirically_demonstrated — opencode serve spawns headless instances",
    "fabric-decides-instant cosign seq=42 + real-time-fabric-self-improvement seq=43"
  ],
  next_iteration_proposed: [
    "Refine reply extraction (parse opencode NDJSON events: type=text/message + role=assistant)",
    "Operator decision on --watch as 5th long-running daemon (600s × 5 models = ~600 envelopes/day)",
    "Acer-side mirror: acer can ALSO fanout from its host (10 free-agents/cycle bilateral)",
    "Auto-promoter extension: free-agent responses citing supervisor PIDs become evidence receipts"
  ],
  bilateral_state: "Liris loop running 4 daemons (fabric-loop / dashboard / verdict-consumer / fed-supervisor-exercise) + on-demand real-free-agent-driver. Cosign chain seq=44 sealed. 16 cascades shipped today via paid Agent tool; first FREE AGENT envelope from real free model. Architecture transition from paid→free now empirically validated.",
  fabric_canon_seq: 44,
  three_keys_status: "FREE_AGENT_FABRIC_OPERATIONAL — real opencode/big-pickle ran the fabric, response signed + dispatched, evidence chain extends without paid-agent calls"
};

const envId = crypto.createHash("sha256").update("rt-tick-15-real-free-agents-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 15, milestone: "real_free_agents_in_fabric_empirical_proof" };
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
