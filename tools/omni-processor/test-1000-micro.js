"use strict";
const runner = require("./sandbox-runner");

const PASS_JOBS = [];
const FAIL_JOBS = [];

// 200 arithmetic — all should PASS
for (let i = 1; i <= 200; i++) {
  PASS_JOBS.push({
    id: "arith-" + i,
    envelope: {
      envelope: { job_id: "arith-" + i, permissionTier: 2 },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "math" },
      body: { kind: "compute", code: "result = input.a + input.b;", input: { a: i, b: i * 2 }, sandbox_class: "node_vm" },
      constraints: { may_network: false, may_write_paths: [] }
    },
    expectOk: true,
    expectResult: i + i * 2
  });
}

// 100 string ops — should PASS
for (let i = 1; i <= 100; i++) {
  const word = "test" + i;
  PASS_JOBS.push({
    id: "str-" + i,
    envelope: {
      envelope: { job_id: "str-" + i, permissionTier: 1 },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "string" },
      body: { kind: "compute", code: "result = input.s.toUpperCase();", input: { s: word }, sandbox_class: "node_vm" },
      constraints: {}
    },
    expectOk: true,
    expectResult: word.toUpperCase()
  });
}

// 50 JSON transforms — should PASS
for (let i = 1; i <= 50; i++) {
  PASS_JOBS.push({
    id: "json-" + i,
    envelope: {
      envelope: { job_id: "json-" + i, permissionTier: 2 },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "transform" },
      body: { kind: "compute", code: "result = { sum: input.a + input.b, product: input.a * input.b };", input: { a: i, b: i + 7 }, sandbox_class: "node_vm" },
      constraints: {}
    },
    expectOk: true,
    expectResult: { sum: i + (i + 7), product: i * (i + 7) }
  });
}

// 50 sqrt — should PASS
for (let i = 1; i <= 50; i++) {
  PASS_JOBS.push({
    id: "sqrt-" + i,
    envelope: {
      envelope: { job_id: "sqrt-" + i, permissionTier: 2 },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "sqrt" },
      body: { kind: "compute", code: "result = Math.round(Math.sqrt(input.n) * 1000) / 1000;", input: { n: i * i }, sandbox_class: "node_vm" },
      constraints: {}
    },
    expectOk: true,
    expectResult: i
  });
}

// === KNOWN FAILS ===

// 100 hookwall blocks — dangerous verbs at observer tier
const dangerVerbs = ["delete_all","drop_table","kill_process","rm_rf","format_disk","wipe_data","destroy","purge","nuke","terminate"];
for (let i = 0; i < 100; i++) {
  FAIL_JOBS.push({
    id: "hw-" + i,
    envelope: {
      envelope: { job_id: "hw-" + i, permissionTier: 0 },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: dangerVerbs[i % dangerVerbs.length] },
      body: { kind: "compute", code: "result = 'SHOULD NEVER RUN';", sandbox_class: "node_vm" },
      constraints: {}
    },
    expectOk: false,
    expectBlockedBy: "hookwall"
  });
}

// 100 novalum blocks
for (let i = 0; i < 100; i++) {
  FAIL_JOBS.push({
    id: "novalum-" + i,
    envelope: {
      envelope: { job_id: "novalum-" + i },
      target: { host: "liris", unit_id: "novalum-unit-" + String(i).padStart(3, "0"), operation_id: "probe" },
      body: { kind: "compute", code: "result = 1;", sandbox_class: "node_vm" },
      constraints: {}
    },
    expectOk: false,
    expectBlockedBy: "HD-1"
  });
}

// 50 network blocks
for (let i = 0; i < 50; i++) {
  FAIL_JOBS.push({
    id: "net-" + i,
    envelope: {
      envelope: { job_id: "net-" + i },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "fetch" },
      body: { kind: "compute", code: "result = 1;", sandbox_class: "node_vm" },
      constraints: { may_network: true }
    },
    expectOk: false,
    expectBlockedBy: "HD-2"
  });
}

