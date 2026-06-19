#!/usr/bin/env python3
"""
SHANNON RECOVERY PIPELINE — White Room Engineering
====================================================
Colony: Liris / Asolaria
Target: Xiaomi Mi 10 Lite 5G (monet), SD765G, screenless
Method: Shannon 5-phase reverse engineering pipeline
        with 6-body-system diagnostic framework

Open Vectors from Recon:
  V6: ADB key READY (QAAAA...)
  V7: Samsung ADB driver .inf EXISTS on system (5 instances)
  USB: WinUSB in driver stack (raw control transfers possible)
  WiFi: Device at 192.168.15.37 (MAC B8:BB:AF Xiaomi confirmed)
  Samsung: R9QY205KAKJ with full ADB — RELAY ASSET

Shannon Pipeline:
  Phase 1 — WinUSB Native AOA Injection (bypass MTP, send vendor requests)
  Phase 2 — WPD COM Deep Access (fix registration, enumerate storage)
  Phase 3 — Samsung Relay Bridge (use Samsung as proxy to reach Xiaomi)
  Phase 4 — Bluetooth Input Injection (pair + send keystrokes blindly)
  Phase 5 — Unified Report + Next Action

Colony Anatomy:
  Nervous:     Pipeline orchestration, phase transitions
  Circulatory: USB/WiFi/BT data channels
  Skeletal:    Device descriptor tree, driver infrastructure
  Memory:      ADB keys, driver cache, report persistence
  Muscular:    AOA transfers, mode switching, relay commands
  Immune:      Safe rollback on each phase, no destructive ops

Chain: LX-290, LX-259, LX-210, IX-331, IX-332, IX-311
"""

import sys
import os
import json
import time
import ctypes
import ctypes.wintypes
import subprocess
import struct
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.abspath(__file__))

# ─── Constants ───
XIAOMI_VID = 0x2717
XIAOMI_PID_MTP = 0xFF40
XIAOMI_SERIAL = "56C90D22"
GOOGLE_VID = 0x18D1
AOA_PIDS = [0x2D00, 0x2D01, 0x2D02, 0x2D03, 0x2D04, 0x2D05]
SAMSUNG_SERIAL = "R9QY205KAKJ"

# AOA Protocol
AOA_GET_PROTOCOL = 51
AOA_SET_STRING = 52
AOA_START = 53

# WinUSB/SetupAPI GUIDs
GUID_DEVINTERFACE_USB_DEVICE = "{A5DCBF10-6530-11D2-901F-00C04FB951ED}"
WINUSB_SETUP_PACKET_SIZE = 8


def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    sym = {"INFO": "  ", "OK": " +", "WARN": " !", "FAIL": " X",
           "PHASE": ">>", "HIT": "**", "CMD": " $"}
    print(f"  {sym.get(level, '  ')} [{ts}] {msg}")


def ps(script, timeout=60):
    """Run PowerShell script."""
    try:
        r = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True, text=True, timeout=timeout, encoding='utf-8', errors='replace'
        )
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT", 1


def adb(*args, serial=None):
    """Run ADB command."""
    cmd = ["adb"]
    if serial:
        cmd += ["-s", serial]
    cmd += list(args)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30,
                          encoding='utf-8', errors='replace')
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except:
        return "", "error", 1


report = {
    "pipeline": "shannon_recovery",
    "colony": "liris",
    "target": "Xiaomi Mi 10 Lite 5G (monet)",
    "started": datetime.now().isoformat(),
    "phases": {}
}


# ================================================================
# PHASE 1 — WinUSB Native AOA Injection
# ================================================================

