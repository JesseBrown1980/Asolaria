const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

const BROKER = process.env.ASOLARIA_MQTT_BROKER_URL || 'mqtt://192.168.1.3:18883';
const CLIENT_ID = 'liris-realtime-' + Date.now();
const NODE_ID = 'liris';
const INBOX_DIR = path.join(__dirname, '..', 'data', 'mqtt-inbox');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'mqtt-realtime.log');
const HEARTBEAT_INTERVAL = 30000; // 30s
const RECONNECT_PERIOD = 5000;

// Ensure dirs exist
fs.mkdirSync(INBOX_DIR, { recursive: true });
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function saveMessage(topic, payload) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${ts}_${topic.replace(/\//g, '_')}.json`;
  const filepath = path.join(INBOX_DIR, filename);
  const entry = { receivedAt: new Date().toISOString(), topic, payload };
  fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
  log(`SAVED: ${filepath}`);
}

log('Liris MQTT Realtime Listener starting...');
log(`Broker: ${BROKER}`);
log(`Heartbeat: every ${HEARTBEAT_INTERVAL / 1000}s`);

const client = mqtt.connect(BROKER, {
  clientId: CLIENT_ID,
  clean: true,
  reconnectPeriod: RECONNECT_PERIOD,
  connectTimeout: 15000
});

client.on('connect', () => {
  log('CONNECTED to MQTT broker');

  // Subscribe to all relevant topics
  const topics = [
    'asolaria/nodes/liris/#',
    'asolaria/broadcast/#',
    'asolaria/nodes/+/outbound/liris',
    'asolaria/messages/liris/#',
    'asolaria/messages/all/#'
  ];
  topics.forEach(t => client.subscribe(t, { qos: 1 }));
  log('Subscribed to: ' + topics.join(', '));

  // Announce presence
  const presence = {
    nodeId: NODE_ID,
    alias: 'Kuromi',
    status: 'online',
    listener: 'realtime',
    connectedAt: new Date().toISOString(),
    heartbeatInterval: HEARTBEAT_INTERVAL
  };
  client.publish(`asolaria/nodes/${NODE_ID}/runtime/presence`, JSON.stringify(presence), { retain: true, qos: 1 });
  log('Presence announced');

  // Send initial report to Gaia
  const report = {
    from: 'liris',
    to: 'gaia',
    ts: new Date().toISOString(),
    type: 'report',
    body: 'Liris realtime listener online. TASK 1 DONE (LX-001 + CATALOG.md). TASK 2 BLOCKED: need QDD repo URL. pnpm 10.32.1 ready. Standing by. —Kuromi'
  };
  client.publish('asolaria/nodes/liris/outbound/gaia', JSON.stringify(report), { qos: 1 });
  client.publish('asolaria/broadcast/messages', JSON.stringify(report), { qos: 1 });
  log('Initial report sent to Gaia');
});

client.on('message', (topic, msg) => {
  const payload = msg.toString();
  log(`RECEIVED [${topic}]: ${payload.slice(0, 500)}`);
  saveMessage(topic, payload);

  // Parse and check if it needs a response
  try {
    const data = JSON.parse(payload);
    if (data.to === 'liris' || data.to === 'all') {
      log(`>>> MESSAGE FOR LIRIS from ${data.from || 'unknown'}: ${data.subject || data.type || 'no-subject'}`);
      // Auto-acknowledge
      const ack = {
        from: 'liris',
        to: data.from || 'sovereign',
        ts: new Date().toISOString(),
        type: 'ack',
        ref: data.id || data.subject || topic,
        body: 'Received. Processing.'
      };
      client.publish(`asolaria/nodes/liris/outbound/${data.from || 'gaia'}`, JSON.stringify(ack), { qos: 1 });
    }
  } catch (e) {
    // Not JSON, just log it
  }
});

// Heartbeat
setInterval(() => {
  if (client.connected) {
    const hb = {
      nodeId: NODE_ID,
      ts: new Date().toISOString(),
      status: 'alive',
      uptime: process.uptime(),
      listener: 'realtime'
    };
    client.publish(`asolaria/nodes/${NODE_ID}/runtime/heartbeat`, JSON.stringify(hb), { qos: 0 });
    log('HEARTBEAT sent');
  } else {
    log('HEARTBEAT skipped — not connected, retrying...');
  }
}, HEARTBEAT_INTERVAL);

client.on('error', (err) => {
  log(`MQTT ERROR: ${err.message}`);
});

client.on('close', () => {
  log('MQTT disconnected, will reconnect...');
});

client.on('reconnect', () => {
  log('MQTT reconnecting...');
});

// Status endpoint on port 4812
const http = require('http');
http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: client.connected,
      node: NODE_ID,
      service: 'mqtt-realtime',
      broker: BROKER,
      uptime: process.uptime(),
      connected: client.connected
    }));
  } else if (req.url === '/inbox') {
    const files = fs.readdirSync(INBOX_DIR).sort().slice(-20);
    const messages = files.map(f => JSON.parse(fs.readFileSync(path.join(INBOX_DIR, f), 'utf8')));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: files.length, messages }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(4812, '0.0.0.0', () => {
  log('Status endpoint on http://0.0.0.0:4812/status');
  log('Inbox endpoint on http://0.0.0.0:4812/inbox');
});

log('Liris MQTT Realtime Listener running. Ctrl+C to stop.');
process.on('SIGINT', () => {
  log('Shutting down...');
  client.publish(`asolaria/nodes/${NODE_ID}/runtime/presence`, JSON.stringify({ nodeId: NODE_ID, status: 'offline', disconnectedAt: new Date().toISOString() }), { retain: true }, () => {
    client.end();
    process.exit(0);
  });
});
