const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ebacmap-local-test';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Delete the old batch (wrong chart modules from prior run)
  const oldIds = [
    '69c467d6f037f2dbdf96a606', '69c467d6f037f2dbdf96a607',
    '69c467d6f037f2dbdf96a608', '69c467d6f037f2dbdf96a609',
    '69c467d6f037f2dbdf96a60a', '69c467d6f037f2dbdf96a60b',
    '69c467d6f037f2dbdf96a60c', '69c467d6f037f2dbdf96a60d',
    '69c467d6f037f2dbdf96a60e', '69c467d6f037f2dbdf96a60f',
  ].map(id => new ObjectId(id));

  const result = await db.collection('reports').deleteMany({ _id: { $in: oldIds } });
  console.log(`Deleted ${result.deletedCount} old duplicate reports.`);

  // Verify only 10 trend reports remain
  const names = [
    '30-Day Positive Rate Trend', 'Quarter-over-Quarter Comparison',
    'Year-to-Date Performance', 'Seasonal Pattern Analysis',
    'Device Reliability Trend', 'Operator Performance Metrics',
    'Shift Comparison Analysis', 'Site Rotation Effectiveness',
    'Test Method Comparison', 'Rolling 7-Day Moving Average',
  ];
  const remaining = await db.collection('reports').find({ name: { $in: names } }).toArray();
  console.log(`\n${remaining.length} trend reports remaining:`);
  remaining.forEach(r => {
    console.log(`  [${r._id}] ${r.name} — ${r.sections.length} section(s), charts: ${r.sections.map(s => s.charts.map(c => c.module).join(',')).join(' | ')}`);
  });

  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
