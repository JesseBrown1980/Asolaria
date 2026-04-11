/**
 * Seed 100 EZ Protect events into ebacmap-local-test
 *
 * Usage: node tmp/seed-ezprotect-100.js
 *
 * Requires: mongosh or mongodb driver available
 * This script uses mongosh-compatible syntax.
 * Run with: mongosh mongodb://localhost:27017/ebacmap-local-test tmp/seed-ezprotect-100.js
 */

const clientId = ObjectId('69c41938d84980e337ac77cd');

// Step 1: Get 3 locations for this client
const locations = db.locations.find({ clientId }).limit(3).toArray();
if (locations.length === 0) {
  print('ERROR: No locations found for client ' + clientId);
  quit(1);
}
const locationIds = locations.map(l => l._id);
const locationNames = locations.map(l => l.name || 'Unknown');
print('Found ' + locations.length + ' locations:');
locations.forEach(l => print('  ' + l._id + ' -> ' + (l.name || 'N/A')));

// Step 2: Configuration
const devices = [
  { sn: 'SN-1001', model: 'novaLUM-II-X' },
  { sn: 'SN-1002', model: 'novaLUM-II-X' },
  { sn: 'SN-1003', model: 'novaLUM-II-X' },
  { sn: 'SN-2001', model: 'PocketSwab Plus' },
  { sn: 'SN-2002', model: 'PocketSwab Plus' },
  { sn: 'SN-2003', model: 'PocketSwab Plus' },
  { sn: 'SN-2004', model: 'PocketSwab Plus' },
  { sn: 'SN-3001', model: 'InSite Listeria' },
  { sn: 'SN-3003', model: 'InSite Listeria' },
  { sn: 'SN-3005', model: 'InSite Listeria' },
];

const operators = [
  { id: 'OP-101', group: 'Day Shift A' },
  { id: 'OP-102', group: 'Day Shift A' },
  { id: 'OP-203', group: 'Day Shift B' },
  { id: 'OP-304', group: 'Night Shift' },
  { id: 'OP-405', group: 'Night Shift' },
];

// 8 result states with realistic distribution (100 events total)
// 60% NEGATIVE, 15% INITIAL_POSITIVE, 5% each for the other 6
const resultPool = [];
for (let i = 0; i < 60; i++) resultPool.push('NEGATIVE');
for (let i = 0; i < 15; i++) resultPool.push('INITIAL_POSITIVE');
for (let i = 0; i < 5; i++) resultPool.push('CONFIRMED_POSITIVE');
for (let i = 0; i < 5; i++) resultPool.push('PRESUMPTIVE_POSITIVE');
for (let i = 0; i < 5; i++) resultPool.push('INVALID');
for (let i = 0; i < 5; i++) resultPool.push('ERROR');
for (let i = 0; i < 3; i++) resultPool.push('INCONCLUSIVE');
for (let i = 0; i < 2; i++) resultPool.push('RETEST_REQUIRED');

// Shuffle
for (let i = resultPool.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [resultPool[i], resultPool[j]] = [resultPool[j], resultPool[i]];
}

const assays = [
  { code: 'LIS-ENV', name: 'Listeria Environmental', family: 'Pathogen' },
  { code: 'SAL-ENV', name: 'Salmonella Environmental', family: 'Pathogen' },
  { code: 'ATP-SFC', name: 'ATP Surface Hygiene', family: 'Hygiene' },
  { code: 'COL-TOT', name: 'Total Coliform', family: 'Indicator' },
];

const lotNumbers = ['LOT-2026-A1', 'LOT-2026-A2', 'LOT-2026-B1', 'LOT-2026-B3'];
const rollNumbers = ['R-001', 'R-002', 'R-003', 'R-004', 'R-005'];

// Step 3: Generate 100 events spread across last 48 hours
const now = new Date();
const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

