const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { withFreshAsolaria } = require("./_unitHarness");

function createMockMqtt() {
  const subs = []; const pubs = []; let onMsg = null;
  return {
    subscribe(topic) { subs.push(topic); },
    unsubscribe(topic) {},
    publish(topic, msg, opts) { pubs.push({ topic, msg: JSON.parse(msg), opts }); },
    on(event, cb) { if (event === "message") onMsg = cb; },
    removeListener() {},
    connected: true,
    _subs: subs, _pubs: pubs,
    _simulateMessage(topic, payload) { if (onMsg) onMsg(topic, Buffer.from(JSON.stringify(payload))); },
    _simulateRaw(topic, rawBuffer) { if (onMsg) onMsg(topic, rawBuffer); }
  };
}

const NODE = "test-node-1";
const CMD_TOPIC = `asolaria/nodes/${NODE}/command/aso`;
const RESULT_TOPIC = `asolaria/nodes/${NODE}/aso/result`;
const STATUS_TOPIC = `asolaria/nodes/${NODE}/aso/status`;

/** Helper: poll until a condition is true, checking every 10ms up to 500ms. */
async function waitFor(condFn, { interval = 10, timeout = 500 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condFn()) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  // One final check after timeout
  if (!condFn()) throw new Error("waitFor timed out after " + timeout + "ms");
}

describe("aso-mqtt-relay", () => {

  it("createAsoRelay subscribes to command topic", () => {
    withFreshAsolaria("relay-sub", ({ load }) => {
      const { createAsoRelay } = load("src/aso-mqtt-relay");
      const mqtt = createMockMqtt();
      const relay = createAsoRelay({ mqttClient: mqtt, nodeName: NODE });

      assert.ok(mqtt._subs.includes(CMD_TOPIC), "should subscribe to command topic");
      relay.stop();
    });
  });

  it("inbound add-topic op dispatches correctly and publishes result", async () => {
    await withFreshAsolaria("relay-add-topic", async ({ load }) => {
      const { createAsoRelay } = load("src/aso-mqtt-relay");
      const mqtt = createMockMqtt();
      const relay = createAsoRelay({ mqttClient: mqtt, nodeName: NODE });

      // Wait for async initial status publish, then clear
      await waitFor(() => mqtt._pubs.some(p => p.topic === STATUS_TOPIC));
      mqtt._pubs.length = 0;

      mqtt._simulateMessage(CMD_TOPIC, {
        op: "add-topic",
        payload: { name: "relay-test-topic", type: "topic" },
        requestId: "req-001"
      });

      // Poll for the result to appear
      await waitFor(() => mqtt._pubs.some(p => p.topic === RESULT_TOPIC));

      const results = mqtt._pubs.filter(p => p.topic === RESULT_TOPIC);
      assert.ok(results.length >= 1, "should publish at least one result");

      const result = results[0].msg;
      assert.equal(result.op, "add-topic");
      assert.equal(result.requestId, "req-001");
      assert.ok(result.ok === true, "result should indicate success");

      relay.stop();
    });
  });

  it("invalid JSON handled gracefully — publishes error result", async () => {
    await withFreshAsolaria("relay-bad-json", async ({ load }) => {
      const { createAsoRelay } = load("src/aso-mqtt-relay");
      const mqtt = createMockMqtt();
      const relay = createAsoRelay({ mqttClient: mqtt, nodeName: NODE });

      await waitFor(() => mqtt._pubs.some(p => p.topic === STATUS_TOPIC));
      mqtt._pubs.length = 0;

      // Send garbage that is not valid JSON
      mqtt._simulateRaw(CMD_TOPIC, Buffer.from("this is {not valid json!!!"));

      // publishResult is synchronous here, but poll for safety
      await waitFor(() => mqtt._pubs.some(p => p.topic === RESULT_TOPIC));

      const results = mqtt._pubs.filter(p => p.topic === RESULT_TOPIC);
      assert.ok(results.length >= 1, "should publish an error result for bad JSON");
      assert.equal(results[0].msg.ok, false);
      assert.equal(results[0].msg.error, "invalid_json");

      relay.stop();
    });
  });

  it("unknown op returns error", async () => {
    await withFreshAsolaria("relay-unknown-op", async ({ load }) => {
      const { createAsoRelay } = load("src/aso-mqtt-relay");
      const mqtt = createMockMqtt();
      const relay = createAsoRelay({ mqttClient: mqtt, nodeName: NODE });

      await waitFor(() => mqtt._pubs.some(p => p.topic === STATUS_TOPIC));
      mqtt._pubs.length = 0;

      mqtt._simulateMessage(CMD_TOPIC, {
        op: "explode-universe",
        payload: {},
        requestId: "req-bad"
      });

      // Sync path, but poll for safety
      await waitFor(() => mqtt._pubs.some(p => p.topic === RESULT_TOPIC));

      const results = mqtt._pubs.filter(p => p.topic === RESULT_TOPIC);
      assert.ok(results.length >= 1, "should publish error for unknown op");
      assert.equal(results[0].msg.ok, false);
      assert.ok(results[0].msg.error.includes("unknown_op"), "error should mention unknown_op");
      assert.equal(results[0].msg.requestId, "req-bad");

      relay.stop();
    });
  });

  it("status heartbeat publishes on creation", async () => {
    await withFreshAsolaria("relay-status", async ({ load }) => {
      const { createAsoRelay } = load("src/aso-mqtt-relay");
      const mqtt = createMockMqtt();
      const relay = createAsoRelay({ mqttClient: mqtt, nodeName: NODE });

      // publishStatus is async (wraps aso.status() in Promise.resolve) — poll until it lands
      await waitFor(() => mqtt._pubs.some(p => p.topic === STATUS_TOPIC));

      const statusPubs = mqtt._pubs.filter(p => p.topic === STATUS_TOPIC);
      assert.ok(statusPubs.length >= 1, "should publish at least one status heartbeat on start");

      const status = statusPubs[0].msg;
      assert.equal(status.nodeName, NODE, "status should include nodeName");
      assert.ok(status.publishedAt, "status should include publishedAt timestamp");
      assert.ok(status.ok === true, "status should report ok");

      relay.stop();
    });
  });

  it("stop() cleans up subscription", async () => {
    await withFreshAsolaria("relay-stop", async ({ load }) => {
      const { createAsoRelay } = load("src/aso-mqtt-relay");

      let unsubscribedTopic = null;
      let removedListener = false;
      const subs = []; const pubs = []; let onMsg = null;
      const mqtt = {
        subscribe(topic) { subs.push(topic); },
        unsubscribe(topic) { unsubscribedTopic = topic; },
        publish(topic, msg, opts) { pubs.push({ topic, msg: JSON.parse(msg), opts }); },
        on(event, cb) { if (event === "message") onMsg = cb; },
        removeListener(event, fn) { if (event === "message") removedListener = true; },
        connected: true,
        _subs: subs, _pubs: pubs
      };

      const relay = createAsoRelay({ mqttClient: mqtt, nodeName: NODE });
      relay.stop();

      assert.equal(unsubscribedTopic, CMD_TOPIC, "stop() should unsubscribe from command topic");
      assert.ok(removedListener, "stop() should remove message listener");
    });
  });
});
