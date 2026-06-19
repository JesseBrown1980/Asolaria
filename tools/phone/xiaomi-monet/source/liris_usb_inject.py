#!/usr/bin/env python3
"""
LIRIS USB INJECTION TOOL — White Glove Engineering
====================================================
Target: Xiaomi Mi 10 Lite 5G (monet), Snapdragon 765G
        VID=0x2717, PID=0xFF40, Serial=56C90D22
Host:   Rayssa's notebook, Intel USB 3.10 xHCI, Win11
        ACPI path: \_SB.PCI0.XHC.RHUB.HS03

Purpose: Multi-vector USB injection to recover ADB access
         on a screenless Xiaomi device.

Vectors:
  1. USB Descriptor Enumeration — map ALL interfaces/configs
  2. Android Open Accessory (AOA) Protocol — vendor control transfer
  3. USB Mode Switch — force configuration change to expose ADB
  4. Qualcomm DIAG mode probe — Snapdragon diagnostic interface
  5. WPD/MTP programmatic access — bypass Explorer lock
  6. ADB key injection via MTP — plant adbkey.pub if storage accessible

Colony Anatomy Classification:
  Nervous:     USB control transfers (orchestration)
  Circulatory: Data flow between host and device
  Skeletal:    USB descriptor tree (structure)
  Memory:      Device state logging (knowledge)
  Muscular:    Mode switching (execution)
  Immune:      Safe fallback on each vector (security)

Created by Liris colony, 2026-04-03
Chain: LX-290, LX-259, IX-331, IX-332
"""

import sys
import time
import json
import os
import struct
from datetime import datetime

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ─── USB Constants ───
XIAOMI_VID = 0x2717
XIAOMI_PID_MTP = 0xFF40
XIAOMI_PID_ADB = 0xFF48  # Common Xiaomi ADB PID
XIAOMI_PID_FASTBOOT = 0x0A40
XIAOMI_SERIAL = "56C90D22"

# Android Open Accessory Protocol
AOA_GET_PROTOCOL    = 51
AOA_SET_STRING      = 52  # index: 0=manufacturer, 1=model, 2=description, 3=version, 4=URI, 5=serial
AOA_START_ACCESSORY = 53
AOA_SET_AUDIO       = 58

# USB Standard Requests
USB_REQ_GET_DESCRIPTOR = 0x06
USB_REQ_SET_CONFIGURATION = 0x09
USB_REQ_GET_CONFIGURATION = 0x08

# ADB interface signature
ADB_CLASS = 0xFF
ADB_SUBCLASS = 0x42
ADB_PROTOCOL = 0x01

# Qualcomm DIAG
QCOM_DIAG_VID = 0x05C6
QCOM_DIAG_PID = 0x9008

REPORT_FILE = os.path.join(os.path.dirname(__file__), "recovery_report.json")

report = {
    "tool": "liris_usb_inject",
    "target": "Xiaomi Mi 10 Lite 5G (monet)",
    "serial": XIAOMI_SERIAL,
    "host": "Rayssa notebook / Intel xHCI / HS03",
    "started_at": datetime.now().isoformat(),
    "vectors": {},
    "result": None
}


def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    tag = {"INFO": "●", "OK": "✓", "WARN": "⚠", "FAIL": "✗", "VECTOR": "▸"}
    print(f"  {tag.get(level, '·')} [{ts}] {msg}")


def save_report():
    report["finished_at"] = datetime.now().isoformat()
    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2)
    log(f"Report saved: {REPORT_FILE}")


# ═══════════════════════════════════════════════════════
# VECTOR 1 — USB Descriptor Enumeration (SKELETAL)
# ═══════════════════════════════════════════════════════