def phase_1_winusb_aoa():
    """
    Direct WinUSB control transfers to send AOA protocol commands.
    Bypasses MTP layer — talks to the USB device at transport level.
    WinUSB is confirmed in the driver stack.
    """
    log("PHASE 1 -- WinUSB Native AOA Injection", "PHASE")
    log("Strategy: Send AOA vendor requests through WinUSB setupapi")

    # Use PowerShell + .NET P/Invoke to call WinUSB directly
    # This bypasses the MTP driver and sends raw vendor control transfers

    ps_script = r'''
$ErrorActionPreference = "Stop"

# P/Invoke signatures for SetupAPI and WinUSB
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class WinUsbNative {
    // SetupAPI
    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr SetupDiGetClassDevs(
        ref Guid classGuid, IntPtr enumerator, IntPtr hwndParent, uint flags);

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern bool SetupDiEnumDeviceInterfaces(
        IntPtr deviceInfoSet, IntPtr deviceInfoData,
        ref Guid interfaceClassGuid, uint memberIndex,
        ref SP_DEVICE_INTERFACE_DATA deviceInterfaceData);

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern bool SetupDiGetDeviceInterfaceDetail(
        IntPtr deviceInfoSet,
        ref SP_DEVICE_INTERFACE_DATA deviceInterfaceData,
        IntPtr deviceInterfaceDetailData,
        uint deviceInterfaceDetailDataSize,
        ref uint requiredSize,
        IntPtr deviceInfoData);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiDestroyDeviceInfoList(IntPtr deviceInfoSet);

    // CreateFile for USB device
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr CreateFile(
        string fileName, uint desiredAccess, uint shareMode,
        IntPtr securityAttributes, uint creationDisposition,
        uint flagsAndAttributes, IntPtr templateFile);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr handle);

    // WinUSB
    [DllImport("winusb.dll", SetLastError = true)]
    public static extern bool WinUsb_Initialize(
        IntPtr deviceHandle, out IntPtr interfaceHandle);

    [DllImport("winusb.dll", SetLastError = true)]
    public static extern bool WinUsb_Free(IntPtr interfaceHandle);

    [DllImport("winusb.dll", SetLastError = true)]
    public static extern bool WinUsb_ControlTransfer(
        IntPtr interfaceHandle,
        WINUSB_SETUP_PACKET setupPacket,
        byte[] buffer, uint bufferLength,
        out uint lengthTransferred, IntPtr overlapped);

    [DllImport("winusb.dll", SetLastError = true)]
    public static extern bool WinUsb_GetDescriptor(
        IntPtr interfaceHandle, byte descriptorType,
        byte index, ushort languageID,
        byte[] buffer, uint bufferLength,
        out uint lengthTransferred);

    // Constants
    public const uint DIGCF_PRESENT = 0x02;
    public const uint DIGCF_DEVICEINTERFACE = 0x10;
    public const uint GENERIC_READ = 0x80000000;
    public const uint GENERIC_WRITE = 0x40000000;
    public const uint FILE_SHARE_READ = 0x01;
    public const uint FILE_SHARE_WRITE = 0x02;
    public const uint OPEN_EXISTING = 3;
    public const uint FILE_ATTRIBUTE_NORMAL = 0x80;
    public const uint FILE_FLAG_OVERLAPPED = 0x40000000;

    [StructLayout(LayoutKind.Sequential)]
    public struct SP_DEVICE_INTERFACE_DATA {
        public uint cbSize;
        public Guid InterfaceClassGuid;
        public uint Flags;
        public IntPtr Reserved;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct WINUSB_SETUP_PACKET {
        public byte RequestType;
        public byte Request;
        public ushort Value;
        public ushort Index;
        public ushort Length;
    }
}
"@

$result = @{ status = "starting"; steps = @() }

try {
    # GUID for USB device interface
    $usbGuid = [Guid]::new("A5DCBF10-6530-11D2-901F-00C04FB951ED")

    # Step 1: Enumerate USB device interfaces
    $flags = [WinUsbNative]::DIGCF_PRESENT -bor [WinUsbNative]::DIGCF_DEVICEINTERFACE
    $devInfoSet = [WinUsbNative]::SetupDiGetClassDevs([ref]$usbGuid, [IntPtr]::Zero, [IntPtr]::Zero, $flags)

    if ($devInfoSet -eq [IntPtr]::new(-1)) {
        $result["status"] = "setupdi_failed"
        $result["error"] = "SetupDiGetClassDevs failed: " + [Marshal]::GetLastWin32Error()
        Write-Output ($result | ConvertTo-Json -Depth 3 -Compress)
        exit
    }

    $result["steps"] += "SetupDi initialized"

    # Step 2: Find Xiaomi device interface
    $found = $false
    $devicePath = ""

    for ($i = 0; $i -lt 50; $i++) {
        $ifData = New-Object WinUsbNative+SP_DEVICE_INTERFACE_DATA
        $ifData.cbSize = [Marshal]::SizeOf($ifData)

        $enumResult = [WinUsbNative]::SetupDiEnumDeviceInterfaces(
            $devInfoSet, [IntPtr]::Zero, [ref]$usbGuid, $i, [ref]$ifData)

        if (-not $enumResult) { break }

        # Get required size
        $reqSize = [uint32]0
        [WinUsbNative]::SetupDiGetDeviceInterfaceDetail(
            $devInfoSet, [ref]$ifData, [IntPtr]::Zero, 0, [ref]$reqSize, [IntPtr]::Zero) | Out-Null

        if ($reqSize -gt 0) {
            # Allocate and fill detail data
            $detailBuf = [Marshal]::AllocHGlobal([int]$reqSize)
            # Set cbSize (varies by architecture: 8 on x64, 6 on x86)
            [Marshal]::WriteInt32($detailBuf, 8)  # x64

            $ok = [WinUsbNative]::SetupDiGetDeviceInterfaceDetail(
                $devInfoSet, [ref]$ifData, $detailBuf, $reqSize, [ref]$reqSize, [IntPtr]::Zero)

            if ($ok) {
                # Read the device path string (offset 4 bytes from start)
                $pathPtr = [IntPtr]::Add($detailBuf, 4)
                $path = [Marshal]::PtrToStringAuto($pathPtr)

                if ($path -match "vid_2717" -and $path -match "pid_ff40") {
                    $devicePath = $path
                    $found = $true
                    $result["steps"] += "Found Xiaomi at: $path"
                }
            }
            [Marshal]::FreeHGlobal($detailBuf)
        }

        if ($found) { break }
    }

    [WinUsbNative]::SetupDiDestroyDeviceInfoList($devInfoSet) | Out-Null

    if (-not $found) {
        $result["status"] = "xiaomi_not_found_in_setupdi"
        Write-Output ($result | ConvertTo-Json -Depth 3 -Compress)
        exit
    }

    # Step 3: Open device handle
    $access = [WinUsbNative]::GENERIC_READ -bor [WinUsbNative]::GENERIC_WRITE
    $share = [WinUsbNative]::FILE_SHARE_READ -bor [WinUsbNative]::FILE_SHARE_WRITE
    $fileHandle = [WinUsbNative]::CreateFile(
        $devicePath, $access, $share,
        [IntPtr]::Zero, [WinUsbNative]::OPEN_EXISTING,
        [WinUsbNative]::FILE_ATTRIBUTE_NORMAL -bor [WinUsbNative]::FILE_FLAG_OVERLAPPED,
        [IntPtr]::Zero)

    if ($fileHandle -eq [IntPtr]::new(-1)) {
        $err = [Marshal]::GetLastWin32Error()
        $result["status"] = "createfile_failed"
        $result["error"] = "CreateFile failed with error $err (device may be held by MTP driver)"
        $result["device_path"] = $devicePath
        Write-Output ($result | ConvertTo-Json -Depth 3 -Compress)
        exit
    }

    $result["steps"] += "Device handle opened"

    # Step 4: Initialize WinUSB
    $usbHandle = [IntPtr]::Zero
    $initOk = [WinUsbNative]::WinUsb_Initialize($fileHandle, [ref]$usbHandle)

    if (-not $initOk) {
        $err = [Marshal]::GetLastWin32Error()
        [WinUsbNative]::CloseHandle($fileHandle) | Out-Null
        $result["status"] = "winusb_init_failed"
        $result["error"] = "WinUsb_Initialize failed with error $err"
        Write-Output ($result | ConvertTo-Json -Depth 3 -Compress)
        exit
    }

    $result["steps"] += "WinUSB initialized — RAW USB ACCESS ACQUIRED"

    # Step 5: AOA GET_PROTOCOL (vendor request 51)
    $setupPacket = New-Object WinUsbNative+WINUSB_SETUP_PACKET
    $setupPacket.RequestType = 0xC0  # Vendor, Device-to-Host
    $setupPacket.Request = 51        # AOA_GET_PROTOCOL
    $setupPacket.Value = 0
    $setupPacket.Index = 0
    $setupPacket.Length = 2

    $buf = New-Object byte[] 2
    $transferred = [uint32]0

    $aoaOk = [WinUsbNative]::WinUsb_ControlTransfer(
        $usbHandle, $setupPacket, $buf, 2, [ref]$transferred, [IntPtr]::Zero)

    if ($aoaOk -and $transferred -ge 2) {
        $aoaVersion = [BitConverter]::ToUInt16($buf, 0)
        $result["steps"] += "AOA Protocol Version: $aoaVersion"
        $result["aoa_version"] = $aoaVersion

        if ($aoaVersion -gt 0) {
            # Step 6: Set AOA strings
            $strings = @(
                @(0, "Asolaria"),
                @(1, "Liris Recovery"),
                @(2, "Screenless Xiaomi USB Recovery"),
                @(3, "1.0"),
                @(5, "liris-001")
            )

            foreach ($s in $strings) {
                $idx = $s[0]
                $str = [System.Text.Encoding]::UTF8.GetBytes($s[1] + "`0")

                $setPacket = New-Object WinUsbNative+WINUSB_SETUP_PACKET
                $setPacket.RequestType = 0x40  # Vendor, Host-to-Device
                $setPacket.Request = 52        # AOA_SET_STRING
                $setPacket.Value = 0
                $setPacket.Index = [uint16]$idx
                $setPacket.Length = [uint16]$str.Length

                $setTransferred = [uint32]0
                [WinUsbNative]::WinUsb_ControlTransfer(
                    $usbHandle, $setPacket, $str, [uint32]$str.Length,
                    [ref]$setTransferred, [IntPtr]::Zero) | Out-Null

                $result["steps"] += "AOA string[$idx] = '$($s[1])'"
            }

            # Step 7: AOA START (vendor request 53)
            $startPacket = New-Object WinUsbNative+WINUSB_SETUP_PACKET
            $startPacket.RequestType = 0x40  # Vendor, Host-to-Device
            $startPacket.Request = 53        # AOA_START
            $startPacket.Value = 0
            $startPacket.Index = 0
            $startPacket.Length = 0

            $startOk = [WinUsbNative]::WinUsb_ControlTransfer(
                $usbHandle, $startPacket, $null, 0, [ref]$transferred, [IntPtr]::Zero)

            if ($startOk) {
                $result["steps"] += "AOA START SENT — device should re-enumerate as accessory!"
                $result["status"] = "aoa_start_sent"
            } else {
                $err = [Marshal]::GetLastWin32Error()
                $result["steps"] += "AOA START failed with error $err"
                $result["status"] = "aoa_start_failed"
            }
        } else {
            $result["status"] = "aoa_not_supported"
            $result["steps"] += "Device does not support AOA (version 0)"
        }
    } else {
        $err = [Marshal]::GetLastWin32Error()
        $result["status"] = "aoa_query_failed"
        $result["steps"] += "AOA GET_PROTOCOL failed with error $err"
    }

    # Cleanup
    [WinUsbNative]::WinUsb_Free($usbHandle) | Out-Null
    [WinUsbNative]::CloseHandle($fileHandle) | Out-Null
    $result["steps"] += "Handles closed"

} catch {
    $result["status"] = "exception"
    $result["error"] = $_.Exception.Message
    $result["error_type"] = $_.Exception.GetType().FullName
}

Write-Output ($result | ConvertTo-Json -Depth 3 -Compress)
'''

    out, err, rc = ps(ps_script, timeout=30)
    if err == "TIMEOUT":
        log("Phase 1 timed out", "FAIL")
        report["phases"]["1_aoa"] = {"status": "timeout"}
        return False

    try:
        data = json.loads(out)
        for step in data.get("steps", []):
            is_hit = any(k in step.upper() for k in ["FOUND", "ACQUIRED", "AOA START SENT", "INITIALIZED"])
            log(f"  {step}", "HIT" if is_hit else "OK")

        status = data.get("status", "unknown")
        aoa_ver = data.get("aoa_version", None)

        if status == "aoa_start_sent":
            log("AOA START COMMAND SENT TO DEVICE!", "HIT")
            log("Waiting for re-enumeration...", "OK")
            time.sleep(4)

            # Check if device re-enumerated
            for pid in AOA_PIDS:
                check_out, _, _ = ps(f'Get-PnpDevice | Where-Object {{ $_.InstanceId -match "VID_18D1&PID_{pid:04X}" }} | Select-Object FriendlyName, Status | Format-Table -AutoSize')
                if check_out and "OK" in check_out:
                    log(f"ACCESSORY MODE ACTIVE! PID={hex(pid)}", "HIT")
                    data["accessory_pid"] = hex(pid)
                    report["phases"]["1_aoa"] = data
                    return True

            # Check if Xiaomi re-enumerated with different PID
            check_out, _, _ = ps('Get-PnpDevice | Where-Object { $_.InstanceId -match "VID_2717" } | Select-Object FriendlyName, InstanceId, Status | Format-Table -AutoSize')
            log(f"Post-AOA device state: {check_out}", "OK" if check_out else "WARN")
            data["post_aoa_state"] = check_out

        elif status == "createfile_failed":
            log("MTP driver holds exclusive lock on device handle", "WARN")
            log("Need to temporarily unbind MTP driver for raw USB access", "WARN")

        report["phases"]["1_aoa"] = data
        return status == "aoa_start_sent"

    except Exception as e:
        log(f"Phase 1 parse error: {e}", "FAIL")
        log(f"Raw output: {out[:300]}", "WARN")
        if err:
            log(f"PS stderr: {err[:200]}", "WARN")
        report["phases"]["1_aoa"] = {"status": "error", "error": str(e), "raw": out[:300]}
        return False


