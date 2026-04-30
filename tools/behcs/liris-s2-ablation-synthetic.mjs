#!/usr/bin/env node
// liris-s2-ablation-synthetic.mjs — OPT_S2 ablation test on liris.
//
// Generates a SYNTHETIC corpus (no acer dependency, since 65MB corpus too big for
// bus per acer note). Tests label-leakage hypothesis from
// `feedback_gnn_label_leakage_when_node_features_encode_labels.md`.
//
// Method:
//   1. Generate N synthetic edges with riskScore + ground-truth label
//   2. Variant A: node features include avgRisk/maxRisk (LEAK present)
//   3. Variant B: node features WITHOUT avgRisk/maxRisk (LEAK stripped)
//   4. Train both variants → compare F1
//   5. Variant A F1 ≈ 0.99 + Variant B F1 ≈ 0.50-0.70 → leakage CONFIRMED
//   6. Variant A F1 ≈ Variant B F1 → leakage was elsewhere
//   7. Both ≈ 0.10 → architecture / dataset issue
//
// Output: ablation report JSON with both F1s + dispatched envelope.
//
// named_agent: liris-s2-ablation-synthetic

import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { spawn } from "node:child_process";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const REPORT_PATH = "C:/Users/rayss/Asolaria/services/gnn-sidecar/s2-ablation-report.json";

// Generate synthetic corpus: 1000 nodes, ~10K edges, riskScore drawn uniform [0,9],
// label = riskScore >= 3.
function generateSynthetic(N_nodes = 1000, N_edges = 10000, seed = 42) {
  let rngState = seed;
  const rng = () => { rngState = (rngState * 9301 + 49297) % 233280; return rngState / 233280; };
  const nodes = [];
  for (let i = 0; i < N_nodes; i++) {
    const riskScore = Math.floor(rng() * 10);  // 0-9
    nodes.push({
      id: i,
      riskScore,
      avgRisk: riskScore + (rng() - 0.5),  // noise around riskScore
      maxRisk: riskScore + Math.floor(rng() * 2),
      edgeVolume: Math.floor(rng() * 100),
      failureRate: rng() * 0.5,
      online: rng() > 0.1 ? 1 : 0,
      trustTier: Math.floor(rng() * 3) + 1,
    });
  }
  const edges = [];
  for (let i = 0; i < N_edges; i++) {
    const src = Math.floor(rng() * N_nodes);
    let tgt = Math.floor(rng() * N_nodes);
    if (tgt === src) tgt = (tgt + 1) % N_nodes;
    const edgeRisk = Math.max(nodes[src].riskScore, nodes[tgt].riskScore);
    const label = edgeRisk >= 3 ? 1 : 0;
    edges.push({ source: src, target: tgt, label });
  }
  return { nodes, edges };
}

console.log("[1/5] generating synthetic corpus ...");
const corpus = generateSynthetic(1000, 10000);
const positive = corpus.edges.filter(e => e.label === 1).length;
const ratio = positive / corpus.edges.length;
console.log(`  nodes: ${corpus.nodes.length}, edges: ${corpus.edges.length}, positive ratio: ${(ratio * 100).toFixed(2)}%`);

// Run 2 training variants via Python (minimal inline trainer since we can't easily
// reuse acer's full train_gslgnn_w9_3.py without acer's specific corpus structure).
// Use a tiny Python runner that does GSLGNN training on the synthetic corpus.

