"use strict";

/**
 * ssrfGuard.js — Asolaria-native SSRF guard for hook/webhook HTTP calls.
 *
 * Validates target URLs against blocked address ranges (RFC1918, link-local,
 * IMDS, CGNAT) before any outbound HTTP request leaves the colony.
 *
 * Extracted from Claude Code's ssrfGuard.ts, rewritten as CommonJS using
 * only Node.js builtins (net, dns).
 *
 * Usage:
 *   const { validateUrl, isPrivateAddress, ssrfGuardedLookup } = require("./ssrfGuard");
 *   const result = await validateUrl("http://169.254.169.254/latest/meta-data/");
 *   // { safe: false, reason: "...", resolvedIp: "169.254.169.254" }
 */

const { isIP } = require("net");
const dns = require("dns");

// ---------------------------------------------------------------------------
// Blocked CIDR ranges
// ---------------------------------------------------------------------------

const BLOCKED_RANGES = [
  { cidr: "0.0.0.0/8",       description: '"this" network (RFC 1122)' },
  { cidr: "10.0.0.0/8",      description: "Private — Class A (RFC 1918)" },
  { cidr: "100.64.0.0/10",   description: "Shared / CGNAT (RFC 6598, Alibaba IMDS 100.100.100.200)" },
  { cidr: "169.254.0.0/16",  description: "Link-local / cloud IMDS (AWS, Azure, GCP)" },
  { cidr: "172.16.0.0/12",   description: "Private — Class B (RFC 1918)" },
  { cidr: "192.168.0.0/16",  description: "Private — Class C (RFC 1918)" },
  { cidr: "::/128",          description: "IPv6 unspecified" },
  { cidr: "fc00::/7",        description: "IPv6 unique local (ULA)" },
  { cidr: "fe80::/10",       description: "IPv6 link-local" },
  { cidr: "::ffff:0:0/96",   description: "IPv4-mapped IPv6 — delegates to v4 check" },
];

// ---------------------------------------------------------------------------
// IPv6 expansion helpers
// ---------------------------------------------------------------------------

/**
 * Expand an IPv6 address (with optional :: and trailing dotted-decimal)
 * into an array of exactly 8 numeric groups. Returns null on malformed input.
 */
function expandIPv6Groups(addr) {
  let tailHextets = [];

  // Handle trailing dotted-decimal (e.g. ::ffff:169.254.169.254)
  if (addr.includes(".")) {
    const lastColon = addr.lastIndexOf(":");
    const v4 = addr.slice(lastColon + 1);
    addr = addr.slice(0, lastColon);
    const octets = v4.split(".").map(Number);
    if (
      octets.length !== 4 ||
      octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
    ) {
      return null;
    }
    tailHextets = [
      (octets[0] << 8) | octets[1],
      (octets[2] << 8) | octets[3],
    ];
  }

  // Expand :: into zero-fill groups
  const dbl = addr.indexOf("::");
  let head, tail;
  if (dbl === -1) {
    head = addr.split(":");
    tail = [];
  } else {
    const headStr = addr.slice(0, dbl);
    const tailStr = addr.slice(dbl + 2);
    head = headStr === "" ? [] : headStr.split(":");
    tail = tailStr === "" ? [] : tailStr.split(":");
  }

  const target = 8 - tailHextets.length;
  const fill = target - head.length - tail.length;
  if (fill < 0) return null;

  const hex = [...head, ...new Array(fill).fill("0"), ...tail];
  const nums = hex.map((h) => parseInt(h, 16));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 0xffff)) {
    return null;
  }
  nums.push(...tailHextets);
  return nums.length === 8 ? nums : null;
}

/**
 * Extract the embedded IPv4 dotted-decimal from an IPv4-mapped IPv6 address
 * (::ffff:X.X.X.X or ::ffff:XXXX:YYYY). Returns null if not mapped.
 */
