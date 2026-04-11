const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const { repoRoot } = require("./_unitHarness");

function createClassList(element) {
  const readTokens = () => String(element._className || "").split(/\s+/).filter(Boolean);
  const writeTokens = (tokens) => {
    element._className = Array.from(new Set(tokens.filter(Boolean))).join(" ");
  };
  return {
    add(...tokens) {
      writeTokens(readTokens().concat(tokens));
    },
    remove(...tokens) {
      const removeSet = new Set(tokens.filter(Boolean));
      writeTokens(readTokens().filter((token) => !removeSet.has(token)));
    },
    contains(token) {
      return readTokens().includes(token);
    },
    toggle(token, force) {
      const tokens = readTokens();
      const hasToken = tokens.includes(token);
      const shouldAdd = force === undefined ? !hasToken : Boolean(force);
      if (shouldAdd && !hasToken) {
        tokens.push(token);
        writeTokens(tokens);
        return true;
      }
      if (!shouldAdd && hasToken) {
        writeTokens(tokens.filter((item) => item !== token));
        return false;
      }
      return hasToken;
    }
  };
}

function createElement(tagName = "div", id = "") {
  const listeners = new Map();
  const attributes = new Map();
  const element = {
    tagName: String(tagName || "div").toUpperCase(),
    id,
    style: {},
    dataset: {},
    children: [],
    parentNode: null,
    ownerDocument: null,
    disabled: false,
    checked: false,
    value: "",
    href: "",
    title: "",
    _className: "",
    _innerHTML: "",
    _textContent: "",
    classList: null,
    appendChild(child) {
      if (child && typeof child === "object") {
        child.parentNode = element;
        element.children.push(child);
      }
      return child;
    },
    addEventListener(type, handler) {
      const key = String(type || "").toLowerCase();
      if (!listeners.has(key)) listeners.set(key, []);
      listeners.get(key).push(handler);
    },
    dispatchEvent(event) {
      const key = String(event?.type || "").toLowerCase();
      const handlers = listeners.get(key) || [];
      for (const handler of handlers) {
        handler.call(element, event);
      }
      return true;
    },
    querySelectorAll() {
      return [];
    },
    setAttribute(name, value) {
      const key = String(name || "").toLowerCase();
      attributes.set(key, String(value));
      if (key === "href") {
        element.href = String(value);
      }
      if (key === "value") {
        element.value = String(value);
      }
    },
    getAttribute(name) {
      return attributes.get(String(name || "").toLowerCase()) || null;
    },
    removeAttribute(name) {
      attributes.delete(String(name || "").toLowerCase());
    }
  };
  Object.defineProperty(element, "className", {
    get() {
      return element._className;
    },
    set(value) {
      element._className = String(value || "");
    }
  });
  Object.defineProperty(element, "innerHTML", {
    get() {
      return element._innerHTML;
    },
    set(value) {
      element._innerHTML = String(value || "");
    }
  });
  Object.defineProperty(element, "textContent", {
    get() {
      return element._textContent;
    },
    set(value) {
      element._textContent = String(value || "");
    }
  });
  element.classList = createClassList(element);
  return element;
}

function createDocument(elementsById) {
  const documentElement = createElement("html", "documentElement");
  const body = createElement("body", "body");
  const document = {
    body,
    documentElement,
    currentScript: null,
    getElementById(id) {
      return elementsById.get(id) || null;
    },
    createElement(tagName) {
      const element = createElement(tagName);
      element.ownerDocument = document;
      return element;
    },
    createElementNS(_ns, tagName) {
      const element = createElement(tagName);
      element.ownerDocument = document;
      return element;
    },
    querySelector() {
      return null;
    }
  };
  body.ownerDocument = document;
  documentElement.ownerDocument = document;
  return document;
}

