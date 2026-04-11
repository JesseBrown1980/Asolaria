/**
 * seed-ezprotect-500.js
 *
 * Seeds 500 EZ Protect events spread over 6 months (180 days)
 * into ezprotectevents collection in ebacmap-local-test.
 *
 * Usage:  node tmp/seed-ezprotect-500.js
 *         (run from Asolaria root, uses QDD's mongoose)
 */

const mongoose = require('D:/projects/QDD/ebacmap-master/node_modules/.pnpm/mongoose@8.15.2_socks@2.8.7/node_modules/mongoose');
const { Schema } = mongoose;

const MONGO_URI = 'mongodb://localhost:27017/ebacmap-local-test';
const CLIENT_ID = new mongoose.Types.ObjectId('69c41938d84980e337ac77cd');

// ── Minimal schemas for querying ──
const LocationSchema = new Schema({
  name: String, clientId: { type: Schema.Types.ObjectId, ref: 'Client' }
}, { timestamps: true, strict: false });

const EzProtectEventSchema = new Schema({
  eventVersion: { type: Number, default: 1 },
  sourceSystem: { type: String, enum: ['CHARM_EZP', 'CHARM_EZP_PLUS'], required: true },
  transportMode: { type: String, enum: ['api', 'ethernet', 'wifi', 'cellular', 'usb', 'mock'], default: 'mock' },
  organizationId: { type: String, required: true },
  facilityId: { type: String, required: true },
  deviceSerialNumber: { type: String, required: true },
  deviceModel: { type: String, required: true },
  assayCode: { type: String, required: true },
  assayName: { type: String, required: true },
  assayFamily: String,
  lotNumber: String,
  rollNumber: String,
  resultState: {
    type: String,
    enum: ['NEGATIVE','INITIAL_POSITIVE','PRESUMPTIVE_POSITIVE','PRODUCT_POSITIVE','INVALID','CALIBRATION_FAIL','PM_FAIL','UNKNOWN'],
    required: true
  },
  resultValue: Number,
  resultUnit: String,
  readingValue: Number,
  controlLineValid: Boolean,
  temperatureC: Number,
  pmStatus: String,
  calibrationStatus: String,
  lockout: Boolean,
  supervisorOverride: Boolean,
  stripLot: String,
  stripRoll: String,
  stripExpiration: Date,
  moduleSlot: Number,
  operatorId: String,
  operatorGroup: String,
  sampleId: String,
  truckId: String,
  startedAt: Date,
  completedAt: { type: Date, required: true },
  ingestedAt: Date,
  rawPayload: Schema.Types.Mixed,
  normalizationWarnings: [String],
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true }
}, { timestamps: true });

EzProtectEventSchema.index({ deviceSerialNumber: 1, completedAt: 1, sampleId: 1 }, { unique: true });

const Location = mongoose.model('Location', LocationSchema);
const EzProtectEvent = mongoose.model('EzProtectEvent', EzProtectEventSchema, 'ezprotectevents');

// ── Data pools ──
const DEVICES = [
  { sn: 'SN-1001', model: 'EZP-200' },
  { sn: 'SN-1002', model: 'EZP-200' },
  { sn: 'SN-2001', model: 'EZP-300X' },
  { sn: 'SN-2002', model: 'EZP-300X' },
  { sn: 'SN-2003', model: 'EZP-400' },
  { sn: 'SN-2004', model: 'EZP-400' },
  { sn: 'SN-3001', model: 'EZP-500Pro' },
  { sn: 'SN-3002', model: 'EZP-500Pro' },
  { sn: 'SN-3003', model: 'EZP-600Plus' },
  { sn: 'SN-3005', model: 'EZP-600Plus' },
];

const OPERATORS = [
  { id: 'OP-101', group: 'Morning Shift' },
  { id: 'OP-202', group: 'Afternoon Shift' },
  { id: 'OP-303', group: 'Night Shift' },
  { id: 'OP-404', group: 'Weekend Crew' },
  { id: 'OP-505', group: 'Quality Assurance' },
];

const ASSAYS = [
  { code: 'SAL-LF', name: 'Salmonella Lateral Flow' },
  { code: 'LIS-LF', name: 'Listeria Lateral Flow' },
  { code: 'ECO-LF', name: 'E. coli O157 Lateral Flow' },
  { code: 'STA-LF', name: 'Staph Enterotoxin Lateral Flow' },
  { code: 'APC-LF', name: 'APC Total Count Lateral Flow' },
];

const TRANSPORT_MODES = ['api', 'ethernet', 'wifi', 'cellular', 'usb'];
const SOURCE_SYSTEMS = ['CHARM_EZP', 'CHARM_EZP_PLUS'];

// Weighted result states: 55% NEG, 12% INIT_POS, 8% PRES_POS, 5% PROD_POS, 8% INV, 5% CAL_FAIL, 4% PM_FAIL, 3% UNK
const RESULT_STATES_WEIGHTED = [];
for (let i = 0; i < 55; i++) RESULT_STATES_WEIGHTED.push('NEGATIVE');
for (let i = 0; i < 12; i++) RESULT_STATES_WEIGHTED.push('INITIAL_POSITIVE');
for (let i = 0; i < 8; i++)  RESULT_STATES_WEIGHTED.push('PRESUMPTIVE_POSITIVE');
for (let i = 0; i < 5; i++)  RESULT_STATES_WEIGHTED.push('PRODUCT_POSITIVE');
for (let i = 0; i < 8; i++)  RESULT_STATES_WEIGHTED.push('INVALID');
for (let i = 0; i < 5; i++)  RESULT_STATES_WEIGHTED.push('CALIBRATION_FAIL');
for (let i = 0; i < 4; i++)  RESULT_STATES_WEIGHTED.push('PM_FAIL');
for (let i = 0; i < 3; i++)  RESULT_STATES_WEIGHTED.push('UNKNOWN');

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, dec) { return parseFloat((Math.random() * (max - min) + min).toFixed(dec)); }