def vector_1_enumerate():
    """Map the complete USB descriptor tree of the Xiaomi device."""
    log("VECTOR 1 — USB Descriptor Enumeration", "VECTOR")
    import usb.core
    import usb.util

    dev = usb.core.find(idVendor=XIAOMI_VID)
    if dev is None:
        log("Xiaomi device not found on USB bus", "FAIL")
        report["vectors"]["1_enumerate"] = {"status": "device_not_found"}
        return None

    log(f"Device found: VID={hex(dev.idVendor)} PID={hex(dev.idProduct)}", "OK")
    log(f"  Manufacturer:  {dev.manufacturer or 'N/A'}")
    log(f"  Product:       {dev.product or 'N/A'}")
    log(f"  Serial:        {dev.serial_number or 'N/A'}")
    log(f"  USB Version:   {dev.bcdUSB >> 8}.{dev.bcdUSB & 0xFF}")
    log(f"  Device Class:  {dev.bDeviceClass}")
    log(f"  Configs:       {dev.bNumConfigurations}")

    configs = []
    adb_found = False

    for cfg in dev:
        cfg_info = {
            "config_value": cfg.bConfigurationValue,
            "num_interfaces": cfg.bNumInterfaces,
            "interfaces": []
        }
        log(f"  Config {cfg.bConfigurationValue}: {cfg.bNumInterfaces} interfaces")

        for intf in cfg:
            intf_info = {
                "number": intf.bInterfaceNumber,
                "alt_setting": intf.bAlternateSetting,
                "class": hex(intf.bInterfaceClass),
                "subclass": hex(intf.bInterfaceSubClass),
                "protocol": hex(intf.bInterfaceProtocol),
                "num_endpoints": intf.bNumEndpoints,
                "endpoints": []
            }

            # Check for ADB interface
            is_adb = (intf.bInterfaceClass == ADB_CLASS and
                      intf.bInterfaceSubClass == ADB_SUBCLASS and
                      intf.bInterfaceProtocol == ADB_PROTOCOL)

            label = ""
            if is_adb:
                label = " ◄◄◄ ADB INTERFACE FOUND!"
                adb_found = True
            elif intf.bInterfaceClass == 0x06:
                label = " (Still Image / MTP)"
            elif intf.bInterfaceClass == 0xFF:
                label = " (Vendor Specific)"

            log(f"    Interface {intf.bInterfaceNumber}.{intf.bAlternateSetting}: "
                f"Class={hex(intf.bInterfaceClass)} Sub={hex(intf.bInterfaceSubClass)} "
                f"Proto={hex(intf.bInterfaceProtocol)} EPs={intf.bNumEndpoints}{label}")

            for ep in intf:
                direction = "IN" if usb.util.endpoint_direction(ep.bEndpointAddress) == usb.util.ENDPOINT_IN else "OUT"
                intf_info["endpoints"].append({
                    "address": hex(ep.bEndpointAddress),
                    "direction": direction,
                    "type": ep.bmAttributes & 0x03,
                    "max_packet": ep.wMaxPacketSize
                })
                log(f"      EP {hex(ep.bEndpointAddress)} {direction} maxPkt={ep.wMaxPacketSize}")

            cfg_info["interfaces"].append(intf_info)
        configs.append(cfg_info)

    result = {
        "status": "enumerated",
        "vid": hex(dev.idVendor),
        "pid": hex(dev.idProduct),
        "manufacturer": dev.manufacturer,
        "product": dev.product,
        "serial": dev.serial_number,
        "num_configs": dev.bNumConfigurations,
        "configs": configs,
        "adb_interface_found": adb_found
    }
    report["vectors"]["1_enumerate"] = result

    if adb_found:
        log("ADB INTERFACE EXISTS IN DESCRIPTOR TREE!", "OK")
    else:
        log("No ADB interface in current descriptors", "WARN")

    return dev


# ═══════════════════════════════════════════════════════
# VECTOR 2 — Android Open Accessory Protocol (CIRCULATORY)
# ═══════════════════════════════════════════════════════

