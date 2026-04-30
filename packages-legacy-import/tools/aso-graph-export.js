#!/usr/bin/env node
/** ASO Graph Export — nodes, edges, and DOT visualization.
 *  Outputs: data/aso/graph-nodes.json, graph-edges.json, graph.dot
 *  Chain: LX-153, LX-170 */
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
process.env.ASOLARIA_INSTANCE_ROOT = process.env.ASOLARIA_INSTANCE_ROOT || projectRoot;
const aso = require("../src/index-kernel/aso");

const TABLES_DIR = path.join(aso.ASO_DATA_DIR, "tables");
const OUTPUT_DIR = aso.ASO_DATA_DIR;

function loadRows(name) {
  const filePath = path.join(TABLES_DIR, `${name}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(data.rows) ? data.rows : [];
}

const topics = loadRows("topics");
const relations = loadRows("relations").filter((row) => row.active !== false);
const topicsById = new Map(topics.map((topic) => [topic.asoId, topic]));
const relationCounts = new Map();

for (const relation of relations) {
  relationCounts.set(relation.from, (relationCounts.get(relation.from) || 0) + 1);
  relationCounts.set(relation.to, (relationCounts.get(relation.to) || 0) + 1);
}

const nodes = topics.map((topic) => ({
  id: topic.asoId,
  name: topic.name,
  type: topic.type,
  tier: topic.tier,
  relations_count: relationCounts.get(topic.asoId) || 0
}));

const edges = relations.map((relation) => ({
  from: relation.from,
  to: relation.to,
  verb: relation.verb,
  fromName: topicsById.get(relation.from)?.name || relation.from,
  toName: topicsById.get(relation.to)?.name || relation.to
}));

const bootIds = new Set(topics.filter((topic) => topic.tier === "boot").map((topic) => topic.asoId));
const oneHopIds = new Set(bootIds);
for (const relation of relations) {
  if (bootIds.has(relation.from)) oneHopIds.add(relation.to);
  if (bootIds.has(relation.to)) oneHopIds.add(relation.from);
}

const escapeLabel = (value) => String(value || "").replace(/"/g, '\\"');
let dot = "digraph ASO {\n  rankdir=LR;\n  node [shape=box fontsize=10];\n";
for (const asoId of oneHopIds) {
  const topic = topicsById.get(asoId);
  if (!topic) continue;
  const color = bootIds.has(asoId) ? "red" : "gray40";
  const style = bootIds.has(asoId) ? "bold" : "solid";
  dot += `  "${asoId}" [label="${escapeLabel(topic.name)}" color=${color} style=${style}];\n`;
}
for (const relation of relations) {
  if (!oneHopIds.has(relation.from) || !oneHopIds.has(relation.to)) continue;
  dot += `  "${relation.from}" -> "${relation.to}" [label="${relation.verb}" fontsize=8];\n`;
}
dot += "}\n";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const nodesPath = path.join(OUTPUT_DIR, "graph-nodes.json");
const edgesPath = path.join(OUTPUT_DIR, "graph-edges.json");
const dotPath = path.join(OUTPUT_DIR, "graph.dot");

fs.writeFileSync(nodesPath, JSON.stringify(nodes, null, 2), "utf8");
fs.writeFileSync(edgesPath, JSON.stringify(edges, null, 2), "utf8");
fs.writeFileSync(dotPath, dot, "utf8");

const topTen = [...nodes]
  .sort((left, right) => right.relations_count - left.relations_count)
  .slice(0, 10);

console.log("=== ASO Graph Export ===");
console.log(`  Nodes : ${nodes.length}`);
console.log(`  Edges : ${edges.length}`);
console.log(`  DOT   : boot(${bootIds.size}) + 1-hop(${oneHopIds.size - bootIds.size}) = ${oneHopIds.size} nodes`);
console.log("");
console.log("Top 10 most-connected topics:");
console.log("-".repeat(60));
for (const node of topTen) {
  console.log(`  ${String(node.relations_count).padStart(4)} rels  [${String(node.tier || "").padEnd(13)}] ${node.name}`);
}
console.log("-".repeat(60));
console.log("\nFiles written:");
console.log(`  ${nodesPath}`);
console.log(`  ${edgesPath}`);
console.log(`  ${dotPath}`);
