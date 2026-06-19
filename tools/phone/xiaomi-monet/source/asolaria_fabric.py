"""
ASOLARIA FABRIC — Silicon-Level Multi-Device OS
Omnichannel mesh across all colony nodes.

Nodes:
  - liris    : Rayssa's notebook (Win11 + WSL2 Ubuntu) — orchestrator
  - felipe-a06: Samsung A06 (R9QY205KAKJ) — full ADB, active
  - monet    : Xiaomi Mi 10 Lite 5G (56C90D22) — AOA keyboard, pending unlock
  - rayssa-s24: Samsung S24 FE — future node

Channels: USB, WiFi, Bluetooth, ADB, AOA, MQTT
Agents: Shannon (pentest), Trixie (activation), Debora (comms)
"""
import subprocess
import json
import socket
import time
from datetime import datetime

FABRIC = {
    "colony": "liris",
    "orchestrator": "C:\\Users\\rayss",
    "created": datetime.now().isoformat(),
    "nodes": {}
}

def run(cmd, timeout=10):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=timeout).decode(errors='replace').strip()
    except:
        return ""

def scan_node_adb(serial):
    """Scan an ADB-connected node"""
    node = {"serial": serial, "channels": ["usb_adb"], "status": "active"}
    node["model"] = run(f"adb -s {serial} shell getprop ro.product.model")
    node["android"] = run(f"adb -s {serial} shell getprop ro.build.version.release")
    node["wifi_ip"] = run(f"adb -s {serial} shell ip route | findstr wlan0").split("src ")[-1].split()[0] if "src" in run(f"adb -s {serial} shell ip route") else ""
    node["battery"] = run(f"adb -s {serial} shell dumpsys battery").split("level: ")[-1].split("\n")[0] if "level" in run(f"adb -s {serial} shell dumpsys battery") else ""
    node["screen"] = run(f"adb -s {serial} shell dumpsys power").split("mWakefulness=")[-1].split("\n")[0] if "mWakefulness" in run(f"adb -s {serial} shell dumpsys power") else ""

    # Check WiFi ADB capability
    wifi_ip = node.get("wifi_ip", "")
    if wifi_ip:
        node["channels"].append("wifi")
        # Try enabling ADB over WiFi
        run(f"adb -s {serial} tcpip 5555")
        node["adb_wifi"] = f"{wifi_ip}:5555"
        node["channels"].append("wifi_adb")

    # Check Bluetooth
    bt = run(f"adb -s {serial} shell settings get global bluetooth_on")
    if bt == "1":
        node["channels"].append("bluetooth")

    return node

def scan_node_usb(vid, pid, serial):
    """Scan a USB-connected node (no ADB)"""
    node = {
        "serial": serial,
        "vid_pid": f"{vid}:{pid}",
        "channels": ["usb_mtp"],
        "status": "connected_no_adb"
    }
    # Check AOA
    try:
        import usb.core
        dev = usb.core.find(idVendor=int(vid, 16), idProduct=int(pid, 16))
        if dev:
            node["channels"].append("usb_aoa")
            node["aoa_version"] = 2
    except:
        pass
    return node

def scan_network(subnet="192.168.15"):
    """Scan local network for nodes"""
    hosts = []
    for i in range(1, 255):
        ip = f"{subnet}.{i}"
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.1)
            if s.connect_ex((ip, 5555)) == 0:
                hosts.append({"ip": ip, "port": 5555, "service": "adb"})
            s.close()
        except:
            pass
    return hosts

def build_fabric():
    print("=" * 60)
    print("  ASOLARIA FABRIC — Silicon-Level Omnichannel OS")
    print("=" * 60)

    # Node 1: Liris (this machine)
    print("\n[NODE] liris — orchestrator")
    FABRIC["nodes"]["liris"] = {
        "type": "orchestrator",
        "os": "Win11 + WSL2 Ubuntu",
        "ip": "192.168.15.170",
        "channels": ["local", "usb_host", "wifi", "bluetooth"],
        "agents": ["shannon", "liris_orchestrator"],
        "status": "active"
    }
    print("  Status: ACTIVE")

    # Node 2: Samsung A06 (ADB)
    print("\n[NODE] felipe-a06 — scanning via ADB...")
    adb_devices = run("adb devices -l")
    if "R9QY205KAKJ" in adb_devices:
        FABRIC["nodes"]["felipe-a06"] = scan_node_adb("R9QY205KAKJ")
        FABRIC["nodes"]["felipe-a06"]["codename"] = "a06"
        FABRIC["nodes"]["felipe-a06"]["agents"] = ["trixie", "debora"]
        print(f"  Model: {FABRIC['nodes']['felipe-a06'].get('model', '?')}")
        print(f"  Android: {FABRIC['nodes']['felipe-a06'].get('android', '?')}")
        print(f"  Channels: {FABRIC['nodes']['felipe-a06']['channels']}")
        print("  Status: ACTIVE")
    else:
        print("  Status: OFFLINE")

    # Node 3: Xiaomi Mi 10 Lite 5G
    print("\n[NODE] monet — Xiaomi Mi 10 Lite 5G")
    FABRIC["nodes"]["monet"] = {
        "serial": "56C90D22",
        "vid_pid": "2717:ff40",
        "codename": "monet",
        "soc": "SD765G",
        "channels": ["usb_mtp", "usb_aoa", "wifi_passive"],
        "wifi_ip": "192.168.15.37",
        "agents": ["trixie_pending", "debora_pending"],
        "status": "connected_pending_unlock",
        "pin": ["<REDACTED_PIN>", "<REDACTED_PIN_LONG>"]
    }
    print("  Channels: usb_mtp, usb_aoa, wifi(firewalled)")
    print("  Status: CONNECTED — PENDING UNLOCK")

    # Fabric summary
    print("\n" + "=" * 60)
    print("  FABRIC TOPOLOGY")
    print("=" * 60)
    active = sum(1 for n in FABRIC["nodes"].values() if n["status"] == "active")
    pending = sum(1 for n in FABRIC["nodes"].values() if "pending" in n["status"])
    total_channels = sum(len(n.get("channels", [])) for n in FABRIC["nodes"].values())
    print(f"  Nodes: {len(FABRIC['nodes'])} ({active} active, {pending} pending)")
    print(f"  Channels: {total_channels}")
    print(f"  Agents: shannon, trixie, debora")
    print(f"  Colony: {FABRIC['colony']}")

    # Save
    with open("C:/Users/rayss/xiaomi-recover/fabric.json", "w") as f:
        json.dump(FABRIC, f, indent=2, default=str)
    print(f"\n  Fabric saved: fabric.json")

    return FABRIC

if __name__ == "__main__":
    build_fabric()

