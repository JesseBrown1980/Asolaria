"""
ASOLARIA FABRIC BROKER — MQTT Nervous System
The language flows through here. All agents publish/subscribe.
Topics follow IX/LX index language.

Topics:
  asolaria/colony/{colony}/node/{node}/status    — heartbeat
  asolaria/colony/{colony}/node/{node}/agent/{agent}  — agent messages
  asolaria/colony/{colony}/discovery/{d_id}      — new discoveries
  asolaria/colony/{colony}/command               — orchestrator commands
  asolaria/colony/{colony}/fabric                — topology updates
"""
import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime

BROKER = "localhost"
PORT = 1883
COLONY = "liris"

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"[FABRIC] Connected to MQTT broker (rc={rc})")
    client.subscribe(f"asolaria/colony/{COLONY}/#")
    # Announce fabric online
    client.publish(f"asolaria/colony/{COLONY}/fabric", json.dumps({
        "event": "fabric_online",
        "colony": COLONY,
        "timestamp": datetime.now().isoformat(),
        "nodes": ["liris", "felipe-a06", "monet"],
        "channels": 10
    }))

def on_message(client, userdata, msg):
    topic = msg.topic
    try:
        payload = json.loads(msg.payload.decode())
    except:
        payload = msg.payload.decode()

    # Index language: classify the message
    parts = topic.split("/")
    if "status" in parts:
        node = parts[4] if len(parts) > 4 else "?"
        print(f"[HEARTBEAT] {node}: {payload}")
    elif "discovery" in parts:
        d_id = parts[-1]
        print(f"[DISCOVERY] {d_id}: {payload}")
    elif "agent" in parts:
        agent = parts[-1]
        node = parts[4] if len(parts) > 4 else "?"
        print(f"[AGENT] {agent}@{node}: {payload}")
    elif "command" in parts:
        print(f"[COMMAND] {payload}")
    elif "fabric" in parts:
        print(f"[FABRIC] {payload}")
    else:
        print(f"[{topic}] {payload}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="liris-orchestrator")
client.on_connect = on_connect
client.on_message = on_message

print("=" * 50)
print("  ASOLARIA FABRIC BROKER")
print(f"  Colony: {COLONY}")
print(f"  Broker: {BROKER}:{PORT}")
print("=" * 50)

try:
    client.connect(BROKER, PORT)
    client.loop_forever()
except KeyboardInterrupt:
    print("\n[FABRIC] Shutting down")
except Exception as e:
    print(f"[FABRIC] Error: {e}")
    print("[FABRIC] Start mosquitto first: net start mosquitto")

