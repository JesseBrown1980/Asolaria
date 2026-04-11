const mongoose = require('D:/projects/QDD/ebacmap-master/node_modules/.pnpm/mongoose@8.14.1/node_modules/mongoose');

const MONGO_URI = 'mongodb://localhost:27017/ebacmap-local-test';
const CLIENT_ID  = new mongoose.Types.ObjectId('69c41938d84980e337ac77cd');
const LOCATION_ID = new mongoose.Types.ObjectId('69c41938d84980e337ac77cf');
const USER_ID    = new mongoose.Types.ObjectId('69c41938d84980e337ac77d1');

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI);
  const db = mongoose.connection.db;

  // Fetch reference IDs from DB
  let categories = await db.collection('categories').find({ client: CLIENT_ID }).project({ _id: 1, name: 1 }).toArray();
  let organisms  = await db.collection('organisms').find({ client: CLIENT_ID }).project({ _id: 1, name: 1 }).toArray();
  let zones      = await db.collection('zones').find({ client: CLIENT_ID }).project({ _id: 1, name: 1 }).toArray();

  console.log(`Client-scoped: ${categories.length} categories, ${organisms.length} organisms, ${zones.length} zones`);

  // Fallback: try without client filter if empty
  if (!categories.length) categories = await db.collection('categories').find({}).project({ _id: 1, name: 1 }).limit(10).toArray();
  if (!organisms.length)  organisms  = await db.collection('organisms').find({}).project({ _id: 1, name: 1 }).limit(10).toArray();
  if (!zones.length)      zones      = await db.collection('zones').find({}).project({ _id: 1, name: 1 }).limit(10).toArray();

  console.log(`Final: ${categories.length} categories, ${organisms.length} organisms, ${zones.length} zones`);
  if (categories.length) console.log('  Sample categories:', categories.slice(0, 3).map(c => c.name).join(', '));
  if (organisms.length)  console.log('  Sample organisms:', organisms.slice(0, 3).map(o => o.name).join(', '));
  if (zones.length)      console.log('  Sample zones:', zones.slice(0, 3).map(z => z.name).join(', '));

  const pick = arr => arr.length ? arr[Math.floor(Math.random() * arr.length)]._id : undefined;

  const chartModules = [
    'LineGraph','ScatterGraph','BarGraph','SuccessGraph','StackedGraph',
    'PassFailSuccessGraph','PassRateCircles','ResultsTable','SummaryTable','MapSiteResultsTable'
  ];
  const groupBys = ['byOrganism','byEbacmapCode','byZone','byResult','byPlan','byFacility','bySite','byDate'];
  const intervals = ['daily','weekly','monthly','quarterly','yearly'];
  const dataTypes = ['environmental','product','both'];
  const rollingIntervals = ['7','14','30','60','90'];
  const dateRangeTypes = ['day','week','month','quarter','ytd','year'];
  const accessTypes = ['personal','facility','global'];
  const ringTypes = ['inner','outer','full'];
  const filterTypes = ['environmental','product'];

  const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];
  const pickN = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  function makeChart() {
    const mod = pickRandom(chartModules);
    const chart = { module: mod, groupBy: pickRandom(groupBys) };
    if (Math.random() > 0.5) chart.dailyFailureTolerance = Math.floor(Math.random() * 5) + 1;
    if (Math.random() > 0.5) chart.hideUntested = Math.random() > 0.5;
    if (Math.random() > 0.5) chart.showTestCounts = true;
    if (Math.random() > 0.6) chart.showControlLine = true;
    if (Math.random() > 0.6) chart.showConformingPct = true;
    if (Math.random() > 0.7) chart.limitLines = [{ meta: 'upper', value: Math.floor(Math.random() * 100) + 50, name: 'Upper Limit' }];
    if (mod === 'ResultsTable' || mod === 'SummaryTable') {
      chart.tableHeaders = pickN(['Site','Zone','Date','Result','Organism','Category','Plan'], 3 + Math.floor(Math.random() * 3));
    }
    return chart;
  }

  function makeSection(idx) {
    const numCharts = 1 + Math.floor(Math.random() * 3);
    const section = {
      title: `Section ${idx + 1}`,
      filters: {
        interval: pickRandom(intervals),
        type: pickRandom(filterTypes),
        dataType: pickRandom(dataTypes),
        rollingInterval: pickRandom(rollingIntervals),
        includeVectorSites: Math.random() > 0.7,
        dateRange: {
          type: pickRandom(dateRangeTypes)
        }
      },
      charts: Array.from({ length: numCharts }, () => makeChart())
    };
    if (Math.random() > 0.5) {
      section.filters.conditions = [{
        condition: 'and',
        rules: [{
          field: pickRandom(['category','zone','organism','site']),
          operator: pickRandom(['is','isNot','contains']),
          value: pick(categories)?.toString() || 'any'
        }]
      }];
    }
    if (Math.random() > 0.6) section.notes = pickRandom([
      'Review monthly with QA team',
      'Auto-generated trending data',
      'Flagged for audit preparation',
      'Compare against prior year baseline',
      'Requires manager sign-off',
      'Include in quarterly board report'
    ]);
    return section;
  }

  const reportDefs = [
    { name: 'Allergen Control Program',            reportType: 'multi',   access: 'global',   showOnDashboard: true,  numSections: 3 },
    { name: 'Water Quality Analysis',              reportType: 'single',  access: 'facility', showOnDashboard: false, numSections: 2 },
    { name: 'Air Quality Sampling',                reportType: 'single',  access: 'facility', showOnDashboard: true,  numSections: 1 },
    { name: 'Cold Chain Monitoring',               reportType: 'multi',   access: 'global',   showOnDashboard: true,  numSections: 3 },
    { name: 'Cross-Contamination Risk Map',        reportType: 'ebacmap', access: 'facility', showOnDashboard: false, numSections: 2 },
    { name: 'Pest Control Integration',            reportType: 'single',  access: 'personal', showOnDashboard: false, numSections: 1 },
    { name: 'Chemical Sanitizer Efficacy',         reportType: 'multi',   access: 'facility', showOnDashboard: true,  numSections: 2 },
    { name: 'ATP Monitoring Dashboard',            reportType: 'single',  access: 'global',   showOnDashboard: true,  numSections: 1 },
    { name: 'Personnel Hygiene Tracking',          reportType: 'multi',   access: 'personal', showOnDashboard: false, numSections: 2 },
    { name: 'Raw Material Receiving Log',          reportType: 'legacy',  access: 'facility', showOnDashboard: false, numSections: 1 },
    { name: 'Finished Product Hold-Release',       reportType: 'multi',   access: 'global',   showOnDashboard: true,  numSections: 3 },
    { name: 'Environmental Trending by Building',  reportType: 'multi',   access: 'facility', showOnDashboard: true,  numSections: 2 },
    { name: 'Swab Site Retirement Analysis',       reportType: 'single',  access: 'personal', showOnDashboard: false, numSections: 1 },
    { name: 'New Product Line Validation',         reportType: 'multi',   access: 'global',   showOnDashboard: false, numSections: 3 },
    { name: 'Seasonal Adjustment Report',          reportType: 'single',  access: 'facility', showOnDashboard: true,  numSections: 2 },
    { name: 'Holiday Shutdown Recovery',           reportType: 'legacy',  access: 'personal', showOnDashboard: false, numSections: 1 },
    { name: 'Third Party Audit Prep',              reportType: 'multi',   access: 'global',   showOnDashboard: true,  numSections: 3 },
    { name: 'Insurance Compliance Package',        reportType: 'single',  access: 'facility', showOnDashboard: false, numSections: 2 },
    { name: 'Training Effectiveness Metrics',      reportType: 'multi',   access: 'personal', showOnDashboard: true,  numSections: 2 },
    { name: 'Continuous Improvement Tracker',      reportType: 'multi',   access: 'global',   showOnDashboard: true,  numSections: 3 }
  ];

  const docs = reportDefs.map((def, i) => {
    const catId = pick(categories);
    const orgId = pick(organisms);
    const zoneId = pick(zones);

    return {
      name: def.name,
      client: CLIENT_ID,
      location: LOCATION_ID,
      userId: USER_ID,
      createdBy: 'seed-script',
      access: def.access,
      reportType: def.reportType,
      showOnDashboard: def.showOnDashboard,
      dashboardOnly: def.showOnDashboard && Math.random() > 0.7,
      isDefault: i < 2,
      individualSites: Math.random() > 0.6,
      byZone: Math.random() > 0.5,
      sections: Array.from({ length: def.numSections }, (_, si) => makeSection(si)),
      filters: {
        category: catId,
        organism: orgId,
        zone: zoneId,
        interval: pickRandom(intervals),
        type: pickRandom(filterTypes),
        dataType: pickRandom(dataTypes),
        rollingInterval: pickRandom(rollingIntervals),
        ringType: pickRandom(ringTypes),
        resultRating: pickRandom(['pass','fail','all']),
        showTestCounts: Math.random() > 0.5,
        showConformingPct: Math.random() > 0.5,
        dailyFailureTolerance: Math.floor(Math.random() * 5),
        advanced: Math.random() > 0.6,
        hideUntested: Math.random() > 0.5,
        chartType: pickRandom(['LineGraph','BarGraph','SuccessGraph','StackedGraph']),
        conditions: [{
          condition: 'and',
          rules: [{
            field: pickRandom(['category','zone','organism']),
            operator: 'is',
            value: (catId || orgId || zoneId)?.toString()
          }]
        }]
      },
      sort: pickRandom(['name','-name','createdAt','-createdAt','updatedAt']),
      charts: pickN(chartModules, 1 + Math.floor(Math.random() * 3)),
      notifications: Math.random() > 0.5 ? [{
        notifyType: pickRandom(['email','sms','push']),
        limit: Math.floor(Math.random() * 10) + 1,
        organismId: orgId,
        categoryId: catId,
        recipients: [USER_ID]
      }] : [],
      createdAt: new Date(2026, 0, 1 + i * 4),
      updatedAt: new Date(2026, 2, 20 + Math.floor(i / 5))
    };
  });

  const result = await db.collection('reports').insertMany(docs);
  console.log(`\nInserted ${result.insertedCount} reports:`);
  Object.values(result.insertedIds).forEach((id, i) => {
    console.log(`  ${(i+1).toString().padStart(2)}. ${reportDefs[i].name.padEnd(42)} -> ${id}`);
  });

  // Quick verification
  const count = await db.collection('reports').countDocuments({ client: CLIENT_ID, createdBy: 'seed-script' });
  console.log(`\nTotal seed-script reports for this client: ${count}`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