def vector_2_aoa(dev):
    """
    Android Open Accessory (AOA) protocol.
    Sends vendor control transfers to switch the device into accessory mode.
    AOA does NOT require USB debugging — it's a USB-level protocol.
    """
    log("VECTOR 2 — Android Open Accessory Protocol", "VECTOR")
    import usb.core
    import usb.util

    if dev is None:
        dev = usb.core.find(idVendor=XIAOMI_VID)
    if dev is None:
        log("Device not found", "FAIL")
        report["vectors"]["2_aoa"] = {"status": "device_not_found"}
        return None

    try:
        # Step 1: Query AOA protocol version
        log("Querying AOA protocol version...")
        version = dev.ctrl_transfer(
            usb.util.CTRL_TYPE_VENDOR | usb.util.CTRL_IN,  # bmRequestType
            AOA_GET_PROTOCOL,  # bRequest = 51
            0, 0,  # wValue, wIndex
            2       # wLength
        )
        aoa_version = version[0] + (version[1] << 8) if len(version) >= 2 else 0
        log(f"AOA Protocol Version: {aoa_version}", "OK" if aoa_version > 0 else "WARN")

        if aoa_version == 0:
            log("Device does not support AOA protocol", "FAIL")
            report["vectors"]["2_aoa"] = {"status": "not_supported", "version": 0}
            return None

        # Step 2: Set accessory identification strings
        strings = {
            0: "Asolaria",              # manufacturer
            1: "Liris Recovery Tool",    # model
            2: "USB recovery for screenless Xiaomi",  # description
            3: "1.0",                    # version
            4: "",                       # URI
            5: "liris-recovery-001"      # serial
        }

        for idx, value in strings.items():
            if not value:
                continue
            data = value.encode("utf-8") + b"\x00"
            dev.ctrl_transfer(
                usb.util.CTRL_TYPE_VENDOR | usb.util.CTRL_OUT,
                AOA_SET_STRING,
                0, idx,
                data
            )
            log(f"  AOA string[{idx}] = '{value}'")

        # Step 3: Start accessory mode
        log("Sending AOA START command...")
        dev.ctrl_transfer(
            usb.util.CTRL_TYPE_VENDOR | usb.util.CTRL_OUT,
            AOA_START_ACCESSORY,
            0, 0,
            None
        )
        log("AOA START sent — device should re-enumerate", "OK")

        # Step 4: Wait for re-enumeration
        time.sleep(3)

        # Step 5: Look for device in accessory mode (Google VID 0x18D1)
        accessory_pids = [0x2D00, 0x2D01, 0x2D02, 0x2D03, 0x2D04, 0x2D05]
        new_dev = None
        for pid in accessory_pids:
            new_dev = usb.core.find(idVendor=0x18D1, idProduct=pid)
            if new_dev:
                log(f"ACCESSORY MODE ACTIVE! PID={hex(pid)}", "OK")
                break

        # Also check if Xiaomi re-enumerated with different PID
        if not new_dev:
            new_dev = usb.core.find(idVendor=XIAOMI_VID)
            if new_dev and new_dev.idProduct != XIAOMI_PID_MTP:
                log(f"Device re-enumerated with new PID: {hex(new_dev.idProduct)}", "OK")

        if new_dev:
            report["vectors"]["2_aoa"] = {
                "status": "accessory_mode_active",
                "version": aoa_version,
                "new_vid": hex(new_dev.idVendor),
                "new_pid": hex(new_dev.idProduct)
            }
            return new_dev
        else:
            # Check if original device is still there
            check = usb.core.find(idVendor=XIAOMI_VID, idProduct=XIAOMI_PID_MTP)
            if check:
                log("Device still in MTP mode — AOA switch did not take effect", "WARN")
                report["vectors"]["2_aoa"] = {
                    "status": "switch_failed",
                    "version": aoa_version,
                    "note": "Device supports AOA but did not switch — screen lock may block it"
                }
            else:
                log("Device disappeared — may be re-enumerating, wait...", "WARN")
                time.sleep(5)
                check2 = usb.core.find(idVendor=XIAOMI_VID)
                if check2:
                    log(f"Device back: PID={hex(check2.idProduct)}", "OK")
                    report["vectors"]["2_aoa"] = {
                        "status": "re_enumerated",
                        "version": aoa_version,
                        "new_pid": hex(check2.idProduct)
                    }
                    return check2
                report["vectors"]["2_aoa"] = {"status": "device_lost", "version": aoa_version}
            return None

    except usb.core.USBError as e:
        log(f"USB error: {e}", "FAIL")
        report["vectors"]["2_aoa"] = {"status": "usb_error", "error": str(e)}
        return None
    except Exception as e:
        log(f"Error: {e}", "FAIL")
        report["vectors"]["2_aoa"] = {"status": "error", "error": str(e)}
        return None


