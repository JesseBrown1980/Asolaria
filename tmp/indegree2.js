// Topology scan v2 — honest target handling
const fs = require('fs');
const readline = require('readline');

const FILE = 'C:/Users/acer/Asolaria/data/graph-runtime-events.ndjson';
const t0 = Date.now();

const inDeg = new Map();
let lines = 0;
let events = 0;
let noTarget = 0;
let noTargetId = 0;
let hasTargetId = 0;
const targetTypeCounts = new Map();

// Sample a few "no id" events for inspection
const noIdSamples = [];

const rl = readline.createInterface({
  input: fs.createReadStream(FILE),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  lines++;
  try {
    const ev = JSON.parse(line);
    if (ev.kind !== 'graph_event') return;
    events++;
    if (!ev.target) { noTarget++; return; }
    const ttype = ev.target.type || '<no-type>';
    targetTypeCounts.set(ttype, (targetTypeCounts.get(ttype) || 0) + 1);
    if (!ev.target.id) {
      noTargetId++;
      if (noIdSamples.length < 3) noIdSamples.push(JSON.stringify(ev).slice(0, 300));
      return;
    }
    hasTargetId++;
    const tgt = ev.target.id;
    inDeg.set(tgt, (inDeg.get(tgt) || 0) + 1);
  } catch (_) {}
});

rl.on('close', () => {
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Scan complete in ${elapsed}s`);
  console.log(`Total graph_event lines: ${events}`);
  console.log(`  with target:     ${events - noTarget}`);
  console.log(`  without target:  ${noTarget}`);
  console.log(`  target.id set:   ${hasTargetId}  (${(hasTargetId/events*100).toFixed(1)}%)`);
  console.log(`  target, no id:   ${noTargetId}  (${(noTargetId/events*100).toFixed(1)}%)`);
  console.log('');

  console.log('TARGET.TYPE DISTRIBUTION:');
  const typeRows = [...targetTypeCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, n] of typeRows.slice(0, 15)) {
    console.log(`  ${n.toString().padStart(10)}  ${(n/events*100).toFixed(2).padStart(6)}%  ${type}`);
  }
  console.log('');

  if (noIdSamples.length > 0) {
    console.log('SAMPLES of "target but no id" events:');
    for (const s of noIdSamples) console.log('  ' + s);
    console.log('');
  }

  // Real in-degree only over events that have target.id
  const topIn = [...inDeg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const totalIn = [...inDeg.values()].reduce((s, v) => s + v, 0);
  console.log(`TOP 15 TARGETS BY IN-DEGREE (events with target.id = ${totalIn})`);
  for (const [id, deg] of topIn) {
    const pct = ((deg / totalIn) * 100).toFixed(2);
    const short = id.length > 60 ? id.slice(0, 57) + '...' : id;
    console.log(`  ${deg.toString().padStart(8)}  ${pct.padStart(6)}%  ${short}`);
  }
  console.log('');

  const top1Pct = ((topIn[0][1] / totalIn) * 100);
  const top5Pct = (topIn.slice(0, 5).reduce((s, [_, v]) => s + v, 0) / totalIn * 100);
  const top10Pct = (topIn.reduce((s, [_, v]) => s + v, 0) / totalIn * 100);
  console.log('CONCENTRATION (over events with target.id):');
  console.log(`  Top 1  hub: ${top1Pct.toFixed(2)}%`);
  console.log(`  Top 5  hubs: ${top5Pct.toFixed(2)}%`);
  console.log(`  Top 10 hubs: ${top10Pct.toFixed(2)}%`);
  console.log(`  Unique targets: ${inDeg.size}`);
  console.log('');

  if (top1Pct > 80) console.log('VERDICT: SINGLE-SINK FUNNEL');
  else if (top5Pct > 80) console.log('VERDICT: STAR');
  else if (top10Pct > 80) console.log('VERDICT: HUB-AND-SPOKE');
  else console.log('VERDICT: DISTRIBUTED DAG');
});