const LOT_NUMBERS = ['LOT-2026-A01', 'LOT-2026-A02', 'LOT-2026-B01', 'LOT-2025-C03', 'LOT-2025-D01'];
const ROLL_NUMBERS = ['R-001', 'R-002', 'R-003', 'R-004', 'R-005'];

async function main() {
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  // Fetch all locations for this client
  const locations = await Location.find({ clientId: CLIENT_ID });
  if (locations.length === 0) {
    console.error('ERROR: No locations found for client', CLIENT_ID.toString());
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`Found ${locations.length} locations for client ${CLIENT_ID}:`);
  locations.forEach(l => console.log(`  - ${l._id} : ${l.name}`));

  const locationIds = locations.map(l => l._id);

  // Time range: 180 days back from now
  const now = Date.now();
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  const startTime = now - SIX_MONTHS_MS;

  const events = [];
  for (let i = 0; i < 500; i++) {
    const device = pick(DEVICES);
    const operator = pick(OPERATORS);
    const assay = pick(ASSAYS);
    const resultState = pick(RESULT_STATES_WEIGHTED);
    const completedAt = new Date(startTime + Math.random() * SIX_MONTHS_MS);
    const startedAt = new Date(completedAt.getTime() - randInt(30, 600) * 1000);
    const ingestedAt = new Date(completedAt.getTime() + randInt(1, 300) * 1000);
    const locId = pick(locationIds);

    // Reading value depends on result state
    let readingValue;
    if (resultState === 'NEGATIVE') readingValue = randFloat(0.01, 0.39, 2);
    else if (resultState === 'INITIAL_POSITIVE' || resultState === 'PRESUMPTIVE_POSITIVE') readingValue = randFloat(0.40, 0.79, 2);
    else if (resultState === 'PRODUCT_POSITIVE') readingValue = randFloat(0.80, 1.50, 2);
    else readingValue = randFloat(0.0, 1.0, 2);

    const controlLineValid = (resultState !== 'INVALID' && resultState !== 'PM_FAIL') ? true : Math.random() > 0.5;
    const temperatureC = randFloat(2.0, 42.0, 1);

    let pmStatus, calibrationStatus;
    if (resultState === 'PM_FAIL') { pmStatus = 'FAIL'; calibrationStatus = 'PASS'; }
    else if (resultState === 'CALIBRATION_FAIL') { pmStatus = 'PASS'; calibrationStatus = 'FAIL'; }
    else { pmStatus = 'PASS'; calibrationStatus = 'PASS'; }

    events.push({
      eventVersion: 1,
      sourceSystem: pick(SOURCE_SYSTEMS),
      transportMode: pick(TRANSPORT_MODES),
      organizationId: `ORG-${CLIENT_ID.toString().slice(-6)}`,
      facilityId: `FAC-${locId.toString().slice(-6)}`,
      deviceSerialNumber: device.sn,
      deviceModel: device.model,
      assayCode: assay.code,
      assayName: assay.name,
      assayFamily: 'Lateral Flow',
      lotNumber: pick(LOT_NUMBERS),
      rollNumber: pick(ROLL_NUMBERS),
      resultState,
      resultValue: readingValue,
      resultUnit: 'RLU',
      readingValue,
      controlLineValid,
      temperatureC,
      pmStatus,
      calibrationStatus,
      lockout: false,
      supervisorOverride: false,
      stripLot: pick(LOT_NUMBERS),
      stripRoll: pick(ROLL_NUMBERS),
      stripExpiration: new Date(Date.now() + randInt(30, 365) * 24 * 60 * 60 * 1000),
      moduleSlot: randInt(1, 4),
      operatorId: operator.id,
      operatorGroup: operator.group,
      sampleId: `SMPL-${Date.now().toString(36)}-${i.toString().padStart(4, '0')}`,
      truckId: `TRK-${randInt(100, 999)}`,
      startedAt,
      completedAt,
      ingestedAt,
      locationId: locId,
      clientId: CLIENT_ID,
    });
  }

  console.log(`\nInserting ${events.length} EZ Protect events...`);
  const result = await EzProtectEvent.insertMany(events, { ordered: false });
  console.log(`Inserted ${result.length} events.`);

  // Verify distribution
  const pipeline = [
    { $match: { clientId: CLIENT_ID } },
    { $group: { _id: '$resultState', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  const dist = await EzProtectEvent.aggregate(pipeline);
  const total = dist.reduce((s, d) => s + d.count, 0);
  console.log(`\nResult state distribution (total ${total} events for this client):`);
  dist.forEach(d => console.log(`  ${d._id}: ${d.count} (${(d.count / total * 100).toFixed(1)}%)`));

  // Date range
  const dateRange = await EzProtectEvent.aggregate([
    { $match: { clientId: CLIENT_ID } },
    { $group: { _id: null, min: { $min: '$completedAt' }, max: { $max: '$completedAt' } } }
  ]);
  if (dateRange.length) {
    console.log(`\nDate range: ${dateRange[0].min.toISOString()} -> ${dateRange[0].max.toISOString()}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
