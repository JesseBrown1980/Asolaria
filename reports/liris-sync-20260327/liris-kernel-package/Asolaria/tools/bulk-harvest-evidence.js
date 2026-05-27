#!/usr/bin/env node
/** bulk-harvest-evidence.js — Link every topic to its source file on disk.
 *  Idempotent: skips evidence where topicId::sourceRef already exists. */
const fs = require("fs"), path = require("path");
const aso = require("../src/index-kernel/aso");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src"), SKILLS = path.join(ROOT, "skills");
const TESTS = path.join(ROOT, "tests"), LX = path.join(ROOT, "data", "agent-index");
const EVD = path.join(aso.ASO_DATA_DIR, "tables", "evidence.json");
const rel = f => path.relative(ROOT, f).replace(/\\/g, "/");
const toKebab = s => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const toCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const isDir = p => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function loadSeen() {
  if (!fs.existsSync(EVD)) return new Set();
  const s = new Set();
  for (const r of (JSON.parse(fs.readFileSync(EVD, "utf8")).rows || [])) s.add(`${r.topicId}::${r.sourceRef}`);
  return s;
}
function add(seen, tid, kind, ref, cmd) {
  const k = `${tid}::${ref}`;
  if (seen.has(k)) return 0;
  seen.add(k);
  return aso.addEvidence({ topicId: tid, sourceKind: kind, sourceRef: ref, commandOrPath: cmd }).ok ? 1 : 0;
}
function tryFile(seen, tid, kind, fp) {
  return fs.existsSync(fp) ? add(seen, tid, kind, rel(fp), fp) : 0;
}

// 1. Name-based file matching: camelCase stems and slugs → src/, connectors/, tests/
function harvestByName(seen) {
  let n = 0;
  const connDir = path.join(SRC, "connectors"), ikDir = path.join(SRC, "index-kernel");
  const testFiles = fs.existsSync(TESTS) ? fs.readdirSync(TESTS).filter(f => f.endsWith(".test.js")) : [];
  for (const t of aso.listTopics({})) {
    const camelMatch = t.name.match(/\b([a-z][a-zA-Z]+(?:Connector|Store|Engine|Manager|Router|Policy|Bridge|Relay|Registry|Planner|Spawner|Runner|Ledger|Query|Builder|Schema|Catalog|Loader|Notifier|View|Bundle|Export))\b/);
    const stems = new Set();
    if (camelMatch) stems.add(camelMatch[1]);
    const slug = (t.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (slug.split("-").length <= 4) stems.add(toCamel(slug));
    for (const stem of stems) {
      const kebab = toKebab(stem);
      for (const c of [`${stem}.js`, `${kebab}.js`]) {
        for (const dir of [SRC, connDir, ikDir])
          n += tryFile(seen, t.asoId, "source-file", path.join(dir, c));
      }
      for (const tf of testFiles) {
        const base = tf.replace(/\.unit\.test\.js$/, "").replace(/\.test\.js$/, "");
        if (base === kebab || base === stem || toCamel(base) === stem)
          n += add(seen, t.asoId, "source-file", `tests/${tf}`, path.join(TESTS, tf));
      }
    }
  }
  return n;
}

// 2. Skills → skill.json
function harvestSkills(seen) {
  let n = 0;
  if (!fs.existsSync(SKILLS)) return n;
  const slugMap = new Map();
  for (const d of fs.readdirSync(SKILLS).filter(d => isDir(path.join(SKILLS, d))))
    if (fs.existsSync(path.join(SKILLS, d, "skill.json"))) slugMap.set(d, `skills/${d}/skill.json`);
  for (const t of aso.listTopics({})) {
    const nm = (t.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    for (const [dir, ref] of slugMap)
      if (nm.includes(dir) || dir.includes(nm.slice(0, 20)))
        n += add(seen, t.asoId, "skill-json", ref, path.join(SKILLS, dir, "skill.json"));
  }
  return n;
}

// 3. LX legacy markdown files → topics via crosswalk
function harvestLx(seen) {
  let n = 0;
  const cw = aso.getCrosswalk();
  for (const dir of fs.readdirSync(LX).filter(d => isDir(path.join(LX, d)))) {
    for (const f of fs.readdirSync(path.join(LX, dir)).filter(x => /^LX-\d+\.md$/.test(x))) {
      const asoId = cw.mappings[f.replace(".md", "")];
      if (asoId) n += add(seen, asoId, "lx-source", `data/agent-index/${dir}/${f}`, path.join(LX, dir, f));
    }
  }
  return n;
}

// --- Main ---
const seen = loadSeen();
const before = seen.size;
console.log(`Evidence rows BEFORE: ${before}`);
const nF = harvestByName(seen), nS = harvestSkills(seen), nL = harvestLx(seen);
const evData = fs.existsSync(EVD) ? JSON.parse(fs.readFileSync(EVD, "utf8")) : { rows: [] };
console.log(`  source-file  (name→src/connectors/tests): +${nF}`);
console.log(`  skill-json   (skill dirs):                 +${nS}`);
console.log(`  lx-source    (LX markdown files):          +${nL}`);
console.log(`  TOTAL added: ${nF + nS + nL}`);
console.log(`Evidence rows AFTER:  ${evData.rows.length}`);
console.log(`Topics with evidence: ${new Set(evData.rows.map(r => r.topicId)).size} / 405`);
