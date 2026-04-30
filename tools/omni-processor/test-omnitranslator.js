"use strict";
/**
 * 7 tests for omnitranslator-v0.js — mirrors acer's LX-491 stage_2 test shape.
 */

const fs = require("fs");
const path = require("path");
const tr = require("./omnitranslator-v0");

const LOG_FILE = path.resolve(__dirname, "..", "..", "logs", "omnitranslator.ndjson");
// Truncate log before tests so we can count lines accurately
try { fs.writeFileSync(LOG_FILE, ""); } catch {}

let pass = 0, fail = 0;
function test(name, cond, detail) {
  if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name + " — " + (detail || "")); }
}

// T1: 6 dialects registered (2 implemented + 4 planned), all with pair_status
const dialects = tr.listDialects();
const implemented = dialects.filter(d => d.pair_status === "implemented");
const planned = dialects.filter(d => d.pair_status === "planned");
test("T1_6_dialects_registered_2_impl_4_planned",
  dialects.length === 6 &&
    implemented.length === 2 && implemented.some(d => d.id === "omnilanguage") && implemented.some(d => d.id === "json") &&
    planned.length === 4 && ["IX","LX","XL","plain_english"].every(id => planned.some(d => d.id === id)),
  "got " + JSON.stringify(dialects.map(d => d.id + ":" + d.pair_status))
);

// T2: omnilanguage → json basic
const r2 = tr.translate("@packet from=liris to=asolaria verb=test.ping input_a=1", "omnilanguage", "json");
test("T2_omnilanguage_to_json_basic",
  r2.output.from === "liris" && r2.output.to === "asolaria" && r2.output.verb === "test.ping" && r2.output.input_a === "1",
  JSON.stringify(r2.output)
);

// T3: json → omnilanguage basic
const r3 = tr.translate({ from: "liris", to: "asolaria", verb: "test.ping", input_a: "1" }, "json", "omnilanguage");
test("T3_json_to_omnilanguage_basic",
  r3.output.includes("@packet") && r3.output.includes("from=liris") && r3.output.includes("verb=test.ping") && r3.output.includes("input_a=1"),
  r3.output
);

// T4: round trip preservation (omnilanguage → json → omnilanguage)
const original = "@packet from=liris to=asolaria verb=test.ping input_a=1";
const step1 = tr.translate(original, "omnilanguage", "json");
const step2 = tr.translate(step1.output, "json", "omnilanguage");
// Round trip should preserve all key=val pairs (order may differ)
const origKeys = ["from=liris", "to=asolaria", "verb=test.ping", "input_a=1"];
const allPresent = origKeys.every(k => step2.output.includes(k));
test("T4_round_trip_preservation", allPresent, step2.output);

// T5: novalum cube 103823 preserved shield invariant
const r5 = tr.translate({ unit_id: "novalum-unit-001", cube: 103823, op: "read_globals" }, "json", "omnilanguage");
test("T5_novalum_cube_103823_preserved_shield_invariant",
  r5.shielded_redacted_across_host === true && r5.output.includes("unit_id=novalum-unit-001") && r5.output.includes("cube=103823"),
  "shielded=" + r5.shielded_redacted_across_host + " output=" + r5.output
);

// T6: translation log populated (at least 4 lines after T2-T5)
let logLines = 0;
try { logLines = fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(l => l.trim()).length; } catch {}
test("T6_translation_log_populated_4_lines", logLines >= 4, "got " + logLines);

// T7: unknown pair throws
let threw = false;
try { tr.translate("foo", "omnilanguage", "nonexistent"); }
catch (e) { threw = true; }
test("T7_unknown_pair_throws", threw);

console.log("\n" + pass + "/" + (pass + fail) + " PASS, " + fail + " FAIL");
process.exit(fail > 0 ? 1 : 0);