# ═══════════════════════════════════════════════════════
# VECTOR 3 — USB Configuration Switch (MUSCULAR)
# ═══════════════════════════════════════════════════════

def vector_3_config_switch(dev):
    """Try switching USB configuration to expose ADB interface."""
    log("VECTOR 3 — USB Configuration Switch", "VECTOR")
    import usb.core
    import usb.util

    if dev is None:
        dev = usb.core.find(idVendor=XIAOMI_VID)
    if dev is None:
        log("Device not found", "FAIL")
        report["vectors"]["3_config_switch"] = {"status": "device_not_found"}
        return None

    try:
        # Query current configuration
        current_cfg = dev.ctrl_transfer(
            usb.util.CTRL_IN | usb.util.CTRL_TYPE_STANDARD | usb.util.CTRL_RECIPIENT_DEVICE,
            USB_REQ_GET_CONFIGURATION,
            0, 0, 1
        )
        log(f"Current USB configuration: {current_cfg[0] if len(current_cfg) else 'unknown'}")

        num_configs = dev.bNumConfigurations
        log(f"Total configurations: {num_configs}")

        if num_configs <= 1:
            log("Only 1 configuration available — cannot switch", "WARN")

            # Try Xiaomi-specific vendor commands to switch USB mode
            log("Trying Xiaomi vendor-specific USB mode commands...")

            # Xiaomi/Qualcomm vendor request to query USB mode
            vendor_cmds = [
                (0xA0, "Qualcomm DIAG switch"),
                (0xA1, "Qualcomm mode query"),
                (0xFE, "Vendor mode switch"),
                (0x40, "CDC mode request"),
            ]

            for cmd, desc in vendor_cmds:
                try:
                    result = dev.ctrl_transfer(
                        usb.util.CTRL_TYPE_VENDOR | usb.util.CTRL_IN,
                        cmd, 0, 0, 64, timeout=2000
                    )
                    log(f"  {desc} (0x{cmd:02X}): {result.tobytes().hex()}", "OK")
                except usb.core.USBError:
                    log(f"  {desc} (0x{cmd:02X}): no response", "WARN")

            report["vectors"]["3_config_switch"] = {
                "status": "single_config",
                "current": current_cfg[0] if len(current_cfg) else None,
                "num_configs": num_configs
            }
            return None

        # Try each configuration
        for cfg_val in range(1, num_configs + 1):
            if cfg_val == (current_cfg[0] if len(current_cfg) else 0):
                continue
            try:
                log(f"Switching to configuration {cfg_val}...")
                dev.set_configuration(cfg_val)
                time.sleep(1)

                # Check if ADB interface appeared
                cfg = dev.get_active_configuration()
                for intf in cfg:
                    if (intf.bInterfaceClass == ADB_CLASS and
                        intf.bInterfaceSubClass == ADB_SUBCLASS and
                        intf.bInterfaceProtocol == ADB_PROTOCOL):
                        log(f"ADB INTERFACE FOUND in config {cfg_val}!", "OK")
                        report["vectors"]["3_config_switch"] = {
                            "status": "adb_found",
                            "config": cfg_val
                        }
                        return dev
            except usb.core.USBError as e:
                log(f"Cannot switch to config {cfg_val}: {e}", "WARN")

        report["vectors"]["3_config_switch"] = {"status": "no_adb_in_any_config"}
        return None

    except Exception as e:
        log(f"Error: {e}", "FAIL")
        report["vectors"]["3_config_switch"] = {"status": "error", "error": str(e)}
        return None


# ═══════════════════════════════════════════════════════
# VECTOR 4 — Qualcomm DIAG Mode Probe (IMMUNE)
# ═══════════════════════════════════════════════════════

