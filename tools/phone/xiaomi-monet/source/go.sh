#!/bin/bash
killall Xvfb openbox scrcpy 2>/dev/null
sleep 1

Xvfb :55 -screen 0 640x480x24 -ac &
sleep 2
DISPLAY=:55 openbox &
sleep 1

cd /tmp/scrcpy-linux-x86_64-v3.3.4
DISPLAY=:55 ./scrcpy --otg -s 56c90d22 --mouse=disabled --verbosity=debug &
SPID=$!

for i in $(seq 1 12); do
    if ! kill -0 $SPID 2>/dev/null; then
        echo "DIED at ${i}s"
        break
    fi
    echo "alive ${i}s"
    sleep 1
done

if kill -0 $SPID 2>/dev/null; then
    echo "=== SENDING PIN ==="
    export DISPLAY=:55
    xdotool key space
    sleep 1
    xdotool key space
    sleep 1
    xdotool key Return
    sleep 1
    xdotool type --delay 200 "<REDACTED_PIN>"
    xdotool key Return
    sleep 2
    echo "PIN <REDACTED_PIN> SENT"
    xdotool type --delay 200 "<REDACTED_PIN_LONG>"
    xdotool key Return
    sleep 2
    echo "PIN <REDACTED_PIN_LONG> SENT"
    kill $SPID
fi

killall Xvfb openbox 2>/dev/null
echo "DONE"

