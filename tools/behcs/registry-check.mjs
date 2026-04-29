#!/usr/bin/env node
// tools/behcs/registry-check.mjs
//
// Device-registry validator for the BEHCS bus.
//
// Reads data/behcs/device-registry.json. For each device:
//   - validates required fields (id, endpoints array)
//   - validates each endpoint URL is well-formed http://host:port
//   - HTTP GETs <endpoint>/behcs/health with a 3s timeout
//
// CLI:
//   node registry-check.mjs          # ping first endpoint per device (default)
//   node registry-check.mjs --full   # ping ALL endpoints per device
//
// Notes:
//   - Some endpoints (Falcon, phones, browser:// sidecars) may legitimately
//     be unreachable from acer; that's a topology fact, not a tool bug.
//   - This script does not write or commit anything.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import http from 'node:http';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default registry path: <repo>/data/behcs/device-registry.json
// tools/behcs/  ->  ../../data/behcs/device-registry.json
const REGISTRY_PATH = resolve(__dirname, '..', '..', 'data', 'behcs', 'device-registry.json');
const HEALTH_PATH = '/behcs/health';
const TIMEOUT_MS = 3000;

const args = process.argv.slice(2);
const FULL = args.includes('--full');

// ---------- helpers ----------

/**
 * Validate an endpoint string is a well-formed http(s)://host:port URL.
 * Returns { ok, host, port, protocol, reason }.
 */
function parseEndpoint(raw) {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { ok: false, reason: 'not_a_string' };
  }
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: 'unparseable_url' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: `non_http_protocol:${u.protocol.replace(':', '')}` };
  }
  if (!u.hostname) return { ok: false, reason: 'missing_host' };
  if (!u.port) return { ok: false, reason: 'missing_port' };
  return {
    ok: true,
    host: u.hostname,
    port: u.port,
    protocol: u.protocol.replace(':', ''),
  };
}

/**
 * GET <endpoint>/behcs/health with a 3s timeout.
 * Resolves with { reachable, latency_ms, status, version, error }.
 * Never rejects.
 */
function pingHealth(endpoint) {
  return new Promise((resolveP) => {
    const start = Date.now();
    let url;
    try {
      url = new URL(HEALTH_PATH, endpoint);
    } catch (e) {
      resolveP({
        reachable: false,
        latency_ms: 0,
        error: `bad_url:${e.message}`,
      });
      return;
    }

    const lib = url.protocol === 'https:' ? https : http;
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolveP(payload);
    };

    const req = lib.get(url, { timeout: TIMEOUT_MS }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const latency = Date.now() - start;
        const body = Buffer.concat(chunks).toString('utf8');
        let version;
        try {
          const j = JSON.parse(body);
          version = j.version || j.behcs_version || j.v;
        } catch {
          // not JSON — leave version undefined
        }
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        finish({
          reachable: ok,
          latency_ms: latency,
          status: res.statusCode,
          version,
          error: ok ? undefined : `http_${res.statusCode}`,
        });
      });
      res.on('error', (e) => {
        finish({
          reachable: false,
          latency_ms: Date.now() - start,
          error: `res_error:${e.code || e.message}`,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      finish({
        reachable: false,
        latency_ms: Date.now() - start,
        error: `timeout_${TIMEOUT_MS}ms`,
      });
    });

    req.on('error', (e) => {
      finish({
        reachable: false,
        latency_ms: Date.now() - start,
        error: `req_error:${e.code || e.message}`,
      });
    });
  });
}

/**
 * Validate device shape. Returns { ok, problems: string[] }.
 */
function validateDevice(id, dev) {
  const problems = [];
  if (!dev || typeof dev !== 'object') {
    problems.push('not_an_object');
    return { ok: false, problems };
  }
  if (!dev.id || typeof dev.id !== 'string') problems.push('missing_id');
  if (dev.id && dev.id !== id) problems.push(`id_mismatch:key=${id}_id=${dev.id}`);
  if (!Array.isArray(dev.endpoints)) problems.push('endpoints_not_array');
  return { ok: problems.length === 0, problems };
}

