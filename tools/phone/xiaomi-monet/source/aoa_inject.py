import sys,ctypes
from ctypes import wintypes
sys.stdout.reconfigure(encoding='utf-8',errors='replace')

k=ctypes.WinDLL('kernel32',use_last_error=True)
w=ctypes.WinDLL('winusb',use_last_error=True)

p=r"\\?\USB#VID_2717&PID_FF40#56c90d22#{f72fe0d4-cbcb-407d-8814-9ed673d0dd6b}"
print("Path:",p)

h=k.CreateFileW(p,0xC0000000,3,None,3,0x40000000,None)
e=ctypes.get_last_error()
print(f"Handle:{h} Err:{e}")

if h not in (-1, 4294967295):
    print("GOT HANDLE!")
    uh=ctypes.c_void_p()
    ok=w.WinUsb_Initialize(ctypes.c_void_p(h),ctypes.byref(uh))
    print(f"WinUsb_Init:{ok} err={ctypes.get_last_error()}")
    if ok:
        print("*** WINUSB LIVE ***")
        class S(ctypes.Structure):
            _fields_=[('a',ctypes.c_ubyte),('b',ctypes.c_ubyte),
                     ('c',ctypes.c_ushort),('d',ctypes.c_ushort),('e',ctypes.c_ushort)]
        buf=(ctypes.c_ubyte*2)()
        t=wintypes.DWORD()
        ok2=w.WinUsb_ControlTransfer(uh,S(0xC0,51,0,0,2),buf,2,ctypes.byref(t),None)
        if ok2:
            v=buf[0]|(buf[1]<<8)
            print(f"AOA VERSION = {v}")
            if v>0:
                print("AOA SUPPORTED! Sending strings...")
                for i,s in [(0,b"Asolaria\0"),(1,b"Liris Recovery\0"),
                            (2,b"Screenless Xiaomi\0"),(3,b"1.0\0"),(5,b"liris-001\0")]:
                    a=(ctypes.c_ubyte*len(s))(*s)
                    w.WinUsb_ControlTransfer(uh,S(0x40,52,0,i,len(s)),a,len(s),ctypes.byref(t),None)
                    print(f"  String[{i}] sent")
                print("SENDING AOA START!")
                ok3=w.WinUsb_ControlTransfer(uh,S(0x40,53,0,0,0),None,0,ctypes.byref(t),None)
                print(f"AOA START = {'SUCCESS' if ok3 else 'FAILED'} err={ctypes.get_last_error()}")
                if ok3:
                    print()
                    print("!!! THE PORTAL IS OPEN !!!")
                    print("!!! XIAOMI RE-ENUMERATING AS ACCESSORY !!!")
            else:
                print("AOA version 0 - device does not support AOA")
        else:
            print(f"AOA query failed: err={ctypes.get_last_error()}")
        w.WinUsb_Free(uh)
    k.CloseHandle(ctypes.c_void_p(h))
else:
    errors = {5:"ACCESS DENIED",32:"SHARING VIOLATION",2:"NOT FOUND",31:"NOT FUNCTIONING"}
    print(errors.get(e, f"Error {e}"))

