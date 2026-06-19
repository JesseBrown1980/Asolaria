"""
MICRO AGENT — Instant Asolaria agent template
Speaks IX/LX language over MQTT-SN / MQTT.
Runs on any node with Python. Lightweight. Fast. Self-reflecting.

Usage:
  python micro_agent.py --name trixie --node monet
  python micro_agent.py --name debora --node felipe-a06
"""
import paho.mqtt.client as mqtt
import json
import time
import argparse
from datetime import datetime

COLONY = "liris"
BROKER = "192.168.15.170"  # Liris PC
PORT = 1883

class MicroAgent:
    def __init__(self, name, node, broker=BROKER, port=PORT):
        self.name = name
        self.node = node
        self.colony = COLONY
        self.discoveries = []
        self.skills = []
        self.mistakes = []
        self.d_counter = 0
        self.s_counter = 0
        self.m_counter = 0

        self.client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2,
            client_id=f"{name}-{node}"
        )
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.broker = broker
        self.port = port

    def _topic(self, suffix):
        return f"asolaria/colony/{self.colony}/node/{self.node}/{suffix}"

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        print(f"[{self.name}@{self.node}] Connected to fabric")
        client.subscribe(f"asolaria/colony/{self.colony}/command")
        client.subscribe(self._topic("agent/#"))
        self.heartbeat()

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
        except:
            payload = msg.payload.decode()

        if "command" in msg.topic:
            self._handle_command(payload)
        else:
            print(f"[{self.name}] Received: {msg.topic} -> {payload}")

    def _handle_command(self, cmd):
        """Self-reflecting command handler"""
        action = cmd.get("action", "") if isinstance(cmd, dict) else str(cmd)
        print(f"[{self.name}] Command: {action}")

        # Reflect: can I do this?
        if action == "status":
            self.heartbeat()
        elif action == "discover":
            self.discover(cmd.get("data", ""))
        elif action == "deploy":
            self.deploy(cmd.get("target", ""))

    def heartbeat(self):
        self.client.publish(self._topic("status"), json.dumps({
            "agent": self.name,
            "node": self.node,
            "status": "alive",
            "timestamp": datetime.now().isoformat(),
            "discoveries": len(self.discoveries),
            "skills": len(self.skills)
        }))

    def discover(self, data):
        """Index a discovery in IX/LX language"""
        self.d_counter += 1
        d_id = f"D-{self.d_counter:03d}"
        discovery = {
            "id": d_id,
            "agent": self.name,
            "node": self.node,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        self.discoveries.append(discovery)
        self.client.publish(
            f"asolaria/colony/{self.colony}/discovery/{d_id}",
            json.dumps(discovery)
        )
        print(f"[{self.name}] Indexed: {d_id}")
        return d_id

    def publish(self, topic_suffix, data):
        self.client.publish(self._topic(f"agent/{topic_suffix}"), json.dumps(data))

    def run(self):
        print(f"[{self.name}@{self.node}] Starting...")
        try:
            self.client.connect(self.broker, self.port)
            self.client.loop_forever()
        except KeyboardInterrupt:
            print(f"\n[{self.name}] Shutting down")
        except Exception as e:
            print(f"[{self.name}] Cannot reach fabric broker at {self.broker}:{self.port}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Asolaria Micro Agent")
    parser.add_argument("--name", default="agent", help="Agent name")
    parser.add_argument("--node", default="liris", help="Node name")
    parser.add_argument("--broker", default=BROKER, help="MQTT broker")
    args = parser.parse_args()

    agent = MicroAgent(args.name, args.node, args.broker)
    agent.run()

