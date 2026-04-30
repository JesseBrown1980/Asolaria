"use strict";
/**
 * test-pipeline-integration.js — end-to-end pipeline test on a single host
 *
 * Proves the omni-processor pipeline works WITHOUT cross-host federation:
 *   plain English idea
 *     ↓
 *   omnitranslator (plain → omnilanguage → json)
 *     ↓
 *   sandbox-runner (executes job in node_vm or child_process_spawn)
 *     ↓
 *   result envelope back through omnitranslator (json → omnilanguage)
 *     ↓
 *   audit log in logs/omni-processor.ndjson + logs/omnitranslator.ndjson
 *
 * This is the integration proof point that the pieces compose, before any
 * cross-host wire is laid (STAGE_4 still gated on acer-side jesse flag).
 */

const tr = require("./omnitranslator-v0");
const runner = require("./sandbox-runner");

let pass = 0, fail = 0;
function test(name, cond, detail) {
  if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name + " — " + (detail || "")); }
}

console.log("=== omni-processor pipeline integration test ===\n");

async function main() {
// ─── Test 1: full pipeline, simple math ────────────────────────────────────
{
  // Step 1: human-friendly omnilanguage form of a job request
  const omniInput = "@packet kind=compute code=result=input.x*input.x+input.y*input.y input_x=3 input_y=4 max_runtime_ms=5000 sandbox_class=node_vm";

  // Step 2: translate to JSON
  const jsonStep = tr.translate(omniInput, "omnilanguage", "json");

  // Step 3: massage into the runner envelope shape
  // (the omnilanguage flat form is not yet a perfect 1:1 with the runner envelope —
  //  this is the kind of glue that the production pipeline will formalize)
  const flat = jsonStep.output;
  const envelope = {
    envelope: { job_id: "pipeline-test-1-pythagoras" },
    target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "math" },
    body: {
      kind: flat.kind,
      code: flat.code,
      input: { x: parseInt(flat.input_x, 10), y: parseInt(flat.input_y, 10) },
      max_runtime_ms: parseInt(flat.max_runtime_ms, 10),
      sandbox_class: flat.sandbox_class
    },
    constraints: { may_network: false, may_write_paths: [] }
  };

  // Step 4: run via sandbox runner
  const result = await runner.runJob(envelope);

  test("PI-1_pipeline_compute_pythagoras",
    result.ok === true && result.result === 25,
    "got: " + JSON.stringify(result)
  );

  // Step 5: translate result back to omnilanguage for return-trip
  const returnEnvelope = { ok: result.ok, job_id: result.job_id, result: result.result, wall_ms: result.wall_ms };
  const returnOmni = tr.translate(returnEnvelope, "json", "omnilanguage");
  test("PI-1_return_trip_omnilanguage_includes_result_25",
    returnOmni.output.includes("result=25"),
    returnOmni.output
  );
}

// ─── Test 2: NOVALUM SHIELD blocks at sandbox layer ────────────────────────
{
  const novalumOmni = "@packet kind=compute code=result=1 sandbox_class=node_vm";
  const j = tr.translate(novalumOmni, "omnilanguage", "json");
  const envelope = {
    envelope: { job_id: "pipeline-test-2-novalum-target" },
    target: { host: "liris", unit_id: "novalum-unit-001", operation_id: "anything" },
    body: { kind: j.output.kind, code: j.output.code, sandbox_class: j.output.sandbox_class },
    constraints: {}
  };
  const result = await runner.runJob(envelope);
  test("PI-2_novalum_shield_blocks_at_runner",
    result.ok === false && result.error && result.error.gate.startsWith("HD-1"),
    JSON.stringify(result)
  );
}

// ─── Test 3: child_process_spawn through pipeline ─────────────────────────
{
  const omniInput = "@packet kind=compute code=result=input.text.toUpperCase() input_text=hello_pipeline max_runtime_ms=10000 sandbox_class=child_process_spawn";
  const j = tr.translate(omniInput, "omnilanguage", "json");
  const flat = j.output;
  const envelope = {
    envelope: { job_id: "pipeline-test-3-uppercase-cps" },
    target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "string" },
    body: {
      kind: flat.kind,
      code: flat.code,
      input: { text: flat.input_text },
      max_runtime_ms: parseInt(flat.max_runtime_ms, 10),
      sandbox_class: flat.sandbox_class
    },
    constraints: { may_network: false }
  };
  const result = await runner.runJob(envelope);
  test("PI-3_pipeline_uppercase_via_child_process_spawn",
    result.ok === true && result.result === "HELLO_PIPELINE",
    JSON.stringify(result)
  );
}

// ─── Test 4: NOVALUM SHIELD redaction visible at translator step ──────────
{
  const novalumPayload = { unit_id: "novalum-unit-001", op: "any" };
  const r = tr.translate(novalumPayload, "json", "omnilanguage");
  test("PI-4_novalum_shield_visible_at_translator", r.shielded_redacted_across_host === true);
}

console.log("\n" + pass + "/" + (pass + fail) + " PASS, " + fail + " FAIL");
process.exit(fail > 0 ? 1 : 0);
}
main();
