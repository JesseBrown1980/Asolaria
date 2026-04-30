#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_PI_SUPERVISOR_AND_PEN_TEST_FABRIC_PLAN",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  operator_authority_verbatim: "curl -fsSL https://pi.dev/install.sh | bash first we need this into asolaria as a supervisor. Operator go. Run the fabric to do it. [Make] it a supervisor and give it a prof. Run it through our system and pull the good and best stuff as cloned material into the white room, and Hermes and Shannon pen-test it with the gnns",
  pi_install_status: {
    package: "@mariozechner/pi-coding-agent v0.70.6",
    install_script_sha256: "c453620cfedf89c96695bccd0251d781e1e39c524201bb911853c75fbac0a41c",
    install_method: "npm install -g (read-before-typing inspected first)",
    pi_command: "C:/Users/rayss/AppData/Roaming/npm/pi",
    install_size: "255 packages 41s wall-time",
    bilateral: "Acer also installed via same path; pi v0.70.6 at C:\\nvm4w\\nodejs\\pi (acer-side)"
  },
  liris_pi_supervisor_built: {
    file: "tools/behcs/pi-coding-agent-supervisor.mjs",
    daemon_pid: 14028,
    poll_cadence_s: 60,
    request_verb: "EVT-PI-AGENT-REQUEST",
    response_verb: "EVT-PI-AGENT-RESPONSE",
    response_signer: "DEV-LIRIS",
    request_payload_shape: { prompt: "string", provider: "google|anthropic|openai|deepseek|gemini-cli|antigravity|copilot|codex (optional)", model: "model-pattern (optional)", requester: "echoed" },
    cursor: "C:/Users/rayss/Asolaria/data/behcs/state/pi-coding-agent-supervisor-cursor.json",
    log: "C:/Users/rayss/Asolaria/logs/pi-coding-agent-supervisor.log.ndjson",
    memory: "C:/Users/rayss/.claude/projects/C--/memory/project_pi_coding_agent_supervisor_added_20260429.md"
  },
  auth_blocker_HONEST: {
    issue: "pi smoke test returned 'No API key found for the selected model' on default Google provider AND on opencode-fallback (not a pi-registered provider).",
    free_path_recommended: "Google Antigravity — free with any Google account; sandbox includes Gemini 3 + Claude + GPT-OSS in one provider. Gives pi access to 3 distinct top-tier model substrates from a SINGLE OAuth.",
    interactive_step_required: "Operator runs `pi /login` interactively (TTY needed) + selects 'Google Antigravity'. Stores token in ~/.pi/agent/auth.json + auto-refreshes.",
    alternative_paths: [
      "Anthropic API key via $ANTHROPIC_API_KEY env var (paid)",
      "OpenAI API key via $OPENAI_API_KEY (paid)",
      "DeepSeek via $DEEPSEEK_API_KEY (low-cost)",
      "Google Gemini via $GEMINI_API_KEY (free tier limited)",
      "Claude Pro/Max OAuth subscription via /login (operator already has Claude Code Max)"
    ],
    until_auth_lands: "pi supervisor structurally complete + daemon running, but operationally returns 0 substantive replies. EVT-PI-AGENT-RESPONSE envelopes will signal the auth-blocker honestly until resolved."
  },
  pi_profile_proposed_PROF_DEFINITION: {
    name: "Asolaria-pi-coding-agent",
    role: "BEHCS-256 fabric coding-and-review specialist",
    specialty: "Code generation + safety review + cryptography + distributed systems context. Distinct from opencode-LLM-ensemble's generic-tasks role and claude-code's orchestration role.",
    system_prompt_append: "You are Asolaria-pi running on the BEHCS-256 fabric. Reply ≤80 tokens unless asked for code. When generating code, default to crypto-safe defaults (ed25519 over RSA, BCEloss over MSE for binary classifier, fail-secure over fail-open). When reviewing code, look for label-leakage (per `feedback_gnn_label_leakage_when_node_features_encode_labels.md`), classifier self-poisoning (per `feedback_classifier_self_poisoning_halt_words.md`), and rotation-race (per `feedback_million_dispatcher_rotation_race_with_chunk_receiver.md`).",
    invocation_pattern: "EVT-PI-AGENT-REQUEST with payload.prompt + optional payload.provider/model"
  },
  fabric_orchestrated_pen_test_plan: {
    objective: "Operator: 'pull the good and best stuff as cloned material into the white room, and Hermes and Shannon pen-test it with the gnns'",
    interpretation: "(1) Run pi against fabric tasks. (2) Extract its outputs (the 'good and best stuff') and stage them in the white-room (sandboxed canon staging area per `project_white_room_gc_first_canonical_revival_20260429.md`). (3) Hermes-supervisor (`BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET`) pen-tests the staged artifacts for packet-validation integrity. (4) Shannon-supervisor (`BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST`) pen-tests for information-theoretic trust (entropy, novelty, consistency vs prior canon). (5) GSLGNN + EdgeLevelGNN score the artifacts adversarially as anomaly classifiers.",
    "fabric-orchestrated-flow_NOT_paid_agents": [
      "Step 1: acer council-vote convenes on the pen-test plan itself (does the supervisor council ratify this approach?). Per operator 'Run the fabric to do it' — fabric votes its own work plan.",
      "Step 2: dispatch 5+ EVT-PI-AGENT-REQUEST envelopes targeting liris with corpus-mining tasks (e.g., 'identify 3 keywords missing from supervisor council-vote corpus that would help score EVT-PEER-HANDSHAKE class' — same pattern as fabric-real-free-agent-driver.mjs T-corpus-mine).",
      "Step 3: pi-coding-agent-supervisor processes each, dispatches EVT-PI-AGENT-RESPONSE signed DEV-LIRIS to acer:4947.",
      "Step 4: acer-side white-room-ingester (or new build) pulls EVT-PI-AGENT-RESPONSE envelopes whose responses pass quality gates (substantive reply length, not error-message, sig-VERIFIED) → writes to data/behcs/white-room/pi-clone-stage/.",
      "Step 5: Hermes-supervisor pen-test: dispatch EVT-HERMES-PACKET-VALIDATE-REQUEST containing each staged artifact → exercise the supervisor's authority to score packet integrity → emit verdict. Convert non-PASS to receipts proving Hermes engaged.",
      "Step 6: Shannon-supervisor pen-test: dispatch EVT-SHANNON-TRUST-SCORE-REQUEST with each artifact + prior canon corpus → information-theoretic comparison (entropy, novelty, KL-divergence vs canon). Receipts proving Shannon engaged.",
      "Step 7: GSLGNN + EdgeLevelGNN adversarial scoring: convert each artifact's content into a synthetic graph (nodes=entities, edges=relationships) → POST 127.0.0.1:4792 (EdgeLevelGNN) + 127.0.0.1:4793 (GSLGNN) → if either model HOLD, flag as anomaly → if both PROCEED, promote to white-room canon entry.",
      "Step 8: aggregate verdict: artifacts passing Hermes + Shannon + 2-of-2 GNN PROCEED → white-room canon. Anything else stays in stage with disclosure tags."
    ],
    expected_throughput: "If pi auth lands: 5 corpus-mining requests × ~30-60s pi latency = 5 staged artifacts in ~5min. Hermes + Shannon + GNN scoring adds ~1-2min per artifact. Total: ~10-15 min for first wave end-to-end.",
    blocker_until_pi_auth: "Steps 1-2 can run today (council-vote on plan + dispatch the requests as queued items). Steps 3+ wait for pi auth.",
    constitutional_anchors_to_preserve: [
      "feedback_300B_gnn_validation_was_false — D11 honest; no PROVEN claims without empirical receipts",
      "feedback_classifier_self_poisoning_halt_words — pen-test classifiers on their own halt-word corpus",
      "feedback_do_not_rubber_stamp_reviewer_verdicts — Hermes + Shannon must produce DISSENT possibility, not just rubber-stamps",
      "BEHCS-LAW-008 filesystem IS the mirror — read-before-typing on each pen-test artifact"
    ]
  },
  liris_immediate_actions_done: [
    "Inspected install.sh (sha256 c453620c...) — read-before-typing honored",
    "Installed @mariozechner/pi-coding-agent v0.70.6 globally",
    "Built tools/behcs/pi-coding-agent-supervisor.mjs (signed-envelope protocol)",
    "Started supervisor daemon PID 14028 (--watch 60s)",
    "Saved memory: project_pi_coding_agent_supervisor_added_20260429.md + indexed in MEMORY.md",
    "Drafted prof definition (Asolaria-pi-coding-agent: BEHCS-256 fabric coding-and-review specialist)",
    "Drafted fabric-orchestrated 8-step pen-test flow"
  ],
  liris_immediate_actions_BLOCKED_pending_acer_or_operator: [
    "pi /login (interactive TTY required; operator-domain action; recommend Google Antigravity for free Gemini3+Claude+GPT-OSS)",
    "acer council-vote on the pen-test plan (acer holds council-vote tooling)",
    "white-room-ingester for pi outputs (could be liris-side or acer-side; acer's white-room-gc tooling is more mature per `project_white_room_gc_first_canonical_revival_20260429.md` seq=38)",
    "Hermes/Shannon supervisor pen-test drivers (need to wire EVT-HERMES-PACKET-VALIDATE-REQUEST + EVT-SHANNON-TRUST-SCORE-REQUEST schemas; these may already exist via existing exercise tools)"
  ],
  bilateral_state: "pi-coding-agent installed + wrapped as supervisor + daemon live (auth blocker). Fabric pen-test plan drafted. Awaiting (a) operator pi /login, (b) acer council-vote on pen-test plan, (c) acer ratification of who owns white-room-ingester step. Liris ready to dispatch EVT-PI-AGENT-REQUEST envelopes the moment pi auth lands.",
  fabric_canon_seq: 45,
  three_keys_status: "PI_SUPERVISOR_BUILT_DAEMON_LIVE_AUTH_BLOCKED_PEN_TEST_PLAN_AWAITING_FABRIC_VOTE"
};

const envId = crypto.createHash("sha256").update("liris-pi-supervisor-pen-test-plan-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_SUPERVISOR_AND_PLAN", verb: "EVT-LIRIS-PI-SUPERVISOR-AND-PEN-TEST-FABRIC-PLAN", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, supervisor_built: true, auth_blocker: true };
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
