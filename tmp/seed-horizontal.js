const mongoose = require('D:/projects/QDD/ebacmap-master/node_modules/.pnpm/mongoose@8.15.2_socks@2.8.7/node_modules/mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/ebacmap-local-test');
  const db = mongoose.connection.db;
  const OID = mongoose.Types.ObjectId;
  const clientId = new OID('69c41938d84980e337ac77cd');
  const now = new Date();

  // ── 1. Create 3 new locations ──
  const lid4 = new OID();
  const lid5 = new OID();
  const lid6 = new OID();

  const newLocations = [
    { _id: lid4, name: 'Cold Storage Facility', clientId: clientId, status: 'active', createdAt: now, updatedAt: now, subscriptionFeatures: { ezProtect: { enabled: true } } },
    { _id: lid5, name: 'Raw Materials Warehouse', clientId: clientId, status: 'active', createdAt: now, updatedAt: now, subscriptionFeatures: { ezProtect: { enabled: true } } },
    { _id: lid6, name: 'Packaging Line B', clientId: clientId, status: 'active', createdAt: now, updatedAt: now, subscriptionFeatures: { ezProtect: { enabled: true } } },
  ];

  const locResult = await db.collection('locations').insertMany(newLocations);
  console.log('Locations inserted:', locResult.insertedCount);
  console.log('  lid4 (Cold Storage):', lid4.toString());
  console.log('  lid5 (Raw Materials):', lid5.toString());
  console.log('  lid6 (Packaging Line B):', lid6.toString());

  // ── Existing references ──
  const lid1 = new OID('69c41938d84980e337ac77cf');   // Dev HQ
  const lid2 = new OID('69c42817238048400fc80850');   // Production Floor A
  const lid3 = new OID('69c42817238048400fc80851');   // Warehouse B

  const z1 = new OID('69c443d7bbdabf215406bfbf'); // Zone 1 - Product Contact
  const z2 = new OID('69c443d7bbdabf215406bfc0'); // Zone 2 - Adjacent
  const z3 = new OID('69c443d7bbdabf215406bfc1'); // Zone 3 - General Plant
  const z4 = new OID('69c443d7bbdabf215406bfc2'); // Zone 4 - External

  const zoneNames = ['Product Contact', 'Adjacent', 'General Plant', 'External'];
  const allLocs = [lid1, lid2, lid3, lid4, lid5, lid6];
  const locNames = ['Dev HQ', 'Production Floor A', 'Warehouse B', 'Cold Storage Facility', 'Raw Materials Warehouse', 'Packaging Line B'];

  // Zone map: lid -> [z1, z2, z3, z4]
  const zoneMap = {};
  zoneMap[lid1.toString()] = [z1, z2, z3, z4]; // existing zones

  // ── Create zones for locations that don't have them yet ──
  const newZones = [];
  for (let li = 1; li < allLocs.length; li++) {
    const loc = allLocs[li];
    const locZones = [];
    for (let zi = 0; zi < 4; zi++) {
      const zid = new OID();
      locZones.push(zid);
      newZones.push({
        _id: zid,
        name: 'Zone ' + (zi + 1) + ' - ' + zoneNames[zi],
        client: clientId,
        location: loc,
        status: 'active',
        active: true,
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      });
    }
    zoneMap[loc.toString()] = locZones;
  }

  if (newZones.length > 0) {
    const zResult = await db.collection('zones').insertMany(newZones);
    console.log('Zones inserted:', zResult.insertedCount);
  }

  // ── 2. Create 20 new sites (S-011 through S-030) ──
  const sitesDef = [
    { name: 'Mixer Station',       loc: lid2, zi: 0 },  // S-011, Production Floor A, Product Contact
    { name: 'Conveyor Joint',      loc: lid2, zi: 0 },  // S-012, Production Floor A, Product Contact
    { name: 'Packaging Seal',      loc: lid6, zi: 0 },  // S-013, Packaging Line B, Product Contact
    { name: 'Cooling Tunnel',      loc: lid4, zi: 1 },  // S-014, Cold Storage, Adjacent
    { name: 'Loading Dock',        loc: lid3, zi: 3 },  // S-015, Warehouse B, External
    { name: 'Prep Table B',        loc: lid2, zi: 0 },  // S-016, Production Floor A, Product Contact
    { name: 'Walk-in Cooler Wall', loc: lid4, zi: 2 },  // S-017, Cold Storage, General Plant
    { name: 'Drain Cover B',       loc: lid1, zi: 1 },  // S-018, Dev HQ, Adjacent
    { name: 'Hand Wash Station',   loc: lid2, zi: 2 },  // S-019, Production Floor A, General Plant
    { name: 'Air Handler Unit',    loc: lid3, zi: 3 },  // S-020, Warehouse B, External
    { name: 'Return Air Vent',     loc: lid3, zi: 2 },  // S-021, Warehouse B, General Plant
    { name: 'Dock Bumper',         loc: lid3, zi: 3 },  // S-022, Warehouse B, External
    { name: 'Scale Platform',      loc: lid5, zi: 1 },  // S-023, Raw Materials, Adjacent
    { name: 'Ingredient Hopper',   loc: lid5, zi: 0 },  // S-024, Raw Materials, Product Contact
    { name: 'Fill Nozzle',         loc: lid6, zi: 0 },  // S-025, Packaging Line B, Product Contact
    { name: 'Cap Sorter',          loc: lid6, zi: 1 },  // S-026, Packaging Line B, Adjacent
    { name: 'Label Applicator',    loc: lid6, zi: 1 },  // S-027, Packaging Line B, Adjacent
    { name: 'Case Packer',         loc: lid5, zi: 2 },  // S-028, Raw Materials, General Plant
    { name: 'Palletizer',          loc: lid3, zi: 2 },  // S-029, Warehouse B, General Plant
    { name: 'Shrink Wrapper',      loc: lid6, zi: 2 },  // S-030, Packaging Line B, General Plant
  ];

  const newSites = sitesDef.map((s, i) => ({
    _id: new OID(),
    name: s.name,
    siteCode: 'S-' + String(i + 11).padStart(3, '0'),
    siteId: String(i + 11).padStart(3, '0'),
    description: s.name,
    zone: zoneMap[s.loc.toString()][s.zi],
    location: s.loc,
    client: clientId,
    status: 'active',
    active: true,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  }));

  const siteResult = await db.collection('sites').insertMany(newSites);
  console.log('Sites inserted:', siteResult.insertedCount);

  // ── 3. Update dev user to have ALL 6 locations ──
  const userId = new OID('69c41938d84980e337ac77d1');
  const allLocIds = [lid1, lid2, lid3, lid4, lid5, lid6];

  const userResult = await db.collection('users').updateOne(
    { _id: userId },
    { $set: { locations: allLocIds, updatedAt: now } }
  );
  console.log('User updated:', userResult.modifiedCount, 'doc(s)');

  // ── Verification ──
  console.log('\n=== VERIFICATION ===');
  const totalLocs = await db.collection('locations').countDocuments({ clientId: clientId });
  console.log('Total locations for client:', totalLocs);

  const totalSites = await db.collection('sites').countDocuments({ client: clientId });
  console.log('Total sites for client:', totalSites);

  const totalZones = await db.collection('zones').countDocuments({ client: clientId });
  console.log('Total zones for client:', totalZones);

  const user = await db.collection('users').findOne({ _id: userId });
  console.log('User locations count:', user.locations.length);

  console.log('\n=== SITES BY LOCATION ===');
  for (let i = 0; i < allLocs.length; i++) {
    const count = await db.collection('sites').countDocuments({ client: clientId, location: allLocs[i] });
    console.log('  ' + locNames[i] + ': ' + count + ' sites');
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(e => { console.error(e); process.exit(1); });
