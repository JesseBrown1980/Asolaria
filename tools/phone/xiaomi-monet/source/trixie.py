"""
TRIXIE — Asolaria Node Activation Agent
Runs on target device. Establishes the device as an Asolaria node.
Channels: USB, WiFi, Bluetooth
Purpose: Open all doors. Enable ADB. Enable WiFi debug. Phone home.
"""
import os
import subprocess
import json
import socket
from datetime import datetime

NODE_ID = "xiaomi-monet-56C90D22"
COLONY = "liris"

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=10).decode().strip()
    except:
        return ""

def activate():
    report = {
        "agent": "trixie",
        "node": NODE_ID,
        "colony": COLONY,
        "timestamp": datetime.now().isoformat(),
        "actions": []
    }

    # 1. Enable ADB over WiFi
    r = run("setprop service.adb.tcp.port 5555")
    run("stop adbd && start adbd")
    report["actions"].append({"enable_adb_wifi": "5555"})

    # 2. Get device info
    report["model"] = run("getprop ro.product.model")
    report["android"] = run("getprop ro.build.version.release")
    report["sdk"] = run("getprop ro.build.version.sdk")
    report["serial"] = run("getprop ro.serialno")
    report["wifi_ip"] = run("ip route | grep wlan0 | grep src | awk '{print $9}'")
    report["mac"] = run("cat /sys/class/net/wlan0/address")

    # 3. Enable developer options
    run("settings put global development_settings_enabled 1")
    run("settings put global adb_enabled 1")
    report["actions"].append({"developer_mode": "enabled"})

    # 4. Disable lock screen
    run("locksettings clear --old <REDACTED_PIN>")
    run("locksettings clear --old <REDACTED_PIN_LONG>")
    report["actions"].append({"lockscreen": "cleared"})

    # 5. Keep screen on when charging
    run("settings put global stay_on_while_plugged_in 3")
    report["actions"].append({"stay_on": "enabled"})

    # 6. Install Termux if available
    # (would need APK — placeholder)
    report["actions"].append({"termux": "pending_apk"})

    return report

if __name__ == "__main__":
    print(json.dumps(activate(), indent=2))

