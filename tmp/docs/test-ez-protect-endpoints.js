const http = require('http');
const fs = require('fs');

const results = [];

function log(msg) {
  console.log(msg);
  results.push(msg);
}

function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

async function getDevBypassCookie() {
  const res = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/dev-bypass',
    method: 'GET'
  });
  log(`=== DEV BYPASS ===`);
  log(`Status: ${res.statusCode}`);
  if (res.headers['set-cookie']) {
    const cookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    log(`Cookie: ${cookie.substring(0, 120)}...`);
    return cookie;
  }
  log(`No set-cookie header. Body: ${res.body.substring(0, 300)}`);
  // Try POST
  const res2 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/dev-bypass',
    method: 'POST'
  });
  log(`POST Status: ${res2.statusCode}`);
  if (res2.headers['set-cookie']) {
    const cookie = res2.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    log(`POST Cookie: ${cookie.substring(0, 120)}...`);
    return cookie;
  }
  log(`POST No set-cookie. Body: ${res2.body.substring(0, 300)}`);
  return null;
}

async function testEndpoint(cookie, path, label) {
  log(`\n=== ${label} ===`);
  log(`Path: ${path}`);
  try {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method: 'GET',
      headers
    });
    log(`Status: ${res.statusCode}`);
    // Try to pretty-print JSON
    let display = res.body;
    try {
      const parsed = JSON.parse(res.body);
      display = JSON.stringify(parsed, null, 2);
      if (display.length > 1500) display = display.substring(0, 1500) + '\n... (truncated)';
    } catch(e) {
      if (display.length > 1500) display = display.substring(0, 1500) + '\n... (truncated)';
    }
    log(`Response:\n${display}`);
    return res;
  } catch(err) {
    log(`ERROR: ${err.message}`);
    return null;
  }
}

async function main() {
  const cookie = await getDevBypassCookie();
  log(`\nUsing cookie: ${cookie ? 'YES' : 'NO (proceeding without)'}\n`);

  const locationId = '69c41938d84980e337ac77cf';

  // 1. Events list
  const eventsRes = await testEndpoint(cookie,
    `/api/ez-protect/events?locationId=${locationId}&page=1&limit=10`,
    'EVENTS LIST');

  // Extract a real event ID if possible
  let eventId = null;
  if (eventsRes && eventsRes.statusCode === 200) {
    try {
      const data = JSON.parse(eventsRes.body);
      // Try common shapes: data.events[0]._id, data.data[0]._id, data[0]._id, data.events[0].id
      const events = data.events || data.data || data.results || (Array.isArray(data) ? data : []);
      if (events.length > 0) {
        eventId = events[0]._id || events[0].id;
        log(`\n>>> Found event ID: ${eventId}`);
      }
    } catch(e) {}
  }

  // 2. Events by device serial
  await testEndpoint(cookie,
    `/api/ez-protect/events?locationId=${locationId}&deviceSerialNumber=SN-001`,
    'EVENTS BY DEVICE SERIAL');

  // 3. Single event
  const eid = eventId || '000000000000000000000000';
  await testEndpoint(cookie,
    `/api/ez-protect/event/${eid}`,
    `SINGLE EVENT (id=${eid})`);

  // 4. Dashboard
  await testEndpoint(cookie,
    `/api/ez-protect/dashboard?locationId=${locationId}`,
    'DASHBOARD');

  // 5. Dashboard Corporate
  await testEndpoint(cookie,
    `/api/ez-protect/dashboard-corporate`,
    'DASHBOARD CORPORATE');

  // 6. Dashboard Facility
  await testEndpoint(cookie,
    `/api/ez-protect/dashboard-facility?locationId=${locationId}`,
    'DASHBOARD FACILITY');

  // 7. Devices
  await testEndpoint(cookie,
    `/api/ez-protect/devices?locationId=${locationId}`,
    'DEVICES');

  // 8. Alert History
  await testEndpoint(cookie,
    `/api/ez-protect/alert-history?locationId=${locationId}&page=1&limit=10`,
    'ALERT HISTORY');

  // 9. Alerts
  await testEndpoint(cookie,
    `/api/ez-protect/alerts?locationId=${locationId}`,
    'ALERTS');

  // Save results
  const output = results.join('\n');
  fs.writeFileSync('C:/Users/acer/Asolaria/tmp/docs/qdd-api-endpoint-test.txt', output, 'utf8');
  log('\n=== RESULTS SAVED ===');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
