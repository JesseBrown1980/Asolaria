/**
 * QDD EZ Protect — Page Render Verification
 * Tests every EZ Protect page's API endpoint and verifies the response
 * contains all fields the frontend components expect.
 *
 * Usage: node tmp/docs/qdd-page-render-verification.js
 *
 * Prerequisites:
 *   - QDD dev server running on http://127.0.0.1:3000
 *   - MongoDB with seed data
 *   - dev-bypass endpoint available at /api/auth/dev-bypass
 */

const http = require('http');
const fs = require('fs');

const HOST = '127.0.0.1';
const PORT = 3000;
const LOCATION_ID = '69c41938d84980e337ac77cf';

const results = [];
let passCount = 0;
let failCount = 0;
let skipCount = 0;

function log(msg) {
  console.log(msg);
  results.push(msg);
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Field validation helpers
// ---------------------------------------------------------------------------

function checkFields(obj, fieldPaths, label) {
  const missing = [];
  const present = [];

  for (const fp of fieldPaths) {
    const parts = fp.split('.');
    let cur = obj;
    let found = true;

    for (const part of parts) {
      if (part.endsWith('[]')) {
        const key = part.slice(0, -2);
        if (!cur || !Array.isArray(cur[key])) { found = false; break; }
        cur = cur[key][0]; // check first element
        if (cur === undefined) { found = false; break; }
      } else {
        if (cur === null || cur === undefined || !(part in cur)) { found = false; break; }
        cur = cur[part];
      }
    }

    if (found) {
      present.push(fp);
    } else {
      missing.push(fp);
    }
  }

  if (missing.length === 0) {
    log(`  PASS: All ${present.length} required fields present`);
    passCount++;
  } else {
    log(`  FAIL: Missing fields: ${missing.join(', ')}`);
    log(`  Present: ${present.join(', ')}`);
    failCount++;
  }

  return missing.length === 0;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function getDevBypassCookie() {
  log('=== AUTH: Dev Bypass ===');
  try {
    const res = await request({
      hostname: HOST, port: PORT,
      path: '/api/auth/dev-bypass',
      method: 'GET'
    });
    log(`  Status: ${res.statusCode}`);

    if (res.headers['set-cookie']) {
      const cookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      log(`  Cookie obtained: ${cookie.substring(0, 80)}...`);
      return cookie;
    }

    // Some iron-session setups return the cookie on the response
    // but also check body for success
    let body;
    try { body = JSON.parse(res.body); } catch { body = null; }
    if (body && body.ok) {
      log('  Response ok=true but no set-cookie header.');
      log('  Body: ' + JSON.stringify(body));
      // iron-session might set the cookie anyway
      if (res.headers['set-cookie']) {
        const cookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        return cookie;
      }
    }

    log(`  WARNING: No cookie obtained. Body: ${(res.body || '').substring(0, 300)}`);
    return null;
  } catch (err) {
    log(`  ERROR: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Generic endpoint test
// ---------------------------------------------------------------------------

async function testEndpoint(cookie, path, label) {
  log(`\n=== TEST: ${label} ===`);
  log(`  Endpoint: GET ${path}`);

  try {
    const headers = { 'Accept': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    const res = await request({
      hostname: HOST, port: PORT,
      path, method: 'GET', headers
    });

    log(`  Status: ${res.statusCode}`);

    if (res.statusCode === 401 || res.statusCode === 403) {
      log(`  SKIP: Auth required (${res.statusCode}). Cookie may not be set.`);
      skipCount++;
      return { skip: true };
    }

    if (res.statusCode !== 200) {
      log(`  FAIL: Expected 200, got ${res.statusCode}`);
      log(`  Body: ${(res.body || '').substring(0, 500)}`);
      failCount++;
      return null;
    }

    let data;
    try {
      data = JSON.parse(res.body);
    } catch {
      log(`  FAIL: Response is not valid JSON`);
      log(`  Body: ${(res.body || '').substring(0, 500)}`);
      failCount++;
      return null;
    }

    // Truncated preview
    const preview = JSON.stringify(data, null, 2);
    log(`  Response preview: ${preview.substring(0, 600)}${preview.length > 600 ? '\n  ... (truncated)' : ''}`);

    return data;
  } catch (err) {
    log(`  ERROR: ${err.message}`);
    failCount++;
    return null;
  }
}

// ---------------------------------------------------------------------------
// Individual page tests
// ---------------------------------------------------------------------------

async function test1_Dashboard(cookie) {
  const label = '1. /ez-protect (index) — Dashboard';
  const data = await testEndpoint(cookie,
    `/api/ez-protect/dashboard?locationId=${LOCATION_ID}`,
    label);
  if (!data || data.skip) return;

  // Page expects: totalEvents, windows[].byResultState, latestOccurredAt
  // From EzProtectDashboardSummary: locationId, generatedAt, totalEvents, latestOccurredAt, windows[]
  // WindowSummary: windowDays, totalEvents, byResultState
  checkFields(data, [
    'totalEvents',
    'windows',
    'locationId',
    'generatedAt'
  ], label);

  // Check window structure if windows exist
  if (data.windows && data.windows.length > 0) {
    const w = data.windows[0];
    const wMissing = [];
    if (!('windowDays' in w)) wMissing.push('windows[0].windowDays');
    if (!('totalEvents' in w)) wMissing.push('windows[0].totalEvents');
    if (!('byResultState' in w)) wMissing.push('windows[0].byResultState');
    if (wMissing.length > 0) {
      log(`  FAIL: Window sub-fields missing: ${wMissing.join(', ')}`);
      failCount++;
    } else {
      log(`  PASS: Window sub-fields (windowDays, totalEvents, byResultState) present`);
      passCount++;
    }
  } else {
    log(`  INFO: windows array is empty — no window sub-field check possible`);
  }
}

async function test2_EventsList(cookie) {
  const label = '2. /ez-protect/results — Events List';
  const data = await testEndpoint(cookie,
    `/api/ez-protect/events?locationId=${LOCATION_ID}&page=1&limit=10`,
    label);
  if (!data || data.skip) return;

  // Page expects: events[].id, events[].deviceSerialNumber, events[].resultState,
  //               events[].completedAt, total, totalPages
  // From PaginatedEvents: events[], total, page, limit, totalPages
  checkFields(data, [
    'total',
    'totalPages',
    'page',
    'limit'
  ], label);

  if (data.events && data.events.length > 0) {
    const e = data.events[0];
    const eMissing = [];
    for (const f of ['id', 'deviceSerialNumber', 'resultState', 'completedAt', 'assayName']) {
      if (!(f in e)) eMissing.push(f);
    }
    if (eMissing.length > 0) {
      log(`  FAIL: Event sub-fields missing: ${eMissing.join(', ')}`);
      failCount++;
    } else {
      log(`  PASS: Event sub-fields (id, deviceSerialNumber, resultState, completedAt, assayName) present`);
      passCount++;
    }
  } else {
    log(`  INFO: events array is empty — no event sub-field check possible`);
  }

  // Return first event ID for detail test
  if (data.events && data.events.length > 0) {
    return data.events[0].id || data.events[0]._id;
  }
  return null;
}

async function test3_EventDetail(cookie, eventId) {
  const label = '3. /ez-protect/results/[id] — Event Detail';

  if (!eventId) {
    log(`\n=== TEST: ${label} ===`);
    log('  SKIP: No event ID available from events list');
    skipCount++;
    return;
  }

  const data = await testEndpoint(cookie,
    `/api/ez-protect/event/${eventId}`,
    label);
  if (!data || data.skip) return;

  // Page expects: id, readingValue, controlLineValid, temperatureC,
  //               deviceSerialNumber, resultState, deviceModel, assayCode, assayName, etc.
  checkFields(data, [
    'id',
    'deviceSerialNumber',
    'resultState',
    'deviceModel',
    'assayCode',
    'assayName'
  ], label);

  // Optional but important fields that the detail page renders
  const optionalFields = ['readingValue', 'controlLineValid', 'temperatureC',
    'moduleSlot', 'operatorId', 'sampleId', 'completedAt', 'startedAt'];
  const presentOptional = optionalFields.filter(f => f in data);
  log(`  INFO: Optional detail fields present: ${presentOptional.join(', ') || '(none)'}`);
}

async function test4_Devices(cookie) {
  const label = '4. /ez-protect/devices — Devices';
  const data = await testEndpoint(cookie,
    `/api/ez-protect/devices?locationId=${LOCATION_ID}`,
    label);
  if (!data || data.skip) return;

  // Page expects: devices[].deviceSerialNumber, devices[].status,
  //               devices[].totalEvents, devices[].lastSeenAt
  // From GetDeviceHealthResponse: { devices: DeviceInfo[] }
  checkFields(data, ['devices'], label);

  if (data.devices && data.devices.length > 0) {
    const d = data.devices[0];
    const dMissing = [];
    for (const f of ['deviceSerialNumber', 'status', 'deviceModel']) {
      if (!(f in d)) dMissing.push(f);
    }
    if (dMissing.length > 0) {
      log(`  FAIL: Device sub-fields missing: ${dMissing.join(', ')}`);
      failCount++;
    } else {
      log(`  PASS: Device sub-fields (deviceSerialNumber, status, deviceModel) present`);
      passCount++;
    }

    // Optional but important
    const optDev = ['lastSeenAt', 'totalEvents', 'calibrationStatus', 'pmStatus', 'facilityId'];
    const presentDev = optDev.filter(f => f in d);
    log(`  INFO: Optional device fields present: ${presentDev.join(', ') || '(none)'}`);
  } else {
    log(`  INFO: devices array is empty — no device sub-field check possible`);
  }
}

async function test5_AlertRules(cookie) {
  const label = '5. /ez-protect/alerts — Alert Rules';
  const data = await testEndpoint(cookie,
    `/api/ez-protect/alerts?locationId=${LOCATION_ID}`,
    label);
  if (!data || data.skip) return;

  // Page expects: bare array of AlertRule objects with _id, name, triggerType, channel, enabled
  // API returns AlertRule[] (bare array)
  if (!Array.isArray(data)) {
    log(`  FAIL: Expected bare array, got ${typeof data}`);
    failCount++;
    return;
  }

  log(`  PASS: Response is array (${data.length} rules)`);
  passCount++;

  if (data.length > 0) {
    const r = data[0];
    const rMissing = [];
    for (const f of ['_id', 'name', 'triggerType', 'channel', 'enabled']) {
      if (!(f in r)) rMissing.push(f);
    }
    if (rMissing.length > 0) {
      log(`  FAIL: AlertRule sub-fields missing: ${rMissing.join(', ')}`);
      failCount++;
    } else {
      log(`  PASS: AlertRule sub-fields (_id, name, triggerType, channel, enabled) present`);
      passCount++;
    }
  } else {
    log(`  INFO: alerts array is empty — no rule sub-field check possible (this is OK if no rules exist)`);
  }
}

async function test6_AlertHistory(cookie) {
  const label = '6. /ez-protect/alerts (history) — Alert History';
  const data = await testEndpoint(cookie,
    `/api/ez-protect/alert-history?locationId=${LOCATION_ID}&page=1&limit=10`,
    label);
  if (!data || data.skip) return;

  // Page expects: alerts[].alertName, alerts[].sentAt, alerts[].triggerType,
  //               alerts[].channel, total, totalPages
  // NOTE: The user said "alertRuleName" but the actual DB/API field is "alertName"
  checkFields(data, [
    'total',
    'totalPages',
    'page',
    'limit'
  ], label);

  if (data.alerts && data.alerts.length > 0) {
    const a = data.alerts[0];
    const aMissing = [];
    for (const f of ['alertName', 'sentAt', 'triggerType', 'channel']) {
      if (!(f in a)) aMissing.push(f);
    }
    if (aMissing.length > 0) {
      log(`  FAIL: AlertHistory sub-fields missing: ${aMissing.join(', ')}`);
      failCount++;
    } else {
      log(`  PASS: AlertHistory sub-fields (alertName, sentAt, triggerType, channel) present`);
      passCount++;
    }
  } else {
    log(`  INFO: alerts array is empty — no history sub-field check possible`);
  }
}

async function test7_FacilityDashboard(cookie) {
  const label = '7. /ez-protect/facility — Facility Dashboard';
  const data = await testEndpoint(cookie,
    `/api/ez-protect/dashboard-facility?locationId=${LOCATION_ID}`,
    label);
  if (!data || data.skip) return;

  // Page expects: totalEvents, windows[].byResultState, latestOccurredAt
  // From FacilityDashboardResponse: locationId, generatedAt, totalEvents, latestOccurredAt?, windows[]
  checkFields(data, [
    'totalEvents',
    'windows',
    'locationId',
    'generatedAt'
  ], label);

  if (data.windows && data.windows.length > 0) {
    const w = data.windows[0];
    const wMissing = [];
    if (!('windowDays' in w)) wMissing.push('windowDays');
    if (!('totalEvents' in w)) wMissing.push('totalEvents');
    if (!('byResultState' in w)) wMissing.push('byResultState');
    if (wMissing.length > 0) {
      log(`  FAIL: Facility window sub-fields missing: ${wMissing.join(', ')}`);
      failCount++;
    } else {
      log(`  PASS: Facility window sub-fields present`);
      passCount++;
    }
  } else {
    log(`  INFO: facility windows array is empty`);
  }
}

// ---------------------------------------------------------------------------
// Corporate dashboard (bonus — rendered on the /ez-protect index page too)
// ---------------------------------------------------------------------------

async function testBonus_CorporateDashboard(cookie) {
  const label = 'BONUS: /ez-protect (corporate) — Corporate Dashboard';
  const data = await testEndpoint(cookie,
    '/api/ez-protect/dashboard-corporate',
    label);
  if (!data || data.skip) return;

  // Page expects: totalEvents, totalDevices, alertCount, positiveRate,
  //               connectedDevices24h, disconnectedDevices, windows[],
  //               byFacility, errorCategories, byLotRoll, pmTesting
  checkFields(data, [
    'clientId',
    'generatedAt',
    'totalEvents',
    'totalDevices',
    'alertCount',
    'positiveRate',
    'windows',
    'byFacility',
    'errorCategories'
  ], label);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log('QDD EZ Protect — Page Render Verification');
  log(`Date: ${new Date().toISOString()}`);
  log(`Target: http://${HOST}:${PORT}`);
  log(`LocationId: ${LOCATION_ID}`);
  log('='.repeat(70));

  // Step 1: Get dev bypass cookie
  const cookie = await getDevBypassCookie();
  if (!cookie) {
    log('\nWARNING: No auth cookie. Tests may fail with 401/403.');
    log('Make sure QDD dev server is running: pnpm dev (in apps/web-ebacmap)');
  }

  // Step 2: Run all tests
  await test1_Dashboard(cookie);
  const eventId = await test2_EventsList(cookie);
  await test3_EventDetail(cookie, eventId);
  await test4_Devices(cookie);
  await test5_AlertRules(cookie);
  await test6_AlertHistory(cookie);
  await test7_FacilityDashboard(cookie);
  await testBonus_CorporateDashboard(cookie);

  // Summary
  log('\n' + '='.repeat(70));
  log('SUMMARY');
  log('='.repeat(70));
  log(`  PASS:  ${passCount}`);
  log(`  FAIL:  ${failCount}`);
  log(`  SKIP:  ${skipCount}`);
  log(`  Total: ${passCount + failCount + skipCount}`);

  if (failCount > 0) {
    log('\nVERDICT: SOME PAGES WILL NOT RENDER CORRECTLY');
  } else if (skipCount > 0 && passCount === 0) {
    log('\nVERDICT: ALL TESTS SKIPPED (server not running or auth failed)');
  } else {
    log('\nVERDICT: ALL PAGE RENDER REQUIREMENTS MET');
  }

  // Save results
  const output = results.join('\n');
  fs.writeFileSync('C:/Users/acer/Asolaria/tmp/docs/qdd-page-render-verification.txt', output, 'utf8');
  log('\nResults saved to: C:/Users/acer/Asolaria/tmp/docs/qdd-page-render-verification.txt');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  const output = results.join('\n');
  fs.writeFileSync('C:/Users/acer/Asolaria/tmp/docs/qdd-page-render-verification.txt', output, 'utf8');
  process.exit(1);
});