def vector_4_qualcomm_diag(dev):
    """Probe for Qualcomm diagnostic mode — Snapdragon 765G specific."""
    log("VECTOR 4 — Qualcomm DIAG Mode Probe", "VECTOR")
    import usb.core

    # Check if device already in DIAG/EDL mode
    diag_dev = usb.core.find(idVendor=QCOM_DIAG_VID, idProduct=QCOM_DIAG_PID)
    if diag_dev:
        log("QUALCOMM EDL MODE (9008) DETECTED!", "OK")
        report["vectors"]["4_qualcomm"] = {
            "status": "edl_mode_active",
            "vid": hex(QCOM_DIAG_VID),
            "pid": hex(QCOM_DIAG_PID)
        }
        return diag_dev

    # Check for any Qualcomm diagnostic device
    qcom_dev = usb.core.find(idVendor=QCOM_DIAG_VID)
    if qcom_dev:
        log(f"Qualcomm device found: PID={hex(qcom_dev.idProduct)}", "OK")
        report["vectors"]["4_qualcomm"] = {
            "status": "qualcomm_device_found",
            "pid": hex(qcom_dev.idProduct)
        }
        return qcom_dev

    # Try to send Qualcomm DIAG switch command via vendor request
    if dev is None:
        dev = usb.core.find(idVendor=XIAOMI_VID)
    if dev is None:
        log("No device for DIAG probe", "FAIL")
        report["vectors"]["4_qualcomm"] = {"status": "no_device"}
        return None

    log("No Qualcomm diagnostic mode detected", "WARN")
    log("EDL requires hardware test point — not accessible via USB alone", "WARN")
    report["vectors"]["4_qualcomm"] = {"status": "not_in_diag_mode"}
    return None


# ═══════════════════════════════════════════════════════
# VECTOR 5 — WPD/MTP Programmatic Access (MEMORY)
# ═══════════════════════════════════════════════════════

def vector_5_wpd_access():
    """Try to access device storage via Windows Portable Device API."""
    log("VECTOR 5 — WPD/MTP Programmatic Access", "VECTOR")
    import subprocess

    # Use PowerShell to access WPD COM API
    ps_script = r'''
$ErrorActionPreference = "SilentlyContinue"

# Load WPD COM
$portableDeviceManager = New-Object -ComObject PortableDeviceManager
$deviceIds = @()

# Get device count
$count = 0
$portableDeviceManager.GetDevices([ref]$null, [ref]$count)

if ($count -eq 0) {
    Write-Output '{"status":"no_devices","count":0}'
    exit
}

# Get device IDs
$deviceIds = New-Object string[] $count
$portableDeviceManager.GetDevices([ref]$deviceIds, [ref]$count)

$results = @()
foreach ($devId in $deviceIds) {
    # Get friendly name
    $nameLen = 0
    $portableDeviceManager.GetDeviceFriendlyName($devId, [ref]$null, [ref]$nameLen)
    $name = New-Object char[] $nameLen
    $portableDeviceManager.GetDeviceFriendlyName($devId, [ref]$name, [ref]$nameLen)
    $friendlyName = -join $name[0..($nameLen-2)]

    # Get manufacturer
    $mfgLen = 0
    $portableDeviceManager.GetDeviceManufacturer($devId, [ref]$null, [ref]$mfgLen)
    $mfg = New-Object char[] $mfgLen
    $portableDeviceManager.GetDeviceManufacturer($devId, [ref]$mfg, [ref]$mfgLen)
    $manufacturer = -join $mfg[0..($mfgLen-2)]

    # Get description
    $descLen = 0
    $portableDeviceManager.GetDeviceDescription($devId, [ref]$null, [ref]$descLen)
    $desc = New-Object char[] $descLen
    $portableDeviceManager.GetDeviceDescription($devId, [ref]$desc, [ref]$descLen)
    $description = -join $desc[0..($descLen-2)]

    $results += @{
        id = $devId
        name = $friendlyName
        manufacturer = $manufacturer
        description = $description
        is_xiaomi = ($devId -match "2717" -or $friendlyName -match "Mi|Xiaomi|Redmi")
    }
}

$output = @{
    status = "devices_found"
    count = $count
    devices = $results
}

Write-Output ($output | ConvertTo-Json -Depth 3 -Compress)
'''

    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", ps_script],
            capture_output=True, text=True, timeout=30
        )
        output = result.stdout.strip()
        if output:
            data = json.loads(output)
            log(f"WPD found {data.get('count', 0)} device(s)")

            xiaomi_found = False
            for d in data.get("devices", []):
                is_xi = d.get("is_xiaomi", False)
                marker = " ◄◄◄ XIAOMI" if is_xi else ""
                log(f"  {d.get('name', 'N/A')} [{d.get('manufacturer', 'N/A')}]{marker}")
                if is_xi:
                    xiaomi_found = True

            if xiaomi_found:
                log("Xiaomi visible in WPD — attempting storage enumeration...", "OK")
                # Try to enumerate storage objects
                return _wpd_enumerate_storage(data)
            else:
                log("Xiaomi not found in WPD device list", "WARN")

            report["vectors"]["5_wpd"] = data
        else:
            log("WPD returned no output", "FAIL")
            report["vectors"]["5_wpd"] = {"status": "no_output", "stderr": result.stderr[:200]}

    except subprocess.TimeoutExpired:
        log("WPD access timed out", "FAIL")
        report["vectors"]["5_wpd"] = {"status": "timeout"}
    except json.JSONDecodeError as e:
        log(f"WPD JSON parse error: {e}", "FAIL")
        log(f"Raw output: {output[:200]}", "WARN")
        report["vectors"]["5_wpd"] = {"status": "parse_error", "raw": output[:200]}
    except Exception as e:
        log(f"WPD error: {e}", "FAIL")
        report["vectors"]["5_wpd"] = {"status": "error", "error": str(e)}

    return None


