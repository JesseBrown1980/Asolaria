/**
 * Network loopback wildcard host contract
 * Run: node tests/contracts/network-loopback-host-wildcard.test.js
 */

const { isLoopbackRequest } = require("../../lib/network");

let passed = 0;
let failed = 0;

function assert(label, predicate) {
  if (predicate) {
    passed += 1;
    console.log(`PASS  ${label}`);
    return;
  }
  failed += 1;
  console.log(`FAIL  ${label}`);
}

function makeReq({ ip = "127.0.0.1", remoteAddress = "127.0.0.1", host = "127.0.0.1:4781", headers = {} } = {}) {
  return {
    ip,
    socket: { remoteAddress },
    headers: {
      host,
      ...headers
    }
  };
}

assert(
  "loopback request accepts host header 0.0.0.0",
  isLoopbackRequest(makeReq({ host: "0.0.0.0:4781" })) === true
);

assert(
  "loopback request accepts host header ::",
  isLoopbackRequest(makeReq({ host: "[::]:4781" })) === true
);

assert(
  "loopback request still rejects private LAN host headers",
  isLoopbackRequest(makeReq({ host: "192.168.15.189:4781" })) === false
);

assert(
  "loopback request still rejects non-loopback forwarded client",
  isLoopbackRequest(makeReq({
    host: "0.0.0.0:4781",
    headers: {
      "x-forwarded-for": "192.168.15.188"
    }
  })) === false
);

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