# ================================================================
# PHASE 2 — MTP Driver Unbind + Direct USB Access
# ================================================================

def phase_2_driver_unbind():
    """
    Temporarily disable the MTP driver to get raw USB access.
    Then send AOA commands without the MTP driver blocking us.
    Re-enable after AOA negotiation.
    """
    log("PHASE 2 -- MTP Driver Unbind + Raw USB Retry", "PHASE")

    # Step 1: Disable the WPD device (releases MTP lock)
    script = r'''
$ErrorActionPreference = "SilentlyContinue"
$devId = "USB\VID_2717&PID_FF40\56C90D22"

# Disable the device
$dev = Get-PnpDevice -InstanceId $devId
if (-not $dev) {
    Write-Output '{"status":"not_found"}'
    exit
}

Write-Output ("BEFORE: " + $dev.Status)

# Disable device to release MTP driver lock
Disable-PnpDevice -InstanceId $devId -Confirm:$false -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$dev2 = Get-PnpDevice -InstanceId $devId -ErrorAction SilentlyContinue
Write-Output ("AFTER DISABLE: " + $(if ($dev2) { $dev2.Status } else { "GONE" }))

# Re-enable immediately
Enable-PnpDevice -InstanceId $devId -Confirm:$false -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$dev3 = Get-PnpDevice -InstanceId $devId -ErrorAction SilentlyContinue
Write-Output ("AFTER ENABLE: " + $(if ($dev3) { $dev3.Status } else { "GONE" }))

# Check if PID changed during re-enumeration
$allXiaomi = Get-PnpDevice | Where-Object { $_.InstanceId -match "VID_2717" }
foreach ($x in $allXiaomi) {
    Write-Output ("XIAOMI: " + $x.InstanceId + " | " + $x.Status + " | " + $x.Class)
}

# Check for ANY new device
$newDevs = Get-PnpDevice | Where-Object {
    $_.InstanceId -match "VID_18D1|VID_2717|VID_05C6" -and
    $_.InstanceId -notmatch "PID_FF40"
}
foreach ($n in $newDevs) {
    Write-Output ("NEW: " + $n.InstanceId + " | " + $n.FriendlyName + " | " + $n.Status)
}
'''
    out, err, rc = ps(script, timeout=30)
    lines = out.split("\n") if out else []
    for line in lines:
        line = line.strip()
        if line:
            is_hit = "NEW:" in line or "GONE" in line or ("XIAOMI" in line and "PID_FF40" not in line)
            log(f"  {line}", "HIT" if is_hit else "OK")

    report["phases"]["2_unbind"] = {"output": lines}
    return any("NEW:" in l for l in lines)


