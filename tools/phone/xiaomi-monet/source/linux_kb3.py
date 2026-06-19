"""
LIRIS AOA KEYBOARD v3 — HID without accessory mode
AOA v2 allows HID registration without START_ACCESSORY.
Key: proper USB setup (set_configuration, claim interface)
"""
import usb.core, usb.util, time, sys

print("=== LIRIS AOA KEYBOARD v3 ===")

dev = usb.core.find(idVendor=0x2717, idProduct=0xff40)
if not dev:
    print("[-] Xiaomi not found"); sys.exit(1)
print(f"[+] Found: {dev.idVendor:04x}:{dev.idProduct:04x}")

# Detach ALL kernel drivers
for cfg in dev:
    for intf in cfg:
        try:
            if dev.is_kernel_driver_active(intf.bInterfaceNumber):
                dev.detach_kernel_driver(intf.bInterfaceNumber)
                print(f"[+] Detached driver from interface {intf.bInterfaceNumber}")
        except: pass

# Set USB configuration
try:
    dev.set_configuration()
    print("[+] USB configuration set")
except Exception as e:
    print(f"[*] Config: {e}")

# AOA version
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

# Register HID
print("[*] Registering HID...")
try:
    ret = dev.ctrl_transfer(0x40, 54, HID_ID, len(HID_DESC))
    print(f"[+] REGISTER_HID: OK (ret={ret})")
except Exception as e:
    print(f"[-] REGISTER_HID failed: {e}")
    sys.exit(1)

# Send HID descriptor
print("[*] Sending HID descriptor...")
try:
    ret = dev.ctrl_transfer(0x40, 56, HID_ID, 0, HID_DESC)
    print(f"[+] SET_HID_REPORT_DESC: OK (ret={ret})")
except Exception as e:
    print(f"[-] SET_HID_REPORT_DESC failed: {e}")
    sys.exit(1)

# Try sending a key
print("[*] Sending test key (SPACE)...")
KEY_SPACE = 0x2C
report = bytes([0, 0, KEY_SPACE, 0, 0, 0, 0, 0])
release = bytes(8)

try:
    dev.ctrl_transfer(0x40, 57, HID_ID, 0, report)
    time.sleep(0.05)
    dev.ctrl_transfer(0x40, 57, HID_ID, 0, release)
    print("[+] SEND_HID_EVENT: OK — KEY SENT!")
except usb.core.USBError as e:
    print(f"[-] SEND_HID_EVENT failed: {e}")
    print("[*] Trying alternative: send via endpoint instead of control...")
    # Some devices need bulk/interrupt endpoint for HID events
    # Check available endpoints
    cfg = dev.get_active_configuration()
    for intf in cfg:
        print(f"  Interface {intf.bInterfaceNumber}: class={intf.bInterfaceClass}")
        for ep in intf:
            print(f"    EP 0x{ep.bEndpointAddress:02x}: type={ep.bmAttributes} maxpacket={ep.wMaxPacketSize}")
    sys.exit(1)

print("\n=== KEYBOARD ACTIVE ===")
print("Type digits for PIN, empty line = ENTER, q = quit")

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
    time.sleep(0.1)

# Wake
send_key(KEY['SPACE']); time.sleep(1)
send_key(KEY['SPACE']); time.sleep(1)
print("[+] Screen wake sent")

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

