/**
 * Server route order contract for phone/mobile/voice paths.
 * Run: node tests/contracts/server-route-order-mobile-phone-voice.test.js
 */

const fs = require("fs");
const path = require("path");

const serverPath = path.resolve(__dirname, "../../server.js");
const source = fs.readFileSync(serverPath, "utf8");

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

const miscNeedle = 'app.use("/api", requireLoopbackOnly, require("./routes/misc")';
const mobileNeedle = 'app.use("/api/mobile", require("./routes/mobile")';
const phoneNeedle = 'app.use("/api/phone", require("./routes/phone")';
const voiceNeedle = 'app.use("/api/voice", require("./routes/voice")';

const miscIndex = source.indexOf(miscNeedle);
const mobileIndex = source.indexOf(mobileNeedle);
const phoneIndex = source.indexOf(phoneNeedle);
const voiceIndex = source.indexOf(voiceNeedle);

assert("misc loopback-only mount exists", miscIndex >= 0);
assert("mobile route mount exists", mobileIndex >= 0);
assert("phone route mount exists", phoneIndex >= 0);
assert("voice route mount exists", voiceIndex >= 0);

assert(
  "mobile route mount stays before loopback-only misc mount",
  mobileIndex >= 0 && miscIndex >= 0 && mobileIndex < miscIndex
);

assert(
  "phone route mount stays before loopback-only misc mount",
  phoneIndex >= 0 && miscIndex >= 0 && phoneIndex < miscIndex
);

assert(
  "voice route mount stays before loopback-only misc mount",
  voiceIndex >= 0 && miscIndex >= 0 && voiceIndex < miscIndex
);

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