# ================================================================
# PHASE 3 — Samsung Relay Bridge
# ================================================================

def phase_3_samsung_relay():
    """
    Use the Samsung A06 as a relay device.
    Samsung has full ADB — install tools on it to reach the Xiaomi.
    Vectors: WiFi scan from Samsung, Bluetooth from Samsung.
    """
    log("PHASE 3 -- Samsung Relay Bridge", "PHASE")

    # Check if Samsung is connected
    out, err, rc = adb("devices")
    if SAMSUNG_SERIAL not in out:
        log("Samsung not connected — reconnect it alongside Xiaomi", "WARN")
        log("Both can be on USB simultaneously (different ports)", "INFO")
        report["phases"]["3_relay"] = {"status": "samsung_not_connected"}
        return False

    log(f"Samsung {SAMSUNG_SERIAL} connected!", "OK")

    # Step 1: Check Samsung WiFi IP
    ip_out, _, _ = adb("shell", "ip route get 1 | awk '{print $NF; exit}'", serial=SAMSUNG_SERIAL)
    log(f"Samsung WiFi IP: {ip_out}", "OK")

    # Step 2: Try to ping Xiaomi from Samsung
    log("Pinging Xiaomi (192.168.15.37) from Samsung...")
    ping_out, _, _ = adb("shell", "ping -c 2 -W 1 192.168.15.37", serial=SAMSUNG_SERIAL)
    xiaomi_alive = "bytes from" in ping_out
    log(f"Xiaomi from Samsung: {'ALIVE' if xiaomi_alive else 'no response'}", "OK" if xiaomi_alive else "WARN")

    # Step 3: Port scan from Samsung
    if xiaomi_alive:
        log("Scanning Xiaomi ports from Samsung...", "OK")
        ports_to_check = [5555, 5037, 7912, 8080, 2424, 18883, 4791, 9222]
        open_ports = []
        for port in ports_to_check:
            nc_out, _, rc = adb("shell", f"(echo > /dev/tcp/192.168.15.37/{port}) 2>/dev/null && echo OPEN || echo CLOSED",
                               serial=SAMSUNG_SERIAL)
            if "OPEN" in nc_out:
                open_ports.append(port)
                log(f"  Port {port}: OPEN", "HIT")
            else:
                log(f"  Port {port}: closed", "INFO")

        if open_ports:
            log(f"OPEN PORTS ON XIAOMI: {open_ports}", "HIT")

    # Step 4: Bluetooth scan from Samsung
    log("Checking Bluetooth on Samsung...")
    bt_out, _, _ = adb("shell", "settings get global bluetooth_on", serial=SAMSUNG_SERIAL)
    log(f"Samsung BT: {'ON' if bt_out.strip() == '1' else 'OFF'}")

    # Step 5: Try ADB connect from Samsung (if it has network tools)
    log("Attempting ADB-over-WiFi connect to Xiaomi from Samsung...")
    adb_wifi_out, _, _ = adb("shell",
        "am start -a android.intent.action.VIEW -d 'http://192.168.15.37:5555' 2>/dev/null; echo done",
        serial=SAMSUNG_SERIAL)

    # Step 6: Check if Samsung can see Xiaomi via mDNS/SSDP
    log("mDNS discovery from Samsung...")
    mdns_out, _, _ = adb("shell", "cat /proc/net/arp 2>/dev/null", serial=SAMSUNG_SERIAL)
    if "192.168.15.37" in mdns_out:
        log("Xiaomi visible in Samsung's ARP table!", "HIT")

    result = {
        "samsung_connected": True,
        "samsung_ip": ip_out,
        "xiaomi_alive_from_samsung": xiaomi_alive,
        "open_ports": open_ports if xiaomi_alive else [],
        "bt_on": bt_out.strip() == "1"
    }
    report["phases"]["3_relay"] = result
    return xiaomi_alive and len(open_ports) > 0


