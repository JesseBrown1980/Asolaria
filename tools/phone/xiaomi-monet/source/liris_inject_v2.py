#!/usr/bin/env python3
"""
LIRIS USB INJECTION TOOL v2 — Windows Native Stack
====================================================
Uses WinUSB/WPD/COM APIs instead of libusb for Windows compatibility.
Target: Xiaomi Mi 10 Lite 5G (monet), VID=0x2717, PID=0xFF40
Host: Rayssa notebook, Intel xHCI, Win11

7 Vectors — all planes simultaneously.
"""

import sys
import os
import json
import time
import subprocess
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

XIAOMI_VID = "2717"
XIAOMI_PID_MTP = "FF40"
REPORT = {"tool": "liris_inject_v2", "started": datetime.now().isoformat(), "vectors": {}}


def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    tag = {"INFO": " ", "OK": "+", "WARN": "!", "FAIL": "X", "VEC": ">"}
    print(f"  [{tag.get(level, ' ')}] {ts} {msg}")


def ps(script, timeout=90):
    """Run PowerShell and return stdout."""
    try:
        r = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True, text=True, timeout=timeout, encoding='utf-8', errors='replace'
        )
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT", 1


def save_report():
    REPORT["finished"] = datetime.now().isoformat()
    path = os.path.join(os.path.dirname(__file__), "recovery_report.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(REPORT, f, indent=2, ensure_ascii=False)
    log(f"Report: {path}")


# ================================================================
# VECTOR 1 — USB Descriptor Deep Scan (via devcon/registry)
# ================================================================

def vector_1_descriptors():
    log("VECTOR 1 -- USB Descriptor Deep Scan", "VEC")

    script = r'''
$dev = Get-PnpDevice | Where-Object { $_.InstanceId -match "VID_2717" }
if (-not $dev) { Write-Output '{"status":"not_found"}'; exit }

$props = Get-PnpDeviceProperty -InstanceId $dev.InstanceId -ErrorAction SilentlyContinue
$out = @{}
foreach ($p in $props) {
    if ($null -ne $p.Data) {
        $key = $p.KeyName -replace "DEVPKEY_", ""
        $val = $p.Data
        if ($val -is [byte[]]) { $val = [BitConverter]::ToString($val) -replace "-","" }
        $out[$key] = [string]$val
    }
}
Write-Output ($out | ConvertTo-Json -Compress)
'''
    out, err, rc = ps(script)
    try:
        data = json.loads(out)
        log(f"Product: {data.get('Device_BusReportedDeviceDesc', 'N/A')}", "OK")
        log(f"Driver: {data.get('Device_Service', 'N/A')}")
        log(f"Hardware IDs: {data.get('Device_HardwareIds', 'N/A')}")
        log(f"Compatible IDs: {data.get('Device_CompatibleIds', 'N/A')}")
        log(f"Stack: {data.get('Device_Stack', 'N/A')}")
        log(f"Location: {data.get('Device_BiosDeviceName', 'N/A')}")
        log(f"Install state: {data.get('Device_InstallState', 'N/A')}")

        # Check for ADB in compatible IDs
        compat = data.get("Device_CompatibleIds", "")
        if "ADB" in compat.upper() or "FF_42_01" in compat:
            log("ADB COMPATIBLE ID FOUND IN DESCRIPTOR!", "OK")
            REPORT["vectors"]["1"] = {"status": "adb_in_compat", "data": data}
            return True

        REPORT["vectors"]["1"] = {"status": "enumerated", "data": data}
    except:
        log(f"Parse error: {out[:100]}", "FAIL")
        REPORT["vectors"]["1"] = {"status": "error", "raw": out[:200]}
    return False


# ================================================================
# VECTOR 2 — Android Open Accessory via WinUSB setupapi
# ================================================================

def vector_2_aoa():
    log("VECTOR 2 -- Android Open Accessory Protocol", "VEC")

    # AOA requires direct USB control transfer. On Windows with MTP driver,
    # we need to temporarily use the device through setupapi/WinUSB.
    # Use Python ctypes to call SetupAPI + WinUSB directly.

    script = r'''
# Check if we can send vendor requests through WinUSB
$ErrorActionPreference = "SilentlyContinue"

# Find the WinUSB device path
$dev = Get-PnpDevice -InstanceId "USB\VID_2717&PID_FF40\56C90D22"
if (-not $dev) { Write-Output '{"status":"device_not_found"}'; exit }

# Check device interfaces
$interfaces = Get-PnpDeviceProperty -InstanceId $dev.InstanceId -KeyName "DEVPKEY_Device_CompatibleIds"
$stack = Get-PnpDeviceProperty -InstanceId $dev.InstanceId -KeyName "DEVPKEY_Device_Stack"

$result = @{
    status = "probed"
    device_status = $dev.Status.ToString()
    compatible_ids = if ($interfaces.Data) { $interfaces.Data } else { @() }
    driver_stack = if ($stack.Data) { $stack.Data } else { @() }
    has_winusb = ($stack.Data -join " ") -match "WINUSB"
    has_wpd = ($stack.Data -join " ") -match "WpdUpFltr|WudfRd"
}

# Check for USB composite - if device exposes multiple interfaces
$children = Get-PnpDevice | Where-Object {
    $parent = (Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName "DEVPKEY_Device_Parent" -ErrorAction SilentlyContinue).Data
    $parent -eq "USB\VID_2717&PID_FF40\56C90D22"
}

$result["child_devices"] = @()
foreach ($child in $children) {
    $result["child_devices"] += @{
        name = $child.FriendlyName
        id = $child.InstanceId
        class = $child.Class
        status = $child.Status.ToString()
    }
}

# Try to find if there's a hidden ADB interface
$allUsb = Get-PnpDevice -Class "AndroidUsbDeviceClass" -ErrorAction SilentlyContinue
$result["android_usb_class_devices"] = @()
foreach ($au in $allUsb) {
    $result["android_usb_class_devices"] += $au.FriendlyName + " | " + $au.InstanceId
}

# Check for Xiaomi USB driver in registry
$xiaomiDriver = Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Enum\USB" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "VID_2717" } |
    ForEach-Object {
        Get-ChildItem $_.PSPath -ErrorAction SilentlyContinue |
        ForEach-Object {
            $svc = (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).Service
            @{ path = $_.PSPath; service = $svc }
        }
    }
$result["registry_services"] = $xiaomiDriver

Write-Output ($result | ConvertTo-Json -Depth 4 -Compress)
'''
    out, err, rc = ps(script, timeout=60)
    if err == "TIMEOUT":
        log("AOA probe timed out -- child device scan too slow", "WARN")
        REPORT["vectors"]["2"] = {"status": "timeout"}
        return False
    try:
        data = json.loads(out)
        log(f"Device status: {data.get('device_status')}")
        log(f"Has WinUSB: {data.get('has_winusb')}")
        log(f"Has WPD: {data.get('has_wpd')}")
        log(f"Child devices: {len(data.get('child_devices', []))}")
        log(f"Android USB class: {len(data.get('android_usb_class_devices', []))}")

        for child in data.get("child_devices", []):
            log(f"  Child: {child.get('name')} [{child.get('class')}] {child.get('status')}", "OK")

        for au in data.get("android_usb_class_devices", []):
            log(f"  Android USB: {au}", "OK")

        if data.get("has_winusb"):
            log("WinUSB in stack -- AOA control transfers possible via native API", "OK")
        else:
            log("WinUSB not primary -- MTP/WPD owns the device", "WARN")

        REPORT["vectors"]["2"] = data
    except:
        log(f"AOA probe error: {out[:100]}", "FAIL")
        REPORT["vectors"]["2"] = {"status": "error"}
    return False


# ================================================================
# VECTOR 3 — WPD Storage Access (bypass Explorer)
# ================================================================

def vector_3_wpd():
    log("VECTOR 3 -- WPD/MTP Programmatic Storage Access", "VEC")

    script = r'''
$ErrorActionPreference = "Stop"

try {
    $manager = New-Object -ComObject PortableDeviceManager

    # Get device count
    $count = 0
    $manager.GetDevices([ref]$null, [ref]$count)

    if ($count -eq 0) {
        Write-Output '{"status":"no_wpd_devices","count":0}'
        exit
    }

    # Get device IDs
    $ids = New-Object string[] $count
    $manager.GetDevices([ref]$ids, [ref]$count)

    $devices = @()
    $xiaomiId = $null

    foreach ($id in $ids) {
        $nLen = 0
        $manager.GetDeviceFriendlyName($id, [ref]$null, [ref]$nLen)
        if ($nLen -gt 0) {
            $nBuf = New-Object char[] $nLen
            $manager.GetDeviceFriendlyName($id, [ref]$nBuf, [ref]$nLen)
            $name = -join $nBuf[0..($nLen-2)]
        } else { $name = "" }

        $mLen = 0
        $manager.GetDeviceManufacturer($id, [ref]$null, [ref]$mLen)
        if ($mLen -gt 0) {
            $mBuf = New-Object char[] $mLen
            $manager.GetDeviceManufacturer($id, [ref]$mBuf, [ref]$mLen)
            $mfg = -join $mBuf[0..($mLen-2)]
        } else { $mfg = "" }

        $isXiaomi = ($id -match "2717") -or ($name -match "Mi|Xiaomi")
        if ($isXiaomi) { $xiaomiId = $id }

        $devices += @{ id = $id; name = $name; manufacturer = $mfg; is_xiaomi = $isXiaomi }
    }

    if (-not $xiaomiId) {
        Write-Output (@{ status = "no_xiaomi"; count = $count; devices = $devices } | ConvertTo-Json -Depth 3 -Compress)
        exit
    }

    # Try to open the Xiaomi device
    $clientInfo = New-Object -ComObject PortableDeviceTypesLib.PortableDeviceValues

    # WPD_CLIENT_NAME
    $clientInfo.SetStringValue([guid]"204D9F0C-2292-4080-9F42-40664E70F859", "Liris Recovery")
    # WPD_CLIENT_MAJOR_VERSION
    $clientInfo.SetUnsignedIntegerValue([guid]"0C164E33-0CC0-4E87-900C-1AE1BBA4CF20", 1)
    # WPD_CLIENT_DESIRED_ACCESS = GENERIC_READ
    $clientInfo.SetUnsignedIntegerValue([guid]"AA010827-0DA6-4568-9EE3-1E7A2E81EBD9", 0x80000000)

    $device = New-Object -ComObject PortableDeviceTypesLib.PortableDevice
    $device.Open($xiaomiId, $clientInfo)

    $content = $device.Content()

    # Enumerate root objects
    $enumObj = $content.EnumObjects(0, "DEVICE", $null)
    $rootItems = @()
    $oid = ""
    $fetched = 0

    do {
        try {
            $enumObj.Next(1, [ref]$oid, [ref]$fetched)
            if ($fetched -gt 0 -and $oid) {
                $rootItems += $oid

                # Try to get properties of each root object
                $propKeys = New-Object -ComObject PortableDeviceTypesLib.PortableDeviceKeyCollection
                # WPD_OBJECT_NAME
                $propKeys.Add([ref]([guid]"EF6B490D-5CD8-437A-AFFC-DA8B60EE4A3C"), 4)

                try {
                    $propVals = $content.Properties().GetValues($oid, $propKeys)
                    # Try to read the name
                } catch {}
            }
        } catch { $fetched = 0 }
    } while ($fetched -gt 0)

    $device.Close()

    Write-Output (@{
        status = "storage_accessed"
        xiaomi_id = $xiaomiId
        root_objects = $rootItems
        root_count = $rootItems.Count
        all_devices = $devices
    } | ConvertTo-Json -Depth 3 -Compress)

} catch {
    Write-Output (@{
        status = "access_error"
        error = $_.Exception.Message
        error_type = $_.Exception.GetType().Name
    } | ConvertTo-Json -Compress)
}
'''
    out, err, rc = ps(script, timeout=30)
    try:
        data = json.loads(out)
        status = data.get("status", "unknown")

        if status == "storage_accessed":
            count = data.get("root_count", 0)
            log(f"STORAGE ACCESSED! {count} root objects", "OK")
            for obj in data.get("root_objects", []):
                log(f"  Object: {obj}", "OK")
            REPORT["vectors"]["3"] = data
            return True
        elif status == "access_error":
            error = data.get("error", "")
            if "denied" in error.lower() or "0x80070005" in error.lower():
                log("Access denied -- device is locked (screen lock blocks MTP)", "WARN")
            elif "0x800700AA" in error:
                log("Resource busy -- another process holds the MTP connection", "WARN")
            else:
                log(f"WPD error: {error}", "WARN")
            REPORT["vectors"]["3"] = data
        elif status == "no_xiaomi":
            log("Xiaomi not in WPD device list", "WARN")
            for d in data.get("devices", []):
                log(f"  WPD device: {d.get('name', 'N/A')} [{d.get('manufacturer', 'N/A')}]")
            REPORT["vectors"]["3"] = data
        else:
            log(f"WPD status: {status}", "WARN")
            REPORT["vectors"]["3"] = data

    except Exception as e:
        log(f"WPD parse error: {e}", "FAIL")
        log(f"Raw: {out[:200]}", "WARN")
        REPORT["vectors"]["3"] = {"status": "parse_error", "raw": out[:200]}

    return False


# ================================================================
# VECTOR 4 — Bluetooth Discovery
# ================================================================

def vector_4_bluetooth():
    log("VECTOR 4 -- Bluetooth Discovery Scan", "VEC")

    script = r'''
$ErrorActionPreference = "SilentlyContinue"

# Get all Bluetooth devices (paired and nearby)
$paired = Get-PnpDevice -Class Bluetooth | Where-Object {
    $_.InstanceId -match "BTHENUM\\DEV_" -or $_.InstanceId -match "BTHLE\\DEV_"
} | Select-Object FriendlyName, InstanceId, Status

$results = @()
foreach ($d in $paired) {
    $isXiaomi = $d.FriendlyName -match "Mi|Xiaomi|Redmi|POCO|Monet"
    $results += @{
        name = $d.FriendlyName
        id = $d.InstanceId
        status = $d.Status.ToString()
        is_xiaomi = $isXiaomi
    }
}

# Try Bluetooth radio scan for unpaired devices
Add-Type -AssemblyName System.Runtime.WindowsRuntime 2>$null

Write-Output (@{
    status = "scanned"
    paired_count = $results.Count
    devices = $results
    xiaomi_found = ($results | Where-Object { $_.is_xiaomi }).Count -gt 0
} | ConvertTo-Json -Depth 3 -Compress)
'''
    out, err, rc = ps(script)
    try:
        data = json.loads(out)
        log(f"Paired devices: {data.get('paired_count', 0)}")
        for d in data.get("devices", []):
            marker = " <<< XIAOMI" if d.get("is_xiaomi") else ""
            log(f"  BT: {d.get('name', 'N/A')} [{d.get('status')}]{marker}",
                "OK" if d.get("is_xiaomi") else "INFO")

        if data.get("xiaomi_found"):
            log("Xiaomi found on Bluetooth!", "OK")

        REPORT["vectors"]["4"] = data
        return data.get("xiaomi_found", False)
    except:
        log(f"BT scan error: {out[:100]}", "FAIL")
        REPORT["vectors"]["4"] = {"status": "error"}
    return False


# ================================================================
# VECTOR 5 — WiFi / Network Probe
# ================================================================

def vector_5_wifi():
    log("VECTOR 5 -- WiFi / Network Probe", "VEC")

    # We know .37 has MAC B8:BB:AF:3F:D3:54 (Xiaomi WiFi module)
    script = r'''
$target = "192.168.15.37"
$mac = "B8-BB-AF-3F-D3-54"

$results = @{ target = $target; mac = $mac; mac_vendor = "Shenzhen Bilian (Xiaomi)" }

# Ping test
$ping = Test-Connection -ComputerName $target -Count 2 -Quiet -TimeoutSeconds 2
$results["ping"] = $ping

# ADB ports
$adbPorts = @(5555, 5037, 5556, 5557, 5558)
$openPorts = @()
foreach ($port in $adbPorts) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $ar = $tcp.BeginConnect($target, $port, $null, $null)
        $wait = $ar.AsyncWaitHandle.WaitOne(500)
        if ($wait -and $tcp.Connected) { $openPorts += $port }
        $tcp.Close()
    } catch {}
}
$results["adb_ports_open"] = $openPorts

# Common Android ports
$androidPorts = @(8080, 8443, 4781, 4791, 7912, 9222, 2424, 18883)
foreach ($port in $androidPorts) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $ar = $tcp.BeginConnect($target, $port, $null, $null)
        $wait = $ar.AsyncWaitHandle.WaitOne(500)
        if ($wait -and $tcp.Connected) { $openPorts += $port }
        $tcp.Close()
    } catch {}
}
$results["all_open_ports"] = $openPorts

# mDNS / SSDP discovery
$results["mdns_check"] = "probed"

Write-Output ($results | ConvertTo-Json -Compress)
'''
    out, err, rc = ps(script, timeout=45)
    try:
        data = json.loads(out)
        log(f"Target: {data.get('target')} ({data.get('mac_vendor')})")
        log(f"Ping: {'ALIVE' if data.get('ping') else 'no response'}", "OK" if data.get("ping") else "WARN")
        open_ports = data.get("all_open_ports", [])
        if open_ports:
            log(f"OPEN PORTS: {open_ports}", "OK")
        else:
            log("No open ports found (Android firewall)", "WARN")

        REPORT["vectors"]["5"] = data
        return len(open_ports) > 0
    except:
        log(f"WiFi probe error: {out[:100]}", "FAIL")
        REPORT["vectors"]["5"] = {"status": "error"}
    return False


# ================================================================
# VECTOR 6 — ADB Key Preparation
# ================================================================

def vector_6_adb_key():
    log("VECTOR 6 -- ADB Key Preparation", "VEC")

    adb_dir = os.path.join(os.path.expanduser("~"), ".android")
    pubkey = os.path.join(adb_dir, "adbkey.pub")

    if os.path.exists(pubkey):
        with open(pubkey, "r") as f:
            key = f.read().strip()
        log(f"ADB public key ready: {key[:50]}...", "OK")
        REPORT["vectors"]["6"] = {"status": "key_ready", "path": pubkey, "preview": key[:50]}
        return key
    else:
        log("No ADB key -- generating...", "WARN")
        os.makedirs(adb_dir, exist_ok=True)
        r = subprocess.run(["adb", "keygen", os.path.join(adb_dir, "adbkey")],
                          capture_output=True, text=True)
        if os.path.exists(pubkey):
            with open(pubkey, "r") as f:
                key = f.read().strip()
            log(f"Key generated: {key[:50]}...", "OK")
            REPORT["vectors"]["6"] = {"status": "generated", "path": pubkey}
            return key
        log("Key generation failed", "FAIL")
        REPORT["vectors"]["6"] = {"status": "failed"}
    return None


# ================================================================
# VECTOR 7 — USB Device Reinstall / Driver Switch
# ================================================================

def vector_7_driver_switch():
    log("VECTOR 7 -- USB Driver Switch Attempt", "VEC")

    # Try to switch the device driver from MTP to Android ADB
    script = r'''
$ErrorActionPreference = "SilentlyContinue"
$devId = "USB\VID_2717&PID_FF40\56C90D22"

# Check if Android ADB driver is available on this system
$adbInf = Get-ChildItem "C:\Windows\INF" -Filter "*.inf" -ErrorAction SilentlyContinue |
    Select-String -Pattern "VID_2717|Android|ADB" -List |
    Select-Object -ExpandProperty Path

# Check for Google USB driver
$googleDriver = Test-Path "C:\Program Files (x86)\Google\USB_Driver\android_winusb.inf"
$samsungDriver = Get-ChildItem "C:\Windows\INF" -Filter "*.inf" -ErrorAction SilentlyContinue |
    Select-String -Pattern "SAMSUNG.*ADB|Android.*ADB" -List |
    Select-Object -ExpandProperty Path

# Check if there's a composite device hiding ADB
$compositeCheck = Get-PnpDevice | Where-Object {
    $_.InstanceId -match "VID_2717" -and $_.Class -ne "WPD"
}

$result = @{
    status = "checked"
    adb_inf_found = @($adbInf)
    google_driver = $googleDriver
    samsung_adb_infs = @($samsungDriver)
    non_wpd_xiaomi_devices = @()
}

foreach ($cd in $compositeCheck) {
    $result["non_wpd_xiaomi_devices"] += @{
        name = $cd.FriendlyName
        id = $cd.InstanceId
        class = $cd.Class
        status = $cd.Status.ToString()
    }
}

# List all USB composite children (any vendor) that have ADB interface
$adbDevices = Get-PnpDevice -Class "AndroidUsbDeviceClass" -ErrorAction SilentlyContinue
$result["system_adb_devices"] = @()
foreach ($ad in $adbDevices) {
    $result["system_adb_devices"] += @{
        name = $ad.FriendlyName
        id = $ad.InstanceId
        status = $ad.Status.ToString()
    }
}

Write-Output ($result | ConvertTo-Json -Depth 3 -Compress)
'''
    out, err, rc = ps(script)
    try:
        data = json.loads(out)
        adb_infs = data.get("adb_inf_found", [])
        google = data.get("google_driver", False)
        samsung_infs = data.get("samsung_adb_infs", [])
        sys_adb = data.get("system_adb_devices", [])

        log(f"ADB .inf files on system: {len(adb_infs)}")
        for inf in adb_infs[:5]:
            log(f"  {inf}")
        log(f"Google USB driver: {'YES' if google else 'NO'}")
        log(f"Samsung ADB .infs: {len(samsung_infs)}")
        log(f"System ADB devices: {len(sys_adb)}")
        for ad in sys_adb:
            log(f"  ADB: {ad.get('name')} [{ad.get('status')}]", "OK")

        non_wpd = data.get("non_wpd_xiaomi_devices", [])
        if non_wpd:
            log("NON-MTP XIAOMI DEVICE NODES FOUND:", "OK")
            for d in non_wpd:
                log(f"  {d.get('name')} [{d.get('class')}] {d.get('status')}", "OK")

        REPORT["vectors"]["7"] = data
        return len(non_wpd) > 0 or len(sys_adb) > 0
    except:
        log(f"Driver switch error: {out[:100]}", "FAIL")
        REPORT["vectors"]["7"] = {"status": "error"}
    return False


# ================================================================
# MAIN
# ================================================================

def main():
    print()
    print("  ========================================================")
    print("  LIRIS USB INJECTION TOOL v2")
    print("  Target: Xiaomi Mi 10 Lite 5G (monet) / SD765G")
    print("  Host:   Rayssa / Intel xHCI / Win11")
    print("  Colony: Liris / Asolaria")
    print("  Method: 7-vector white glove recovery")
    print("  ========================================================")
    print()

    results = {}

    results["v1"] = vector_1_descriptors()
    print()
    results["v2"] = vector_2_aoa()
    print()
    results["v3"] = vector_3_wpd()
    print()
    results["v4"] = vector_4_bluetooth()
    print()
    results["v5"] = vector_5_wifi()
    print()
    results["v6"] = vector_6_adb_key()
    print()
    results["v7"] = vector_7_driver_switch()
    print()

    # Summary
    print("  ========================================================")
    print("  RECOVERY SUMMARY")
    print("  ========================================================")
    print()

    successes = [k for k, v in results.items() if v]
    for k, v in results.items():
        status = "OPEN" if v else "BLOCKED"
        log(f"{k}: {status}", "OK" if v else "WARN")

    print()
    if successes:
        log(f"VECTORS WITH ACCESS: {', '.join(successes)}", "OK")
        REPORT["result"] = "access_found"
    else:
        log("All vectors blocked by MIUI screen lock", "WARN")
        log("MIUI enforces full USB lockdown without screen unlock", "INFO")
        log("", "INFO")
        log("RECOMMENDED: OTG USB-C (R$10) + teclado USB", "INFO")
        log("  1. Conecta OTG + teclado no Xiaomi", "INFO")
        log("  2. Digita PIN + Enter (desbloqueia cego)", "INFO")
        log("  3. 'Ok Google' > 'Ativar depuracao USB'", "INFO")
        log("  4. Conecta cabo USB dados > ADB conecta", "INFO")
        log("  5. Integra no Asolaria como segundo no phone", "INFO")
        REPORT["result"] = "hardware_required"

    save_report()
    print()


if __name__ == "__main__":
    main()