const PY_SCRIPT = `
import sys, json, hashlib, random
import numpy as np
import torch
import torch.nn as nn

random.seed(42)
torch.manual_seed(42)
np.random.seed(42)

corpus = json.load(sys.stdin)
nodes = corpus["nodes"]
edges = corpus["edges"]
strip_leak = corpus.get("strip_leak", False)

# 6-dim features: edgeVolume/100, avgRisk/9, maxRisk/9, failureRate, online, trustTier/3
# When stripping leak: zero out avgRisk + maxRisk (keep dimensionality)
nf = []
for n in nodes:
    feat = [
        min(n["edgeVolume"]/100.0, 1.0),
        0.0 if strip_leak else (n["avgRisk"]/9.0),
        0.0 if strip_leak else (n["maxRisk"]/9.0),
        n["failureRate"],
        n["online"],
        n["trustTier"]/3.0,
    ]
    nf.append(feat)
node_features = torch.tensor(nf, dtype=torch.float32)
src = [e["source"] for e in edges]
tgt = [e["target"] for e in edges]
edge_index = torch.tensor([src, tgt], dtype=torch.long)
labels = torch.tensor([e["label"] for e in edges], dtype=torch.float32)

# Tiny GNN (GCNConv-style with PyG real if available)
try:
    from torch_geometric.nn import GCNConv
    class TinyGNN(nn.Module):
        def __init__(self, in_dim, hid=32):
            super().__init__()
            self.conv1 = GCNConv(in_dim, hid)
            self.conv2 = GCNConv(hid, hid)
            self.edge_classifier = nn.Linear(hid * 2, 1)
        def forward(self, x, ei):
            h = torch.relu(self.conv1(x, ei))
            h = self.conv2(h, ei)
            row, col = ei
            edge_h = torch.cat([h[row], h[col]], dim=1)
            return torch.sigmoid(self.edge_classifier(edge_h)).reshape(-1)
except ImportError:
    class TinyGNN(nn.Module):
        def __init__(self, in_dim, hid=32):
            super().__init__()
            self.lin1 = nn.Linear(in_dim, hid)
            self.lin2 = nn.Linear(hid, hid)
            self.edge_classifier = nn.Linear(hid * 2, 1)
        def forward(self, x, ei):
            h = torch.relu(self.lin1(x))
            h = self.lin2(h)
            row, col = ei
            edge_h = torch.cat([h[row], h[col]], dim=1)
            return torch.sigmoid(self.edge_classifier(edge_h)).reshape(-1)

model = TinyGNN(in_dim=6, hid=32)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
criterion = nn.BCELoss()

n = len(labels)
train_end = int(n * 0.7)
val_end = int(n * 0.85)

best_val = 0
for epoch in range(15):
    model.train()
    optimizer.zero_grad()
    scores = model(node_features, edge_index).clamp(1e-7, 1 - 1e-7)
    loss = criterion(scores[:train_end], labels[:train_end])
    loss.backward()
    optimizer.step()
    with torch.no_grad():
        model.eval()
        s = model(node_features, edge_index).clamp(1e-7, 1 - 1e-7)
        pred_v = (s[train_end:val_end] > 0.5).float()
        val_acc = (pred_v == labels[train_end:val_end]).float().mean().item()
        if val_acc > best_val: best_val = val_acc

# Test
with torch.no_grad():
    model.eval()
    scores = model(node_features, edge_index).clamp(1e-7, 1 - 1e-7)
    pred = (scores[val_end:] > 0.5).float()
    actual = labels[val_end:]
    tp = ((pred == 1) & (actual == 1)).sum().item()
    fp = ((pred == 1) & (actual == 0)).sum().item()
    fn = ((pred == 0) & (actual == 1)).sum().item()
    test_acc = (pred == actual).float().mean().item()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

print(json.dumps({
    "strip_leak": strip_leak,
    "test_accuracy": test_acc,
    "test_precision": precision,
    "test_recall": recall,
    "test_f1": f1,
    "best_val_acc": best_val,
    "epochs": 15,
    "test_size": n - val_end,
    "positive_ratio": float((labels == 1).float().mean()),
}))
`;

