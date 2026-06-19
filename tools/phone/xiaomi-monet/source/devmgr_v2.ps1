# Force libusbK on Xiaomi - v2 (no PRESENT filter)
# Must run as Administrator

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class SetupApi2 {
    [StructLayout(LayoutKind.Sequential)]
    public struct SP_DEVINFO_DATA {
        public int cbSize;
        public Guid ClassGuid;
        public int DevInst;
        public IntPtr Reserved;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct SP_DRVINFO_DATA {
        public int cbSize;
        public int DriverType;
        public IntPtr Reserved;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
        public string Description;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
        public string MfgName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
        public string ProviderName;
        public System.Runtime.InteropServices.ComTypes.FILETIME DriverDate;
        public long DriverVersion;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct SP_DEVINSTALL_PARAMS {
        public int cbSize;
        public int Flags;
        public int FlagsEx;
        public IntPtr hwndParent;
        public IntPtr InstallMsgHandler;
        public IntPtr InstallMsgHandlerContext;
        public IntPtr FileQueue;
        public IntPtr ClassInstallReserved;
        public int Reserved;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
        public string DriverPath;
    }

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern IntPtr SetupDiGetClassDevs(IntPtr ClassGuid, string Enumerator, IntPtr hwndParent, int Flags);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiEnumDeviceInfo(IntPtr DeviceInfoSet, int MemberIndex, ref SP_DEVINFO_DATA DeviceInfoData);

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool SetupDiGetDeviceInstanceId(IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, StringBuilder DeviceInstanceId, int DeviceInstanceIdSize, out int RequiredSize);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiBuildDriverInfoList(IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, int DriverType);

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool SetupDiEnumDriverInfo(IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, int DriverType, int MemberIndex, ref SP_DRVINFO_DATA DriverInfoData);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiSetSelectedDriver(IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, ref SP_DRVINFO_DATA DriverInfoData);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiGetDeviceInstallParams(IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, ref SP_DEVINSTALL_PARAMS DeviceInstallParams);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiSetDeviceInstallParams(IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, ref SP_DEVINSTALL_PARAMS DeviceInstallParams);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiDestroyDeviceInfoList(IntPtr DeviceInfoSet);

    [DllImport("newdev.dll", SetLastError = true)]
    public static extern bool DiInstallDevice(IntPtr hwndParent, IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, ref SP_DRVINFO_DATA DriverInfoData, int Flags, out bool NeedReboot);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiCallClassInstaller(int InstallFunction, IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData);
}
"@

$targetId = "USB\VID_2717&PID_FF40\56C90D22"

Write-Host "=== Finding Xiaomi (all devices, no PRESENT filter) ===" -ForegroundColor Cyan

# DIGCF_ALLCLASSES = 4 (no PRESENT flag)
$devInfoSet = [SetupApi2]::SetupDiGetClassDevs([IntPtr]::Zero, "USB", [IntPtr]::Zero, 4)
if ($devInfoSet -eq [IntPtr]::new(-1)) {
    Write-Host "SetupDiGetClassDevs failed!" -ForegroundColor Red
    Read-Host; exit
}

$devInfo = New-Object SetupApi2+SP_DEVINFO_DATA
$devInfo.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($devInfo)

$found = $false
$idx = 0
while ([SetupApi2]::SetupDiEnumDeviceInfo($devInfoSet, $idx, [ref]$devInfo)) {
    $sb = New-Object System.Text.StringBuilder 256
    $reqSize = 0
    if ([SetupApi2]::SetupDiGetDeviceInstanceId($devInfoSet, [ref]$devInfo, $sb, 256, [ref]$reqSize)) {
        if ($sb.ToString() -eq $targetId) {
            Write-Host "FOUND: $($sb.ToString())" -ForegroundColor Green
            $found = $true
            break
        }
    }
    $idx++
}

if (-not $found) {
    Write-Host "Device not found even without PRESENT filter!" -ForegroundColor Red
    "NOT_FOUND" | Out-File "C:\Users\rayss\xiaomi-recover\devmgr_result.txt" -Encoding UTF8
    Read-Host; exit
}

# Point to INF directory
Write-Host "=== Setting driver search path ===" -ForegroundColor Cyan
$params = New-Object SetupApi2+SP_DEVINSTALL_PARAMS
$params.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($params)
[SetupApi2]::SetupDiGetDeviceInstallParams($devInfoSet, [ref]$devInfo, [ref]$params) | Out-Null
$params.DriverPath = "C:\Users\rayss\xiaomi-recover\oem64_export"
$params.FlagsEx = $params.FlagsEx -bor 0x800  # ALLOWEXCLUDEDDRVS
[SetupApi2]::SetupDiSetDeviceInstallParams($devInfoSet, [ref]$devInfo, [ref]$params) | Out-Null

# Build compatible driver list
Write-Host "=== Building compatible driver list ===" -ForegroundColor Cyan
$buildOk = [SetupApi2]::SetupDiBuildDriverInfoList($devInfoSet, [ref]$devInfo, 2)
Write-Host "Build result: $buildOk (err=$([System.Runtime.InteropServices.Marshal]::GetLastWin32Error()))"

# Enumerate
$drvIdx = 0
$bestDriver = $null
while ($true) {
    $drv = New-Object SetupApi2+SP_DRVINFO_DATA
    $drv.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($drv)
    if (-not [SetupApi2]::SetupDiEnumDriverInfo($devInfoSet, [ref]$devInfo, 2, $drvIdx, [ref]$drv)) { break }
    Write-Host "  [$drvIdx] $($drv.Description) | Provider=$($drv.ProviderName) | Mfg=$($drv.MfgName)"
    if ($drv.ProviderName -like "*libusbK*" -or $drv.Description -like "*libusbK*") {
        $bestDriver = $drv
        Write-Host "       ^^^ libusbK FOUND ^^^" -ForegroundColor Green
    }
    $drvIdx++
}
Write-Host "Compatible drivers found: $drvIdx"

# If no libusbK in compatible, try class drivers
if ($bestDriver -eq $null) {
    Write-Host ""
    Write-Host "=== Trying class driver list ===" -ForegroundColor Yellow
    [SetupApi2]::SetupDiBuildDriverInfoList($devInfoSet, [ref]$devInfo, 1) | Out-Null
    $drvIdx2 = 0
    while ($true) {
        $drv2 = New-Object SetupApi2+SP_DRVINFO_DATA
        $drv2.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($drv2)
        if (-not [SetupApi2]::SetupDiEnumDriverInfo($devInfoSet, [ref]$devInfo, 1, $drvIdx2, [ref]$drv2)) { break }
        if ($drv2.ProviderName -like "*libusbK*" -or $drv2.Description -like "*libusbK*") {
            Write-Host "  [$drvIdx2] $($drv2.Description) | $($drv2.ProviderName) <<< FOUND" -ForegroundColor Green
            $bestDriver = $drv2
        }
        $drvIdx2++
    }
    Write-Host "Class drivers scanned: $drvIdx2"
}

if ($bestDriver -ne $null) {
    Write-Host ""
    Write-Host "=== INSTALLING libusbK ===" -ForegroundColor Green

    $selOk = [SetupApi2]::SetupDiSetSelectedDriver($devInfoSet, [ref]$devInfo, [ref]$bestDriver)
    Write-Host "SetSelectedDriver: $selOk"

    $reboot = $false
    $instOk = [SetupApi2]::DiInstallDevice([IntPtr]::Zero, $devInfoSet, [ref]$devInfo, [ref]$bestDriver, 0, [ref]$reboot)
    $instErr = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Host "DiInstallDevice: $instOk (err=$instErr, reboot=$reboot)"

    if (-not $instOk) {
        Write-Host "Trying CallClassInstaller(DIF_INSTALLDEVICE)..." -ForegroundColor Yellow
        $callOk = [SetupApi2]::SetupDiCallClassInstaller(6, $devInfoSet, [ref]$devInfo)
        $callErr = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
        Write-Host "CallClassInstaller: $callOk (err=$callErr)"
    }
} else {
    Write-Host ""
    Write-Host "NO libusbK driver found in any list!" -ForegroundColor Red
}

# Final check
Write-Host ""
Write-Host "=== Final state ===" -ForegroundColor Cyan
$d = Get-PnpDevice -InstanceId $targetId -ErrorAction SilentlyContinue
$result = "Class=$($d.Class) Status=$($d.Status) Name=$($d.FriendlyName)"
Write-Host $result
$result | Out-File "C:\Users\rayss\xiaomi-recover\devmgr_result.txt" -Encoding UTF8

[SetupApi2]::SetupDiDestroyDeviceInfoList($devInfoSet) | Out-Null
Write-Host "Press Enter to close."
Read-Host

