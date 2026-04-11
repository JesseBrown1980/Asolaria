const http = require("http");
http.get("http://192.168.1.3:4781/api/health/fast", res => {
  let d = "";
  res.on("data", c => d += c);
  res.on("end", () => {
    const h = JSON.parse(d);
    console.log("=== SOVEREIGN STATUS ===");
    console.log("Health:", h.ok ? "HEALTHY" : "DOWN", "| Uptime:", Math.round(h.uptimeSeconds / 60) + "min");
    console.log("\n=== AGENTS ===");
    (h.agentColony?.agents || []).forEach(a => {
      if (a.plane !== "admin_terminal") {
        const on = a.state === "active" || a.state === "online";
        console.log(on ? "[ON]" : "[--]", a.name, "-", a.role, "|", a.execution?.primaryProvider || "none");
      }
    });
    console.log("\n=== ADMIN TERMINALS ===");
    (h.agentColony?.adminTerminals?.agents || []).forEach(a => {
      console.log(a.sidecar?.state === "running" ? "[ON]" : "[--]", a.name, "-", a.role);
    });
    console.log("\n=== GATES ===");
    console.log(h.agentColony?.relay?.running ? "[ON]" : "[--]", "Codex Relay pid:" + h.agentColony?.relay?.pid);
    console.log(h.agentColony?.tunnel?.running ? "[ON]" : "[--]", "Cloudflare Tunnel");
    console.log(h.mqtt?.connected ? "[ON]" : "[--]", "MQTT", h.mqtt?.baseTopic);
    console.log("\n=== BRAIN ===");
    console.log("Provider:", h.brainLeader?.selectedProvider, "| Status:", h.brainLeader?.status);
    console.log("Queue:", h.queue?.running, "running,", h.queue?.queued, "queued");
  });
}).on("error", e => console.log("Cannot reach sovereign:", e.message));