function extractMappedIPv4(addr) {
  const g = expandIPv6Groups(addr);
  if (!g) return null;
  // IPv4-mapped: first 80 bits zero, next 16 bits 0xffff
  if (
    g[0] === 0 &&
    g[1] === 0 &&
    g[2] === 0 &&
    g[3] === 0 &&
    g[4] === 0 &&
    g[5] === 0xffff
  ) {
    const hi = g[6];
    const lo = g[7];
    return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Address classification
// ---------------------------------------------------------------------------

/**
 * Check if an IPv4 address string falls in a blocked range.
 * Loopback (127.0.0.0/8) is explicitly ALLOWED.
 */
function isBlockedV4(address) {
  const parts = address.split(".").map(Number);
  const [a, b] = parts;
  if (
    parts.length !== 4 ||
    a === undefined ||
    b === undefined ||
    parts.some((n) => Number.isNaN(n))
  ) {
    return false;
  }

  // Loopback — allowed
  if (a === 127) return false;

  if (a === 0) return true;                          // 0.0.0.0/8
  if (a === 10) return true;                         // 10.0.0.0/8
  if (a === 169 && b === 254) return true;           // 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10
  if (a === 192 && b === 168) return true;           // 192.168.0.0/16

  return false;
}

/**
 * Check if an IPv6 address string falls in a blocked range.
 * ::1 loopback is explicitly ALLOWED.
 */
function isBlockedV6(address) {
  const lower = address.toLowerCase();

  // ::1 loopback — allowed
  if (lower === "::1") return false;

  // :: unspecified — blocked
  if (lower === "::") return true;

  // IPv4-mapped IPv6 — delegate to v4 check
  const mappedV4 = extractMappedIPv4(lower);
  if (mappedV4 !== null) {
    return isBlockedV4(mappedV4);
  }

  // fc00::/7 — unique local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;

  // fe80::/10 — link-local (fe80 through febf)
  const firstHextet = lower.split(":")[0];
  if (
    firstHextet &&
    firstHextet.length === 4 &&
    firstHextet >= "fe80" &&
    firstHextet <= "febf"
  ) {
    return true;
  }

  return false;
}

/**
 * Returns true if the address (IPv4 or IPv6 string) is in a blocked range.
 *
 * Blocked: RFC1918, CGNAT, link-local, IMDS, unspecified, ULA.
 * Allowed: loopback (127.x.x.x, ::1), all public addresses.
 *
 * @param {string} address — IP address string
 * @returns {boolean}
 */
function isPrivateAddress(address) {
  const v = isIP(address);
  if (v === 4) return isBlockedV4(address);
  if (v === 6) return isBlockedV6(address);
  return false;
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

/**
 * Resolve a hostname to IP(s) via dns.lookup, wrapped in a Promise.
 * Returns an array of { address, family } objects.
 */
function dnsResolve(hostname) {
  return new Promise((resolve, reject) => {
    // If hostname is already an IP literal, skip DNS
    const ipVer = isIP(hostname);
    if (ipVer !== 0) {
      resolve([{ address: hostname, family: ipVer }]);
      return;
    }

    dns.lookup(hostname, { all: true }, (err, addresses) => {
      if (err) return reject(err);
      if (!addresses || addresses.length === 0) {
        const e = new Error(`ENOTFOUND ${hostname}`);
        e.code = "ENOTFOUND";
        e.hostname = hostname;
        return reject(e);
      }
      resolve(addresses);
    });
  });
}

/**
 * Validate a URL against SSRF blocked ranges.
 *
 * @param {string} url — full URL string (e.g. "http://169.254.169.254/latest/")
 * @param {object} [options]
 * @param {boolean} [options.allowLoopback=true] — allow 127.x.x.x / ::1
 * @returns {Promise<{safe: boolean, reason: string, resolvedIp: string}>}
 */
const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

async function validateUrl(url, options = {}) {
  const { allowLoopback = true } = options;

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_) {
    return { safe: false, reason: "Malformed URL", resolvedIp: "" };
  }

  // Protocol whitelist — block file://, gopher://, ftp://, data://, etc.
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return {
      safe: false,
      reason: `Blocked scheme: ${parsed.protocol}`,
      resolvedIp: "",
    };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  let addresses;
  try {
    addresses = await dnsResolve(hostname);
  } catch (err) {
    return {
      safe: false,
      reason: `DNS resolution failed: ${err.message}`,
      resolvedIp: "",
    };
  }

  for (const { address } of addresses) {
    // Loopback gate
    if (!allowLoopback) {
      const v = isIP(address);
      if (
        (v === 4 && address.startsWith("127.")) ||
        (v === 6 && address.toLowerCase() === "::1")
      ) {
        return {
          safe: false,
          reason: `Loopback address ${address} blocked (allowLoopback=false)`,
          resolvedIp: address,
        };
      }
    }

    if (isPrivateAddress(address)) {
      return {
        safe: false,
        reason: `Blocked address: ${hostname} resolves to ${address} (private/link-local/IMDS range)`,
        resolvedIp: address,
      };
    }
  }

  return { safe: true, reason: "", resolvedIp: addresses[0].address };
}

// ---------------------------------------------------------------------------
// Guarded DNS lookup (drop-in for http agent / axios)
// ---------------------------------------------------------------------------

/**
 * dns.lookup-compatible callback function that rejects blocked addresses.
 * Use as the `lookup` option in http.request or axios to bind validation
 * to the same resolution the socket uses (no TOCTOU rebind window).
 *
 * @param {string} hostname
 * @param {object} options
 * @param {function} callback — (err, address, family) or (err, [{address,family}])
 */
function ssrfGuardedLookup(hostname, options, callback) {
  const wantsAll = options && options.all === true;

  // IP literal — validate directly, no DNS
  const ipVersion = isIP(hostname);
  if (ipVersion !== 0) {
    if (isPrivateAddress(hostname)) {
      callback(_makeError(hostname, hostname), "");
      return;
    }
    const family = ipVersion === 6 ? 6 : 4;
    if (wantsAll) {
      callback(null, [{ address: hostname, family }]);
    } else {
      callback(null, hostname, family);
    }
    return;
  }

  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) {
      callback(err, "");
      return;
    }

    for (const { address } of addresses) {
      if (isPrivateAddress(address)) {
        callback(_makeError(hostname, address), "");
        return;
      }
    }

    const first = addresses[0];
    if (!first) {
      const e = new Error(`ENOTFOUND ${hostname}`);
      e.code = "ENOTFOUND";
      e.hostname = hostname;
      callback(e, "");
      return;
    }

    const family = first.family === 6 ? 6 : 4;
    if (wantsAll) {
      callback(
        null,
        addresses.map((a) => ({
          address: a.address,
          family: a.family === 6 ? 6 : 4,
        }))
      );
    } else {
      callback(null, first.address, family);
    }
  });
}

/**
 * Build a structured error for blocked addresses.
 */
function _makeError(hostname, address) {
  const err = new Error(
    `SSRF guard blocked: ${hostname} resolves to ${address} (private/link-local address). ` +
    `Loopback (127.0.0.1, ::1) is allowed for local dev.`
  );
  err.code = "ERR_SSRF_BLOCKED_ADDRESS";
  err.hostname = hostname;
  err.address = address;
  return err;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  isPrivateAddress,
  validateUrl,
  ssrfGuardedLookup,
  BLOCKED_RANGES,
  ALLOWED_SCHEMES,

  // Exposed for testing
  _expandIPv6Groups: expandIPv6Groups,
  _extractMappedIPv4: extractMappedIPv4,
};
