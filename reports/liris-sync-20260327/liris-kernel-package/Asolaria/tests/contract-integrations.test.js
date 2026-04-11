const http = require('http');
const assert = require('assert');

const BASE = 'http://127.0.0.1:4781';

const ENDPOINTS = [
  '/api/integrations/slack/status',
  '/api/integrations/github/status',
  '/api/integrations/symphony/status',
  '/api/integrations/abacus/status',
  '/api/integrations/augment-context/status',
  '/api/integrations/google/status',
  '/api/integrations/microsoft/status',
  '/api/integrations/hubspot/status',
  '/api/integrations/gcp/status',
  '/api/integrations/vertex/status',
  '/api/integrations/mqtt/status',
  '/api/integrations/gemini_api/status',
  '/api/integrations/external/status',
];

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    }).on('error', reject);
  });
}

async function run() {
  let passed = 0;
  let failed = 0;

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await get(endpoint);
      assert.strictEqual(res.status, 200, `Expected 200 for ${endpoint}, got ${res.status}`);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.ok, true, `Expected ok:true for ${endpoint}, got ok:${json.ok}`);
      console.log(`PASS  ${endpoint}`);
      passed++;
    } catch (err) {
      console.error(`FAIL  ${endpoint} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