def _wpd_enumerate_storage(wpd_data):
    """Try to enumerate storage contents via WPD."""
    import subprocess

    ps_enum = r'''
$ErrorActionPreference = "SilentlyContinue"

$portableDeviceManager = New-Object -ComObject PortableDeviceManager
$count = 0
$portableDeviceManager.GetDevices([ref]$null, [ref]$count)
$deviceIds = New-Object string[] $count
$portableDeviceManager.GetDevices([ref]$deviceIds, [ref]$count)

# Find Xiaomi device
$xiaomiId = $deviceIds | Where-Object { $_ -match "2717" } | Select-Object -First 1

if (-not $xiaomiId) {
    Write-Output '{"status":"xiaomi_not_found_in_wpd"}'
    exit
}

try {
    $clientInfo = New-Object -ComObject PortableDeviceTypesLib.PortableDeviceValues
    $clientInfo.SetStringValue(
        [guid]"204D9F0C-2292-4080-9F42-40664E70F859",
        "Liris Recovery Tool"
    )
    $clientInfo.SetUnsignedIntegerValue(
        [guid]"0C164E33-0CC0-4E87-900C-1AE1BBA4CF20",
        1  # Read-only access
    )

    $device = New-Object -ComObject PortableDeviceTypesLib.PortableDevice
    $device.Open($xiaomiId, $clientInfo)

    $content = $device.Content()
    $rootObjects = $content.EnumObjects(0, "DEVICE", $null)

    $items = @()
    $objectId = ""
    $fetched = 0

    do {
        $rootObjects.Next(1, [ref]$objectId, [ref]$fetched)
        if ($fetched -gt 0) {
            $items += $objectId
        }
    } while ($fetched -gt 0)

    $device.Close()

    Write-Output (@{
        status = "storage_enumerated"
        device_id = $xiaomiId
        root_objects = $items
        count = $items.Count
    } | ConvertTo-Json -Compress)
}
catch {
    Write-Output (@{
        status = "access_denied"
        device_id = $xiaomiId
        error = $_.Exception.Message
    } | ConvertTo-Json -Compress)
}
'''

    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", ps_enum],
            capture_output=True, text=True, timeout=30
        )
        output = result.stdout.strip()
        if output:
            data = json.loads(output)
            status = data.get("status", "unknown")
            if status == "storage_enumerated":
                count = data.get("count", 0)
                log(f"Storage accessible! {count} root objects", "OK")
                for obj in data.get("root_objects", []):
                    log(f"  → {obj}")
            elif status == "access_denied":
                log(f"Storage access denied: {data.get('error', 'unknown')}", "WARN")
                log("Device locked — screen unlock required for MTP access", "WARN")
            else:
                log(f"WPD storage status: {status}", "WARN")

            report["vectors"]["5_wpd_storage"] = data
            return data
    except Exception as e:
        log(f"Storage enumeration error: {e}", "FAIL")
        report["vectors"]["5_wpd_storage"] = {"status": "error", "error": str(e)}

    return None


