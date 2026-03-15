## SwarmDesk MQTT Hybrid

Asolaria now exposes a browser-safe hybrid transport for SwarmDesk:

- Realtime: `wss://127.0.0.1:18885/mqtt`
- Local debug fallback: `ws://127.0.0.1:18884/mqtt`
- Raw broker: `mqtt://127.0.0.1:18883`
- Feed packet: `GET http://127.0.0.1:4781/api/integrations/mqtt/browser-feed`

Use `WSS + MQTT` for live reads and `HTTP/MCP` for writes.

### Topics

- `asolaria/test/local/world/state`
- `asolaria/test/local/agents/colony/status`
- `asolaria/test/local/runtime/health`
- `asolaria/test/local/graph/events`

### Best SwarmDesk Hook Points

- `C:\Users\acer\swarmdesk-src\swarmdesk-dashboard-hooks.js`
  - `RealChatAPI` constructor / bootstrap: attach feed initialization beside auth-aware startup.
  - `getAuthToken()`: keep HTTP auth here; MQTT feed itself is local loopback and read-oriented.
  - `initializeSidebarChat()`: good place to start one global feed client after DOM ready.
  - `updateAnalytics()`: replace mock counters with feed-backed values.
  - `logActivity()`: append selected graph/runtime events here.

### Recommended Client Pattern

```js
import mqtt from "https://unpkg.com/mqtt/dist/mqtt.min.js";

const client = mqtt.connect("wss://127.0.0.1:18885/mqtt", {
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 3000
});

client.on("connect", () => {
  client.subscribe("asolaria/test/local/world/state");
  client.subscribe("asolaria/test/local/agents/colony/status");
  client.subscribe("asolaria/test/local/graph/events");
});

client.on("message", (topic, raw) => {
  const payload = JSON.parse(String(raw || "{}"));
  if (topic.endsWith("/world/state")) {
    window.__asolariaWorldState = payload;
  } else if (topic.endsWith("/agents/colony/status")) {
    window.__asolariaColonyStatus = payload;
  } else if (topic.endsWith("/graph/events")) {
    window.__asolariaGraphEvent = payload;
  }
});
```

### Verified Reality

- Windows/browser trust for `Asolaria Local CA` is installed in `CurrentUser\Root`.
- `https://127.0.0.1:18885/` returns `200`.
- Chromium opened from an HTTPS page successfully established `new WebSocket("wss://127.0.0.1:18885/mqtt")`.
- `ws://127.0.0.1:18884/mqtt` also connects for local debug, but secure pages should prefer `wss`.
