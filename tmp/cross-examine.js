const fs = require("fs");
const path = require("path");
const mqtt = require("mqtt");

const indexDir = path.join(__dirname, "..", "data", "agent-index");

// Build full IX inventory
function findAllIx(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== "sub-colonies") {
      results.push(...findAllIx(full));
    } else if (item.isFile() && /^IX-\d+\.md$/.test(item.name)) {
      const content = fs.readFileSync(full, "utf8");
      const ix = item.name.replace(".md", "");
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const typeMatch = content.match(/^type:\s*(.+)$/m);
      const tagsMatch = content.match(/^tags:\s*(.+)$/m);
      const chainMatch = content.match(/^chain:\s*(.+)$/m);
      results.push({
        ix,
        type: (typeMatch ? typeMatch[1].trim() : "unknown"),
        name: (nameMatch ? nameMatch[1].trim() : ix),
        tags: (tagsMatch ? tagsMatch[1].trim() : ""),
        chain: (chainMatch ? chainMatch[1].trim() : ""),
        folder: path.relative(indexDir, path.dirname(full)).replace(/\\/g, "/")
      });
    }
  }
  return results;
}

const allIx = findAllIx(indexDir).sort((a, b) => {
  const na = parseInt(a.ix.replace("IX-", ""));
  const nb = parseInt(b.ix.replace("IX-", ""));
  return na - nb;
});

console.log("IX entries found:", allIx.length);

// Count by type
const byType = {};
for (const e of allIx) {
  byType[e.type] = (byType[e.type] || 0) + 1;
}
console.log("By type:", JSON.stringify(byType));

// Read Liris inventory from MQTT
const client = mqtt.connect("mqtt://127.0.0.1:18883");
client.on("connect", () => {
  client.subscribe("asolaria/orchestrator/liris/cross-examination");
  setTimeout(() => {
    console.log("Timeout — publishing IX inventory anyway");
    publishAndAnalyze(null);
  }, 5000);
});

client.on("message", (topic, payload) => {
  if (topic.includes("cross-examination")) {
    const data = JSON.parse(payload.toString());
    publishAndAnalyze(data);
  }
});

function publishAndAnalyze(lirisData) {
  // Publish our full IX inventory
  const ixInventory = {
    from: "gaia",
    to: "liris",
    type: "cross_examination_ix_inventory",
    pid: "gaia-20260324-unification-orchestrator",
    ixTotal: allIx.length,
    byType,
    ixInventory: allIx,
    at: new Date().toISOString()
  };

  const payload = JSON.stringify(ixInventory);
  client.publish("asolaria/orchestrator/gaia/ix-full-inventory", payload, { retain: true });
  console.log("Published IX inventory:", allIx.length, "entries,", Math.round(payload.length / 1024), "KB");

  if (!lirisData || !lirisData.lxInventory) {
    console.log("No Liris data to cross-examine");
    client.end();
    return;
  }

  // Cross-examination
  const lxEntries = lirisData.lxInventory;
  console.log("\n=== CROSS-EXAMINATION ===");
  console.log("IX entries:", allIx.length);
  console.log("LX entries:", lxEntries.length);

  // Type comparison
  const lxByType = {};
  for (const e of lxEntries) {
    lxByType[e.type] = (lxByType[e.type] || 0) + 1;
  }
  console.log("\nIX by type:", JSON.stringify(byType));
  console.log("LX by type:", JSON.stringify(lxByType));

  // Find IX entries that chain to LX
  const ixChainingToLx = allIx.filter(e => e.chain && e.chain.includes("LX-"));
  console.log("\nIX entries chaining to LX:", ixChainingToLx.length);

  // Find LX entries that chain to IX
  const lxChainingToIx = lxEntries.filter(e => e.chain && e.chain.includes("IX-"));
  console.log("LX entries chaining to IX:", lxChainingToIx.length);

  // Language alignment
  const ixTypes = new Set(Object.keys(byType));
  const lxTypes = new Set(Object.keys(lxByType));
  const ixOnlyTypes = [...ixTypes].filter(t => !lxTypes.has(t));
  const lxOnlyTypes = [...lxTypes].filter(t => !ixTypes.has(t));
  console.log("\nIX-only types:", ixOnlyTypes.join(", ") || "none");
  console.log("LX-only types:", lxOnlyTypes.join(", ") || "none");

  // Tag overlap — find most common tags in each
  function topTags(entries) {
    const counts = {};
    for (const e of entries) {
      const tags = String(e.tags || "").split(/[,\[\]]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
      for (const t of tags) counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }
  console.log("\nTop IX tags:", topTags(allIx).map(([t, c]) => `${t}(${c})`).join(", "));
  console.log("Top LX tags:", topTags(lxEntries).map(([t, c]) => `${t}(${c})`).join(", "));

  // Folder naming: IX uses plural (patterns/), LX uses singular (pattern/)
  const ixFolders = [...new Set(allIx.map(e => e.folder))].sort();
  console.log("\nIX folders:", ixFolders.join(", "));

  // Compression candidates — entries with very similar names
  const pairs = [];
  for (const ix of allIx) {
    const ixName = ix.name.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
    for (const lx of lxEntries) {
      const lxName = String(lx.name || "").toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
      // Simple word overlap score
      const ixWords = new Set(ixName.split(/\s+/).filter(w => w.length > 3));
      const lxWords = new Set(lxName.split(/\s+/).filter(w => w.length > 3));
      let overlap = 0;
      for (const w of ixWords) { if (lxWords.has(w)) overlap++; }
      const score = ixWords.size > 0 && lxWords.size > 0 ? overlap / Math.min(ixWords.size, lxWords.size) : 0;
      if (score >= 0.5 && overlap >= 2) {
        pairs.push({ ix: ix.ix, lx: lx.lx, score: Math.round(score * 100), ixName: ix.name.slice(0, 60), lxName: String(lx.name || "").slice(0, 60) });
      }
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  console.log("\nCompression candidates (>50% word overlap):", pairs.length);
  pairs.slice(0, 20).forEach(p => {
    console.log(`  ${p.ix} <-> ${p.lx} (${p.score}%)`);
    console.log(`    IX: ${p.ixName}`);
    console.log(`    LX: ${p.lxName}`);
  });

  // Write results
  const results = {
    ixTotal: allIx.length,
    lxTotal: lxEntries.length,
    combined: allIx.length + lxEntries.length,
    ixByType: byType,
    lxByType,
    ixChainingToLx: ixChainingToLx.length,
    lxChainingToIx: lxChainingToIx.length,
    ixOnlyTypes,
    lxOnlyTypes,
    compressionCandidates: pairs.length,
    topPairs: pairs.slice(0, 30)
  };

  // Publish cross-exam results
  client.publish("asolaria/orchestrator/gaia/cross-exam", JSON.stringify({
    from: "gaia", type: "cross_examination_results",
    pid: "gaia-20260324-unification-orchestrator",
    results,
    at: new Date().toISOString()
  }), { retain: true });

  console.log("\nResults published to asolaria/orchestrator/gaia/cross-exam");

  // Write to file for IX-395
  fs.writeFileSync("tmp/cross-exam-results.json", JSON.stringify(results, null, 2));
  console.log("Results saved to tmp/cross-exam-results.json");

  client.end();
}