// 50 sovereignty path blocks
const sovPaths = ["E:/runtime/foo", "D:/secrets", "C:/Users/rayss/.claude/keys", "data/vault/owner/creds"];
for (let i = 0; i < 50; i++) {
  FAIL_JOBS.push({
    id: "sov-" + i,
    envelope: {
      envelope: { job_id: "sov-" + i },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "write" },
      body: { kind: "compute", code: "result = 1;", sandbox_class: "node_vm" },
      constraints: { may_write_paths: [sovPaths[i % sovPaths.length]] }
    },
    expectOk: false,
    expectBlockedBy: "HD-4"
  });
}

// 50 destructive input blocks
const destructive = ["rm -rf /", "format C:", "drop table users", "del /f /s *", "Remove-Item -Recurse C:\\Windows"];
for (let i = 0; i < 50; i++) {
  FAIL_JOBS.push({
    id: "destr-" + i,
    envelope: {
      envelope: { job_id: "destr-" + i },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "exec" },
      body: { kind: "compute", code: "result = 1;", input: destructive[i % destructive.length], sandbox_class: "node_vm" },
      constraints: {}
    },
    expectOk: false,
    expectBlockedBy: "HD-3"
  });
}

// 50 cap exceeded
for (let i = 0; i < 50; i++) {
  FAIL_JOBS.push({
    id: "cap-" + i,
    envelope: {
      envelope: { job_id: "cap-" + i },
      target: { host: "liris", unit_id: "liris.cpu.i3-1005G1", operation_id: "long" },
      body: { kind: "compute", code: "result = 1;", max_runtime_ms: 999999999, sandbox_class: "node_vm" },
      constraints: {}
    },
    expectOk: false,
    expectBlockedBy: "HD-CAP"
  });
}

async function main() {
  let passOk = 0, passFail = 0, failOk = 0, failFail = 0;
  const gateStats = {};
  const t0 = Date.now();
  const errors = [];

  for (const j of PASS_JOBS) {
    const r = await runner.runJob(j.envelope);
    if (r.ok && JSON.stringify(r.result) === JSON.stringify(j.expectResult)) {
      passOk++;
    } else {
      passFail++;
      if (errors.length < 10) errors.push("SHOULD-PASS " + j.id + ": ok=" + r.ok + " got=" + JSON.stringify(r.result)?.slice(0, 80) + " expected=" + JSON.stringify(j.expectResult));
    }
  }

  for (const j of FAIL_JOBS) {
    const r = await runner.runJob(j.envelope);
    const gate = r.error?.gate || "unknown";
    gateStats[gate] = (gateStats[gate] || 0) + 1;
    if (!r.ok) {
      failOk++;
      // verify code never ran
      if (r.result !== undefined) {
        if (errors.length < 10) errors.push("CODE-LEAKED " + j.id + ": blocked but result=" + JSON.stringify(r.result));
      }
    } else {
      failFail++;
      if (errors.length < 10) errors.push("SHOULD-FAIL " + j.id + ": ok=" + r.ok + " expected block by " + j.expectBlockedBy);
    }
  }

  const elapsed = Date.now() - t0;
  const total = PASS_JOBS.length + FAIL_JOBS.length;

  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log("  MICRO TEST: " + total + " JOBS");
  console.log("═══════════════════════════════════════════════");
  console.log("PASS jobs (should compute): " + passOk + "/" + PASS_JOBS.length);
  console.log("FAIL jobs (should block):   " + failOk + "/" + FAIL_JOBS.length);
  console.log("TOTAL CORRECT:              " + (passOk + failOk) + "/" + total + " (" + ((passOk + failOk) / total * 100).toFixed(1) + "%)");
  console.log("");
  console.log("Gate block distribution:");
  Object.entries(gateStats).sort((a, b) => b[1] - a[1]).forEach(([g, c]) => console.log("  " + g + ": " + c));
  console.log("");
  console.log("TIME: " + elapsed + "ms (" + (elapsed / total).toFixed(1) + "ms/job)");
  console.log("THROUGHPUT: " + Math.round(total / (elapsed / 1000)) + " jobs/sec");
  if (passFail > 0) console.log("PASS FAILURES: " + passFail);
  if (failFail > 0) console.log("FAIL FAILURES: " + failFail + " — CODE RAN WHEN IT SHOULD NOT HAVE");
  if (errors.length > 0) { console.log("\nFIRST ERRORS:"); errors.forEach(e => console.log("  " + e)); }
  console.log("═══════════════════════════════════════════════");
}

main();
