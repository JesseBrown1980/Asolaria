"use strict";
/**
 * Self-test for sandbox-runner.js — runs entirely locally, no wires.
 * Six test envelopes covering: ok, hard_deny novalum, hard_deny destructive,
 * hard_deny network, hard_deny sovereignty path, hard_deny cap.
 */

const { runJob, classifyV2 } = require("./sandbox-runner");

const tests = [
  {
    name: "T1_ok_arithmetic",
    envelope: {
      envelope: { job_id: "test-T1-ok" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "test-arith" },
      body: {
        kind: "compute",
        code: "result = (input.a + input.b) * 2;",
        input: { a: 21, b: 21 },
        max_runtime_ms: 5000,
        sandbox_class: "node_vm"
      },
      constraints: { may_network: false, may_write_paths: [] }
    },
    expect: { ok: true, result: 84 }
  },
  {
    name: "T2_hard_deny_novalum",
    envelope: {
      envelope: { job_id: "test-T2-novalum" },
      target: { host: "liris", unit_id: "novalum-unit-001", operation_id: "any" },
      body: { kind: "compute", code: "result = 1;", sandbox_class: "node_vm" },
      constraints: {}
    },
    expect: { ok: false, gate: "HD-1c" }
  },
  {
    name: "T3_hard_deny_destructive",
    envelope: {
      envelope: { job_id: "test-T3-destructive" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "any" },
      body: {
        kind: "compute",
        code: "result = 1;",
        input: "rm -rf /something",
        sandbox_class: "node_vm"
      },
      constraints: {}
    },
    expect: { ok: false, gate: "HD-3" }
  },
  {
    name: "T4_hard_deny_network",
    envelope: {
      envelope: { job_id: "test-T4-network" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "any" },
      body: { kind: "compute", code: "result = 1;", sandbox_class: "node_vm" },
      constraints: { may_network: true }
    },
    expect: { ok: false, gate: "HD-2" }
  },
  {
    name: "T5_hard_deny_sovereignty_path",
    envelope: {
      envelope: { job_id: "test-T5-sov" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "any" },
      body: { kind: "compute", code: "result = 1;", sandbox_class: "node_vm" },
      constraints: { may_write_paths: ["E:/runtime/foo"] }
    },
    expect: { ok: false, gate: "HD-4" }
  },
  {
    name: "T6_hard_deny_cap",
    envelope: {
      envelope: { job_id: "test-T6-cap" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "any" },
      body: {
        kind: "compute",
        code: "result = 1;",
        max_runtime_ms: 999999999,
        sandbox_class: "node_vm"
      },
      constraints: {}
    },
    expect: { ok: false, gate: "HD-CAP" }
  },
  {
    name: "T7_vm_isolation_no_require",
    envelope: {
      envelope: { job_id: "test-T7-isolation" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "any" },
      body: {
        kind: "compute",
        code: "try { result = require('fs').readFileSync('C:/Windows/System32/drivers/etc/hosts','utf8'); } catch(e) { result = 'BLOCKED:' + e.message; }",
        sandbox_class: "node_vm"
      },
      constraints: {}
    },
    expect: { ok: true, result_starts_with: "BLOCKED:" }
  },
  {
    name: "T8_child_process_spawn_ok",
    envelope: {
      envelope: { job_id: "test-T8-cps" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "any" },
      body: {
        kind: "compute",
        code: "result = input.x * input.x;",
        input: { x: 7 },
        max_runtime_ms: 10000,
        sandbox_class: "child_process_spawn"
      },
      constraints: { may_network: false, may_write_paths: [] }
    },
    expect: { ok: true, result: 49 }
  },
  {
    name: "T9_child_process_spawn_caught_throw",
    envelope: {
      envelope: { job_id: "test-T9-throw" },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "any" },
      body: {
        kind: "compute",
        code: "throw new Error('intentional');",
        max_runtime_ms: 10000,
        sandbox_class: "child_process_spawn"
      },
      constraints: {}
    },
    expect: { ok: false }
  }
];

async function main() {
  let pass = 0, fail = 0;
  for (const t of tests) {
    const r = await runJob(t.envelope);
    let ok = false;
    if (t.expect.ok === true && r.ok === true) {
      if (t.expect.result !== undefined && r.result === t.expect.result) ok = true;
      else if (t.expect.result_starts_with && String(r.result).startsWith(t.expect.result_starts_with)) ok = true;
    } else if (t.expect.ok === false && r.ok === false) {
      if (!t.expect.gate || (r.error && (r.error.gate === t.expect.gate || r.error.gate?.startsWith(t.expect.gate)))) ok = true;
    }
    if (ok) { pass++; console.log("PASS " + t.name); }
    else { fail++; console.log("FAIL " + t.name + " — got: " + JSON.stringify(r).slice(0, 200)); }
  }
  console.log(`\n${pass}/${tests.length} PASS, ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}
main();