function runVariant(strip_leak) {
  return new Promise((resolve) => {
    const input = JSON.stringify({ ...corpus, strip_leak });
    const p = spawn("C:/Users/rayss/AppData/Local/Python/pythoncore-3.14-64/python.exe", ["-c", PY_SCRIPT], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    p.stdout.on("data", c => stdout += c);
    p.stderr.on("data", c => stderr += c);
    p.on("close", (code) => { try { resolve({ ok: code === 0, result: JSON.parse(stdout.trim()), stderr }); } catch (e) { resolve({ ok: false, stderr, stdout }); } });
    p.on("error", e => resolve({ ok: false, error: e.message }));
    p.stdin.write(input);
    p.stdin.end();
  });
}

console.log("\n[2/5] training Variant A (leak features INCLUDED) ...");
const t0a = Date.now();
const variantA = await runVariant(false);
const t1a = Date.now();
console.log(`  elapsed ${(t1a - t0a) / 1000}s ok=${variantA.ok}`);
if (variantA.ok) console.log(`  F1=${variantA.result.test_f1.toFixed(4)} acc=${variantA.result.test_accuracy.toFixed(4)} precision=${variantA.result.test_precision.toFixed(4)} recall=${variantA.result.test_recall.toFixed(4)}`);
else console.log(`  stderr: ${(variantA.stderr || "").slice(0, 300)}`);

console.log("\n[3/5] training Variant B (leak features STRIPPED) ...");
const t0b = Date.now();
const variantB = await runVariant(true);
const t1b = Date.now();
console.log(`  elapsed ${(t1b - t0b) / 1000}s ok=${variantB.ok}`);
if (variantB.ok) console.log(`  F1=${variantB.result.test_f1.toFixed(4)} acc=${variantB.result.test_accuracy.toFixed(4)} precision=${variantB.result.test_precision.toFixed(4)} recall=${variantB.result.test_recall.toFixed(4)}`);
else console.log(`  stderr: ${(variantB.stderr || "").slice(0, 300)}`);

console.log("\n[4/5] interpreting result ...");
let interpretation = "INSUFFICIENT_DATA";
let leakage_confirmed = null;
if (variantA.ok && variantB.ok) {
  const fA = variantA.result.test_f1;
  const fB = variantB.result.test_f1;
  const drop = fA - fB;
  if (fA > 0.85 && fB > 0.85) interpretation = "BOTH_HIGH_LEAKAGE_NOT_DOMINANT_OR_GENERALIZATION_REAL";
  else if (fA > 0.85 && fB < 0.50) { interpretation = "LEAKAGE_CONFIRMED_DROP_GREATER_0_35"; leakage_confirmed = true; }
  else if (fA > 0.85 && fB >= 0.50 && fB <= 0.70) { interpretation = "PARTIAL_LEAKAGE_GENERALIZATION_RECOVERED_AT_REASONABLE_LEVEL"; leakage_confirmed = true; }
  else if (fA < 0.30 && fB < 0.30) interpretation = "ARCHITECTURE_OR_DATASET_ISSUE_NEITHER_LEARNS";
  else interpretation = "MIXED_F1_DELTA_" + drop.toFixed(3);
  console.log(`  Variant A (with leak): F1=${fA.toFixed(4)}`);
  console.log(`  Variant B (stripped):  F1=${fB.toFixed(4)}`);
  console.log(`  Delta:                 ${drop.toFixed(4)}`);
  console.log(`  Interpretation:        ${interpretation}`);
}

const report = {
  generated_at: new Date().toISOString(),
  corpus: { nodes: corpus.nodes.length, edges: corpus.edges.length, positive_ratio: ratio, seed: 42 },
  variant_A_with_leak: variantA.ok ? variantA.result : { error: variantA.error || variantA.stderr?.slice(0, 200) },
  variant_B_stripped: variantB.ok ? variantB.result : { error: variantB.error || variantB.stderr?.slice(0, 200) },
  interpretation,
  leakage_confirmed,
  source: "synthetic-from-scratch (no acer corpus dependency, per acer note 65MB corpus too big for bus)",
  named_agent: "liris-s2-ablation-synthetic",
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`  wrote report ${REPORT_PATH}`);

console.log("\n[5/5] dispatching ablation result envelope to acer ...");
const ts = new Date().toISOString();
const envId = crypto.createHash("sha256").update("liris-s2-ablation-result-" + ts).digest("hex").slice(0, 32);
const env = {
  id: envId, ts, from: "liris", to: "acer", mode: "real",
  type: "BILATERAL_S2_ABLATION_RESULT",
  verb: "EVT-LIRIS-S2-ABLATION-RESULT",
  payload: report,
  sig_owner: LIRIS_KEY_ID,
};
const manifest = { id: env.id, ts, from: env.from, to: env.to, type: env.type, verb: env.verb, leakage_confirmed, interpretation };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...env, body: { signed_envelope } });
const url = new URL(ACER_BUS);
const result = await new Promise(r => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 },
    res => { let b = ""; res.on("data", c => b += c); res.on("end", () => { let p; try { p = JSON.parse(b); } catch { p = b; } r({ status: res.statusCode, body: p }); }); });
  req.on("error", e => r({ err: e.message }));
  req.on("timeout", () => { req.destroy(); r({ err: "timeout" }); });
  req.write(body); req.end();
});
console.log(`  envelope ${envId} status=${result.status}`);
console.log(`\n=== DONE — interpretation: ${interpretation} ===`);
