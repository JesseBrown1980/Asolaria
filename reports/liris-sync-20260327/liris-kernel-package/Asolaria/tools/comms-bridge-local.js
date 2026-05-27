#!/usr/bin/env node
/**
 * Local Comms Bridge — Gaia ↔ Liris ↔ Codex ↔ Dasein
 *
 * Runs on Rayssa's machine. Keeps the legacy Gaia bridge files alive while
 * normalizing all traffic into a 4-way bus envelope:
 * { from, to, thread, kind, text, ts }
 *
 * Legacy files:
 * - data/comms/gaia-to-local.ndjson
 * - data/comms/local-to-gaia.ndjson
 *
 * New files:
 * - data/comms/bus.ndjson
 * - data/comms/mailbox-liris.ndjson
 * - data/comms/mailbox-codex.ndjson
 * - data/comms/mailbox-gaia.ndjson
 * - data/comms/mailbox-dasein.ndjson
 *
 * Start: node tools/comms-bridge-local.js
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const ENVELOPE_PREFIX = "LXBUS:";
const DEFAULT_THREAD = "recovery";
const DEFAULT_KIND = "text";
const DEFAULT_STATUS_PORT = 4798;
const DEFAULT_GAIA_PORT = 4799;
const DEFAULT_POLL_INTERVAL = 5000;
const DEFAULT_OUTBOX_INTERVAL = 3000;

const PARTICIPANTS = {
  liris: {
    aliases: ["kuromi"],
    local: true,
    relayFrom: "liris"
  },
  codex: {
    aliases: ["codex-liris", "karumi", "karomi"],
    local: true,
    relayFrom: "codex-liris"
  },
  gaia: {
    aliases: [],
    local: false,
    relayFrom: "gaia"
  },
  dasein: {
    aliases: [],
    local: false,
    relayFrom: "dasein"
  }
};

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function toIsoString(value, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed.toISOString();
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function createBridge(options = {}) {
  const commsDir = path.resolve(
    String(
      options.commsDir ||
      process.env.ASOLARIA_COMMS_DIR ||
      path.join(__dirname, "..", "data", "comms")
    )
  );
  const legacyInbox = path.join(commsDir, "gaia-to-local.ndjson");
  const legacyOutbox = path.join(commsDir, "local-to-gaia.ndjson");
  const busLog = path.join(commsDir, "bus.ndjson");
  const statusPort = toPositiveInteger(
    options.statusPort || process.env.ASOLARIA_COMMS_STATUS_PORT,
    DEFAULT_STATUS_PORT
  );
  const gaiaHost = String(options.gaiaHost || process.env.ASOLARIA_GAIA_HOST || "192.168.1.3").trim();
  const gaiaPort = toPositiveInteger(
    options.gaiaPort || process.env.ASOLARIA_GAIA_PORT,
    DEFAULT_GAIA_PORT
  );
  const pollInterval = toPositiveInteger(
    options.pollInterval || process.env.ASOLARIA_GAIA_POLL_INTERVAL_MS,
    DEFAULT_POLL_INTERVAL
  );
  const outboxPollInterval = toPositiveInteger(
    options.outboxPollInterval || process.env.ASOLARIA_OUTBOX_POLL_INTERVAL_MS,
    DEFAULT_OUTBOX_INTERVAL
  );

  const aliasMap = new Map();
  for (const [participant, definition] of Object.entries(PARTICIPANTS)) {
    aliasMap.set(participant, participant);
    for (const alias of definition.aliases) {
      aliasMap.set(alias, participant);
    }
  }

  const mailboxPaths = {};
  for (const participant of Object.keys(PARTICIPANTS)) {
    mailboxPaths[participant] = path.join(commsDir, `mailbox-${participant}.ndjson`);
  }

  fs.mkdirSync(commsDir, { recursive: true });
  for (const filePath of [legacyInbox, legacyOutbox, busLog, ...Object.values(mailboxPaths)]) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "", "utf8");
    }
  }

  let messageSequence = 0;
  let server = null;
  let pollTimer = null;
  let outboxTimer = null;
  const outboxCursor = { offset: fs.statSync(legacyOutbox).size, remainder: "" };

  const stats = {
    startedAt: "",
    lastReceivedAt: "",
    lastRelayedAt: "",
    lastBusAt: "",
    lastError: "",
    messagesInjected: 0,
    messagesReceived: 0,
    messagesRelayed: 0,
    busWrites: 0,
    mailboxWrites: 0,
    relayErrors: 0,
    parseErrors: 0
  };

  function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  function makeMessageId() {
    messageSequence += 1;
    return `lxbus-${Date.now()}-${messageSequence}`;
  }

  function normalizeParticipant(raw, fallback = "") {
    const candidate = String(raw || "").trim().toLowerCase();
    if (!candidate) {
      return fallback;
    }
    return aliasMap.get(candidate) || candidate;
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function normalizeTargets(rawTarget, fallbackTarget) {
    const source = rawTarget == null ? fallbackTarget : rawTarget;
    let targets = [];
    if (Array.isArray(source)) {
      targets = source;
    } else if (typeof source === "string") {
      targets = source.split(",").map((value) => value.trim());
    } else if (source) {
      targets = [source];
    }

    const normalized = [];
    for (const target of targets) {
      const participant = normalizeParticipant(target);
      if (!participant) {
        continue;
      }
      if (participant === "all") {
        normalized.push(...Object.keys(PARTICIPANTS));
        continue;
      }
      if (participant === "local") {
        normalized.push(...Object.keys(PARTICIPANTS).filter((name) => PARTICIPANTS[name].local));
        continue;
      }
      if (participant === "remote") {
        normalized.push(...Object.keys(PARTICIPANTS).filter((name) => !PARTICIPANTS[name].local));
        continue;
      }
      normalized.push(participant);
    }
    return unique(normalized);
  }

  function targetValue(targets) {
    if (!targets.length) {
      return "";
    }
    return targets.length === 1 ? targets[0] : targets;
  }

  function normalizeEnvelope(raw, defaults = {}) {
    const from = normalizeParticipant(raw.from, defaults.from || "codex");
    const targets = normalizeTargets(raw.to, defaults.to || "gaia");
    const text = String(raw.text || raw.message || "").trim();
    const thread = String(raw.thread || defaults.thread || DEFAULT_THREAD).trim() || DEFAULT_THREAD;
    const kind = String(raw.kind || defaults.kind || DEFAULT_KIND).trim() || DEFAULT_KIND;
    const envelope = {
      id: String(raw.id || makeMessageId()),
      from,
      to: targetValue(targets),
      thread,
      kind,
      text,
      ts: toIsoString(raw.ts || raw.at || raw.sentAt || raw.receivedAt)
    };

    if (raw.via || defaults.via) {
      envelope.via = normalizeParticipant(raw.via, defaults.via);
    }
    if (raw.receivedAt) {
      envelope.receivedAt = toIsoString(raw.receivedAt);
    }
    return envelope;
  }

  function expandTargets(envelope) {
    return normalizeTargets(envelope.to, []);
  }

  function appendNdjson(filePath, payload) {
    fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, "utf8");
  }

  function appendBus(envelope) {
    appendNdjson(busLog, envelope);
    stats.busWrites += 1;
    stats.lastBusAt = envelope.ts;
  }

  function writeMailboxes(envelope, recipients) {
    const written = [];
    for (const recipient of recipients) {
      const mailboxPath = mailboxPaths[recipient];
      if (!mailboxPath) {
        continue;
      }
      appendNdjson(mailboxPath, envelope);
      stats.mailboxWrites += 1;
      written.push(recipient);
    }
    return written;
  }

  function readAppendedLines(filePath, cursorState) {
    const stat = fs.statSync(filePath);
    if (stat.size < cursorState.offset) {
      cursorState.offset = 0;
      cursorState.remainder = "";
    }
    if (stat.size === cursorState.offset) {
      return [];
    }

    const length = stat.size - cursorState.offset;
    const buffer = Buffer.alloc(length);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, length, cursorState.offset);
    fs.closeSync(fd);
    cursorState.offset = stat.size;

    const text = `${cursorState.remainder}${buffer.toString("utf8")}`;
    const lines = text.split(/\r?\n/);
    cursorState.remainder = lines.pop() || "";
    return lines.filter(Boolean);
  }

  function isLocalParticipant(participant) {
    return Boolean(PARTICIPANTS[participant] && PARTICIPANTS[participant].local);
  }

  function getLocalRecipients(envelope) {
    return expandTargets(envelope).filter(isLocalParticipant);
  }

  function getRemoteRecipients(envelope) {
    return expandTargets(envelope).filter((participant) => !isLocalParticipant(participant));
  }

  function isLegacyPlainMessage(rawMessage, envelope) {
    const remoteTargets = getRemoteRecipients(envelope);
    if (remoteTargets.length !== 1 || remoteTargets[0] !== "gaia") {
      return false;
    }
    const keys = Object.keys(rawMessage || {}).filter((key) => rawMessage[key] !== undefined);
    return keys.every((key) => ["from", "text"].includes(key));
  }

  function buildCarrierMessage(envelope, rawMessage) {
    const remoteTargets = getRemoteRecipients(envelope);
    if (!remoteTargets.length) {
      return null;
    }

    const relayFrom = (PARTICIPANTS[envelope.from] && PARTICIPANTS[envelope.from].relayFrom) || envelope.from;
    if (isLegacyPlainMessage(rawMessage, envelope)) {
      return {
        from: relayFrom,
        text: envelope.text
      };
    }

    const relayEnvelope = {
      ...envelope,
      to: targetValue(remoteTargets)
    };
    return {
      from: relayFrom,
      text: `${ENVELOPE_PREFIX}${JSON.stringify(relayEnvelope)}`
    };
  }

  function relayEnvelope(envelope, rawMessage) {
    const carrier = buildCarrierMessage(envelope, rawMessage);
    if (!carrier) {
      return false;
    }

    const payload = JSON.stringify(carrier);
    const request = http.request(
      {
        hostname: gaiaHost,
        port: gaiaPort,
        path: "/msg",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        },
        timeout: 8000
      },
      (response) => {
        response.resume();
        response.on("end", () => {
          stats.messagesRelayed += 1;
          stats.lastRelayedAt = new Date().toISOString();
          log(`SENT to Gaia bridge: ${carrier.text.slice(0, 120)}`);
        });
      }
    );

    request.on("error", (error) => {
      stats.relayErrors += 1;
      stats.lastError = error.message;
      log(`Relay error: ${error.message}`);
    });
    request.on("timeout", () => request.destroy(new Error("Relay timeout")));
    request.write(payload);
    request.end();
    return true;
  }

  function decodeIncoming(rawMessage) {
    const carrierFrom = normalizeParticipant(rawMessage.from, "gaia");
    const text = String(rawMessage.text || "").trim();
    if (text.startsWith(ENVELOPE_PREFIX)) {
      const decoded = safeJsonParse(text.slice(ENVELOPE_PREFIX.length));
      if (decoded) {
        return normalizeEnvelope(decoded, {
          from: normalizeParticipant(decoded.from, carrierFrom),
          to: "liris",
          via: carrierFrom
        });
      }
    }

    const plainJson = safeJsonParse(text);
    if (plainJson && typeof plainJson === "object" && (plainJson.text || plainJson.to || plainJson.thread)) {
      return normalizeEnvelope(plainJson, {
        from: normalizeParticipant(plainJson.from, carrierFrom),
        to: "liris",
        via: carrierFrom
      });
    }

    return normalizeEnvelope(
      {
        from: carrierFrom,
        to: "liris",
        text
      },
      {
        from: carrierFrom,
        to: "liris",
        via: carrierFrom
      }
    );
  }

  function ingestLocal(rawMessage, defaults = {}) {
    const envelope = normalizeEnvelope(rawMessage, {
      from: defaults.from || "codex",
      to: defaults.to || "gaia",
      thread: defaults.thread || DEFAULT_THREAD,
      kind: defaults.kind || DEFAULT_KIND
    });
    appendBus(envelope);
    const localRecipients = getLocalRecipients(envelope);
    const mailboxRecipients = unique([...localRecipients, ...getRemoteRecipients(envelope)]);
    writeMailboxes(envelope, mailboxRecipients);
    relayEnvelope(envelope, rawMessage);
    stats.messagesInjected += 1;
    return envelope;
  }

  function ingestRemote(rawMessage) {
    const envelope = decodeIncoming(rawMessage);
    appendBus(envelope);
    const recipients = getLocalRecipients(envelope);
    writeMailboxes(envelope, recipients);
    appendNdjson(legacyInbox, envelope);
    stats.messagesReceived += 1;
    stats.lastReceivedAt = envelope.ts;
    log(`RECV from Gaia bridge: ${envelope.text.slice(0, 120)}`);
    return envelope;
  }

  function pollGaia() {
    const request = http.get(
      `http://${gaiaHost}:${gaiaPort}/read?for=liris`,
      { timeout: 8000 },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          const payload = safeJsonParse(body);
          if (!payload || !Array.isArray(payload.messages) || !payload.messages.length) {
            return;
          }
          for (const message of payload.messages) {
            try {
              ingestRemote(message);
            } catch (error) {
              stats.parseErrors += 1;
              stats.lastError = error.message;
              log(`Inbound parse error: ${error.message}`);
            }
          }
        });
      }
    );
    request.on("error", () => {});
    request.on("timeout", () => request.destroy());
  }

  function checkOutbox() {
    let lines = [];
    try {
      lines = readAppendedLines(legacyOutbox, outboxCursor);
    } catch (error) {
      stats.lastError = error.message;
      return;
    }

    for (const line of lines) {
      const message = safeJsonParse(line);
      if (!message) {
        stats.parseErrors += 1;
        stats.lastError = "Invalid JSON in local-to-gaia.ndjson";
        continue;
      }
      try {
        ingestLocal(message, { from: "codex", to: "gaia" });
      } catch (error) {
        stats.parseErrors += 1;
        stats.lastError = error.message;
        log(`Outbox parse error: ${error.message}`);
      }
    }
  }

  function readNdjsonTail(filePath, limit = 20) {
    const size = toPositiveInteger(limit, 20);
    const content = fs.readFileSync(filePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-size)
      .map((line) => safeJsonParse(line))
      .filter(Boolean);
  }

  function getStatus() {
    return {
      ok: true,
      service: "comms-bridge-local",
      mode: "lxbus-4way",
      gaia: `${gaiaHost}:${gaiaPort}`,
      participants: Object.keys(PARTICIPANTS),
      files: {
        legacyInbox,
        legacyOutbox,
        bus: busLog,
        mailboxes: mailboxPaths
      },
      stats: {
        ...stats,
        uptimeSeconds: stats.startedAt ? Math.floor((Date.now() - Date.parse(stats.startedAt)) / 1000) : 0
      }
    };
  }

  function writeJson(response, statusCode, payload) {
    response.writeHead(statusCode, { "Content-Type": "application/json" });
    response.end(JSON.stringify(payload));
  }

  function handleRequest(request, response) {
    const url = new URL(request.url, `http://127.0.0.1:${statusPort}`);
    if (request.method === "GET" && url.pathname === "/status") {
      writeJson(response, 200, getStatus());
      return;
    }

    if (request.method === "GET" && url.pathname === "/participants") {
      writeJson(response, 200, { ok: true, participants: PARTICIPANTS });
      return;
    }

    if (request.method === "GET" && url.pathname === "/bus") {
      const limit = url.searchParams.get("limit") || "20";
      writeJson(response, 200, { ok: true, messages: readNdjsonTail(busLog, limit) });
      return;
    }

    if (request.method === "GET" && url.pathname === "/read") {
      const participant = normalizeParticipant(url.searchParams.get("for"));
      const limit = url.searchParams.get("limit") || "20";
      if (!participant || !mailboxPaths[participant]) {
        writeJson(response, 400, { ok: false, error: "Unknown participant" });
        return;
      }
      writeJson(response, 200, {
        ok: true,
        participant,
        messages: readNdjsonTail(mailboxPaths[participant], limit)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/msg") {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk;
      });
      request.on("end", () => {
        const payload = safeJsonParse(body);
        if (!payload || typeof payload !== "object") {
          writeJson(response, 400, { ok: false, error: "Invalid JSON body" });
          return;
        }
        const envelope = ingestLocal(payload, { from: "codex", to: "gaia" });
        writeJson(response, 200, { ok: true, message: envelope });
      });
      return;
    }

    response.writeHead(404);
    response.end();
  }

  function start() {
    if (server) {
      return getStatus();
    }
    stats.startedAt = new Date().toISOString();
    server = http.createServer(handleRequest);
    server.listen(statusPort, "0.0.0.0", () => {
      log(`Comms bridge status on :${statusPort}`);
    });
    pollTimer = setInterval(pollGaia, pollInterval);
    outboxTimer = setInterval(checkOutbox, outboxPollInterval);
    pollGaia();
    checkOutbox();
    log("Comms bridge started.");
    log(`Legacy inbox: ${legacyInbox}`);
    log(`Legacy outbox: ${legacyOutbox}`);
    log(`Bus log: ${busLog}`);
    log(`Gaia bridge: ${gaiaHost}:${gaiaPort}`);
    log("Participants: gaia, liris, codex, dasein");
    return getStatus();
  }

  function stop() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (outboxTimer) {
      clearInterval(outboxTimer);
      outboxTimer = null;
    }
    if (server) {
      server.close();
      server = null;
    }
  }

  return {
    config: {
      commsDir,
      legacyInbox,
      legacyOutbox,
      busLog,
      mailboxPaths,
      statusPort,
      gaiaHost,
      gaiaPort,
      pollInterval,
      outboxPollInterval
    },
    getStatus,
    ingestLocal,
    ingestRemote,
    start,
    stop
  };
}

if (require.main === module) {
  createBridge().start();
}

module.exports = {
  createBridge
};
