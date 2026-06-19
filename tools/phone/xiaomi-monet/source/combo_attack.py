"""
COMBO ATTACK — Zadig Install + Immediate AOA Keyboard
Shannon Pipeline Phase 3: The Two-Hit Combo

1. Click Install WCID Driver in Zadig
2. Wait for success
3. Immediately send AOA HID keyboard commands via pyusb
4. No replug. No reboot. The driver window is NOW.
"""
import sys; sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pyautogui, pygetwindow as gw, time
import usb.core

pyautogui.PAUSE = 0.1

# HID constants
AOA_GET_PROTOCOL = 51
AOA_SEND_STRING = 52
AOA_REGISTER_HID = 54
AOA_SET_HID_REPORT_DESC = 54
AOA_SEND_HID_EVENT = 56

HID_KEYBOARD_DESCRIPTOR = bytes([
    0x05, 0x01, 0x09, 0x06, 0xA1, 0x01,
    0x05, 0x07, 0x19, 0xE0, 0x29, 0xE7,
    0x15, 0x00, 0x25, 0x01, 0x75, 0x01,
    0x95, 0x08, 0x81, 0x02,
    0x95, 0x01, 0x75, 0x08, 0x81, 0x01,
    0x95, 0x06, 0x75, 0x08, 0x15, 0x00,
    0x25, 0x65, 0x05, 0x07, 0x19, 0x00,
    0x29, 0x65, 0x81, 0x00, 0xC0,
])

KEY = {
    '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21, '5': 0x22,
    '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
    'ENTER': 0x28, 'SPACE': 0x2C,
}

HID_ID = 1

print("=" * 50)
print("COMBO ATTACK — Zadig + AOA Keyboard")
print("=" * 50)

# ===== PHASE 1: Click Install in Zadig =====
print("\n[PHASE 1] Clicking Install WCID Driver...")
win = [w for w in gw.getAllWindows() if 'Zadig' in w.title]
if not win:
    print("[-] Zadig not open!")
    sys.exit(1)
win = win[0]
win.activate()
time.sleep(0.3)

WL, WT = win.left, win.top

# Click "Install WCID Driver" button
# From screenshot: button is centered, roughly at x+290, y+178
btn_x = WL + 290
btn_y = WT + 178
print(f"  Clicking Install at ({btn_x},{btn_y})")
pyautogui.click(btn_x, btn_y)

# ===== PHASE 2: Wait for installation =====
print("\n[PHASE 2] Waiting for driver installation...")
# Monitor for completion — check for "SUCCESS" in status bar
# or "Installing Driver..." dialog to appear and disappear
for i in range(60):  # up to 60 seconds
    time.sleep(1)
    img = pyautogui.screenshot(region=(WL, WT + win.height - 30, win.width, 30))
    img.save(f"C:/Users/rayss/xiaomi-recover/combo_status.png")
    # Also check for completion dialog
    all_wins = gw.getAllWindows()
    install_dialog = [w for w in all_wins if 'Installing' in w.title or 'Driver Install' in w.title]
    if i > 5 and not install_dialog:
        # Dialog gone — either success or never appeared
        break
    if i % 5 == 0:
        print(f"  Waiting... ({i}s)")

time.sleep(2)

# Screenshot final state
img = pyautogui.screenshot(region=(WL, WT, win.width, win.height))
img.save("C:/Users/rayss/xiaomi-recover/combo_zadig_result.png")
print("[PHASE 2] Zadig done. Check combo_zadig_result.png")

# Close any success/error dialog by pressing Enter
pyautogui.press('enter')
time.sleep(0.5)

# ===== PHASE 3: IMMEDIATELY try AOA =====
print("\n[PHASE 3] IMMEDIATE AOA attack — no replug!")