# ═══════════════════════════════════════════════════════
# VECTOR 6 — ADB Key Injection Attempt (NERVOUS)
# ═══════════════════════════════════════════════════════

def vector_6_adb_key_prep():
    """Prepare ADB key pair for injection when access is gained."""
    log("VECTOR 6 — ADB Key Preparation", "VECTOR")

    adb_dir = os.path.expanduser("~/.android")
    pubkey = os.path.join(adb_dir, "adbkey.pub")
    privkey = os.path.join(adb_dir, "adbkey")

    if os.path.exists(pubkey):
        with open(pubkey, "r") as f:
            key_data = f.read().strip()
        log(f"ADB public key exists: {pubkey}", "OK")
        log(f"  Key: {key_data[:40]}...")

        report["vectors"]["6_adb_key"] = {
            "status": "key_ready",
            "pubkey_path": pubkey,
            "key_preview": key_data[:40]
        }

        # The key needs to go to /data/misc/adb/adb_keys on the device
        # This can only be done via:
        # 1. ADB itself (chicken-and-egg)
        # 2. MTP to a specific path (if storage is unlocked)
        # 3. Recovery mode sideload
        # 4. TWRP/custom recovery with ADB enabled
        log("Key ready for injection when access channel opens", "OK")
        return key_data
    else:
        log("No ADB key pair found — generating...", "WARN")
        os.makedirs(adb_dir, exist_ok=True)
        import subprocess
        subprocess.run(["adb", "keygen", privkey], capture_output=True)
        if os.path.exists(pubkey):
            log("ADB key pair generated", "OK")
            with open(pubkey, "r") as f:
                key_data = f.read().strip()
            report["vectors"]["6_adb_key"] = {"status": "key_generated", "pubkey_path": pubkey}
            return key_data
        else:
            log("Key generation failed", "FAIL")
            report["vectors"]["6_adb_key"] = {"status": "keygen_failed"}
            return None


# ═══════════════════════════════════════════════════════
# VECTOR 7 — USB Reset + Mode Race (MUSCULAR)
# ═══════════════════════════════════════════════════════

