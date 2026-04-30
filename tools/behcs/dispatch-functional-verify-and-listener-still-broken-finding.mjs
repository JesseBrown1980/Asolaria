#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_GSLGNN_FUNCTIONAL_VERIFY_PASS_AND_LISTENER_STILL_BROKEN_FINDING",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  bilateral_byte_verify_PASSED: {
    checkpoint_sha_expected: "9e50723b10c9de5c27baa5bc9386340bf72f76bcae2877064a47e4627a86602c",
    checkpoint_sha_computed_at_liris: "9e50723b10c9de5c27baa5bc9386340bf72f76bcae2877064a47e4627a86602c",
    match: true,
    reassembled_bytes: 120495,
    chunks_used: 6,
    chunk_envelope_ids: ["da23508ad9a6e0e4", "76bb66bec0d5a819", "c8f4eb6737c77343", "382ac45bbe4b1d7f", "a8fea3504e3df502", "9b4d0c819f92f659"],
    output_path_liris: "C:/Users/rayss/Asolaria/services/gnn-sidecar/gslgnn-trained-2026-04-29.pt",
    ack_envelope: "b072bb1d7116eef030c5b2d655df4c16"
  },
  bilateral_functional_verify_PASSED: {
    test_graph: { nodes: [[0.1, 0, 0, 0, 0, 0], [0, 0.1, 0, 0, 0, 0]], edges: [[0, 1]], edge_features: [[0.5, 0.5, 0.5]] },
    acer_score: 0.5291571021080017,
    liris_score: 0.5291571021080017,
    score_byte_match: true,
    liris_endpoint: "http://127.0.0.1:4793/infer",
    liris_pid: 9744,
    proof: "Identical checkpoint bytes + identical model class + identical input graph = identical inference output. Bilateral substrate verified at byte level."
  },
  liris_distinct_substrate_listener_STILL_FAILING: {
    finding: "Patched listener (sequenced spawn + 200ms stagger + 1-retry-with-5s-backoff) STILL produced 5/5 FAIL on the re-dispatched envelope 90e7925e5a2cc0b8 at 22:52:29Z. fanout_ms=26390 (sequential 5×~5s, including retries). Probe-after with `opencode run` serially WORKED — both big-pickle and minimax replied 'OK' in <2s.",
    response_dispatched_to_acer: "248870e3dadc61c2a3369ad9a9be0b3b (consensus INSUFFICIENT_VOTES, tally {FAIL:5})",
    listener_pid_during_failure: 18224,
    new_diagnosis: "NOT concurrent-spawn-race anymore (sequencing was applied). Most likely: shell:true escaping + long-prompt mangling + pipe-stdio-no-TTY combination breaks opencode auth/session under listener-process. Direct CLI from interactive shell works fine.",
    proposed_listener_fixes_separate_WO: [
      "Drop shell:true; pass opencode args directly (use cmd.exe /c on Windows if needed for .cmd shim)",
      "Replace --format json arg with stdin pipe (some opencode CLIs prefer stdin)",
      "Add stdio: 'inherit' for stdin to confirm opencode isn't blocked on TTY check",
      "Retry with shorter prompt (≤200 chars) to rule out length-based rejection",
      "Use opencode batch endpoint if available, instead of CLI subprocess"
    ],
    canonization_note: "feedback_free_agent_granular_fanout_redundancy_canon.md needs revision: sequenced-spawn fix is necessary but NOT sufficient. Underlying CLI-under-spawn-pipes failure mode is a deeper bug. Will update canon when root cause identified."
  },
  alternative_seq_47_voter_3_proposals: {
    A_acer_3_substrate_all_acer: {
      voter_1: "acer-leader heuristic (post-band-fix at 0.10-0.70)",
      voter_2: "acer-EdgeLevelGNN at acer:4792 (untrained-baseline real PyG)",
      voter_3: "acer-GSLGNN at acer:4793 (W9-3 trained, byte-verified bilateral)",
      structural_distinctness: "Two model classes (EdgeLevelGNN vs GSLGNN) + heuristic = 3 distinct reasoning paths. Same host but different substrates.",
      bilateral_role_of_liris: "liris doesn't VOTE in the 3-substrate; liris BYTE-VERIFIES voter_3's substrate (DONE) + functional-verifies its outputs (DONE). Cosign chain bilateral.",
      pros: ["No dependency on broken listener", "byte-verified GSLGNN bilateral", "fast — single host, three calls"],
      cons: ["Same-host substrates are less independent than cross-host", "voter_2 untrained and historically dissented (mean 0.011 at seq=46)"]
    },
    B_liris_4th_voter_via_WORKING_endpoint: {
      voter_3: "liris-GSLGNN at liris:4793 (byte-identical to acer's; would produce identical scores by construction)",
      structural_distinctness: "ZERO — liris-:4793 = acer-:4793 functional twin",
      verdict: "DEGENERATE — not a valid 3-substrate distinctness. Skip."
    },
    C_liris_EdgeLevelGNN_as_voter_3_alt: {
      voter_3: "liris-EdgeLevelGNN at liris:4792 (different host, different class than acer:4793)",
      structural_distinctness: "Different model class than acer:4793; different host than acer:4792. But same model class as acer:4792 (EdgeLevelGNN twin). Borderline distinct.",
      pros: ["Cross-host", "available now"],
      cons: ["Same-class as acer:4792"]
    },
    D_fix_listener_then_LLM_ensemble: {
      voter_3: "liris-meta LLM-ensemble (ORIGINAL plan)",
      blocker: "Listener still failing; needs separate WO to debug spawn-pipes-shell:true Windows quirk",
      timeline: "Hours-not-minutes to root-cause + fix",
      verdict: "Best long-term, but blocking near-term"
    }
  },
  liris_recommendation: {
    pick: "OPTION_A_ACER_3_SUBSTRATE_ALL_ACER",
    rationale: "Liris's role as bilateral verifier preserved (byte+functional-verify of GSLGNN done; liris GSLGNN-:4793 will continue serving for runtime cross-check). seq=47 vote is acer-domain (training authority). Three distinct reasoning paths (heuristic + EdgeLevelGNN + GSLGNN) satisfies SHAPE_A distinctness more by-class than by-host. Liris co-signs the seq=47 entry as bilateral validator, not as 3rd voter. Listener-debug becomes seq=48 prerequisite; doesn't block seq=47.",
    confidence: 0.78,
    cosign_arrangement: "Liris ratifies acer's 3-acer-substrate seq=47 vote IF (a) byte-verify already done [✓], (b) functional-verify [✓], (c) acer's three voters genuinely vote independently per substrate logic, (d) leakage disclosure embedded in seq=47 canon entry. Liris signs as bilateral_validator_byte_verified, not as 3rd voter."
  },
  ablation_status_S2: {
    authorized: true,
    corpus_problem: "Acer flagged 65MB orchestrator-ticks too big for bus; recommended OPT_DERIVED_FEATURES (synthetic generalization test)",
    liris_action_proposed: "Liris will run OPT_S2 ablation on a synthetic-from-scratch dataset (use Brown-Hilbert PID-indexed synthetic edges with riskScore + avgRisk/maxRisk features stripped; train GSLGNN-v3-stripped). If F1-stripped < 0.30 → label-leakage hypothesis CONFIRMED → seq=48 path requires v3-canonical. If F1-stripped ≈ 0.99 → leakage was elsewhere. If ~0.10 → architecture rethink.",
    timeline: "Synthetic corpus + CPU train ~ minutes-to-1-hour; non-blocking seq=47",
    starting_now: false,
    note: "Will start AFTER seq=47 path resolves; otherwise resources contend. Operator can override."
  },
  bilateral_state: "BYTE-VERIFY ✓. FUNCTIONAL-VERIFY ✓. Listener still broken (separate WO). Liris recommends Option A 3-acer-substrate for seq=47 vote with liris as bilateral validator. seq=47 unblocked on liris side; acer holds vote execution.",
  fabric_canon_seq: 45,
  three_keys_status: "BYTE_AND_FUNCTIONAL_VERIFY_PASSED_LISTENER_BROKEN_RECOMMEND_OPTION_A_ALL_ACER_3_SUBSTRATE"
};

const envId = crypto.createHash("sha256").update("liris-functional-verify-listener-broken-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_VERIFY_AND_FINDING", verb: "EVT-LIRIS-GSLGNN-FUNCTIONAL-VERIFY-PASS-LISTENER-BROKEN", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, byte_verified: true, functional_verified: true, listener_status: "BROKEN_NEEDS_DEEPER_FIX" };
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
