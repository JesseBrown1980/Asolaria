"""
LIRIS AOA KEYBOARD v4 — Full accessory mode in Linux
Register HID → START_ACCESSORY → find new device → send keys
"""
import usb.core, usb.util, time, sys

print("=== LIRIS AOA KEYBOARD v4 ===")

dev = usb.core.find(idVendor=0x2717, idProduct=0xff40)
if not dev:
    # Maybe already in accessory mode
    dev = usb.core.find(idVendor=0x18D1)
    if dev:
        print(f"[+] Already in accessory mode: {dev.idVendor:04x}:{dev.idProduct:04x}")
    else:
        print("[-] No device found"); sys.exit(1)
else:
    print(f"[+] Xiaomi found: {dev.idVendor:04x}:{dev.idProduct:04x}")

    # Detach kernel drivers
    for cfg in dev:
        for intf in cfg:
            try:
                if dev.is_kernel_driver_active(intf.bInterfaceNumber):
                    dev.detach_kernel_driver(intf.bInterfaceNumber)
            except: pass

    dev.set_configuration()

    # AOA check
    ver = dev.ctrl_transfer(0xC0, 51, 0, 0, 2)
    aoa_ver = ver[0] + (ver[1] << 8)
    print(f"[+] AOA v{aoa_ver}")

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

    # Register HID BEFORE accessory mode
    dev.ctrl_transfer(0x40, 54, HID_ID, len(HID_DESC))
    print("[+] HID registered")
    dev.ctrl_transfer(0x40, 56, HID_ID, 0, HID_DESC)
    print("[+] HID descriptor sent")

    # Send identity strings
    for i, s in enumerate(["Asolaria", "Liris", "Keyboard", "1.0", "", "liris"]):
        dev.ctrl_transfer(0x40, 52, 0, i, s.encode() + b'\x00')
    print("[+] Identity strings sent")

    # START ACCESSORY
    print("[*] Starting accessory mode...")
    dev.ctrl_transfer(0x40, 53, 0, 0)
    print("[+] Sent START_ACCESSORY — waiting for re-enumeration in Linux...")

    # Wait for new device (18D1:2D00 or 18D1:2D01)
    time.sleep(2)
    dev = None
    for attempt in range(15):
        dev = usb.core.find(idVendor=0x18D1)
        if dev:
            print(f"[+] Accessory device: {dev.idVendor:04x}:{dev.idProduct:04x}")
            break
        time.sleep(1)
        print(f"  [{attempt+1}/15] waiting...")

    if not dev:
        print("[-] Accessory device not found")
        sys.exit(1)

# Setup accessory device
for cfg in dev:
    for intf in cfg:
        try:
            if dev.is_kernel_driver_active(intf.bInterfaceNumber):
                dev.detach_kernel_driver(intf.bInterfaceNumber)
                print(f"[+] Detached driver from intf {intf.bInterfaceNumber}")
        except: pass

try:
    dev.set_configuration()
except: pass

# Show device info
cfg = dev.get_active_configuration()
print(f"[*] Config: {cfg.bNumInterfaces} interfaces")
for intf in cfg:
    print(f"  Intf {intf.bInterfaceNumber}: class={intf.bInterfaceClass} subclass={intf.bInterfaceSubClass}")
    for ep in intf:
        print(f"    EP 0x{ep.bEndpointAddress:02x} type={ep.bmAttributes} maxpkt={ep.wMaxPacketSize}")

# Now try HID events
HID_ID = 1
KEY = {
    '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21, '5': 0x22,
    '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
    'ENTER': 0x28, 'SPACE': 0x2C,
}

def send_key(keycode):
    r = bytes([0, 0, keycode, 0, 0, 0, 0, 0])
    dev.ctrl_transfer(0x40, 57, HID_ID, 0, r)
    time.sleep(0.05)
    dev.ctrl_transfer(0x40, 57, HID_ID, 0, bytes(8))
    time.sleep(0.12)

print("\n[*] Testing SPACE key...")
try:
    send_key(KEY['SPACE'])
    print("[+] SEND_HID_EVENT: SUCCESS!")
    print("[+] === KEYBOARD ACTIVE === ")
except Exception as e:
    print(f"[-] SEND_HID_EVENT failed: {e}")
    sys.exit(1)

time.sleep(1)
send_key(KEY['SPACE'])
print("[+] Screen wake sent x2")

print("\nType PIN digits. Empty line = ENTER. 'q' = quit.")
while True:
    try:
        cmd = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        break
    if cmd == 'q': break
    if cmd == '':
        send_key(KEY['ENTER']); print("  ENTER")
    else:
        for ch in cmd:
            if ch in KEY:
                send_key(KEY[ch]); print(f"  {ch}", end='', flush=True)
        print()

