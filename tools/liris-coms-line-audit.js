#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE = process.env.ASOLARIA_LIRIS_COMS_PATH || rel("data/behcs/source-evidence/liris-coms.txt");

const PATHS = Object.freeze({
  auditNdjson: rel("data/behcs/source-evidence/liris-coms-full-line-audit.v1.ndjson"),
  auditJson: rel("data/behcs/source-evidence/liris-coms-full-line-audit.v1.json"),
  state: rel("data/behcs/state/liris/liris-coms-full-line-audit.state.json"),
  hermes: rel("data/behcs/hermes/liris/liris-coms-full-line-audit-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/liris/liris-coms-full-line-audit-consensus-latest.json"),
  cube: rel("data/behcs/cubes/liris-coms-full-line-audit.cube.js"),
  reportJson: rel("reports/liris-coms-full-line-audit-latest.json"),
  reportMd: rel("reports/liris-coms-full-line-audit-latest.md")
});

const CATEGORIES = [
  ["openmythos", /\b(open\s*mythos|mythos|spectral|law-099|recurrence)\b/i],
  ["ga_svm_crop_disease", /\b(ga-svm|crop disease|svm|fractal|entropy|morphology|diagnosis)\b/i],
  ["gulp_gc_whiteroom", /\b(gulp|white.?room|garbage|gc|inbox\.ndjson|collector|super gulp)\b/i],
  ["buffered_io_speed", /\b(buffer|appendFileSync|writeSync|sync I\/O|throughput|agents\/sec|WRITE_BUFFER|BufferedWriter|StateWriter)\b/i],
  ["reverse_gain_gnn", /\b(reverse.?gain|gnn|shannon|omnishannon|mistake|ledger|sieve)\b/i],
  ["law_brown_hilbert_shadow", /\b(law 001|law-001|brown.?hilbert|shadow file|ports 4947|4950)\b/i],
  ["supervisors_maps_cubes", /\b(supervisor|map|mapped|cube|cubed|BEHCS-256|glyph)\b/i],
  ["big_pickle_speed", /\b(big pickle|3 million|100m|100,000,000|63k|42 minutes|39,605|224864025)\b/i],
  ["code_edit_log", /\b(← Edit|Thinking:|function |class |const |let |require\(|node |powershell|\$ )\b/i]
];

function rel(p) {
  return path.join(ROOT, p);
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

function repoRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function sourceRef(filePath) {
  const resolved = path.resolve(filePath);
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : `${ROOT}${path.sep}`;
  if (resolved === ROOT || resolved.startsWith(rootWithSep)) {
    return repoRel(resolved);
  }
  return `external:${path.basename(resolved)}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function classify(line) {
  const categories = [];
  for (const [id, regex] of CATEGORIES) {
    if (regex.test(line)) categories.push(id);
  }
  return categories.length ? categories : ["unclassified_context"];
}

function countWords(line) {
  const trimmed = line.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function findRanges(records, category) {
  const ranges = [];
  let start = null;
  let end = null;
  for (const record of records) {
    if (record.categories.includes(category)) {
      if (start == null) start = record.line;
      end = record.line;
    } else if (start != null) {
      ranges.push({ start, end, lines: end - start + 1 });
      start = null;
      end = null;
    }
  }
  if (start != null) ranges.push({ start, end, lines: end - start + 1 });
  return ranges;
}

function topRanges(records) {
  const out = {};
  for (const [category] of CATEGORIES) {
    out[category] = findRanges(records, category)
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 8);
  }
  return out;
}

function buildInsights(records) {
  const contains = (regex) => records.some((r) => regex.test(r.text));
  const insights = [];
  if (contains(/appendFileSync|sync I\/O|BufferedWriter|WRITE_BUFFER/i)) {
    insights.push({
      id: "buffered_io_is_primary_speed_fix",
      finding: "The logs repeatedly identify synchronous per-record file writes as the throughput cap and promote buffered NDJSON writes as the main speed fix.",
      implementation: "Use open file descriptors, 5k-line buffers, delayed state writes, and final flush/close for inbox, GNN edges, and ledger surfaces."
    });
  }
  if (contains(/sinceLastGulp.*347267|buffer grew|bypass/i)) {
    insights.push({
      id: "stream_bypass_desynchronizes_gc_state",
      finding: "A stream path that writes inbox rows without the real Gulp runtime can desynchronize sinceLastGulp from actual BEHCS buffer depth.",
      implementation: "Feed sealed gulp batches through the existing Law001/Brown-Hilbert runtime export instead of inventing a separate GC counter."
    });
  }
  if (contains(/shadow files|Law 001|Brown/i)) {
    insights.push({
      id: "do_not_edit_shadow_runtime",
      finding: "The logs explicitly protect shadow files and Law001/Brown-Hilbert runtime surfaces.",
      implementation: "Use non-shadow bridge/feeder scripts that call exported runtime functions; do not patch shadow files."
    });
  }
  if (contains(/reverse.?gain|promoted|demoted|sieve/i)) {
    insights.push({
      id: "reverse_gain_before_promotion",
      finding: "Reverse-gain is treated as a promotion gate, not a post-hoc report.",
      implementation: "Run anomaly demotion/promotion before Atlas/ledger promotion and preserve top marks separately from trash compaction."
    });
  }
  if (contains(/OpenMythos|MYTHOS_THINK|spectral/i)) {
    insights.push({
      id: "openmythos_needs_engine_adapter_plus_law_099",
      finding: "OpenMythos integration requires glyph dispatch, PID-bound runtime, spectral radius drift, and GAC enforcement.",
      implementation: "Map MYTHOS_* glyphs to the cognitive engine registry and LAW-099 surfaces."
    });
  }
  if (contains(/GA-SVM|crop disease|Disease class/i)) {
    insights.push({
      id: "ga_svm_is_cognitive_engine_lane",
      finding: "The crop-disease GA-SVM paper maps naturally to a governed classification engine lane with feature extraction, GA optimization, SVM prediction, and explainability output.",
      implementation: "Bind source evidence, feature schema, LAW-100, runtime route, supervisors, map, cube, Hermes, and Shannon."
    });
  }
  return insights;
}

function buildReport(summary) {
  const categoryRows = Object.entries(summary.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join("\n");
  const insightRows = summary.insights
    .map((item) => `- **${item.id}**: ${item.finding} Implementation: ${item.implementation}`)
    .join("\n");
  return `# Liris Coms Full Line Audit

Generated: ${summary.generatedAt}

Source: ${summary.source.path}

SHA256: ${summary.source.sha256}

Lines read: ${summary.source.lines}

Bytes: ${summary.source.bytes}

Status: ${summary.status}

This audit reads every line of the source file sequentially and writes one audit record per source line.

## Category Counts

| Category | Lines |
| --- | ---: |
${categoryRows}

## Implementation Findings

${insightRows}

## Artifacts

- Full per-line NDJSON audit: ${summary.outputs.auditNdjson}
- JSON summary: ${summary.outputs.auditJson}
- Hermes packet: ${summary.outputs.hermes}
- Shannon packet: ${summary.outputs.shannon}
- Cube: ${summary.outputs.cube}
`;
}

function missingSummary(sourcePath, generatedAt) {
  return {
    ok: false,
    generatedAt,
    status: "LIRIS_COMS_SOURCE_MISSING",
    source: {
      pathRef: sourceRef(sourcePath),
      exists: false
    },
    outputs: Object.fromEntries(Object.entries(PATHS).map(([key, file]) => [key, repoRel(file)]))
  };
}

function run(sourcePath = DEFAULT_SOURCE, options = {}) {
  const execute = options.execute === true;
  const generatedAt = new Date().toISOString();
  const exists = fs.existsSync(sourcePath);
  if (!exists) {
    return missingSummary(sourcePath, generatedAt);
  }
  const bytes = fs.readFileSync(sourcePath);
  const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/);
  if (/\r?\n$/.test(text)) {
    lines.pop();
  }
  const records = lines.map((line, index) => ({
    line: index + 1,
    sha256: sha256(line),
    words: countWords(line),
    chars: line.length,
    empty: line.length === 0,
    categories: classify(line),
    text: line
  }));
  const categoryCounts = {};
  for (const record of records) {
    for (const category of record.categories) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  }
  const insights = buildInsights(records);
  const auditRoot = sha256(records.map((record) => `${record.line}:${record.sha256}`).join("|"));
  const sourceHash = sha256(bytes);
  const summary = {
    ok: true,
    generatedAt,
    status: "LIRIS_COMS_EVERY_LINE_AUDITED",
    source: {
      pathRef: sourceRef(sourcePath),
      sha256: sourceHash,
      bytes: bytes.length,
      lines: records.length
    },
    auditRoot,
    categoryCounts,
    topRanges: topRanges(records),
    insights,
    outputs: Object.fromEntries(Object.entries(PATHS).map(([key, file]) => [key, repoRel(file)]))
  };
  if (!execute) return summary;

  const hermes = {
    id: "liris-coms-full-line-audit-hermes.v1",
    generatedAt,
    sourceHash,
    lineCount: records.length,
    packet: "EVERY_LINE_AUDIT_COMPLETE",
    dispatch: ["source_evidence", "implementation_findings", "behcs_mapping"]
  };
  const shannon = {
    id: "liris-coms-full-line-audit-shannon.v1",
    generatedAt,
    consensus: "PROCEED-EVERY-LINE-AUDIT-COMPLETE",
    sourceHash,
    auditRoot,
    votes: [
      { role: "source", vote: "PASS", reason: "Source file exists and was hashed." },
      { role: "line_scan", vote: "PASS", reason: `${records.length} line records generated.` },
      { role: "implementation", vote: "PASS", reason: `${insights.length} implementation findings extracted.` }
    ]
  };
  const cube = {
    cube: "liris-coms-full-line-audit.cube",
    generatedAt,
    sourceHash,
    auditRoot,
    lines: records.length,
    faces: {
      auditNdjson: repoRel(PATHS.auditNdjson),
      auditJson: repoRel(PATHS.auditJson),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon)
    }
  };

  ensureDir(PATHS.auditNdjson);
  fs.writeFileSync(PATHS.auditNdjson, records.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
  writeJson(PATHS.auditJson, summary);
  writeJson(PATHS.state, { savedAt: generatedAt, status: summary.status, sourceHash, auditRoot, lineCount: records.length });
  writeJson(PATHS.hermes, hermes);
  writeJson(PATHS.shannon, shannon);
  writeText(PATHS.cube, `// cube: liris-coms-full-line-audit | every-line source evidence\nexport const CUBE = ${JSON.stringify(cube, null, 2)};\n`);
  writeJson(PATHS.reportJson, summary);
  writeText(PATHS.reportMd, buildReport(summary));
  return summary;
}

function main(argv) {
  const action = argv[2] || "status";
  const sourceArg = argv.find((arg) => arg.startsWith("--source="));
  const sourcePath = sourceArg ? sourceArg.slice("--source=".length) : DEFAULT_SOURCE;
  const execute = argv.includes("--execute");
  if (action === "status" || action === "audit") {
    console.log(JSON.stringify(run(sourcePath, { execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      "node tools/liris-coms-line-audit.js status --source=<path>",
      "node tools/liris-coms-line-audit.js audit --source=<path> --execute"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