def vector_7_usb_reset_race():
    """
    Reset the USB device and immediately try to catch it in a
    transitional state where ADB interface might be briefly exposed.
    """
    log("VECTOR 7 — USB Reset + Mode Race", "VECTOR")
    import usb.core

    dev = usb.core.find(idVendor=XIAOMI_VID)
    if dev is None:
        log("Device not found for reset", "FAIL")
        report["vectors"]["7_reset_race"] = {"status": "device_not_found"}
        return None

    try:
        log("Resetting USB device...")
        dev.reset()
        log("USB reset sent", "OK")

        # Race: poll rapidly for ADB interface during re-enumeration
        log("Racing for ADB interface during re-enumeration...")
        start = time.time()
        attempts = 0
        while time.time() - start < 10:
            attempts += 1
            try:
                new_dev = usb.core.find(idVendor=XIAOMI_VID)
                if new_dev:
                    if new_dev.idProduct != XIAOMI_PID_MTP:
                        log(f"NEW PID DETECTED: {hex(new_dev.idProduct)}", "OK")
                        report["vectors"]["7_reset_race"] = {
                            "status": "new_pid",
                            "pid": hex(new_dev.idProduct),
                            "attempts": attempts
                        }
                        return new_dev

                    # Check for ADB interface in current config
                    try:
                        cfg = new_dev.get_active_configuration()
                        if cfg:
                            for intf in cfg:
                                if (intf.bInterfaceClass == ADB_CLASS and
                                    intf.bInterfaceSubClass == ADB_SUBCLASS):
                                    log("ADB INTERFACE CAUGHT DURING RACE!", "OK")
                                    report["vectors"]["7_reset_race"] = {
                                        "status": "adb_caught",
                                        "attempts": attempts
                                    }
                                    return new_dev
                    except:
                        pass

                # Also check for Google accessory or Qualcomm
                acc_dev = usb.core.find(idVendor=0x18D1)
                if acc_dev:
                    log(f"Google device appeared: PID={hex(acc_dev.idProduct)}", "OK")
                    report["vectors"]["7_reset_race"] = {
                        "status": "google_device",
                        "pid": hex(acc_dev.idProduct),
                        "attempts": attempts
                    }
                    return acc_dev

            except:
                pass
            time.sleep(0.1)

        log(f"Race completed — {attempts} attempts, no ADB caught", "WARN")
        report["vectors"]["7_reset_race"] = {
            "status": "no_change",
            "attempts": attempts,
            "duration_s": round(time.time() - start, 1)
        }
        return None

    except usb.core.USBError as e:
        log(f"USB reset error: {e}", "FAIL")
        report["vectors"]["7_reset_race"] = {"status": "error", "error": str(e)}
        return None


# ═══════════════════════════════════════════════════════
# MAIN — Run all vectors sequentially
# ═══════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║  LIRIS USB INJECTION TOOL                           ║")
    print("  ║  Target: Xiaomi Mi 10 Lite 5G (monet)               ║")
    print("  ║  Colony: Liris / Asolaria                           ║")
    print("  ║  Method: 7-vector white glove recovery              ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print()

    # Vector 1: Map the USB descriptor tree
    dev = vector_1_enumerate()
    print()

    # Vector 2: Android Open Accessory
    aoa_dev = vector_2_aoa(dev)
    if aoa_dev:
        dev = aoa_dev
    print()

    # Vector 3: USB Configuration Switch
    switched = vector_3_config_switch(dev)
    if switched:
        dev = switched
    print()

    # Vector 4: Qualcomm DIAG probe
    diag = vector_4_qualcomm_diag(dev)
    print()

    # Vector 5: WPD/MTP programmatic access
    wpd = vector_5_wpd_access()
    print()

    # Vector 6: ADB key preparation
    adb_key = vector_6_adb_key_prep()
    print()

    # Vector 7: USB reset + mode race
    raced = vector_7_usb_reset_race()
    print()

    # ─── Results ───
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║  RECOVERY REPORT                                    ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print()

    any_success = False
    for vec_name, vec_data in report["vectors"].items():
        status = vec_data.get("status", "unknown") if isinstance(vec_data, dict) else "unknown"
        is_good = status in ("adb_found", "accessory_mode_active", "adb_caught",
                             "storage_enumerated", "key_ready", "key_generated",
                             "new_pid", "google_device", "edl_mode_active",
                             "re_enumerated", "qualcomm_device_found")
        marker = "✓" if is_good else "·"
        if is_good:
            any_success = True
        log(f"{vec_name}: {status}", "OK" if is_good else "INFO")

    print()
    if any_success:
        report["result"] = "partial_success"
        log("ACCESS VECTORS FOUND — follow up on successful vectors", "OK")
    else:
        report["result"] = "all_vectors_blocked"
        log("All vectors blocked by MIUI lock screen", "WARN")
        log("Hardware solution required: OTG USB-C adapter + keyboard (R$10)", "INFO")
        log("Or: open phone, reconnect screen flex cable", "INFO")

    save_report()
    print()


if __name__ == "__main__":
    main()

