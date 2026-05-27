#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_ROOTS = [
  "C:\\Users\\acer\\OneDrive\\Desktop",
  "C:\\Users\\acer\\Downloads"
];
const DEFAULT_CUTOFF = "2026-04-04T00:00:00-03:00";

const OUTPUTS = Object.freeze({
  lineAudit: rel("data/behcs/source-evidence/liris-newer-stuff-corpus-line-audit.v1.ndjson"),
  summary: rel("data/behcs/source-evidence/liris-newer-stuff-corpus-summary.v1.json"),
  map: rel("data/behcs/maps/liris/liris-newer-stuff-corpus-map.v1.json"),
  hermes: rel("data/behcs/hermes/liris/liris-newer-stuff-corpus-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/liris/liris-newer-stuff-corpus-consensus-latest.json"),
  cube: rel("data/behcs/cubes/liris-newer-stuff-corpus.cube.js"),
  reportJson: rel("reports/liris-newer-stuff-corpus-audit-latest.json"),
  reportMd: rel("reports/liris-newer-stuff-corpus-audit-latest.md")
});

const CATEGORY_RULES = [
  ["liris_federation", /\b(liris|desktop-ptsqtie|192\.168\.100\.2|acer\s*\+\s*liris|bilateral|unison|federat)/i],
  ["open_mythos", /\b(open\s*mythos|mythos|mythos_think|spectral|rho|ρ|law-099|recurrence|latent thought)/i],
  ["original_hermes", /\b(original hermes|hermes agent|nousresearch|wal|sqlite|gateway|plugin hook|transport router|scheduler|delegate)/i],
  ["ga_svm_crop", /\b(ga-svm|crop disease|svm|fractal|entropy|morphology|support vector|disease class|rbf|genetic algorithm)/i],
  ["gulp_gc_white_room", /\b(gulp|super gulp|garbage|collector|white.?room|inbox\.ndjson|message-paths|gc_gulp_2000)/i],
  ["gnn_reverse_gain_shannon", /\b(gnn|reverse.?gain|shannon|omnishannon|mistake ledger|mistake|genius|sieve|promoted|demoted)/i],
  ["supervisors_council", /\b(supervisor|supervisor of supervisors|council|chief|helm|gaia|dasein|sentinel|rook|director)/i],
  ["behcs_glyph_cube_map", /\b(behcs|glyph|glyphed|cube|cubed|map mapped|map map|brown.?hilbert|law.?001|falcon language|hyperglyph)/i],
  ["agents_scale_speed", /\b(agents\/sec|agents per second|100b|10b|100m|10,000|claude cli|bare node|pid|omnispindle|omniflywheel|free agents)/i],
  ["storage_pressure", /\b(c drive|c:|d drive|d:|space returned|memory|ram|collapse|explode|buffered|write buffer|appendFileSync|sync i\/o)/i],
  ["credential_device_authority", /\b(password|credential|vault|sena|senhas|falcon|aether|device|omni.?processor|windows credential manager|owner vault)/i],
  ["legal_authority", /\b(authority|authorized|override|jesse|rayssa|felipe|amy|dan|gac|global authority|session lock)/i],
  ["code_patch_log", /\b(← Edit|Thinking:|function |class |const |let |node |powershell|npm |git |apply_patch|wrote |created)/i]
];

const SECRETISH = /\b(password|passwd|pwd|secret|token|api[_-]?key|cookie|authorization|bearer|refresh[_-]?token|private[_-]?key|credential|sena|senhas)\b/i;

function rel(p) {
  return path.join(repoRoot, p);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function appendNdjson(filePath, rows) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function repoRel(filePath) {
  const resolved = path.resolve(filePath);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  if (resolved === repoRoot || resolved.startsWith(rootWithSep)) {
    return path.relative(repoRoot, resolved).replace(/\\/g, "/");
  }
  return `external:${resolved}`;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const body = arg.slice(2);
    const eq = body.indexOf("=");
    if (eq >= 0) args[body.slice(0, eq)] = body.slice(eq + 1);
    else {
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[body] = next;
        i++;
      } else args[body] = true;
    }
  }
  return args;
}

