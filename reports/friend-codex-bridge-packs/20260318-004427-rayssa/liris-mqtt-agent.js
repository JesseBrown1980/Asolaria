const mqtt = require("mqtt");

// Liris/Kuromi — Rayssa's sub-colony agent
// Connects to Jesse's Asolaria MQTT broker

const BROKER_URL = "mqtt://192.168.1.10:18883";  // Jesse's PC on LAN
const DEVICE_ID = "liris";
const VIEWER = "kuromi";
const TOPIC_PREFIX = "asolaria/nodes/" + DEVICE_ID;

const client = mqtt.connect(BROKER_URL, {
  clientId: DEVICE_ID,
  clean: true,
  keepalive: 30,
  connectTimeout: 8000,
  reconnectPeriod: 5000
});

client.on("connect", () => {
  console.log("[LIRIS] Connected to Asolaria broker at " + BROKER_URL);

  // Subscribe to commands
  client.subscribe(TOPIC_PREFIX + "/command/#");
  client.subscribe("asolaria/liris/commands");
  client.subscribe("asolaria/broadcast/#");

  // Publish presence
  const presence = JSON.stringify({
    nodeId: DEVICE_ID,
    viewer: VIEWER,
    type: "desktop",
    role: "sub_colony",
    capabilities: ["node", "python", "codex", "omnispindle"],
    ip: "192.168.1.9",
    at: new Date().toISOString()
  });
  client.publish(TOPIC_PREFIX + "/runtime/presence", presence, { retain: true });
  console.log("[LIRIS] Presence published. Kuromi is online.");

  // Heartbeat every 30s
  setInterval(() => {
    client.publish(TOPIC_PREFIX + "/runtime/health", JSON.stringify({
      ok: true, nodeId: DEVICE_ID, uptime: process.uptime(),
      mem: process.memoryUsage().rss, at: new Date().toISOString()
    }));
  }, 30000);
});

client.on("message", (topic, message) => {
  const msg = message.toString();
  console.log("[LIRIS] " + topic + ": " + msg.slice(0, 200));

  // Command execution
  if (topic.includes("/command/exec")) {
    try {
      const cmd = JSON.parse(msg);
      const { exec } = require("child_process");
      exec(cmd.command, { timeout: cmd.timeout || 30000 }, (err, stdout, stderr) => {
        client.publish(TOPIC_PREFIX + "/response/" + (cmd.id || "exec"), JSON.stringify({
          nodeId: DEVICE_ID, id: cmd.id, stdout, stderr,
          error: err ? err.message : null, at: new Date().toISOString()
        }));
      });
    } catch(e) { console.error("[LIRIS] Exec error: " + e.message); }
  }
});

client.on("error", (err) => {
  console.error("[LIRIS] MQTT error: " + err.message);
});

client.on("close", () => {
  console.log("[LIRIS] Disconnected. Reconnecting...");
});

console.log("[LIRIS] Kuromi sub-colony agent starting...");
