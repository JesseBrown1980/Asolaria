const http = require('http');

const BASE = 'http://127.0.0.1:4781';

const ENDPOINTS = [
  '/api/health/fast',
  '/api/connectors/manifests',
  '/api/standing-directives',
  '/api/graph-runtime/snapshot',
  '/api/federation/nodes',
  '/api/omnispindle/status',
  '/api/projects',
  '/api/mistakes/hints',
  '/api/mistakes/patterns',
  '/api/personas',
  '/api/captures/stats',
  '/api/policy/work-links',
  '/api/policy/clawbot',
  '/api/policy/work-orgs',
  '/api/workspace-knowledge/status',
  '/api/admin-terminals/cockpit',
  '/api/jobs',
  '/api/vault/status',
  '/api/daily-sites/natural20',
  '/api/bootstrap/friend-codex-pack',
  '/api/task-ledger/summary',
  '/api/task-ledger/tasks',
  '/api/security/dashboard',
  '/api/security/roles',
  '/api/security/risk-classes',
  '/api/security/hardening/status',
  '/api/security/hardening/keys',
  '/api/security/logs/status',
  '/api/worker-router/status',
  '/api/worker-runtime/fast',
  '/api/guardian/status',
  '/api/guardian/profile',
  '/api/guardian/alerts',
  '/api/guardian/approvals',
  '/api/company/mission',
  '/api/company/account',
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
  '/api/integrations/telegram/status',
  '/api/integrations/gemini_live/status',
  '/api/integrations/openai_web_chat/status',
  '/api/integrations/contactout/status',
  '/api/integrations/gemini_enterprise_web/status',
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = BASE + endpoint;
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve({ endpoint, pass: false, reason: `HTTP ${res.statusCode}` });
          return;
        }
        try {
          const json = JSON.parse(body);
          if (json.ok === true) {
            resolve({ endpoint, pass: true });
          } else {
            resolve({ endpoint, pass: false, reason: `ok is ${JSON.stringify(json.ok)}, expected true` });
          }
        } catch (e) {
          resolve({ endpoint, pass: false, reason: `Invalid JSON: ${e.message}` });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ endpoint, pass: false, reason: e.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ endpoint, pass: false, reason: 'Timeout' });
    });
  });
}

async function main() {
  console.log(`Running contract tests against ${BASE}`);
  console.log(`Testing ${ENDPOINTS.length} endpoints...\n`);

  const results = []; for (const ep of ENDPOINTS) { results.push(await testEndpoint(ep)); }

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.pass) {
      console.log(`  PASS  ${r.endpoint}`);
      passed++;
    } else {
      console.log(`  FAIL  ${r.endpoint} — ${r.reason}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed, ${ENDPOINTS.length} total`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
