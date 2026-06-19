#!/bin/bash
# FINISH SETUP WIZARD — Navigate through ALL screens blind
# Phone was wiped, might be stuck in setup. Tab+Enter through everything.

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
    if ! kill -0 $SPID 2>/dev/null; then echo "DIED"; break; fi
    sleep 1
done

if kill -0 $SPID 2>/dev/null; then
    export DISPLAY=:55
    echo "=== SETUP WIZARD NAVIGATION ==="

    # First unlock if locked
    xdotool key space; sleep 1
    xdotool key Return; sleep 1
    xdotool type --delay 150 "<REDACTED_PIN>"
    xdotool key Return; sleep 2

    # Now navigate setup wizard — spam Tab+Enter to skip all screens
    # Language > WiFi > Google > PIN > Done etc
    for screen in $(seq 1 20); do
        echo "Screen $screen"
        # Tab to the "Next"/"Skip"/"Continue" button
        xdotool key Tab; sleep 0.2
        xdotool key Tab; sleep 0.2
        xdotool key Tab; sleep 0.2
        xdotool key Tab; sleep 0.2
        xdotool key Tab; sleep 0.2
        # Press Enter/Space to confirm
        xdotool key Return; sleep 1
        # Also try Escape to dismiss dialogs
        xdotool key Escape; sleep 0.3
    done

    echo "=== 20 SCREENS NAVIGATED ==="

    # Try going Home
    xdotool key super; sleep 1
    xdotool key super; sleep 1

    echo "DONE"
    kill $SPID 2>/dev/null
fi

killall Xvfb openbox 2>/dev/null

