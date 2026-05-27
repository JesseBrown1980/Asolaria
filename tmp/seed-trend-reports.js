const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'ebacmap-local-test';

const CLIENT_ID   = new ObjectId('69c41938d84980e337ac77cd');
const LOCATION_ID = new ObjectId('69c41938d84980e337ac77cf');
const USER_ID     = new ObjectId('69c41938d84980e337ac77d1');

// Reference IDs from DB
const ZONES = {
  productContact: '69c443d7bbdabf215406bfbf',
  adjacent:       '69c443d7bbdabf215406bfc0',
  generalPlant:   '69c443d7bbdabf215406bfc1',
  external:       '69c443d7bbdabf215406bfc2',
};

const CATEGORIES = {
  environmental: '69c443d6bbdabf215406bfb5',
  product:       '69c443d6bbdabf215406bfb6',
  personnel:     '69c443d6bbdabf215406bfb7',
  equipment:     '69c443d6bbdabf215406bfb8',
  water:         '69c443d6bbdabf215406bfb9',
};

const SITES = {
  conveyorBelt: '69c443d7bbdabf215406bfc8',
  drain:        '69c443d7bbdabf215406bfc9',
  wall:         '69c443d7bbdabf215406bfca',
  floor:        '69c443d7bbdabf215406bfcb',
  table:        '69c443d7bbdabf215406bfcc',
};

const ORGANISMS = {
  salmonella:  '69c443d7bbdabf215406bfba',
  listeria:    '69c443d7bbdabf215406bfbb',
  ecoli:       '69c443d7bbdabf215406bfbc',
  staph:       '69c443d7bbdabf215406bfbd',
  coliform:    '69c443d7bbdabf215406bfbe',
};

const TEST_DEFS = {
  salmonellaSwab: '69c443d7bbdabf215406bfd2',
  listeriaSwab:   '69c443d7bbdabf215406bfd3',
  ecoliSwab:      '69c443d7bbdabf215406bfd4',
  apcSwab:        '69c443d7bbdabf215406bfd5',
  coliformSwab:   '69c443d7bbdabf215406bfd6',
};

const SURFACE_TYPES = {
  stainlessSteel: '69c443d7bbdabf215406bfc3',
  plastic:        '69c443d7bbdabf215406bfc4',
  concrete:       '69c443d7bbdabf215406bfc5',
  rubber:         '69c443d7bbdabf215406bfc6',
  tile:           '69c443d7bbdabf215406bfc7',
};

const OPERATORS = {
  jesse: '69c41938d84980e337ac77d1',
  dev:   '69c3ecbdecd240dd83e93d3d',
};

const now = new Date();

function makeBase(name, reportType) {
  return {
    name,
    client: CLIENT_ID.toString(),
    location: LOCATION_ID.toString(),
    userId: USER_ID.toString(),
    createdBy: 'seed-script',
    access: 'facility',
    reportType: reportType || 'trend',
    showOnDashboard: true,
    dashboardOnly: false,
    isDefault: false,
    individualSites: false,
    byZone: false,
    notifications: [],
    charts: [],
    createdAt: now,
    updatedAt: now,
  };
}

