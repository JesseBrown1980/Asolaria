# Force driver update using UpdateDriverForPlugAndPlayDevices API
# This is what devcon.exe does internally
# Must run as Administrator

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class DriverInstaller {
    [DllImport("newdev.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool UpdateDriverForPlugAndPlayDevices(
        IntPtr hwndParent,
        string HardwareId,
        string FullInfPath,
        uint InstallFlags,
        out bool bRebootRequired
    );

    public const uint INSTALLFLAG_FORCE = 0x00000001;
}
"@

$infPath = "C:\Users\rayss\xiaomi-recover\oem64_export\xiaomi_libusbk.inf"
$hardwareId = "USB\VID_2717&PID_FF40"

Write-Host "=== Force Driver Update ===" -ForegroundColor Cyan
Write-Host "INF: $infPath"
Write-Host "HardwareID: $hardwareId"
Write-Host ""

$reboot = $false
$result = [DriverInstaller]::UpdateDriverForPlugAndPlayDevices(
    [IntPtr]::Zero,
    $hardwareId,
    $infPath,
    1,  # INSTALLFLAG_FORCE
    [ref]$reboot
)

$err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()

if ($result) {
    Write-Host "SUCCESS! Driver forced onto device." -ForegroundColor Green
    if ($reboot) {
        Write-Host "Reboot required." -ForegroundColor Yellow
    }
} else {
    Write-Host "FAILED. Error code: $err" -ForegroundColor Red
    # Common errors:
    # 2 = file not found
    # 13 = data invalid
    # 87 = invalid parameter
    # 0xE0000228 = no matching devices
    # 0xE000023F = driver not signed
    Write-Host "Hex: 0x$($err.ToString('X8'))" -ForegroundColor Red
}

# Check device state
Write-Host ""
Write-Host "=== Device State ===" -ForegroundColor Cyan
$d = Get-PnpDevice -InstanceId "USB\VID_2717&PID_FF40\56C90D22" -ErrorAction SilentlyContinue
if ($d) {
    Write-Host "Name: $($d.FriendlyName)"
    Write-Host "Class: $($d.Class)"
    Write-Host "Status: $($d.Status)"
}

"Result=$result Error=$err Reboot=$reboot Class=$($d.Class)" | Out-File "C:\Users\rayss\xiaomi-recover\force_driver_result.txt" -Encoding UTF8

Write-Host ""
Write-Host "Press Enter to close."
Read-Host

