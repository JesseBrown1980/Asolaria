const fs = require("fs");
const path = require("path");
const mqtt = require("mqtt");

const indexDir = path.join(__dirname, "..", "data", "agent-index");
const entries = {};

function findIxFile(dir, ix) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== "sub-colonies") {
      const found = findIxFile(full, ix);
      if (found) return found;
    } else if (item.name === "IX-" + ix + ".md") {
      return full;
    }
  }
  return null;
}

for (let i = 356; i <= 388; i++) {
  const file = findIxFile(indexDir, i);
  if (file) {
    const relPath = path.relative(indexDir, file).split(path.sep).join("/");
    entries["IX-" + i] = {
      path: relPath,
      body: fs.readFileSync(file, "utf8")
    };
  }
}
console.log("Found", Object.keys(entries).length, "IX files");

const client = mqtt.connect("mqtt://127.0.0.1:18883");
client.on("connect", () => {
  const keys = Object.keys(entries);
  const mid = Math.ceil(keys.length / 2);
  const batch1 = {};
  const batch2 = {};
  keys.slice(0, mid).forEach(k => { batch1[k] = entries[k]; });
  keys.slice(mid).forEach(k => { batch2[k] = entries[k]; });

  const msg1 = JSON.stringify({
    from: "gaia", type: "ix_full_bodies", batch: 1, of: 2,
    pid: "gaia-20260324-unification-orchestrator",
    entries: batch1, count: Object.keys(batch1).length,
    at: new Date().toISOString()
  });
  const msg2 = JSON.stringify({
    from: "gaia", type: "ix_full_bodies", batch: 2, of: 2,
    pid: "gaia-20260324-unification-orchestrator",
    entries: batch2, count: Object.keys(batch2).length,
    at: new Date().toISOString()
  });

  client.publish("asolaria/orchestrator/gaia/ix-bodies-1", msg1, { retain: true });
  client.publish("asolaria/orchestrator/gaia/ix-bodies-2", msg2, { retain: true });
  console.log("Batch 1:", Object.keys(batch1).length, "entries,", msg1.length, "bytes");
  console.log("Batch 2:", Object.keys(batch2).length, "entries,", msg2.length, "bytes");
  setTimeout(() => { client.end(); process.exit(0); }, 1000);
});
client.on("error", (e) => { console.log("MQTT error:", e.message); process.exit(1); });
