#!/usr/bin/env node
/** ASO Graph Export — nodes, edges, and DOT visualization.
 *  Outputs: data/aso/graph-nodes.json, graph-edges.json, graph.dot
 *  Chain: LX-153, LX-170 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TABLES = path.join(ROOT, "data", "aso", "tables");
const OUT = path.join(ROOT, "data", "aso");

function load(name) {
  const fp = path.join(TABLES, `${name}.json`);
  const d = JSON.parse(fs.readFileSync(fp, "utf8"));
  return Array.isArray(d.rows) ? d.rows : [];
}

// 1. Read topics + active relations
const topics = load("topics");
const relations = load("relations").filter(r => r.active !== false);

// Build lookup
const byId = new Map(topics.map(t => [t.asoId, t]));

// 2a. Count relations per topic
const relCount = new Map();
for (const r of relations) {
  relCount.set(r.from, (relCount.get(r.from) || 0) + 1);
  relCount.set(r.to, (relCount.get(r.to) || 0) + 1);
}

// 2b. Build nodes
const nodes = topics.map(t => ({
  id: t.asoId,
  name: t.name,
  type: t.type,
  tier: t.tier,
  relations_count: relCount.get(t.asoId) || 0
}));

// 2c. Build edges
const edges = relations.map(r => ({
  from: r.from,
  to: r.to,
  verb: r.verb,
  fromName: (byId.get(r.from) || {}).name || r.from,
  toName: (byId.get(r.to) || {}).name || r.to
}));

// 3. DOT export — boot tier + 1 hop (direct neighbours)
const bootIds = new Set(topics.filter(t => t.tier === "boot").map(t => t.asoId));
const hopIds = new Set(bootIds);
for (const r of relations) {
  if (bootIds.has(r.from)) hopIds.add(r.to);
  if (bootIds.has(r.to)) hopIds.add(r.from);
}

const esc = s => (s || "").replace(/"/g, '\\"');
let dot = "digraph ASO {\n  rankdir=LR;\n  node [shape=box fontsize=10];\n";
for (const id of hopIds) {
  const t = byId.get(id);
  if (!t) continue;
  const color = bootIds.has(id) ? "red" : "gray40";
  const style = bootIds.has(id) ? "bold" : "solid";
  dot += `  "${id}" [label="${esc(t.name)}" color=${color} style=${style}];\n`;
}
for (const r of relations) {
  if (!hopIds.has(r.from) || !hopIds.has(r.to)) continue;
  dot += `  "${r.from}" -> "${r.to}" [label="${r.verb}" fontsize=8];\n`;
}
dot += "}\n";

// 4. Write outputs
fs.writeFileSync(path.join(OUT, "graph-nodes.json"), JSON.stringify(nodes, null, 2));
fs.writeFileSync(path.join(OUT, "graph-edges.json"), JSON.stringify(edges, null, 2));
fs.writeFileSync(path.join(OUT, "graph.dot"), dot);

// 5. Summary
const sorted = [...nodes].sort((a, b) => b.relations_count - a.relations_count);
const top10 = sorted.slice(0, 10);

console.log("=== ASO Graph Export ===");
console.log(`  Nodes : ${nodes.length}`);
console.log(`  Edges : ${edges.length}`);
console.log(`  DOT   : boot(${bootIds.size}) + 1-hop(${hopIds.size - bootIds.size}) = ${hopIds.size} nodes`);
console.log("");
console.log("Top 10 most-connected topics:");
console.log("-".repeat(60));
for (const n of top10) {
  const pad = n.relations_count.toString().padStart(4);
  console.log(`  ${pad} rels  [${n.tier.padEnd(13)}] ${n.name}`);
}
console.log("-".repeat(60));
console.log(`\nFiles written:`);
console.log(`  ${path.join(OUT, "graph-nodes.json")}`);
console.log(`  ${path.join(OUT, "graph-edges.json")}`);
console.log(`  ${path.join(OUT, "graph.dot")}`);
