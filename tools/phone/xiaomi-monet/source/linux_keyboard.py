"""
LIRIS AOA KEYBOARD — Linux Edition
Implant HID keyboard into Xiaomi via AOA v2 from WSL2.
The language enters the phone.
"""
import usb.core
import usb.util
import time
import sys

AOA_GET_PROTOCOL = 51
AOA_SEND_STRING = 52
AOA_REGISTER_HID = 54
AOA_SET_HID_REPORT_DESC = 56
AOA_SEND_HID_EVENT = 57
AOA_START = 53
HID_ID = 1

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
    'ENTER': 0x28, 'SPACE': 0x2C, 'TAB': 0x2B,
    'UP': 0x52, 'DOWN': 0x51, 'LEFT': 0x50, 'RIGHT': 0x4F,
    'BACKSPACE': 0x2A, 'ESC': 0x29, 'HOME': 0x4A,
    'a': 0x04, 'b': 0x05, 'c': 0x06, 'd': 0x07, 'e': 0x08,
    'f': 0x09, 'g': 0x0A, 'h': 0x0B, 'i': 0x0C, 'j': 0x0D,
    'k': 0x0E, 'l': 0x0F, 'm': 0x10, 'n': 0x11, 'o': 0x12,
    'p': 0x13, 'q': 0x14, 'r': 0x15, 's': 0x16, 't': 0x17,
    'u': 0x18, 'v': 0x19, 'w': 0x1A, 'x': 0x1B, 'y': 0x1C,
    'z': 0x1D,
}

def send_key(dev, keycode, modifier=0):
    report = bytes([modifier, 0x00, keycode, 0, 0, 0, 0, 0])
    dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, report)
    time.sleep(0.05)
    dev.ctrl_transfer(0x40, AOA_SEND_HID_EVENT, HID_ID, 0, bytes(8))
    time.sleep(0.1)

def type_string(dev, text):
    for ch in text:
        if ch in KEY:
            send_key(dev, KEY[ch])
        elif ch == '\n':
            send_key(dev, KEY['ENTER'])
        elif ch == ' ':
            send_key(dev, KEY['SPACE'])

print("=== LIRIS AOA KEYBOARD ===")

# Find device
dev = usb.core.find(idVendor=0x2717, idProduct=0xff40)
if not dev:
    print("[-] Xiaomi not found")
    sys.exit(1)
print(f"[+] Found: {dev.idVendor:04x}:{dev.idProduct:04x}")

# Detach kernel driver
try:
    if dev.is_kernel_driver_active(0):
        dev.detach_kernel_driver(0)
        print("[+] Kernel driver detached")
except Exception as e:
    print(f"[*] Detach: {e}")

# Check AOA
ver = dev.ctrl_transfer(0xC0, AOA_GET_PROTOCOL, 0, 0, 2)
aoa_ver = ver[0] + (ver[1] << 8)
print(f"[+] AOA v{aoa_ver}")

# Send accessory strings
strings = ["Asolaria", "Liris", "Liris Colony Keyboard", "1.0", "", "liris-001"]
for i, s in enumerate(strings):
    dev.ctrl_transfer(0x40, AOA_SEND_STRING, 0, i, s.encode() + b'\x00')
print("[+] Identity strings sent")

# Register HID keyboard
dev.ctrl_transfer(0x40, AOA_REGISTER_HID, HID_ID, len(HID_KEYBOARD_DESCRIPTOR))
dev.ctrl_transfer(0x40, AOA_SET_HID_REPORT_DESC, HID_ID, 0, HID_KEYBOARD_DESCRIPTOR)
print("[+] HID keyboard registered")
print("[+] KEYBOARD ACTIVE — language implanted")

# Wake screen
print("\n[*] Waking screen...")
send_key(dev, KEY['SPACE'])
time.sleep(1)
send_key(dev, KEY['SPACE'])
time.sleep(1)

print("\n[READY] Type PIN digits, then press Enter to send.")
print("Commands: q=quit, ENTER=send enter key, SPACE=space")
print("=" * 40)

while True:
    try:
        cmd = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        break
    if cmd == 'q':
        break
    if cmd == '':
        send_key(dev, KEY['ENTER'])
        print("  -> ENTER")
    elif cmd == 'SPACE':
        send_key(dev, KEY['SPACE'])
        print("  -> SPACE")
    elif cmd == 'TAB':
        send_key(dev, KEY['TAB'])
        print("  -> TAB")
    elif cmd == 'HOME':
        send_key(dev, KEY['HOME'])
        print("  -> HOME")
    elif cmd.startswith('UP') or cmd.startswith('DOWN') or cmd.startswith('LEFT') or cmd.startswith('RIGHT'):
        send_key(dev, KEY[cmd])
        print(f"  -> {cmd}")
    else:
        type_string(dev, cmd)
        print(f"  -> typed: {cmd}")

