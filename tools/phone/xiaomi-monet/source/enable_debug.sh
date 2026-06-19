#!/bin/bash
# Navigate to Developer Options + Enable USB Debugging
# Uses 12-second scrcpy window
# Phone is UNLOCKED

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
    echo "tick $i"
    sleep 1
done

if kill -0 $SPID 2>/dev/null; then
    export DISPLAY=:55

    # Step 1: Unlock with PIN first
    xdotool key space; sleep 1
    xdotool key space; sleep 1
    xdotool key Return; sleep 1
    xdotool type --delay 150 "<REDACTED_PIN>"
    xdotool key Return; sleep 2
    echo "UNLOCKED"

    # Step 2: Go Home
    xdotool key super; sleep 1

    # Step 3: Pull down notification shade — send F5 or scroll
    # On MIUI with keyboard, try opening Settings directly
    # Android has no universal keyboard shortcut for Settings
    # But we can try: open recent apps and find settings
    # Or: press Home, then use MIUI's app search

    # Try: press Home, wait, then type to search
    xdotool key super; sleep 1

    # On MIUI home screen, swiping down opens search
    # With keyboard, typing should open search automatically
    xdotool type --delay 100 "configuracoes"
    sleep 1
    xdotool key Return; sleep 2
    echo "SETTINGS_SEARCH"

    # If settings opened: navigate to About Phone
    # Tab to scroll, look for "Sobre o telefone"
    for i in $(seq 1 15); do
        xdotool key Tab
        sleep 0.15
    done
    xdotool key Return; sleep 1
    echo "NAVIGATED"

    kill $SPID 2>/dev/null
fi

killall Xvfb openbox 2>/dev/null
echo "DONE"