const events = [];
for (let i = 0; i < 100; i++) {
  // Spread completedAt evenly across 48h with small random jitter
  const baseOffset = (i / 100) * 48 * 60 * 60 * 1000;
  const jitter = Math.floor(Math.random() * 20 * 60 * 1000); // up to 20 min jitter
  const completedAt = new Date(fortyEightHoursAgo.getTime() + baseOffset + jitter);
  const startedAt = new Date(completedAt.getTime() - (30 + Math.floor(Math.random() * 90)) * 1000); // 30-120s before
  const ingestedAt = new Date(completedAt.getTime() + (5 + Math.floor(Math.random() * 30)) * 1000); // 5-35s after

  const device = devices[i % devices.length];
  const operator = operators[i % operators.length];
  const location = locationIds[i % locationIds.length];
  const assay = assays[i % assays.length];
  const resultState = resultPool[i];

  // Generate realistic reading values based on result
  let readingValue, resultValue, resultUnit;
  if (assay.family === 'Hygiene') {
    // ATP values in RLU
    readingValue = resultState === 'NEGATIVE' ? Math.floor(Math.random() * 150) + 10 :
                   resultState === 'INITIAL_POSITIVE' ? Math.floor(Math.random() * 300) + 200 :
                   Math.floor(Math.random() * 500) + 300;
    resultValue = readingValue;
    resultUnit = 'RLU';
  } else {
    // Pathogen tests
    readingValue = resultState === 'NEGATIVE' ? +(Math.random() * 0.3).toFixed(3) :
                   resultState === 'INITIAL_POSITIVE' ? +(0.5 + Math.random() * 0.5).toFixed(3) :
                   +(0.8 + Math.random() * 0.2).toFixed(3);
    resultValue = readingValue;
    resultUnit = 'OD';
  }

  const controlLineValid = resultState !== 'INVALID' && resultState !== 'ERROR';
  const temperatureC = +(20 + Math.random() * 8).toFixed(1); // 20-28 C
  const pmStatus = Math.random() > 0.05 ? 'CURRENT' : 'OVERDUE';
  const calibrationStatus = Math.random() > 0.03 ? 'VALID' : 'EXPIRED';

  events.push({
    eventVersion: 2,
    sourceSystem: 'DEVICE_DIRECT',
    transportMode: 'USB',
    organizationId: clientId.str,
    facilityId: location.str,
    deviceSerialNumber: device.sn,
    deviceModel: device.model,
    assayCode: assay.code,
    assayName: assay.name,
    assayFamily: assay.family,
    lotNumber: lotNumbers[i % lotNumbers.length],
    rollNumber: rollNumbers[i % rollNumbers.length],
    resultState: resultState,
    resultValue: resultValue,
    resultUnit: resultUnit,
    readingValue: readingValue,
    controlLineValid: controlLineValid,
    temperatureC: temperatureC,
    pmStatus: pmStatus,
    calibrationStatus: calibrationStatus,
    lockout: false,
    supervisorOverride: false,
    stripLot: lotNumbers[i % lotNumbers.length],
    stripRoll: rollNumbers[i % rollNumbers.length],
    stripExpiration: new Date('2027-06-30'),
    moduleSlot: (i % 4) + 1,
    operatorId: operator.id,
    operatorGroup: operator.group,
    sampleId: 'SMPL-' + String(1000 + i),
    truckId: null,
    startedAt: startedAt,
    completedAt: completedAt,
    ingestedAt: ingestedAt,
    rawPayload: null,
    normalizationWarnings: [],
    locationId: location,
    clientId: clientId,
  });
}

// Step 4: Insert
const result = db.ezprotectevents.insertMany(events);
print('Inserted ' + result.insertedIds.length + ' EZ Protect events');

// Step 5: Verify
const total = db.ezprotectevents.countDocuments({ clientId });
print('Total events for client: ' + total);

const byState = db.ezprotectevents.aggregate([
  { $match: { clientId, completedAt: { $gte: fortyEightHoursAgo } } },
  { $group: { _id: '$resultState', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray();
print('Distribution in last 48h:');
byState.forEach(s => print('  ' + s._id + ': ' + s.count));
