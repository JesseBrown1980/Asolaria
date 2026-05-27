#!/usr/bin/env node
/**
 * council-vote.mjs
 *
 * Deterministic council vote consumer. Given a question and a set of
 * cluster-keywords (or auto-extracted from the question), tally
 * voteKeyword overlap across all 234 supervisors via the sidecar
 * overlay and emit a deterministic verdict.
 *
 * CLI:
 *   node council-vote.mjs --question "<text>" [--cluster-keywords k1,k2,...]
 *
 * Reads:
 *   data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json
 *   data/behcs/pid-fabric/overlays/supervisor-concerns-overlay-v1.json
 *
 * Does NOT mutate.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

const INDEX_PATH = join(
  REPO_ROOT,
  "data", "behcs", "pid-fabric", "index",
  "supervisor-pid-indicator-index-latest.json"
);
const OVERLAY_PATH = join(
  REPO_ROOT,
  "data", "behcs", "pid-fabric", "overlays",
  "supervisor-concerns-overlay-v1.json"
);

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { question: null, clusterKeywords: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--question") out.question = argv[++i] || "";
    else if (a === "--cluster-keywords") out.clusterKeywords = argv[++i] || "";
    else if (a.startsWith("--question=")) out.question = a.slice("--question=".length);
    else if (a.startsWith("--cluster-keywords=")) out.clusterKeywords = a.slice("--cluster-keywords=".length);
  }
  return out;
}

// Deterministic tokenization: lowercase, strip punctuation, split on
// whitespace, keep alphanum tokens of length >= 3, drop stopwords.
const STOP = new Set([
  "the","a","an","and","or","but","of","to","for","on","in","at","with",
  "is","are","be","by","this","that","it","its","as","from","into","use",
  "should","would","could","do","does","did","not","no","yes","if","then",
  "than","about","over","under","via","per","any","all","some","each","one",
  "two","three","explicit","auto","managed",
]);

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9_/-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t && t.length >= 3 && !STOP.has(t));
}

// Auto-extract cluster keywords from a question if none given.
// Strategy: tokenize, dedupe in-order, cap at 12.
function autoCluster(question) {
  const seen = new Set();
  const out = [];
  for (const t of tokenize(question)) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tally
// ---------------------------------------------------------------------------
function overlapScore(supervisorKeywords, clusterKeywords) {
  // Score = count of cluster keywords that appear (as substring or
  // equality) in the supervisor's voteKeywords.
  if (!supervisorKeywords || supervisorKeywords.length === 0) return 0;
  const supLower = supervisorKeywords.map((k) => String(k).toLowerCase());
  let score = 0;
  const matches = [];
  for (const ck of clusterKeywords) {
    const ckl = String(ck).toLowerCase();
    let hit = false;
    for (const sk of supLower) {
      if (sk === ckl || sk.includes(ckl) || ckl.includes(sk)) { hit = true; break; }
    }
    if (hit) { score++; matches.push(ckl); }
  }
  return { score, matches };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.question) {
    console.error("Usage: node council-vote.mjs --question \"<text>\" [--cluster-keywords k1,k2,...]");
    process.exit(2);
  }
  if (!existsSync(OVERLAY_PATH)) {
    console.error(`[FATAL] overlay not found: ${OVERLAY_PATH}`);
    console.error("Run supervisor-concerns-populator.mjs first.");
    process.exit(3);
  }
  if (!existsSync(INDEX_PATH)) {
    console.error(`[FATAL] supervisor PID index not found: ${INDEX_PATH}`);
    process.exit(4);
  }

  const overlay = JSON.parse(readFileSync(OVERLAY_PATH, "utf8"));
  const entries = overlay.entries || [];

  const cluster = args.clusterKeywords
    ? args.clusterKeywords.split(",").map((s) => s.trim()).filter(Boolean)
    : autoCluster(args.question);

  // Pre-compute domain tally: for each entry, on hit, also bump its
  // matched domains.
  const clusterTally = {};
  const domainTally = {};
  for (const d of (overlay.domainCatalog || [])) domainTally[d] = 0;

  let voted = 0;
  let abstained = 0;
  const named = [];
  const perEntry = [];

  for (const e of entries) {
    const { score, matches } = overlapScore(e.derived_voteKeywords, cluster);
    if (score > 0) {
      voted++;
      named.push({
        pid: e.pid,
        supervisorId: e.supervisorId,
        title: e.title,
        score,
        matched: matches,
        domains: e.derived_domains || [],
      });
      for (const m of matches) clusterTally[m] = (clusterTally[m] || 0) + 1;
      for (const d of (e.derived_domains || [])) {
        domainTally[d] = (domainTally[d] || 0) + 1;
      }
    } else {
      abstained++;
    }
    perEntry.push({ pid: e.pid, score });
  }

  // Deterministic ordering of named voters: highest score, then pid asc.
  named.sort((a, b) => (b.score - a.score) || (a.pid < b.pid ? -1 : a.pid > b.pid ? 1 : 0));

  // Convergence text: pick top-3 dominant domains.
  const dominantDomains = Object.entries(domainTally)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d, v]) => `${d}(${v})`);

  const convergence_text =
    voted === 0
      ? "ABSTAIN: no supervisor voteKeyword overlap with cluster"
      : `CONVERGE: ${voted}/${entries.length} supervisors vote, dominant domains: ${dominantDomains.join(", ")}`;

  const verdict = {
    question: args.question,
    cluster_keywords: cluster,
    cluster_keywords_source: args.clusterKeywords ? "provided" : "auto-extracted",
    overlay_id: overlay.overlayId,
    overlay_generated_at: overlay.generatedAt,
    derivation_d11: overlay.derivation_d11,
    total_supervisors: entries.length,
    voted,
    abstained,
    cluster_tally: clusterTally,
    domain_tally: domainTally,
    named_voters: named,
    convergence_text,
  };

  // Pretty banner + JSON.
  console.log("=".repeat(72));
  console.log("COUNCIL VOTE — deterministic");
  console.log("=".repeat(72));
  console.log(`question:           ${verdict.question}`);
  console.log(`cluster (${verdict.cluster_keywords_source}): ${cluster.join(", ")}`);
  console.log(`total_supervisors:  ${verdict.total_supervisors}`);
  console.log(`voted:              ${verdict.voted}`);
  console.log(`abstained:          ${verdict.abstained}`);
  console.log(`d11:                ${verdict.derivation_d11}`);
  console.log("cluster_tally:");
  for (const [k, v] of Object.entries(clusterTally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}`);
  }
  console.log("domain_tally:");
  for (const [k, v] of Object.entries(domainTally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(18)} ${String(v).padStart(4)}`);
  }
  console.log(`convergence:        ${verdict.convergence_text}`);
  console.log("top named voters:");
  for (const nv of named.slice(0, 10)) {
    console.log(`  [${nv.score}] ${nv.pid}  ${nv.supervisorId || ""}`);
    if (nv.title) console.log(`      title: ${nv.title}`);
    console.log(`      matched: ${nv.matched.join(",")}`);
  }
  console.log("=".repeat(72));
  // Also emit final JSON for machine consumers.
  console.log("--- JSON-VERDICT ---");
  console.log(JSON.stringify(verdict, null, 2));
}

main();
