#!/usr/bin/env node
// Abacus-Worker Diagnostic Probe — surfaces ACTUAL runtime state of the
// abacus integration to identify why it "stopped working".
//
// Empirical method: imports src/connectors/abacusConnector.js + invokes
// getAbacusIntegrationStatus() + formats human-readable verdict.
//
// Output:
//   - JSON mode: structured status report (full connector state)
//   - default: human-readable verdict + actionable next-steps for operator
//
// Exit codes:
//   0  Integration ENABLED + configured + auth-likely-valid
//   1  Integration DISABLED or unconfigured (most common — needs operator login)
//   2  Connector load error (code-level regression, not config)

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = 'C:/Users/rayss/Asolaria';

async function probeConnectorStatus() {
  let connector;
  try {
    connector = require(REPO_ROOT + '/src/connectors/abacusConnector');
  } catch (e) {
    return { exit: 2, reason: 'CONNECTOR_LOAD_ERROR', error: e.message };
  }
  let status;
  try {
    status = connector.getAbacusIntegrationStatus();
  } catch (e) {
    return { exit: 2, reason: 'STATUS_CALL_ERROR', error: e.message };
  }
  return { exit: 0, status };
}

function diagnoseStatus(status) {
  const issues = [];
  const next = [];

  if (status.enabled !== true) {
    issues.push('integration ENABLED flag is false');
    next.push('Call setAbacusConfig({enabled: true, accountEmail: "..."}) via the connector OR enable in the UI.');
  }
  if (!status.accountEmail) {
    issues.push('no accountEmail configured');
    next.push('Provide accountEmail in setAbacusConfig (Google account for the abacus.ai login).');
  }
  if (status.source === 'defaults') {
    issues.push('config is from DEFAULTS, not vault — never customized via setAbacusConfig');
    next.push('Run setAbacusConfig at least once to persist configuration to vault.');
  }
  if (status.profile && status.profile.profileExists === false) {
    issues.push(`isolated Chrome profile does not exist (${status.profile.profileName})`);
    next.push('Launch the abacus-worker UI flow once to create the isolated profile (one-time browser handshake).');
  }
  if (status.profile && status.profile.cookiesPresent === false) {
    issues.push('no auth cookies in isolated profile (login session missing or expired)');
    next.push('Operator-witness moment: log in to abacus.ai via the isolated profile to capture auth cookies.');
  }
  if (status.surfaces && status.surfaces.desktop && status.surfaces.desktop.installed === false) {
    issues.push('Abacus AI desktop client not installed');
    next.push(`If desktop mode is preferred, install from: ${status.surfaces.desktop.installRoot || '<defaults>'}`);
  }

  const overallVerdict = issues.length === 0 ? 'READY' : 'NOT_READY';
  return { overallVerdict, issues, next };
}

function formatHumanReadable(status, diagnosis) {
  const lines = [];
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  Abacus-Worker Diagnostic — actual runtime state probe');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Overall verdict: ${diagnosis.overallVerdict}`);
  lines.push('');
  lines.push('  Connector state:');
  lines.push(`    enabled:         ${status.enabled}`);
  lines.push(`    configured:      ${status.configured}`);
  lines.push(`    source:          ${status.source}`);
  lines.push(`    appId:           ${status.appId}`);
  lines.push(`    accountEmail:    ${status.accountEmail || '(empty)'}`);
  lines.push(`    authProvider:    ${status.authProvider}`);
  lines.push(`    browserMode:     ${status.browserMode}`);
  lines.push('');
  lines.push('  Profile state:');
  lines.push(`    profileName:     ${status.profile?.profileName}`);
  lines.push(`    profileExists:   ${status.profile?.profileExists}`);
  lines.push(`    cookiesPresent:  ${status.profile?.cookiesPresent}`);
  lines.push('');
  lines.push('  Surfaces:');
  lines.push(`    desktop.installed:  ${status.surfaces?.desktop?.installed}`);
  if (status.surfaces?.listener) {
    lines.push(`    listener.installed: ${status.surfaces.listener.installed}`);
  }
  lines.push('');

  if (diagnosis.issues.length > 0) {
    lines.push('  Issues detected:');
    for (let i = 0; i < diagnosis.issues.length; i++) {
      lines.push(`    ${i + 1}. ${diagnosis.issues[i]}`);
    }
    lines.push('');
    lines.push('  Recommended next steps:');
    for (let i = 0; i < diagnosis.next.length; i++) {
      lines.push(`    ${i + 1}. ${diagnosis.next[i]}`);
    }
  } else {
    lines.push('  No issues detected. Integration appears ready.');
  }
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  return lines.join('\n');
}

async function main() {
  const argv = process.argv.slice(2);
  const jsonMode = argv.includes('--json');
  const quietMode = argv.includes('--quiet');

  const probe = await probeConnectorStatus();
  if (probe.exit === 2) {
    if (jsonMode) {
      process.stdout.write(JSON.stringify({ exit: 2, reason: probe.reason, error: probe.error }, null, 2) + '\n');
    } else if (!quietMode) {
      process.stderr.write(`CONNECTOR LOAD ERROR: ${probe.reason}\n${probe.error}\n`);
    }
    process.exit(2);
  }

  const diagnosis = diagnoseStatus(probe.status);
  const exitCode = diagnosis.overallVerdict === 'READY' ? 0 : 1;

  if (jsonMode) {
    process.stdout.write(JSON.stringify({
      schema: 'abacus-worker-diagnostic.v1',
      runAt: new Date().toISOString(),
      verdict: diagnosis.overallVerdict,
      issues: diagnosis.issues,
      nextSteps: diagnosis.next,
      connectorStatus: probe.status,
    }, null, 2) + '\n');
  } else if (!quietMode) {
    process.stdout.write(formatHumanReadable(probe.status, diagnosis) + '\n');
  }

  process.exit(exitCode);
}

main().catch(e => {
  process.stderr.write(`UNEXPECTED ERROR: ${e.message}\n`);
  process.exit(2);
});
