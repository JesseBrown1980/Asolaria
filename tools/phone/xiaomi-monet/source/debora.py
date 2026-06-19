"""
DEBORA — Asolaria Communication Agent
Runs on target device. Establishes comms back to colony.
MQTT, HTTP, reverse shell — whatever works.
"""
import os
import subprocess
import socket
import json
from datetime import datetime

COLONY_IP = "192.168.15.170"  # Liris (Rayssa's PC)
NODE_ID = "xiaomi-monet-56C90D22"

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=10).decode().strip()
    except:
        return ""

def establish_comms():
    report = {
        "agent": "debora",
        "node": NODE_ID,
        "timestamp": datetime.now().isoformat(),
        "channels": []
    }

    # Channel 1: WiFi reverse connection test
    ip = run("ip route | grep wlan0 | grep src | awk '{print $9}'")
    report["wifi_ip"] = ip
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect((COLONY_IP, 8888))
        s.send(json.dumps({"node": NODE_ID, "status": "alive"}).encode())
        s.close()
        report["channels"].append({"reverse_tcp": "connected"})
    except:
        report["channels"].append({"reverse_tcp": "failed"})

    # Channel 2: ADB WiFi status
    adb_port = run("getprop service.adb.tcp.port")
    report["channels"].append({"adb_wifi": adb_port or "disabled"})

    # Channel 3: Phone state
    report["battery"] = run("dumpsys battery | grep level | head -1")
    report["screen"] = run("dumpsys display | grep mScreenState | head -1")
    report["uptime"] = run("uptime")

    # Channel 4: Network scan
    report["gateway"] = run("ip route | grep default | awk '{print $3}'")
    report["dns"] = run("getprop net.dns1")

    return report

if __name__ == "__main__":
    print(json.dumps(establish_comms(), indent=2))