# Try to find the Xiaomi - it might now be under a different VID/PID if driver changed
# Or same VID/PID but now accessible
for attempt in range(5):
    print(f"\n  Attempt {attempt+1}/5...")
    dev = usb.core.find(idVendor=0x2717, idProduct=0xFF40)
    if not dev:
        # After driver change, device might re-enumerate
        # Also check for Google AOA VID (18D1)
        dev = usb.core.find(idVendor=0x18D1)
        if dev:
            print(f"  [!] Device re-enumerated as Google Accessory: {dev.idVendor:04x}:{dev.idProduct:04x}")

    if not dev:
        print(f"  [-] Device not found yet, waiting...")
        time.sleep(2)
        continue

    print(f"  [+] Device found: {dev.idVendor:04x}:{dev.idProduct:04x}")

    # Try AOA GET_PROTOCOL
    try:
        ver = dev.ctrl_transfer(0xC0, AOA_GET_PROTOCOL, 0, 0, 2)
        aoa_ver = ver[0] + (ver[1] << 8)
        print(f"  [+] AOA Protocol v{aoa_ver} — ACCESS GRANTED!")

        # Send identification strings
        strings = ["Asolaria", "Liris Keyboard", "Liris Colony Keyboard", "1.0", "", "liris-001"]
        for idx, s in enumerate(strings):
            dev.ctrl_transfer(0x40, AOA_SEND_STRING, 0, idx, s.encode() + b'\x00')
        print("  [+] Identification strings sent")

        # Register HID
        dev.ctrl_transfer(0x40, AOA_REGISTER_HID, HID_ID, len(HID_KEYBOARD_DESCRIPTOR))
        print("  [+] HID registered")

        # Send descriptor
        dev.ctrl_transfer(0x40, AOA_SET_HID_REPORT_DESC, HID_ID, 0, HID_KEYBOARD_DESCRIPTOR)
        print("  [+] HID descriptor sent")

        print("\n  [!!!] AOA HID KEYBOARD ACTIVE [!!!]")

        # Wake screen
        print("  Sending SPACE to wake...")
        report = bytes([0, 0, KEY['SPACE'], 0, 0, 0, 0, 0])
        dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, report)
        time.sleep(0.05)
        dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, bytes(8))
        time.sleep(1)

        # Another space
        dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, report)
        time.sleep(0.05)
        dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, bytes(8))
        time.sleep(1)

        print("\n  KEYBOARD READY. Waiting for PIN input from controller...")
        print("  (PIN will be sent by the orchestrator)")

        # Signal success
        with open("C:/Users/rayss/xiaomi-recover/combo_result.txt", "w") as f:
            f.write("SUCCESS\n")
            f.write(f"AOA_VERSION={aoa_ver}\n")
            f.write(f"DEVICE={dev.idVendor:04x}:{dev.idProduct:04x}\n")

        # Keep alive and wait
        print("\n  Type PIN digits (or 'q' to quit):")
        while True:
            try:
                c = input("  > ").strip()
            except EOFError:
                break
            if c == 'q':
                break
            for ch in c:
                if ch in KEY:
                    code = KEY[ch]
                    report = bytes([0, 0, code, 0, 0, 0, 0, 0])
                    dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, report)
                    time.sleep(0.05)
                    dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, bytes(8))
                    time.sleep(0.1)
                    print(f"    Sent: {ch}")
            if c.upper() == 'ENTER' or c == '':
                code = KEY['ENTER']
                report = bytes([0, 0, code, 0, 0, 0, 0, 0])
                dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, report)
                time.sleep(0.05)
                dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, bytes(8))
                print("    Sent: ENTER")

        sys.exit(0)

    except usb.core.USBError as e:
        print(f"  [-] AOA failed: {e}")
        time.sleep(2)
    except Exception as e:
        print(f"  [-] Error: {e}")
        time.sleep(2)

# If we get here, all attempts failed
print("\n[-] COMBO ATTACK FAILED — AOA could not access device after Zadig install")
with open("C:/Users/rayss/xiaomi-recover/combo_result.txt", "w") as f:
    f.write("FAILED\n")

