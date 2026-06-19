#!/bin/bash
# SHANNON DEPLOY — Push Trixie + Debora to Xiaomi node via ADB
# Run from Liris colony (Rayssa's PC)

XIAOMI_SERIAL="56C90D22"
AGENTS_DIR="/mnt/c/Users/rayss/xiaomi-recover"

echo "=== SHANNON DEPLOY ==="
echo "Target: $XIAOMI_SERIAL"

# Phase 1: Push agents
echo "[1] Pushing Trixie..."
adb -s $XIAOMI_SERIAL push $AGENTS_DIR/trixie.py /sdcard/trixie.py

echo "[2] Pushing Debora..."
adb -s $XIAOMI_SERIAL push $AGENTS_DIR/debora.py /sdcard/debora.py

# Phase 2: Execute Trixie (node activation)
echo "[3] Activating Trixie..."
adb -s $XIAOMI_SERIAL shell "cd /sdcard && python3 trixie.py 2>/dev/null || python trixie.py 2>/dev/null || echo NO_PYTHON"

# Phase 3: Execute Debora (comms)
echo "[4] Establishing Debora comms..."
adb -s $XIAOMI_SERIAL shell "cd /sdcard && python3 debora.py 2>/dev/null || python debora.py 2>/dev/null || echo NO_PYTHON"

# Phase 4: Verify
echo "[5] Verify ADB WiFi..."
WIFI_IP=$(adb -s $XIAOMI_SERIAL shell "ip route | grep wlan0 | grep src" | awk '{print $9}')
echo "WiFi IP: $WIFI_IP"
adb -s $XIAOMI_SERIAL tcpip 5555
echo "ADB WiFi on ${WIFI_IP}:5555"

echo "=== DEPLOY COMPLETE ==="