function splitList(value, fallback = []) {
  if (Array.isArray(value)) return value.flatMap((v) => splitList(v));
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function walkTxt(root, cutoffMs, out = []) {
  if (!fs.existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!/node_modules|\.git|venv|__pycache__/i.test(full)) stack.push(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".txt")) continue;
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      if (stat.mtimeMs < cutoffMs) continue;
      out.push({ path: full, size: stat.size, mtime: stat.mtime.toISOString() });
    }
  }
  return out;
}

function classify(line) {
  const categories = [];
  for (const [id, regex] of CATEGORY_RULES) {
    if (regex.test(line)) categories.push(id);
  }
  return categories.length ? categories : ["unclassified_context"];
}

function addCount(map, key, inc = 1) {
  map[key] = (map[key] || 0) + inc;
}

function extractFacts(file, lines) {
  const facts = [];
  const joined = lines.join("\n");
  const patterns = [
    ["speed_100m_42min", /100,?000,?000[^\n]{0,80}(42 minutes|39,605|39605)/i],
    ["speed_63k_per_node", /(63,115|63115|63k)[^\n]{0,80}(agents|node|second)/i],
    ["liris_mistake_genius_counts", /(5\s*million|5,000,000)[^\n]{0,120}(genius|mistake)|(\b200\s*million|200,000,000)[^\n]{0,120}(mistake)/i],
    ["gulp_trigger_2000", /(gulp|gc)[^\n]{0,80}(2000|2,000)/i],
    ["law001_ports", /law.?001[^\n]{0,80}(4947|4950)/i],
    ["openmythos_law099", /open\s*mythos|mythos_think|law-099|spectral/i],
    ["ga_svm_crop_engine", /ga-svm|crop disease|support vector|fractal|entropy|morphology/i],
    ["original_hermes_v011", /hermes agent v0\.11|v2026\.4\.23|nousresearch\/hermes-agent/i],
    ["credential_authority_devices", /(falcon|aether|liris)[^\n]{0,80}(credential|vault|device|omni.?processor)/i]
  ];
  for (const [id, regex] of patterns) {
    if (regex.test(joined)) facts.push(id);
  }
  return facts.map((id) => ({ id, file: file.path }));
}

function buildActions(summary) {
  const cats = summary.categoryCounts;
  const has = (name) => Number(cats[name] || 0) > 0;
  const actions = [];
  if (has("original_hermes")) {
    actions.push({
      priority: "P0",
      id: "activate_hermes_contract_queue",
      action: "Turn original Hermes absorption contracts into bounded Asolaria work items: learning loop, WAL state, transport router, plugin hook GAC gate, and security backport."
    });
  }
  if (has("open_mythos")) {
    actions.push({
      priority: "P0",
      id: "finish_openmythos_engine_lane",
      action: "Bind OpenMythos adapter, MYTHOS_* glyphs, LAW-099 spectral drift, supervisor map, cube, Hermes dispatch, and Shannon consensus as one cognitive-engine lane."
    });
  }
  if (has("ga_svm_crop")) {
    actions.push({
      priority: "P0",
      id: "finish_ga_svm_crop_lane",
      action: "Ingest the crop disease GA-SVM paper as a classification engine lane with feature extraction schema, LAW-100, Atlas rule, supervisor, cube, and evaluation harness."
    });
  }
  if (has("gulp_gc_white_room") || has("storage_pressure")) {
    actions.push({
      priority: "P0",
      id: "stream_gulp_without_c_drive_bloat",
      action: "Move large proof/message archives to D-backed storage or bounded GC archives, keep C pressure guard active, and use buffered line writers for all proof streams."
    });
  }
  if (has("credential_device_authority") || has("liris_federation")) {
    actions.push({
      priority: "P0",
      id: "complete_device_credentials_and_audit",
      action: "Store Liris/Falcon/Aether credentials in owner vault, materialize transport adapters only where needed, then run the Liris full filesystem audit and ingest the manifest."
    });
  }
  if (has("supervisors_council") || has("behcs_glyph_cube_map")) {
    actions.push({
      priority: "P1",
      id: "promote_recent_desktop_corpus_to_council_surface",
      action: "Attach this corpus audit to council/supervisor surfaces so newer Desktop notes stop living outside the BEHCS map/cube/glyph chain."
    });
  }
  return actions;
}

