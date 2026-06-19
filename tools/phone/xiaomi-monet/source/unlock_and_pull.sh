#!/bin/bash
# UNLOCK + MOUNT MTP + COPY FILES — all in Linux, no Windows switch
# scrcpy sends PIN, then we mount MTP from Linux immediately

killall Xvfb openbox scrcpy 2>/dev/null
sleep 1
Xvfb :55 -screen 0 640x480x24 -ac &
sleep 2
DISPLAY=:55 openbox &
sleep 1

cd /tmp/scrcpy-linux-x86_64-v3.3.4
DISPLAY=:55 ./scrcpy --otg -s 56c90d22 --mouse=disabled &
SPID=$!

for i in $(seq 1 10); do
    if ! kill -0 $SPID 2>/dev/null; then echo "SCRCPY_DIED"; break; fi
    sleep 1
done

if kill -0 $SPID 2>/dev/null; then
    export DISPLAY=:55
    echo "=== SENDING PIN ==="
    xdotool key space; sleep 1
    xdotool key space; sleep 1
    xdotool key Return; sleep 1
    xdotool type --delay 200 "<REDACTED_PIN>"
    xdotool key Return; sleep 2
    echo "PIN_SENT"

    # Kill scrcpy — it holds USB exclusively
    kill $SPID 2>/dev/null
    wait $SPID 2>/dev/null
    sleep 2
    echo "SCRCPY_KILLED"
fi

killall Xvfb openbox 2>/dev/null

# Now mount MTP from Linux
echo "=== MOUNTING MTP ==="
mkdir -p /tmp/xiaomi-mtp
jmtpfs /tmp/xiaomi-mtp 2>&1
sleep 2

if [ -d /tmp/xiaomi-mtp ] && ls /tmp/xiaomi-mtp/ 2>/dev/null | head -5; then
    echo "=== MTP MOUNTED — COPYING FILES ==="
    mkdir -p /mnt/c/Users/rayss/xiaomi-backup

    # List what's there
    ls -la /tmp/xiaomi-mtp/ 2>&1
    echo "---"

    # Copy everything
    cp -rv /tmp/xiaomi-mtp/* /mnt/c/Users/rayss/xiaomi-backup/ 2>&1 | tail -20
    echo "=== COPY DONE ==="
else
    echo "MTP MOUNT FAILED or EMPTY"
    echo "Trying simple-mtpfs..."
    apt-get install -y -qq simple-mtpfs 2>&1 | tail -1
    simple-mtpfs /tmp/xiaomi-mtp 2>&1
    ls /tmp/xiaomi-mtp/ 2>&1
fi

# Unmount
fusermount -u /tmp/xiaomi-mtp 2>/dev/null
echo "DONE"

