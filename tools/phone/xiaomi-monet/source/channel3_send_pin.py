"""CHANNEL 3: Find accessory device + send PIN"""
import usb.core, usb.util, time, sys

# Find device — try accessory VID first, then Xiaomi
dev = usb.core.find(idVendor=0x18D1)
if not dev:
    dev = usb.core.find(idVendor=0x2717, idProduct=0xff40)
if not dev:
    print("NO_DEVICE"); sys.exit(1)

print(f"FOUND:{dev.idVendor:04x}:{dev.idProduct:04x}")

for cfg in dev:
    for intf in cfg:
        try:
            if dev.is_kernel_driver_active(intf.bInterfaceNumber):
                dev.detach_kernel_driver(intf.bInterfaceNumber)
        except: pass

try:
    dev.set_configuration()
except: pass

KEY = {
    '0': 0x27, '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21,
    '5': 0x22, '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26,
    'ENTER': 0x28, 'SPACE': 0x2C, 'BACK': 0x2A,
}

def send_key(code):
    r = bytes([0, 0, code, 0, 0, 0, 0, 0])
    dev.ctrl_transfer(0x40, 57, 1, 0, r)
    time.sleep(0.05)
    dev.ctrl_transfer(0x40, 57, 1, 0, bytes(8))
    time.sleep(0.15)

# Attempt 1: wake + PIN
print("WAKE")
send_key(KEY['SPACE']); time.sleep(1)
send_key(KEY['SPACE']); time.sleep(1)
send_key(KEY['ENTER']); time.sleep(1)

# Clear any partial input
for _ in range(12): send_key(KEY['BACK'])
time.sleep(0.3)

# Type PIN
print("PIN:<REDACTED_PIN_LONG>")
for d in "<REDACTED_PIN_LONG>":
    send_key(KEY[d])
time.sleep(0.3)

send_key(KEY['ENTER'])
print("ENTER_SENT")
time.sleep(2)

# Attempt 2: in case first didn't land
print("RETRY")
send_key(KEY['SPACE']); time.sleep(1)
send_key(KEY['ENTER']); time.sleep(1)
for _ in range(12): send_key(KEY['BACK'])
time.sleep(0.3)
for d in "<REDACTED_PIN_LONG>":
    send_key(KEY[d])
time.sleep(0.3)
send_key(KEY['ENTER'])
print("DONE")

