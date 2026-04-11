#!/usr/bin/env node
/** harvest-evidence.js — Mine codebase for provable facts, link to ASO topics.
 *  Idempotent: skips evidence where sourceRef already exists for that topic.
 *  LX chain: LX-153, LX-154, LX-015 */
const fs = require("fs"), path = require("path");
const aso = require("../src/index-kernel/aso");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src"), TOOLS = path.join(ROOT, "tools");
const TESTS = path.join(ROOT, "tests"), LX = path.join(ROOT, "data", "agent-index");
const EVD_PATH = path.join(aso.ASO_DATA_DIR, "tables", "evidence.json");
const toCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const rel = f => path.relative(ROOT, f).replace(/\\/g, "/");
const FILE_RE = /(?:src|tools|tests)\/[\w\-\.\/]+\.(?:js|ts|ps1|json)/g;

function existingRefs() {
  if (!fs.existsSync(EVD_PATH)) return new Set();
  const t = JSON.parse(fs.readFileSync(EVD_PATH, "utf8"));
  const s = new Set();
  for (const r of t.rows || []) s.add(`${r.topicId}::${r.sourceRef}`);
  return s;
}

function add(seen, topicId, sourceKind, sourceRef, commandOrPath) {
  const key = `${topicId}::${sourceRef}`;
  if (seen.has(key)) return 0;
  seen.add(key);
  return aso.addEvidence({ topicId, sourceKind, sourceRef, commandOrPath }).ok ? 1 : 0;
}

function harvestToolSources(seen) {
  let n = 0;
  for (const t of aso.listTopics({ type: "tool" })) {
    const words = (t.name || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).slice(0, 4);
    const cands = words.length ? [words.join("-") + ".js", words[0] + ".js"] : [];
    for (const ref of ((t.body || "").match(FILE_RE) || [])) {
      if (fs.existsSync(path.join(ROOT, ref.replace(/\//g, path.sep))))
        n += add(seen, t.asoId, "source-file", ref, path.join(ROOT, ref));
    }
    for (const c of cands) {
      for (const dir of [SRC, TOOLS]) {
        const full = path.join(dir, c);
        if (fs.existsSync(full)) n += add(seen, t.asoId, "source-file", rel(full), full);
      }
    }
  }
  return n;
}

function harvestTests(seen) {
  let n = 0;
  if (!fs.existsSync(TESTS)) return n;
  const allTopics = aso.listTopics({});
  for (const file of fs.readdirSync(TESTS).filter(f => f.endsWith(".test.js"))) {
    const base = file.replace(/\.unit\.test\.js$/, "").replace(/\.test\.js$/, "");
    const kebab = base.toLowerCase();
    const srcTry = [`${base}.js`, `${kebab}.js`, toCamel(kebab) + ".js"].map(f => path.join(SRC, f));
    srcTry.push(path.join(SRC, "index-kernel", `${base}.js`));
    const matchedSrc = srcTry.find(c => fs.existsSync(c)) || null;
    let topicId = null;
    for (const t of allTopics) {
      const nm = (t.name || "").toLowerCase();
      if (nm.includes(kebab) || kebab.includes(nm.replace(/[^a-z0-9]/g, "-"))) {
        topicId = t.asoId; break;
      }
    }
    if (!topicId && matchedSrc) {
      const r = rel(matchedSrc);
      for (const t of allTopics) {
        if ((t.body || "").includes(r)) { topicId = t.asoId; break; }
      }
    }
    if (!topicId) continue;
    const ref = `tests/${file}`;
    const cmd = matchedSrc ? `node --test ${ref} (tests ${rel(matchedSrc)})` : `node --test ${ref}`;
    n += add(seen, topicId, "unit-test", ref, cmd);
  }
  return n;
}

function harvestLxFileRefs(seen) {
  let n = 0;
  const cw = aso.getCrosswalk();
  const dirs = fs.readdirSync(LX).filter(d => {
    try { return fs.statSync(path.join(LX, d)).isDirectory(); } catch { return false; }
  });
  for (const dir of dirs) {
    for (const file of fs.readdirSync(path.join(LX, dir)).filter(f => /^LX-\d+\.md$/.test(f))) {
      const lxId = file.replace(".md", "");
      const asoId = cw.mappings[lxId];
      if (!asoId) continue;
      const content = fs.readFileSync(path.join(LX, dir, file), "utf8");
      for (const ref of [...new Set(content.match(FILE_RE) || [])]) {
        if (fs.existsSync(path.join(ROOT, ref.replace(/\//g, path.sep))))
          n += add(seen, asoId, "file-reference", ref, `Referenced in ${lxId}`);
      }
    }
  }
  return n;
}

// --- Main ---
const seen = existingRefs();
const before = seen.size;
console.log(`Evidence entries BEFORE: ${before}`);
const s = harvestToolSources(seen), t = harvestTests(seen), l = harvestLxFileRefs(seen);
const after = fs.existsSync(EVD_PATH) ? JSON.parse(fs.readFileSync(EVD_PATH, "utf8")).rows.length : 0;
console.log(`\nHarvested:`);
console.log(`  source-file  (tool topics -> src/tools files): +${s}`);
console.log(`  unit-test    (test files -> tested modules):   +${t}`);
console.log(`  file-reference (LX bodies -> real files):      +${l}`);
console.log(`  TOTAL added: ${s + t + l}\n\nEvidence entries AFTER: ${after}`);
