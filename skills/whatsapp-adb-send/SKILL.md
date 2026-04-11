# WhatsApp ADB Send — Agent-to-Agent Comms Skill

## What This Does
Sends a WhatsApp message from the phone using ADB. No browser needed. No server needed. Works even when Asolaria is down.

## Prerequisites
- Phone connected via USB
- ADB authorized (`adb devices` shows the device)
- WhatsApp open to the target chat on the phone

## Method

### 1. Find ADB
```bash
# Jesse's machine
ADB="C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

# Rayssa's machine — find it:
# where adb  OR  ls /c/Users/rayss/AppData/Local/Microsoft/WinGet/Packages/Google.PlatformTools*/platform-tools/adb.exe
```

### 2. Verify phone connected
```bash
"$ADB" devices
# Should show device ID with "device" status
```

### 3. Open WhatsApp to target chat
```bash
# Open WhatsApp directly (if not already open)
"$ADB" shell am start -n com.whatsapp/.Main
```

### 4. Type message
```bash
# Spaces must be %s in ADB input text
"$ADB" shell input text "YOUR%sMESSAGE%sHERE"
```

### 5. Screenshot to find send button position
```bash
"$ADB" exec-out screencap -p > screenshot.png
# Read the screenshot to find the green send arrow coordinates
```

### 6. Tap send button
```bash
# Coordinates vary by phone model/resolution
# Jesse Samsung Galaxy S24 FE: approximately (980, 2170)
# Take screenshot FIRST to verify position
"$ADB" shell input tap <X> <Y>
```

### 7. Heartbeat — wait for reply
```bash
# Wait, then screenshot again to read the response
sleep 10
"$ADB" exec-out screencap -p > reply.png
# Read the image to see what Liris/Rayssa said back
```

## The Heartbeat Loop
```bash
while true; do
  sleep 30
  "$ADB" exec-out screencap -p > check.png
  # Read check.png — if new message, process it
  # If reply needed, type and send
done
```

## Key Notes
- This works WITHOUT Asolaria server running
- This works WITHOUT Chrome/browser
- This is the FALLBACK comms channel when everything else is down
- Gaia uses Jesse's phone, Liris uses Rayssa's phone
- Both phones have WhatsApp with the Jesse/Rayssa chat
