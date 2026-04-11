const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");

class FakeElement {
  constructor(id, tagName = "div") {
    this.id = id;
    this.tagName = String(tagName || "div").toUpperCase();
    this.dataset = {};
    this.style = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.className = "";
    this.title = "";
    this._textContent = "";
    this._innerHTML = "";
    this._buttons = [];
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value ?? "");
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value ?? "");
    this._buttons = [];
  }

  setAttribute(name, value) {
    this.attributes.set(String(name), String(value));
    if (String(name).toLowerCase() === "aria-disabled") {
      this.ariaDisabled = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes.get(String(name));
  }

  addEventListener(type, handler) {
    const key = String(type);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(handler);
  }

  dispatchEvent(event) {
    const handlers = this.listeners.get(String(event?.type || "")) || [];
    for (const handler of handlers) {
      handler(event);
    }
    return true;
  }

  click() {
    if (this.disabled) return;
    this.dispatchEvent({
      type: "click",
      preventDefault() {}
    });
  }

  querySelectorAll(selector) {
    if (String(selector || "") === "button[data-dispatch-id]") {
      return this._buttons.slice();
    }
    return [];
  }
}

function createButton(id, dispatchId) {
  const button = new FakeElement(id, "button");
  button.dataset.dispatchId = String(dispatchId || "");
  return button;
}

function createDocument(elementMap, options = {}) {
  const documentElement = new FakeElement("documentElement", "html");
  const body = new FakeElement("body", "body");
  const currentScript = new FakeElement("currentScript", "script");
  if (options.documentRouterMode) documentElement.dataset.routerMode = options.documentRouterMode;
  if (options.bodyRouterMode) body.dataset.routerMode = options.bodyRouterMode;
  if (options.currentScriptRouterMode) currentScript.dataset.routerMode = options.currentScriptRouterMode;

  return {
    documentElement,
    body,
    currentScript,
    querySelector(selector) {
      if (String(selector || "") === "meta[name='asolaria-router-mode']" && options.metaRouterMode) {
        return { content: options.metaRouterMode };
      }
      return null;
    },
    getElementById(id) {
      const key = String(id || "");
      if (!elementMap.has(key)) {
        elementMap.set(key, new FakeElement(key));
      }
      return elementMap.get(key);
    }
  };
}

function defaultWorkerRouterResponses() {
  return {
    status: {
      ok: true,
      status: {
        generatedAt: "2026-03-25T19:10:00.000Z",
        defaultWorker: "local_codex",
        workers: [
          { id: "local_codex", title: "Local Codex", available: true, dispatchable: true, strengths: ["local edits"], limitations: [], mistakes: [] }
        ],
        leaseLedger: {
          summary: { activeLeases: 1, queuedLeases: 0, totalLeases: 1, statusCounts: { active: 1, queued: 0 } }
        },
        integrationSummary: { localCodexAvailable: true, claudeMaxReady: false },
        coordinationSurfaces: [],
        knownIssues: []
      }
    },
    dispatches: {
      ok: true,
      dispatches: [
        {
          id: "dispatch_001",
          title: "Public dispatch",
          workerId: "local_codex",
          taskId: "task_001",
          leaseId: "lease_001",
          leaseStatus: "active",
          lease: { status: "active" },
          resultSummary: "Ready for inspection."
        }
      ]
    },
    recommend: {
      ok: true,
      recommendation: {
        recommendedWorkerId: "local_codex",
        directDispatchSupported: true,
        reasons: ["local worker available"],
        warnings: [],
        limitations: [],
        mistakes: [],
        input: { taskType: "patch", sensitivity: "internal", size: "small", preferredWorker: "auto" }
      }
    },
    dispatch: {
      ok: true,
      dispatch: {
        id: "dispatch_post_001",
        title: "Posted dispatch",
        workerId: "local_codex",
        taskId: "task_post_001",
        leaseId: "lease_post_001",
        leaseStatus: "queued",
        resultSummary: "Created."
      }
    }
  };
}