# ================================================================
# PHASE 4 — Bluetooth Input Injection
# ================================================================

def phase_4_bluetooth():
    """
    Try to pair with Xiaomi via Bluetooth and send keyboard input.
    If we can pair as a BT keyboard (HID profile), we can type the PIN blind.
    """
    log("PHASE 4 -- Bluetooth Input Injection", "PHASE")

    # Check if Samsung can pair with Xiaomi via BT
    # The Samsung can act as a Bluetooth bridge

    # First, scan for Xiaomi BT from this PC
    script = r'''
$ErrorActionPreference = "SilentlyContinue"

# Get Bluetooth radio info
$radio = Get-PnpDevice -Class Bluetooth | Where-Object { $_.FriendlyName -match "Module|Radio|Adapter" -and $_.Status -eq "OK" }

$result = @{
    bt_radio = if ($radio) { $radio.FriendlyName } else { "none" }
    bt_available = $null -ne $radio
}

# Try WinRT Bluetooth LE scan
try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime

    # Check for already-known devices that might be Xiaomi
    $knownDevices = Get-PnpDevice -Class Bluetooth | Where-Object {
        $_.FriendlyName -match "Mi|Xiaomi|Redmi|POCO|monet"
    }

    $result["xiaomi_bt_devices"] = @()
    foreach ($d in $knownDevices) {
        $result["xiaomi_bt_devices"] += @{
            name = $d.FriendlyName
            id = $d.InstanceId
            status = $d.Status.ToString()
        }
    }

    # List all BT devices for reference
    $allBt = Get-PnpDevice -Class Bluetooth | Where-Object {
        $_.InstanceId -match "BTHENUM\\DEV_"
    } | Select-Object FriendlyName, Status

    $result["all_bt_devices"] = @()
    foreach ($b in $allBt) {
        $result["all_bt_devices"] += $b.FriendlyName + " [" + $b.Status.ToString() + "]"
    }
} catch {
    $result["bt_scan_error"] = $_.Exception.Message
}

# Can we emulate a BT keyboard? Check for HID profile support
$result["hid_profile"] = "Requires external BT HID emulator or rooted Samsung as relay"

Write-Output ($result | ConvertTo-Json -Depth 3 -Compress)
'''
    out, _, _ = ps(script, timeout=30)
    try:
        data = json.loads(out)
        log(f"BT Radio: {data.get('bt_radio', 'none')}")
        log(f"BT available: {data.get('bt_available', False)}")

        xiaomi_bt = data.get("xiaomi_bt_devices", [])
        if xiaomi_bt:
            log("XIAOMI FOUND ON BLUETOOTH!", "HIT")
            for d in xiaomi_bt:
                log(f"  {d.get('name')} [{d.get('status')}]", "HIT")
        else:
            log("Xiaomi not found in Bluetooth devices", "WARN")

        all_bt = data.get("all_bt_devices", [])
        for b in all_bt:
            log(f"  BT: {b}")

        # If Samsung is connected, try BT scan from Samsung
        samsung_out, _, rc = adb("devices")
        if SAMSUNG_SERIAL in samsung_out:
            log("Scanning Bluetooth from Samsung...")
            bt_scan, _, _ = adb("shell", "dumpsys bluetooth_manager | grep -i 'mi 10\\|xiaomi\\|monet' | head -5",
                               serial=SAMSUNG_SERIAL)
            if bt_scan:
                log(f"Samsung BT sees: {bt_scan}", "HIT")
                data["samsung_bt_scan"] = bt_scan

        report["phases"]["4_bluetooth"] = data
        return len(xiaomi_bt) > 0
    except:
        log(f"BT phase error: {out[:100]}", "FAIL")
        report["phases"]["4_bluetooth"] = {"status": "error"}
        return False


