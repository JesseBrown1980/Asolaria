#!/bin/bash
# Use 12-second scrcpy window to enable USB debugging
# Phone is UNLOCKED — keyboard works for navigation

killall Xvfb openbox scrcpy 2>/dev/null
sleep 1

Xvfb :55 -screen 0 640x480x24 -ac &
sleep 2
DISPLAY=:55 openbox &
sleep 1

cd /tmp/scrcpy-linux-x86_64-v3.3.4
DISPLAY=:55 ./scrcpy --otg -s 56c90d22 --mouse=disabled &
SPID=$!
sleep 8

if kill -0 $SPID 2>/dev/null; then
    export DISPLAY=:55
    echo "=== NAVIGATING TO SETTINGS ==="

    # Go to home screen
    xdotool key super
    sleep 1

    # Open Settings via search or shortcut
    # On MIUI: swipe down on home = search. With keyboard: just type
    # Or: use the app drawer key
    # Try: Home → type "config" or open notification shade

    # Method: Open quick settings / notification shade
    # Android keyboard shortcut for settings doesn't exist universally
    # But we can try: press Menu key or use keyboard shortcut

    # MIUI shortcut: hold Home = recent apps. Settings is in quick tiles.
    # Better: press Home, then Tab through to Settings app icon

    # Simplest: use Android's hidden keyboard shortcut
    # Meta+N = notifications (some Android versions)
    # Or just navigate with Tab + Enter

    xdotool key super
    sleep 1

    # Type "settings" in MIUI search (appears when swiping down on home)
    # With keyboard on home screen, typing opens the search
    xdotool type --delay 100 "settings"
    sleep 1
    xdotool key Return
    sleep 2

    echo "=== IN SETTINGS (hopefully) ==="

    # Navigate: About Phone is usually at bottom
    # Tab down many times then Enter
    for i in $(seq 1 30); do
        xdotool key Tab
        sleep 0.1
    done
    xdotool key Return
    sleep 1

    echo "=== TAPPING MIUI VERSION 7 TIMES ==="
    # In About Phone, MIUI version needs 7 taps
    for i in $(seq 1 7); do
        xdotool key Return
        sleep 0.3
    done
    sleep 1

    echo "DEVELOPER_MODE_ATTEMPT_DONE"
    kill $SPID 2>/dev/null
else
    echo "SCRCPY_DEAD"
fi

killall Xvfb openbox 2>/dev/null
echo "DONE"

