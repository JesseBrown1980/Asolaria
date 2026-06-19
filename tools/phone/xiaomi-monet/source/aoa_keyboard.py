"""
AOA (Android Open Accessory) Keyboard — Direct USB attack
Shannon Pipeline Phase 2: Exploit

Sends AOA protocol commands via pyusb to turn the Xiaomi into
an accessory device, then sends HID keyboard events to type PIN.

No ADB. No scrcpy. No driver swap. Direct USB control transfers.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import usb.core
import usb.util
import time
import struct

# AOA Protocol constants
AOA_GET_PROTOCOL    = 51
AOA_SEND_STRING     = 52
AOA_START_ACCESSORY = 53
AOA_SET_HID_REPORT_DESC = 54
AOA_SEND_HID_EVENT  = 56
AOA_REGISTER_HID    = 54
AOA_UNREGISTER_HID  = 55

# Accessory strings
MANUFACTURER = "Asolaria"
MODEL = "Liris Keyboard"
DESCRIPTION = "Liris Colony USB Keyboard"
VERSION = "1.0"
URI = ""
SERIAL = "liris-001"

# HID Keyboard Report Descriptor (8 bytes: modifier, reserved, key1-key6)
HID_KEYBOARD_DESCRIPTOR = bytes([
    0x05, 0x01,  # Usage Page (Generic Desktop)
    0x09, 0x06,  # Usage (Keyboard)
    0xA1, 0x01,  # Collection (Application)
    0x05, 0x07,  #   Usage Page (Key Codes)
    0x19, 0xE0,  #   Usage Minimum (224) - Left Control
    0x29, 0xE7,  #   Usage Maximum (231) - Right GUI
    0x15, 0x00,  #   Logical Minimum (0)
    0x25, 0x01,  #   Logical Maximum (1)
    0x75, 0x01,  #   Report Size (1)
    0x95, 0x08,  #   Report Count (8)
    0x81, 0x02,  #   Input (Data, Variable, Absolute) - Modifier byte
    0x95, 0x01,  #   Report Count (1)
    0x75, 0x08,  #   Report Size (8)
    0x81, 0x01,  #   Input (Constant) - Reserved byte
    0x95, 0x06,  #   Report Count (6)
    0x75, 0x08,  #   Report Size (8)
    0x15, 0x00,  #   Logical Minimum (0)
    0x25, 0x65,  #   Logical Maximum (101)
    0x05, 0x07,  #   Usage Page (Key Codes)
    0x19, 0x00,  #   Usage Minimum (0)
    0x29, 0x65,  #   Usage Maximum (101)
    0x81, 0x00,  #   Input (Data, Array) - Key array
    0xC0,        # End Collection
])

# HID key codes for digits 0-9
# 1-9 = 0x1E-0x26, 0 = 0x27
KEY_CODES = {
    '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21, '5': 0x22,
    '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
    'ENTER': 0x28, 'SPACE': 0x2C, 'TAB': 0x2B,
    'UP': 0x52, 'DOWN': 0x51, 'LEFT': 0x50, 'RIGHT': 0x4F,
    'BACKSPACE': 0x2A, 'ESCAPE': 0x29,
}

HID_ID = 1  # HID device ID for AOA


def find_xiaomi():
    """Find the Xiaomi device"""
    dev = usb.core.find(idVendor=0x2717, idProduct=0xFF40)
    if dev:
        print(f"[+] Xiaomi found: {dev.idVendor:04x}:{dev.idProduct:04x}")
        try:
            print(f"    Manufacturer: {dev.manufacturer}")
            print(f"    Product: {dev.product}")
        except Exception:
            print(f"    (string descriptors blocked by MTP — expected)")
        return dev
    print("[-] Xiaomi not found!")
    return None


def check_aoa_support(dev):
    """Check if device supports AOA protocol"""
    try:
        # GET_PROTOCOL: bmRequestType=0xC0 (device-to-host, vendor, device)
        version = dev.ctrl_transfer(0xC0, AOA_GET_PROTOCOL, 0, 0, 2)
        ver = version[0] + (version[1] << 8)
        print(f"[+] AOA Protocol version: {ver}")
        return ver
    except Exception as e:
        print(f"[-] AOA GET_PROTOCOL failed: {e}")
        return 0


def send_aoa_string(dev, index, string):
    """Send an accessory identification string"""
    try:
        dev.ctrl_transfer(0x40, AOA_SEND_STRING, 0, index, string.encode() + b'\x00')
        print(f"[+] Sent string[{index}]: {string}")
        return True
    except Exception as e:
        print(f"[-] Failed to send string[{index}]: {e}")
        return False


def start_accessory_mode(dev):
    """Switch device to accessory mode (HID)"""
    # Send identification strings
    strings = [MANUFACTURER, MODEL, DESCRIPTION, VERSION, URI, SERIAL]
    for i, s in enumerate(strings):
        if not send_aoa_string(dev, i, s):
            return False

    # Register HID device
    try:
        dev.ctrl_transfer(0x40, AOA_REGISTER_HID, HID_ID, len(HID_KEYBOARD_DESCRIPTOR))
        print(f"[+] HID registered (id={HID_ID}, desc_len={len(HID_KEYBOARD_DESCRIPTOR)})")
    except Exception as e:
        print(f"[-] HID register failed: {e}")
        return False

    # Send HID descriptor
    try:
        dev.ctrl_transfer(0x40, AOA_SET_HID_REPORT_DESC, HID_ID, 0, HID_KEYBOARD_DESCRIPTOR)
        print(f"[+] HID descriptor sent")
    except Exception as e:
        print(f"[-] HID descriptor failed: {e}")
        return False

    print("[+] AOA HID Keyboard mode active!")
    return True


def send_key(dev, keycode, modifier=0):
    """Send a single keypress (press + release)"""
    # Key press: [modifier, 0x00, keycode, 0, 0, 0, 0, 0]
    report = bytes([modifier, 0x00, keycode, 0, 0, 0, 0, 0])
    try:
        dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, report)
        time.sleep(0.05)
        # Key release: all zeros
        dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, bytes(8))
        time.sleep(0.1)
        return True
    except Exception as e:
        print(f"[-] Key send failed: {e}")
        return False


def type_string(dev, text):
    """Type a string of digits"""
    for char in text:
        if char in KEY_CODES:
            code = KEY_CODES[char]
            print(f"  Typing: {char} (0x{code:02x})")
            send_key(dev, code)
        else:
            print(f"  Skipping unknown char: {char}")


def main():
    print("=" * 50)
    print("ASOLARIA — Liris AOA Keyboard")
    print("Shannon Pipeline Phase 2: Exploit")
    print("=" * 50)

    # Phase 1: Find device
    print("\n[PHASE 1] Finding Xiaomi...")
    dev = find_xiaomi()
    if not dev:
        sys.exit(1)

    # Phase 2: Check AOA
    print("\n[PHASE 2] Checking AOA support...")
    aoa_ver = check_aoa_support(dev)
    if aoa_ver < 2:
        print(f"[!] AOA v{aoa_ver} — need v2+ for HID. Trying anyway...")

    # Phase 3: Start HID keyboard
    print("\n[PHASE 3] Activating AOA HID Keyboard...")
    if not start_accessory_mode(dev):
        print("[-] FAILED to activate AOA keyboard")
        sys.exit(1)

    # Phase 4: Wake screen + type PIN
    print("\n[PHASE 4] Sending keystrokes...")
    print("  Waking screen...")
    send_key(dev, KEY_CODES['SPACE'])
    time.sleep(1)
    send_key(dev, KEY_CODES['SPACE'])
    time.sleep(1)

    # Ask for PIN
    pin = input("\n[?] Enter the Xiaomi PIN to type: ").strip()
    if pin:
        print(f"  Typing PIN ({len(pin)} digits)...")
        type_string(dev, pin)
        time.sleep(0.3)
        print("  Pressing ENTER...")
        send_key(dev, KEY_CODES['ENTER'])
        print("[+] PIN sent!")

    print("\n[DONE] Keyboard active. You can now type more commands.")
    print("Type 'q' to quit, or enter keys to send:")
    while True:
        cmd = input("> ").strip()
        if cmd.lower() == 'q':
            break
        elif cmd.upper() in KEY_CODES:
            send_key(dev, KEY_CODES[cmd.upper()])
        else:
            type_string(dev, cmd)


if __name__ == "__main__":
    main()

