const assert = require("node:assert/strict");
const test = require("node:test");

const { loadPublicScript } = require("./public-script-harness");

test("worker-router page is read-only on compat/public context and does not POST", async () => {
  const harness = await loadPublicScript("public/worker-router.js", {
    url: "http://127.0.0.1:4781/worker-router.html",
    metaRouterMode: "read-only"
  });

  assert.equal(harness.document.querySelector("meta[name='asolaria-router-mode']").content, "read-only");
  assert.match(harness.getElement("routerModePill").textContent, /public read-only/i);
  assert.equal(harness.getElement("routerRecommendBtn").disabled, true);
  assert.equal(harness.getElement("routerDispatchBtn").disabled, true);

  const beforePosts = harness.fetchCalls.filter((call) => call.method === "POST").length;
  harness.getElement("routerRecommendBtn").click();
  harness.getElement("routerDispatchBtn").click();
  await harness.flush();
  const afterPosts = harness.fetchCalls.filter((call) => call.method === "POST").length;

  assert.equal(beforePosts, 0);
  assert.equal(afterPosts, 0);
});

test("worker-router page stays full mode elsewhere and allows POST actions", async () => {
  const harness = await loadPublicScript("public/worker-router.js", {
    url: "http://127.0.0.1:4791/worker-router.html",
    metaRouterMode: "full"
  });

  assert.equal(harness.document.querySelector("meta[name='asolaria-router-mode']").content, "full");
  assert.match(harness.getElement("routerModePill").textContent, /full control/i);
  assert.equal(harness.getElement("routerRecommendBtn").disabled, false);
  assert.equal(harness.getElement("routerDispatchBtn").disabled, false);

  harness.getElement("routerRecommendBtn").click();
  await harness.flush();

  const postUrls = harness.fetchCalls
    .filter((call) => call.method === "POST")
    .map((call) => call.pathname);

  assert.ok(postUrls.includes("/api/worker-router/recommend"));
});

test("worker-router page does not silently switch to read-only on 4781 without an explicit server marker", async () => {
  const harness = await loadPublicScript("public/worker-router.js", {
    url: "http://127.0.0.1:4781/worker-router.html"
  });

  assert.equal(harness.document.querySelector("meta[name='asolaria-router-mode']"), null);
  assert.match(harness.getElement("routerModePill").textContent, /full control/i);
  assert.equal(harness.getElement("routerRecommendBtn").disabled, false);
  assert.equal(harness.getElement("routerDispatchBtn").disabled, false);
});
