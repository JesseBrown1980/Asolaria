#!/bin/bash
# OMNICHANNEL ATTACK — All vectors, all channels, one blast
# Channel 1: scrcpy --otg (USB keyboard via AOA)
# Channel 2: MTP file check (unlock verification)
# Channel 3: ADB probe (post-unlock)
# Channel 4: WiFi ADB probe (192.168.15.37:5555)

USBIPD="/c/Program Files/usbipd-win/usbipd.exe"

echo "╔══════════════════════════════════════╗"
echo "║  OMNICHANNEL — XIAOMI RESURRECTION   ║"
echo "╚══════════════════════════════════════╝"

# === PHASE A: USB → Linux → scrcpy → PIN ===
echo ""
echo "▶ PHASE A: USB KEYBOARD CHANNEL"
"$USBIPD" attach --wsl --busid 1-3 2>&1 | grep -v "^$"
sleep 4

# Start scrcpy and send PIN via xdotool, all inside WSL
wsl -d Ubuntu -- bash -c '
export DISPLAY=:0
scrcpy --otg -s 56c90d22 &
PID=$!
sleep 7

# Send PIN 3 times with different strategies
for attempt in 1 2 3; do
    # Use xdotool to send to focused window
    xdotool key space 2>/dev/null; sleep 0.8
    xdotool key space 2>/dev/null; sleep 0.8
    xdotool key Return 2>/dev/null; sleep 0.8
    
    # Clear
    for i in $(seq 1 12); do xdotool key BackSpace 2>/dev/null; done
    sleep 0.3
    
    # PIN
    xdotool type --delay 150 "<REDACTED_PIN_LONG>" 2>/dev/null
    sleep 0.4
    xdotool key Return 2>/dev/null
    sleep 2
done

kill $PID 2>/dev/null
echo "KEYBOARD_DONE"
' 2>&1

echo ""
echo "▶ PHASE B: DETACH → VERIFY"
# Give phone time to process
sleep 2
"$USBIPD" detach --busid 1-3 2>&1
sleep 5

# === PHASE B: Check all channels from Windows ===

# Channel 2: MTP
echo ""
echo "▶ CHANNEL 2: MTP FILE ACCESS"
powershell -ExecutionPolicy Bypass -Command '
$shell = New-Object -ComObject Shell.Application
$mypc = $shell.NameSpace(17)
$found = $false
foreach ($item in $mypc.Items()) {
    if ($item.Name -like "*Mi*") {
        Write-Host "MTP_DEVICE: $($item.Name)"
        $sub = $item.GetFolder
        if ($sub) {
            $count = 0
            foreach ($child in $sub.Items()) {
                Write-Host "MTP_STORAGE: $($child.Name)"
                $count++
            }
            if ($count -gt 0) { Write-Host "MTP_UNLOCKED=YES"; $found=$true }
            else { Write-Host "MTP_UNLOCKED=NO_STORAGE" }
        } else { Write-Host "MTP_UNLOCKED=NO_ACCESS" }
    }
}
if (-not $found) { Write-Host "MTP_UNLOCKED=NOT_FOUND" }
' 2>&1 | grep -v "Qt:\|log4cplus"

# Channel 3: ADB
echo ""
echo "▶ CHANNEL 3: ADB PROBE"
adb kill-server 2>/dev/null
adb devices -l 2>&1 | grep -v "daemon\|List"

# Channel 4: WiFi ADB
echo ""
echo "▶ CHANNEL 4: WIFI ADB (192.168.15.37:5555)"
timeout 2 bash -c 'echo > /dev/tcp/192.168.15.37/5555' 2>/dev/null && echo "WIFI_ADB=OPEN" || echo "WIFI_ADB=CLOSED"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         OMNICHANNEL COMPLETE         ║"
echo "╚══════════════════════════════════════╝"