function buildPreviewHarness({ worldPayload, dispatchPayload, trusted = true, admin = true }) {
  const ids = [
    "civilizationLiveState",
    "civilizationUpdatedAt",
    "civilizationMetrics",
    "civilizationMapSummary",
    "civilizationDistrictFilter",
    "civilizationKindFilter",
    "civilizationRiskFilter",
    "civilizationSearch",
    "civilizationTrustedToggle",
    "civilizationAdminToggle",
    "civilizationHotToggle",
    "civilizationAutoRefresh",
    "civilizationRefreshBtn",
    "civilizationJsonLink",
    "civilizationRoutes",
    "civilizationDistrictLayer",
    "civilizationNodeLayer",
    "civilizationDistrictList",
    "civilizationInspector",
    "civilizationClaudeList",
    "civilizationEventList"
  ];
  const elements = new Map(ids.map((id) => [id, createElement("div", id)]));
  const document = createDocument(elements);
  const calls = [];

  elements.get("civilizationTrustedToggle").checked = Boolean(trusted);
  elements.get("civilizationAdminToggle").checked = Boolean(admin);
  elements.get("civilizationHotToggle").checked = false;
  elements.get("civilizationAutoRefresh").checked = false;
  elements.get("civilizationDistrictFilter").value = "";
  elements.get("civilizationKindFilter").value = "";
  elements.get("civilizationRiskFilter").value = "";
  elements.get("civilizationSearch").value = "";

  const fetch = async (url) => {
    const href = String(url || "");
    calls.push(href);
    if (href.startsWith("/api/worker-runtime/civilization-world")) {
      return {
        ok: true,
        status: 200,
        json: async () => worldPayload
      };
    }
    if (href === "/api/worker-router/dispatches?limit=12") {
      return {
        ok: true,
        status: 200,
        json: async () => dispatchPayload
      };
    }
    throw new Error(`unexpected_fetch:${href}`);
  };

  const window = {
    document,
    location: new URL("https://example.test/swarm-civilization-preview.html"),
    fetch,
    console,
    JSON,
    Math,
    Date,
    URL,
    URLSearchParams,
    Intl,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: (callback) => setTimeout(() => callback(Date.now()), 0),
    cancelAnimationFrame: (handle) => clearTimeout(handle)
  };
  window.window = window;
  window.self = window;
  window.globalThis = window;
  document.defaultView = window;

  return { window, document, elements, calls };
}

function flushTicks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test("swarm civilization preview uses the public worker-router dispatch route", async () => {
  const worldPayload = {
    ok: true,
    generatedAt: "2026-03-25T19:15:00.000Z",
    summary: {
      entities: 1,
      routes: 0,
      towers: 0,
      gates: 0,
      packets: 0,
      tasks: 1,
      projectedTasks: 1,
      hotEntities: 1,
      onlineEntities: 1,
      riskRoutes: { low: 0, medium: 0, high: 0, critical: 0 }
    },
    projections: {
      taskLedger: { openTasks: 1 },
      colony: { online: 1, total: 1 }
    },
    districts: [
      { id: "workshop", label: "Workshop", purpose: "Compat preview", count: 1 }
    ],
    entities: [
      {
        id: "task_001",
        label: "Preview Task",
        kind: "task",
        status: "active",
        district: "workshop",
        summary: "Compat-safe task projection",
        hot: true
      }
    ],
    routes: [],
    events: []
  };
  const dispatchPayload = {
    ok: true,
    dispatches: [
      {
        id: "dispatch_001",
        title: "Compat-safe Claude dispatch",
        workerId: "claude_max",
        taskId: "task_001",
        leaseId: "lease_001",
        leaseStatus: "completed",
        completedAt: "2026-03-25T19:15:00.000Z",
        taskType: "review",
        resultSummary: "Claude Max review completed."
      }
    ]
  };

  const { window, elements, calls } = buildPreviewHarness({
    worldPayload,
    dispatchPayload,
    trusted: true,
    admin: true
  });
  const sourcePath = path.join(repoRoot, "public", "swarm-civilization-preview.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const context = vm.createContext(window);

  vm.runInContext(source, context, { filename: sourcePath });
  await flushTicks();

  assert.deepEqual(calls, [
    "/api/worker-runtime/civilization-world?trusted=1&admin=1",
    "/api/worker-router/dispatches?limit=12"
  ]);
  assert.equal(elements.get("civilizationJsonLink").href, "/api/worker-runtime/civilization-world?trusted=1&admin=1");
  assert.match(elements.get("civilizationClaudeList").innerHTML, /Compat-safe Claude dispatch/);
  assert.match(elements.get("civilizationClaudeList").innerHTML, /completed/);
  assert.equal(elements.get("civilizationLiveState").textContent, "Live local projection");
});