async function loadPublicScript(scriptRelativePath, options = {}) {
  const scriptPath = path.join(repoRoot, scriptRelativePath);
  const source = fs.readFileSync(scriptPath, "utf8");
  const fetchCalls = [];
  const responses = {
    ...defaultWorkerRouterResponses(),
    ...(options.responses || {})
  };
  const elementMap = new Map();
  const document = createDocument(elementMap, options);
  const locationUrl = new URL(options.url || "http://127.0.0.1:4791/worker-router.html");
  const window = {
    location: {
      href: locationUrl.toString(),
      port: locationUrl.port,
      pathname: locationUrl.pathname,
      search: locationUrl.search
    },
    document,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    console,
    URL,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Date,
    Array,
    Object,
    Promise,
    RegExp,
    encodeURIComponent,
    decodeURIComponent
  };
  const metaRouterMode = options.metaRouterMode || "";
  if (metaRouterMode) {
    document.querySelector = (selector) => {
      if (String(selector || "") === "meta[name='asolaria-router-mode']") {
        return { content: metaRouterMode };
      }
      return null;
    };
  }
  window.window = window;
  window.self = window;
  window.navigator = { userAgent: "unit-test" };
  window.fetch = async (url, requestOptions = {}) => {
    const parsedUrl = new URL(String(url), window.location.href);
    const method = String(requestOptions.method || "GET").toUpperCase();
    const body = requestOptions.body === undefined ? undefined : String(requestOptions.body);
    fetchCalls.push({
      url: parsedUrl.toString(),
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      method,
      body
    });
    const key = `${method} ${parsedUrl.pathname}`;
    let payload;
    if (method === "GET" && parsedUrl.pathname === "/api/worker-router/status") {
      payload = responses.status;
    } else if (method === "GET" && parsedUrl.pathname === "/api/worker-router/dispatches") {
      payload = responses.dispatches;
    } else if (method === "POST" && parsedUrl.pathname === "/api/worker-router/recommend") {
      payload = responses.recommend;
    } else if (method === "POST" && parsedUrl.pathname === "/api/worker-router/dispatch") {
      payload = responses.dispatch;
    } else if (typeof options.fetchHandler === "function") {
      payload = await options.fetchHandler({ url: parsedUrl, method, body, fetchCalls, responses });
    }
    if (payload === undefined) {
      throw new Error(`No stubbed response for ${key}`);
    }
    return {
      ok: payload.ok !== false,
      status: payload.status || 200,
      json: async () => payload
    };
  };
  document.defaultView = window;

  const ids = [
    "workerStatusGrid",
    "routerDefaultPill",
    "routerKnownIssuePill",
    "routerDispatchCountPill",
    "routerModePill",
    "workerDispatchList",
    "workerDispatchDetail",
    "routerRecommendationPills",
    "routerRecommendationBody",
    "workerRouterForm",
    "routerTitle",
    "routerObjective",
    "routerInstructions",
    "routerPaths",
    "routerTaskType",
    "routerSensitivity",
    "routerSize",
    "routerPreferredWorker",
    "routerRepoWrite",
    "routerNeedsCloud",
    "routerLongRunning",
    "routerCanvas",
    "routerExecuteNow",
    "routerEnsureService",
    "routerRecommendBtn",
    "routerDispatchBtn",
    "routerRefreshBtn"
  ];
  for (const id of ids) {
    elementMap.set(id, new FakeElement(id));
  }
  for (const id of ["routerRepoWrite", "routerNeedsCloud", "routerLongRunning", "routerCanvas", "routerExecuteNow", "routerEnsureService"]) {
    elementMap.get(id).checked = false;
  }
  if (options.formValues && typeof options.formValues === "object") {
    for (const [key, value] of Object.entries(options.formValues)) {
      const element = elementMap.get(String(key));
      if (!element) continue;
      if (typeof value === "boolean") {
        element.checked = value;
      } else {
        element.value = String(value);
      }
    }
  }

  const context = {
    window,
    document,
    fetch: window.fetch,
    URL,
    console,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    Promise,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Date,
    Array,
    Object,
    RegExp,
    encodeURIComponent,
    decodeURIComponent
  };
  context.globalThis = context;
  context.self = window;

  vm.runInNewContext(source, context, { filename: scriptPath });
  await flushMicrotasks();

  return {
    window,
    document,
    elements: elementMap,
    fetchCalls,
    flush: flushMicrotasks,
    getElement(id) {
      return elementMap.get(String(id || ""));
    },
    setDispatches(dispatches) {
      responses.dispatches = { ok: true, dispatches: Array.isArray(dispatches) ? dispatches : [] };
    },
    setStatus(status) {
      responses.status = { ok: true, status };
    },
    setRecommend(recommendation) {
      responses.recommend = { ok: true, recommendation };
    },
    setDispatch(dispatch) {
      responses.dispatch = { ok: true, dispatch };
    }
  };
}

async function flushMicrotasks(iterations = 10) {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve();
  }
}

module.exports = {
  loadPublicScript,
  flushMicrotasks,
  FakeElement,
  createButton
};
