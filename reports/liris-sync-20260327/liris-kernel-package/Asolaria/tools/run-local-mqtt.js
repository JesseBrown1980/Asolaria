// Simple local MQTT broker for sub-colony testing (Aedes v1).
const net = require("net");

(async () => {
  const { Aedes } = require("aedes");
  const broker = await Aedes.createBroker();

  const port = process.env.MQTT_PORT ? Number(process.env.MQTT_PORT) : 18883;
  const host = process.env.MQTT_HOST || "0.0.0.0";

  const server = net.createServer(broker.handle);
  server.listen(port, host, () => {
    console.log(`[mqtt] broker listening on ${host}:${port}`);
  });

  broker.on("client", (client) => {
    console.log(`[mqtt] client connected: ${client?.id}`);
  });

  broker.on("clientDisconnect", (client) => {
    console.log(`[mqtt] client disconnected: ${client?.id}`);
  });

  broker.on("publish", (packet, client) => {
    if (client) {
      console.log(`[mqtt] ${client.id} -> ${packet.topic} (${packet.payload?.length || 0} bytes)`);
    }
  });
})().catch((err) => {
  console.error("[mqtt] failed to start broker:", err);
  process.exit(1);
});