# ================================================================
# PHASE 5 — Synthesis Report + Next Actions
# ================================================================

def phase_5_report(results):
    log("PHASE 5 -- Synthesis Report", "PHASE")
    print()

    successes = [k for k, v in results.items() if v]

    print("  ========================================================")
    print("  SHANNON RECOVERY PIPELINE -- RESULTS")
    print("  ========================================================")
    print()

    for phase, result in results.items():
        status = "BREAKTHROUGH" if result else "BLOCKED"
        log(f"{phase}: {status}", "HIT" if result else "WARN")

    print()

    if successes:
        log("BREAKTHROUGH VECTORS FOUND!", "HIT")
        log("Follow up on open channels to establish ADB access", "OK")
        report["result"] = "breakthrough"
    else:
        log("MIUI full lockdown -- all software vectors blocked", "WARN")
        print()
        log("MIUI security model:", "INFO")
        log("  - USB: Only exposes MTP, no ADB/composite without dev settings", "INFO")
        log("  - MTP: Locked behind screen unlock", "INFO")
        log("  - WiFi: Android firewall blocks all inbound", "INFO")
        log("  - Bluetooth: Not discoverable without screen interaction", "INFO")
        log("  - AOA: Requires device handle (MTP driver holds exclusive)", "INFO")
        print()
        log("HARDWARE SOLUTION (R$10):", "OK")
        log("  1. Buy USB-C OTG adapter", "CMD")
        log("  2. Connect USB keyboard to Xiaomi", "CMD")
        log("  3. Type PIN + Enter (blind unlock)", "CMD")
        log("  4. 'Ok Google' > 'Ativar depuracao USB'", "CMD")
        log("  5. Connect USB data cable > adb devices", "CMD")
        log("  6. Run: python liris_inject_v2.py (re-scan all vectors)", "CMD")
        log("  7. Integrate into Asolaria as second phone node", "CMD")
        print()
        log("ALTERNATIVE — Samsung as BT keyboard relay:", "OK")
        log("  Install BT keyboard emulator app on Samsung", "CMD")
        log("  Pair Samsung with Xiaomi via Bluetooth", "CMD")
        log("  Send PIN keystrokes from Samsung to Xiaomi", "CMD")
        log("  This works IF Xiaomi BT was on before the fall", "CMD")
        report["result"] = "hardware_required"

    # Save
    report["finished"] = datetime.now().isoformat()
    rpath = os.path.join(BASE, "reports", f"shannon_recovery_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(rpath, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    log(f"Report saved: {rpath}", "OK")

    return report


# ================================================================
# MAIN — Shannon 5-Phase Pipeline
# ================================================================

def main():
    print()
    print("  ========================================================")
    print("  SHANNON RECOVERY PIPELINE")
    print("  Colony: Liris / Asolaria")
    print("  Target: Xiaomi Mi 10 Lite 5G (monet) / screenless")
    print("  Method: White room reverse engineering")
    print("  Anatomy: 6 body systems x Shannon 5 phases")
    print("  ========================================================")
    print()

    results = {}

    log("Starting multi-phase recovery pipeline...", "OK")
    print()

    results["Phase 1: WinUSB AOA"] = phase_1_winusb_aoa()
    print()

    results["Phase 2: Driver Unbind"] = phase_2_driver_unbind()
    print()

    results["Phase 3: Samsung Relay"] = phase_3_samsung_relay()
    print()

    results["Phase 4: Bluetooth"] = phase_4_bluetooth()
    print()

    phase_5_report(results)
    print()


if __name__ == "__main__":
    main()

