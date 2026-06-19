"""
LIRIS AOA KEYBOARD v2 — With accessory mode start
"""
import usb.core, usb.util, time, sys

print("=== LIRIS AOA KEYBOARD v2 ===")

# Find Xiaomi
dev = usb.core.find(idVendor=0x2717, idProduct=0xff40)
if not dev:
    print("[-] Xiaomi not found")
    sys.exit(1)
print(f"[+] Found: {dev.idVendor:04x}:{dev.idProduct:04x}")

# Detach kernel driver
for i in range(dev.get_active_configuration().bNumInterfaces):
    try:
        if dev.is_kernel_driver_active(i):
            dev.detach_kernel_driver(i)
            print(f"[+] Detached kernel driver from interface {i}")
    except: pass

# AOA protocol check
ver = dev.ctrl_transfer(0xC0, 51, 0, 0, 2)
aoa_ver = ver[0] + (ver[1] << 8)
print(f"[+] AOA v{aoa_ver}")

if aoa_ver < 2:
    print("[-] Need AOA v2 for HID")
    sys.exit(1)

# HID descriptor
HID_DESC = bytes([
    0x05, 0x01, 0x09, 0x06, 0xA1, 0x01,
    0x05, 0x07, 0x19, 0xE0, 0x29, 0xE7,
    0x15, 0x00, 0x25, 0x01, 0x75, 0x01,
    0x95, 0x08, 0x81, 0x02,
    0x95, 0x01, 0x75, 0x08, 0x81, 0x01,
    0x95, 0x06, 0x75, 0x08, 0x15, 0x00,
    0x25, 0x65, 0x05, 0x07, 0x19, 0x00,
    0x29, 0x65, 0x81, 0x00, 0xC0,
])

HID_ID = 1

# Register HID BEFORE starting accessory mode
print("[*] Registering HID keyboard...")
dev.ctrl_transfer(0x40, 54, HID_ID, len(HID_DESC))  # REGISTER_HID
print("[+] HID registered")

dev.ctrl_transfer(0x40, 56, HID_ID, 0, HID_DESC)    # SET_HID_REPORT_DESC
print("[+] HID descriptor sent")

# Send accessory strings
strings = ["Asolaria", "Liris", "Keyboard", "1.0", "", "liris"]
for i, s in enumerate(strings):
    dev.ctrl_transfer(0x40, 52, 0, i, s.encode() + b'\x00')
print("[+] Identity strings sent")

# START ACCESSORY — device will re-enumerate
print("[*] Starting accessory mode...")
dev.ctrl_transfer(0x40, 53, 0, 0)
print("[+] Accessory mode started — device re-enumerating...")

# Wait for re-enumeration
time.sleep(3)

# Find the re-enumerated device (Google VID 18D1)
dev2 = None
for attempt in range(10):
    dev2 = usb.core.find(idVendor=0x18D1)
    if dev2:
        print(f"[+] Accessory device found: {dev2.idVendor:04x}:{dev2.idProduct:04x}")
        break
    # Also check if Xiaomi re-appeared with same VID
    dev2 = usb.core.find(idVendor=0x2717, idProduct=0xff40)
    if dev2:
        print(f"[+] Device back as Xiaomi: {dev2.idVendor:04x}:{dev2.idProduct:04x}")
        break
    print(f"  [{attempt+1}/10] Waiting for device...")
    time.sleep(1)

if not dev2:
    print("[-] Device not found after accessory mode start")
    sys.exit(1)

# Detach kernel driver on new device
for i in range(dev2.get_active_configuration().bNumInterfaces if dev2.get_active_configuration() else 1):
    try:
        if dev2.is_kernel_driver_active(i):
            dev2.detach_kernel_driver(i)
    except: pass

# Send HID events
KEY = {
    '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21, '5': 0x22,
    '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
    'ENTER': 0x28, 'SPACE': 0x2C, 'TAB': 0x2B,
}

def send_key(d, keycode, modifier=0):
    report = bytes([modifier, 0x00, keycode, 0, 0, 0, 0, 0])
    d.ctrl_transfer(0x40, 57, HID_ID, 0, report)  # SEND_HID_EVENT
    time.sleep(0.05)
    d.ctrl_transfer(0x40, 57, HID_ID, 0, bytes(8))
    time.sleep(0.1)

print("\n[+] KEYBOARD ACTIVE")

# Wake screen
print("[*] Waking screen...")
send_key(dev2, KEY['SPACE'])
time.sleep(1)
send_key(dev2, KEY['SPACE'])
time.sleep(1)
print("[+] Screen wake sent")

# Interactive
print("\nType PIN, then empty line = ENTER. 'q' = quit.")
while True:
    try:
        cmd = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        break
    if cmd == 'q':
        break
    if cmd == '':
        send_key(dev2, KEY['ENTER'])
        print("  ENTER")
    else:
        for ch in cmd:
            if ch in KEY:
                send_key(dev2, KEY[ch])
                print(f"  {ch}", end='', flush=True)
        print()

