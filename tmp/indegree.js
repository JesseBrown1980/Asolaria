// Topology scan on Jesse's graph-runtime-events.ndjson
// Pure streaming, bounded memory, no grep-then-head runaway
const fs = require('fs');
const readline = require('readline');

const FILE = 'C:/Users/acer/Asolaria/data/graph-runtime-events.ndjson';
const t0 = Date.now();

const inDeg = new Map();
const outDeg = new Map();
let lines = 0;
let events = 0;
let skipped = 0;

const rl = readline.createInterface({
  input: fs.createReadStream(FILE),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  lines++;
  try {
    const ev = JSON.parse(line);
    if (ev.kind !== 'graph_event' || !ev.target || !ev.actor) { skipped++; return; }
    events++;
    const src = ev.actor.id || 'unknown';
    const tgt = ev.target.id || 'unknown';
    inDeg.set(tgt, (inDeg.get(tgt) || 0) + 1);
    outDeg.set(src, (outDeg.get(src) || 0) + 1);
  } catch (_) {
    skipped++;
  }
});

rl.on('close', () => {
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Scan complete in ${elapsed}s`);
  console.log(`Lines: ${lines}, Events: ${events}, Skipped: ${skipped}`);
  console.log(`Unique targets: ${inDeg.size}, Unique actors: ${outDeg.size}`);
  console.log('');

  // Top 10 in-degree
  const topIn = [...inDeg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const totalIn = [...inDeg.values()].reduce((s, v) => s + v, 0);
  console.log('TOP 10 TARGETS BY IN-DEGREE (total edges = ' + totalIn + ')');
  for (const [id, deg] of topIn) {
    const pct = ((deg / totalIn) * 100).toFixed(2);
    const short = id.length > 60 ? id.slice(0, 57) + '...' : id;
    console.log(`  ${deg.toString().padStart(8)}  ${pct.padStart(6)}%  ${short}`);
  }
  console.log('');

  // Concentration summary (star/funnel detector)
  const top1Pct = ((topIn[0][1] / totalIn) * 100).toFixed(2);
  const top5Pct = (topIn.slice(0, 5).reduce((s, [_, v]) => s + v, 0) / totalIn * 100).toFixed(2);
  const top10Pct = (topIn.reduce((s, [_, v]) => s + v, 0) / totalIn * 100).toFixed(2);
  console.log('CONCENTRATION:');
  console.log(`  Top 1  hub: ${top1Pct}%`);
  console.log(`  Top 5  hubs: ${top5Pct}%`);
  console.log(`  Top 10 hubs: ${top10Pct}%`);
  console.log('');

  // Verdict
  if (top1Pct > 80) console.log('VERDICT: SINGLE-SINK FUNNEL (like Liris side)');
  else if (top5Pct > 80) console.log('VERDICT: STAR topology');
  else if (top10Pct > 80) console.log('VERDICT: HUB-AND-SPOKE');
  else console.log('VERDICT: DISTRIBUTED DAG');
});