const reports = [
  // 1. 30-Day Positive Rate Trend
  {
    ...makeBase('30-Day Positive Rate Trend'),
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'day',
      dataType: 'calendar',
      rollingInterval: 'thirtyDay',
    },
    sections: [
      {
        title: 'Daily Positive Rate',
        filters: {
          interval: 'day',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'thirtyDay',
          includeVectorSites: false,
          dateRange: { type: 'month' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'zone', operator: 'is', value: [ZONES.productContact, ZONES.adjacent] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'byOrganism',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Action Limit', value: 5, meta: '%' },
              { name: 'Alert Limit', value: 3, meta: '%' },
            ],
          },
        ],
        notes: 'Tracks daily positive detection rate across Zone 1 and Zone 2 for the trailing 30-day window.',
      },
      {
        title: 'Positive Rate by Zone',
        filters: {
          interval: 'day',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'thirtyDay',
          includeVectorSites: false,
          dateRange: { type: 'month' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'BarGraph',
            groupBy: 'byZone',
            hideUntested: true,
            showTestCounts: true,
            showControlLine: false,
            showConformingPct: true,
            limitLines: [
              { name: 'Threshold', value: 10, meta: '%' },
            ],
          },
        ],
        notes: 'Zone-level positive rate comparison over the last 30 days.',
      },
    ],
  },

  // 2. Quarter-over-Quarter Comparison
  {
    ...makeBase('Quarter-over-Quarter Comparison'),
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'quarter',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: 'Quarterly Trend Overlay',
        filters: {
          interval: 'quarter',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental, CATEGORIES.product] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'byCategory',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: false,
            limitLines: [
              { name: 'Target', value: 95, meta: '% conforming' },
            ],
          },
        ],
        notes: 'Overlays current quarter vs previous quarter positive rates.',
      },
      {
        title: 'Quarter Comparison by Organism',
        filters: {
          interval: 'quarter',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'organism', operator: 'is', value: [ORGANISMS.salmonella, ORGANISMS.listeria] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'StackedGraph',
            groupBy: 'byOrganism',
            hideUntested: true,
            showTestCounts: true,
            showControlLine: false,
            showConformingPct: true,
            limitLines: [],
          },
        ],
        notes: 'Stacked view of pathogen detections by quarter for Salmonella and Listeria.',
      },
    ],
  },

  // 3. Year-to-Date Performance
  {
    ...makeBase('Year-to-Date Performance'),
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'month',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: 'YTD Monthly Trend',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'ytd' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'zone', operator: 'is', value: [ZONES.productContact, ZONES.adjacent, ZONES.generalPlant, ZONES.external] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'byZone',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Annual Target', value: 2, meta: '% positive' },
            ],
          },
        ],
        notes: 'Monthly positive rates from January to current month, segmented by zone.',
      },
      {
        title: 'YTD Cumulative Conformance',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'ytd' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental, CATEGORIES.product] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'BarGraph',
            groupBy: 'byCategory',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Goal', value: 98, meta: '% conforming' },
            ],
          },
        ],
        notes: 'Cumulative conformance percentage year-to-date by testing category.',
      },
      {
        title: 'YTD Organism Detection Scatter',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'ytd' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'organism', operator: 'is', value: [ORGANISMS.salmonella, ORGANISMS.listeria, ORGANISMS.ecoli] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'ScatterGraph',
            groupBy: 'byOrganism',
            hideUntested: true,
            showTestCounts: false,
            showControlLine: false,
            showConformingPct: false,
            limitLines: [],
          },
        ],
        notes: 'Scatter plot of individual positive detections by date and organism type.',
      },
    ],
  },

  // 4. Seasonal Pattern Analysis
  {
    ...makeBase('Seasonal Pattern Analysis'),
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'month',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: '12-Month Seasonal Overlay',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'year' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'zone', operator: 'is', value: [ZONES.productContact] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'byOrganism',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: false,
            limitLines: [
              { name: 'Summer Alert', value: 8, meta: '%' },
              { name: 'Winter Baseline', value: 2, meta: '%' },
            ],
          },
        ],
        notes: 'Identifies seasonal peaks and troughs in pathogen prevalence across 12 months.',
      },
      {
        title: 'Temperature-Correlated Detection',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'year' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'organism', operator: 'is', value: [ORGANISMS.salmonella, ORGANISMS.listeria] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'ScatterGraph',
            groupBy: 'byOrganism',
            hideUntested: true,
            showTestCounts: false,
            showControlLine: false,
            showConformingPct: false,
            limitLines: [],
          },
        ],
        notes: 'Scatter of monthly positive counts to visualize seasonal correlation patterns.',
      },
    ],
  },

  // 5. Device Reliability Trend
  {
    ...makeBase('Device Reliability Trend'),
    filters: {
      type: 'custom',
      category: CATEGORIES.equipment,
      interval: 'week',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: 'Weekly Device Pass Rate',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.equipment] },
                { field: 'surfaceType', operator: 'is', value: [SURFACE_TYPES.stainlessSteel, SURFACE_TYPES.plastic] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'bySurfaceType',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Reliability Target', value: 99, meta: '% pass' },
            ],
          },
        ],
        notes: 'Weekly pass rate for equipment surfaces — stainless steel vs plastic over the quarter.',
      },
      {
        title: 'Device Failure Distribution',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.equipment] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'BarGraph',
            groupBy: 'bySite',
            hideUntested: true,
            showTestCounts: true,
            showControlLine: false,
            showConformingPct: false,
            limitLines: [
              { name: 'Max Failures', value: 3, meta: 'per week' },
            ],
          },
        ],
        notes: 'Bar chart of equipment test failures by site location per week.',
      },
    ],
  },

  // 6. Operator Performance Metrics
  {
    ...makeBase('Operator Performance Metrics'),
    filters: {
      type: 'custom',
      category: CATEGORIES.personnel,
      interval: 'week',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: 'Operator Sampling Consistency',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'month' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental, CATEGORIES.personnel] },
                { field: 'user', operator: 'is', value: [OPERATORS.jesse, OPERATORS.dev] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'BarGraph',
            groupBy: 'byUser',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: false,
            limitLines: [
              { name: 'Min Samples/Week', value: 20, meta: 'tests' },
            ],
          },
        ],
        notes: 'Weekly test count per operator to ensure sampling consistency.',
      },
      {
        title: 'Operator Positive Rate Comparison',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'month' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'user', operator: 'is', value: [OPERATORS.jesse, OPERATORS.dev] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'byUser',
            hideUntested: false,
            showTestCounts: false,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Facility Avg', value: 4, meta: '%' },
            ],
          },
        ],
        notes: 'Compares positive detection rates between operators to identify technique variance.',
      },
      {
        title: 'Operator Zone Coverage',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'month' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'StackedGraph',
            groupBy: 'byZone',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: false,
            showConformingPct: false,
            limitLines: [],
          },
        ],
        notes: 'Stacked view showing how test volume distributes across zones per operator.',
      },
    ],
  },

  // 7. Shift Comparison Analysis
  {
    ...makeBase('Shift Comparison Analysis'),
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'week',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: 'Shift-Level Positive Rates',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'month' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'zone', operator: 'is', value: [ZONES.productContact, ZONES.adjacent] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'BarGraph',
            groupBy: 'byZone',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Shift Target', value: 3, meta: '% positive' },
            ],
          },
        ],
        notes: 'Weekly comparison of positive rates between shift periods across Zone 1-2.',
      },
      {
        title: 'Shift Volume and Conformance',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'month' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental, CATEGORIES.product] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'StackedGraph',
            groupBy: 'byCategory',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: false,
            showConformingPct: true,
            limitLines: [],
          },
        ],
        notes: 'Stacked bars showing test volume breakdown by category across shifts.',
      },
    ],
  },

  // 8. Site Rotation Effectiveness
  {
    ...makeBase('Site Rotation Effectiveness'),
    byZone: true,
    individualSites: true,
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'week',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: 'Site Rotation Coverage',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'site', operator: 'is', value: [SITES.conveyorBelt, SITES.drain, SITES.wall, SITES.floor, SITES.table] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'ScatterGraph',
            groupBy: 'bySite',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: false,
            showConformingPct: false,
            limitLines: [],
          },
        ],
        notes: 'Scatter showing which sites were sampled each week to verify rotation compliance.',
      },
      {
        title: 'Site-Level Positive Trend',
        filters: {
          interval: 'week',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'site', operator: 'is', value: [SITES.conveyorBelt, SITES.drain, SITES.wall, SITES.floor, SITES.table] },
                { field: 'zone', operator: 'is', value: [ZONES.productContact] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'bySite',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Site Limit', value: 5, meta: '% positive' },
            ],
          },
        ],
        notes: 'Tracks positive rate per individual site over the quarter to spot chronic problem areas.',
      },
    ],
  },

  // 9. Test Method Comparison
  {
    ...makeBase('Test Method Comparison'),
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'month',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: 'Detection Rate by Test Method',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'testDefinition', operator: 'is', value: [TEST_DEFS.salmonellaSwab, TEST_DEFS.listeriaSwab, TEST_DEFS.ecoliSwab] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'BarGraph',
            groupBy: 'byTestDefinition',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Sensitivity Baseline', value: 1, meta: '% detection' },
            ],
          },
        ],
        notes: 'Compares detection rates across different swab test methods.',
      },
      {
        title: 'Method Sensitivity Over Time',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'testDefinition', operator: 'is', value: [TEST_DEFS.salmonellaSwab, TEST_DEFS.listeriaSwab, TEST_DEFS.ecoliSwab, TEST_DEFS.apcSwab, TEST_DEFS.coliformSwab] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'byTestDefinition',
            hideUntested: false,
            showTestCounts: false,
            showControlLine: true,
            showConformingPct: false,
            limitLines: [
              { name: 'Control Threshold', value: 50, meta: 'CFU/ml' },
            ],
          },
        ],
        notes: 'Monthly trend of average readings by test method to track sensitivity drift.',
      },
      {
        title: 'Method Agreement Scatter',
        filters: {
          interval: 'month',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'quarter' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'zone', operator: 'is', value: [ZONES.productContact] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'ScatterGraph',
            groupBy: 'byTestDefinition',
            hideUntested: true,
            showTestCounts: false,
            showControlLine: false,
            showConformingPct: false,
            limitLines: [],
          },
        ],
        notes: 'Scatter of individual test results to visualize method-to-method agreement in Zone 1.',
      },
    ],
  },

  // 10. Rolling 7-Day Moving Average
  {
    ...makeBase('Rolling 7-Day Moving Average'),
    filters: {
      type: 'custom',
      category: CATEGORIES.environmental,
      interval: 'day',
      dataType: 'calendar',
      rollingInterval: 'sevenDay',
    },
    sections: [
      {
        title: '7-Day Rolling Average — All Zones',
        filters: {
          interval: 'day',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'rolling' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'LineGraph',
            groupBy: 'byZone',
            hideUntested: false,
            showTestCounts: true,
            showControlLine: true,
            showConformingPct: true,
            limitLines: [
              { name: 'Rolling Limit', value: 4, meta: '% positive' },
            ],
          },
        ],
        notes: 'Smoothed 7-day rolling average of positive rates, broken out by zone.',
      },
      {
        title: '7-Day Rolling — Pathogen Focus',
        filters: {
          interval: 'day',
          type: 'custom',
          dataType: 'calendar',
          rollingInterval: 'sevenDay',
          includeVectorSites: false,
          dateRange: { type: 'rolling' },
          conditions: [
            {
              condition: 'and',
              rules: [
                { field: 'category', operator: 'is', value: [CATEGORIES.environmental] },
                { field: 'organism', operator: 'is', value: [ORGANISMS.salmonella, ORGANISMS.listeria, ORGANISMS.ecoli, ORGANISMS.staph, ORGANISMS.coliform] },
              ],
            },
          ],
        },
        charts: [
          {
            module: 'StackedGraph',
            groupBy: 'byOrganism',
            hideUntested: true,
            showTestCounts: true,
            showControlLine: false,
            showConformingPct: false,
            limitLines: [],
          },
        ],
        notes: 'Stacked daily rolling average showing contribution of each pathogen to overall positive rate.',
      },
    ],
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`Inserting ${reports.length} trend analysis reports...`);
  const result = await db.collection('reports').insertMany(reports);
  console.log(`Inserted ${result.insertedCount} reports.`);

  // Verify
  const names = reports.map(r => r.name);
  const verify = await db.collection('reports').find({ name: { $in: names } }).toArray();
  console.log('\nVerification — inserted reports:');
  verify.forEach(r => {
    console.log(`  [${r._id}] ${r.name} — ${r.sections.length} section(s), charts: ${r.sections.map(s => s.charts.map(c => c.module).join(',')).join(' | ')}`);
  });

  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