function buildReport(summary) {
  const fileRows = summary.files
    .slice(0, 80)
    .map((f) => `| ${f.pathRef} | ${f.lines} | ${f.size} | ${f.modifiedAt} | ${f.topCategories.join(", ")} |`)
    .join("\n");
  const categoryRows = Object.entries(summary.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join("\n");
  const actionRows = summary.actions.map((a) => `- **${a.priority} ${a.id}**: ${a.action}`).join("\n");
  const factRows = summary.factSignals.slice(0, 80).map((f) => `- ${f.id}: ${repoRel(f.file)}`).join("\n");
  return `# Liris Newer-Stuff Corpus Audit

Generated: ${summary.generatedAt}

Cutoff: ${summary.cutoff}

Status: ${summary.status}

Every line in the selected recent text corpus was read and hashed. Secret-like values are not persisted in this report.

## Totals

- Files: ${summary.fileCount}
- Lines: ${summary.lineCount}
- Bytes: ${summary.byteCount}
- Audit root: ${summary.auditRoot}

## Category Counts

| Category | Lines |
| --- | ---: |
${categoryRows}

## High-Priority Actions

${actionRows}

## Fact Signals

${factRows || "- none"}

## Files

| File | Lines | Bytes | Modified | Top categories |
| --- | ---: | ---: | --- | --- |
${fileRows}

## Artifacts

- Per-line redacted/hash audit: ${repoRel(OUTPUTS.lineAudit)}
- Summary JSON: ${repoRel(OUTPUTS.summary)}
- BEHCS map: ${repoRel(OUTPUTS.map)}
- Hermes dispatch: ${repoRel(OUTPUTS.hermes)}
- Shannon consensus: ${repoRel(OUTPUTS.shannon)}
- Cube: ${repoRel(OUTPUTS.cube)}
`;
}

function run(options = {}) {
  const generatedAt = new Date().toISOString();
  const roots = splitList(options.roots, DEFAULT_ROOTS);
  const cutoff = options.cutoff || DEFAULT_CUTOFF;
  const cutoffMs = new Date(cutoff).getTime();
  const files = roots.flatMap((root) => walkTxt(root, cutoffMs)).sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  const rows = [];
  const fileSummaries = [];
  const categoryCounts = {};
  let lineCount = 0;
  let byteCount = 0;
  const factSignals = [];

  for (const file of files) {
    let buffer;
    try {
      buffer = fs.readFileSync(file.path);
    } catch {
      continue;
    }
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/);
    if (/\r?\n$/.test(text)) lines.pop();
    const perFileCategories = {};
    const secretLineCount = lines.filter((line) => SECRETISH.test(line)).length;
    byteCount += buffer.length;
    lineCount += lines.length;

    lines.forEach((line, index) => {
      const categories = classify(line);
      categories.forEach((cat) => {
        addCount(categoryCounts, cat);
        addCount(perFileCategories, cat);
      });
      rows.push({
        file: file.path,
        fileRef: repoRel(file.path),
        line: index + 1,
        sha256: sha256(line),
        chars: line.length,
        words: line.trim() ? line.trim().split(/\s+/).length : 0,
        empty: line.length === 0,
        secretLike: SECRETISH.test(line),
        categories
      });
    });

    factSignals.push(...extractFacts(file, lines));
    fileSummaries.push({
      path: file.path,
      pathRef: repoRel(file.path),
      size: buffer.length,
      modifiedAt: file.mtime,
      lines: lines.length,
      secretLikeLines: secretLineCount,
      topCategories: Object.entries(perFileCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([cat, count]) => `${cat}:${count}`)
    });
  }

  const auditRoot = sha256(rows.map((row) => `${row.fileRef}:${row.line}:${row.sha256}`).join("|"));
  const summary = {
    ok: true,
    generatedAt,
    status: "LIRIS_NEWER_STUFF_EVERY_LINE_HASHED_AND_MAPPED",
    cutoff,
    roots,
    fileCount: fileSummaries.length,
    lineCount,
    byteCount,
    auditRoot,
    categoryCounts,
    factSignals,
    files: fileSummaries,
    actions: [],
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([k, v]) => [k, repoRel(v)]))
  };
  summary.actions = buildActions(summary);

  const map = {
    id: "liris-newer-stuff-corpus-map.v1",
    generatedAt,
    auditRoot,
    nodes: [
      { id: "desktop_corpus", kind: "source_evidence", files: summary.fileCount, lines: summary.lineCount },
      { id: "liris", kind: "federated_node" },
      { id: "openmythos", kind: "cognitive_engine_lane" },
      { id: "original_hermes", kind: "supervisor_of_supervisors_source" },
      { id: "ga_svm_crop", kind: "classification_engine_lane" },
      { id: "gulp_white_room_gc", kind: "runtime_safety_lane" },
      { id: "gnn_reverse_gain_shannon", kind: "learning_loop" },
      { id: "device_credentials", kind: "omni_processor_authority" }
    ],
    edges: [
      { from: "desktop_corpus", to: "liris", relation: "contains_recent_node_evidence" },
      { from: "desktop_corpus", to: "openmythos", relation: "contains_integration_plan" },
      { from: "desktop_corpus", to: "original_hermes", relation: "contains_absorption_plan" },
      { from: "desktop_corpus", to: "ga_svm_crop", relation: "contains_algorithm_lane" },
      { from: "desktop_corpus", to: "gulp_white_room_gc", relation: "contains_runtime_safety_fixes" },
      { from: "gulp_white_room_gc", to: "gnn_reverse_gain_shannon", relation: "feeds_mistakes_and_genius" },
      { from: "device_credentials", to: "liris", relation: "unblocks_audit_when_vault_target_present" }
    ]
  };
  const hermes = {
    id: "liris-newer-stuff-corpus-dispatch.v1",
    generatedAt,
    auditRoot,
    dispatch: summary.actions.map((a) => a.id),
    status: "READY_FOR_TARGETED_IMPLEMENTATION"
  };
  const shannon = {
    id: "liris-newer-stuff-corpus-consensus.v1",
    generatedAt,
    consensus: "PROCEED_TARGETED_LIRIS_DELTA_INTEGRATION",
    votes: [
      { role: "line_scan", vote: "PASS", reason: `${summary.lineCount} lines hashed.` },
      { role: "corpus_scope", vote: "PASS", reason: `${summary.fileCount} recent files included.` },
      { role: "secret_policy", vote: "PASS", reason: "Secret-like lines are flagged but raw values are not persisted." },
      { role: "implementation_queue", vote: "PASS", reason: `${summary.actions.length} actions extracted.` }
    ]
  };
  const cube = {
    cube: "liris-newer-stuff-corpus.cube",
    generatedAt,
    auditRoot,
    faces: {
      lineAudit: repoRel(OUTPUTS.lineAudit),
      summary: repoRel(OUTPUTS.summary),
      map: repoRel(OUTPUTS.map),
      hermes: repoRel(OUTPUTS.hermes),
      shannon: repoRel(OUTPUTS.shannon)
    }
  };

  appendNdjson(OUTPUTS.lineAudit, rows);
  writeJson(OUTPUTS.summary, summary);
  writeJson(OUTPUTS.map, map);
  writeJson(OUTPUTS.hermes, hermes);
  writeJson(OUTPUTS.shannon, shannon);
  writeText(OUTPUTS.cube, `// cube: liris-newer-stuff-corpus | redacted every-line corpus audit\nexport const CUBE = ${JSON.stringify(cube, null, 2)};\n`);
  writeJson(OUTPUTS.reportJson, summary);
  writeText(OUTPUTS.reportMd, buildReport(summary));

  return summary;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "audit";
  if (command !== "audit") {
    throw new Error(`Unknown command: ${command}`);
  }
  const summary = run(args);
  process.stdout.write(JSON.stringify({
    ok: true,
    status: summary.status,
    files: summary.fileCount,
    lines: summary.lineCount,
    bytes: summary.byteCount,
    actions: summary.actions.length,
    outputs: summary.outputs
  }, null, 2) + "\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = { run };