// ---------- main ----------

async function main() {
  let raw;
  try {
    raw = await readFile(REGISTRY_PATH, 'utf8');
  } catch (e) {
    console.error(`FATAL: cannot read registry at ${REGISTRY_PATH}: ${e.message}`);
    process.exit(2);
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`FATAL: registry is not valid JSON: ${e.message}`);
    process.exit(2);
  }

  const devices = json.devices || {};
  const ids = Object.keys(devices);

  console.log(`registry: ${REGISTRY_PATH}`);
  console.log(`mode:     ${FULL ? 'FULL (all endpoints)' : 'first endpoint only'}`);
  console.log(`devices:  ${ids.length}`);
  console.log('');

  const reports = [];
  let totalReachable = 0;
  let totalUnreachable = 0;

  for (const id of ids) {
    const dev = devices[id];
    const shape = validateDevice(id, dev);
    const endpoints = Array.isArray(dev?.endpoints) ? dev.endpoints : [];
    const targets = FULL ? endpoints : endpoints.slice(0, 1);

    const endpointReports = [];
    for (const ep of targets) {
      const parsed = parseEndpoint(ep);
      if (!parsed.ok) {
        endpointReports.push({
          endpoint: ep,
          reachable: false,
          latency_ms: 0,
          error_if_not: `malformed_url:${parsed.reason}`,
        });
        continue;
      }
      const result = await pingHealth(ep);
      endpointReports.push({
        endpoint: ep,
        reachable: result.reachable,
        latency_ms: result.latency_ms,
        version_if_reachable: result.reachable ? result.version : undefined,
        error_if_not: result.reachable ? undefined : result.error,
      });
    }

    // Tally: a device counts as reachable if any pinged endpoint is reachable.
    const anyReachable = endpointReports.some((r) => r.reachable);
    if (targets.length > 0) {
      if (anyReachable) totalReachable += 1;
      else totalUnreachable += 1;
    } else {
      totalUnreachable += 1;
    }

    const first = endpointReports[0];
    const report = {
      id,
      shape_ok: shape.ok,
      shape_problems: shape.problems,
      endpoints_count: endpoints.length,
      first_endpoint: endpoints[0] ?? null,
      reachable: first ? first.reachable : false,
      latency_ms: first ? first.latency_ms : 0,
      version_if_reachable: first?.version_if_reachable,
      error_if_not: first ? first.error_if_not : (endpoints.length === 0 ? 'no_endpoints' : undefined),
    };
    if (FULL) report.all_endpoints = endpointReports;
    reports.push(report);
  }

  // Per-device output
  for (const r of reports) {
    const tag = r.reachable ? 'OK ' : 'XX ';
    const ver = r.version_if_reachable ? ` v=${r.version_if_reachable}` : '';
    const err = r.error_if_not ? ` err=${r.error_if_not}` : '';
    const shape = r.shape_ok ? '' : ` shape!=${r.shape_problems.join(',')}`;
    console.log(
      `${tag} ${r.id.padEnd(20)} eps=${r.endpoints_count} first=${r.first_endpoint ?? '-'} ` +
      `lat=${r.latency_ms}ms${ver}${err}${shape}`,
    );
    if (FULL && r.all_endpoints && r.all_endpoints.length > 1) {
      for (const ep of r.all_endpoints.slice(1)) {
        const tag2 = ep.reachable ? '   OK' : '   XX';
        const ver2 = ep.version_if_reachable ? ` v=${ep.version_if_reachable}` : '';
        const err2 = ep.error_if_not ? ` err=${ep.error_if_not}` : '';
        console.log(`${tag2}     -> ${ep.endpoint} lat=${ep.latency_ms}ms${ver2}${err2}`);
      }
    }
  }

  console.log('');
  console.log(`summary: total=${ids.length} reachable=${totalReachable} unreachable=${totalUnreachable}`);

  // exit 0 always — reachability is informational, not an error condition
  process.exit(0);
}

main().catch((e) => {
  console.error(`FATAL: ${e.stack || e.message}`);
  process.exit(2);
});
