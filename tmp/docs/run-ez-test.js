const http = require('http');
const fs = require('fs');
const results = [];

function test(path) {
  return new Promise((resolve, reject) => {
    const r1 = http.request({hostname:'127.0.0.1',port:3000,path:'/api/auth/dev-bypass'}, res1 => {
      const cookie = res1.headers['set-cookie'].map(c=>c.split(';')[0]).join('; ');
      const r2 = http.request({hostname:'127.0.0.1',port:3000,path,headers:{Cookie:cookie}}, res2 => {
        let b=''; res2.on('data',d=>b+=d); res2.on('end',()=>{
          let parsed;
          try { parsed = JSON.parse(b); } catch(e) { parsed = b; }
          const shape = typeof parsed === 'object' ? describeShape(parsed) : typeof parsed;
          results.push({path, status: res2.statusCode, shape, preview: b.substring(0,300)});
          resolve();
        });
      }); r2.end();
    });
    r1.on('error', e => { results.push({path, status:'ERROR', shape:'N/A', preview:e.message}); resolve(); });
    r1.end();
  });
}

function describeShape(obj) {
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[] (empty array)';
    return '[' + obj.length + ' items] first keys: {' + Object.keys(obj[0]).join(', ') + '}';
  }
  const keys = Object.keys(obj);
  const desc = {};
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) desc[k] = 'array(' + v.length + ')';
    else if (v && typeof v === 'object') desc[k] = 'object{' + Object.keys(v).join(',') + '}';
    else desc[k] = typeof v;
  }
  return JSON.stringify(desc);
}

async function run() {
  const endpoints = [
    '/api/ez-protect/dashboard?locationId=69c41938d84980e337ac77cf',
    '/api/ez-protect/dashboard-corporate',
    '/api/ez-protect/dashboard-facility?locationId=69c41938d84980e337ac77cf',
    '/api/ez-protect/events?locationId=69c41938d84980e337ac77cf&page=1&limit=10',
    '/api/ez-protect/events?locationId=69c41938d84980e337ac77cf&deviceSerialNumber=SN-1001',
    '/api/ez-protect/devices?locationId=69c41938d84980e337ac77cf',
    '/api/ez-protect/alert-history?locationId=69c41938d84980e337ac77cf&page=1&limit=10',
    '/api/ez-protect/alerts?locationId=69c41938d84980e337ac77cf',
    '/api/ez-protect/export?locationId=69c41938d84980e337ac77cf&limit=5',
  ];
  for (const ep of endpoints) {
    await test(ep);
  }

  let report = '=== QDD EZ Protect API Endpoint Test ===\n';
  report += 'Date: ' + new Date().toISOString() + '\n';
  report += 'Server: 127.0.0.1:3000\n';
  report += 'Auth: dev-bypass cookie\n';
  report += '='.repeat(60) + '\n\n';

  for (const r of results) {
    report += '--- ' + r.path.split('?')[0] + ' ---\n';
    report += 'Full path: ' + r.path + '\n';
    report += 'Status: ' + r.status + '\n';
    report += 'Shape: ' + r.shape + '\n';
    report += 'Preview: ' + r.preview + '\n\n';
  }

  report += '=== SUMMARY ===\n';
  const passed = results.filter(r => r.status >= 200 && r.status < 300).length;
  const failed = results.filter(r => r.status >= 400 || r.status === 'ERROR').length;
  report += 'Total: ' + results.length + '\n';
  report += 'Passed (2xx): ' + passed + '\n';
  report += 'Failed (4xx/5xx/ERR): ' + failed + '\n';

  fs.writeFileSync('C:/Users/acer/Asolaria/tmp/docs/qdd-final-api-test.txt', report);
  console.log(report);
}
run();
