# Automate "Update Driver > Let me pick from list" via SetupDi APIs
# Must run as Administrator

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class SetupApi {
    public const int DIGCF_DEVICEINTERFACE = 0x10;
    public const int DIGCF_PRESENT = 0x02;
    public const int DIGCF_ALLCLASSES = 0x04;
    public const int SPDRP_HARDWAREID = 0x01;
    public const int SPDRP_FRIENDLYNAME = 0x0C;
    public const int SPDRP_SERVICE = 0x04;
    public const int DI_FLAGSEX_ALLOWEXCLUDEDDRVS = 0x00000800;
    public const int DI_FLAGSEX_INSTALLEDDRIVER = 0x04000000;
    public const int DIF_SELECTBESTCOMPATDRV = 0x17;
    public const int DIF_INSTALLDEVICE = 0x06;

    [StructLayout(LayoutKind.Sequential)]
    public struct SP_DEVINFO_DATA {
        public int cbSize;
        public Guid ClassGuid;
        public int DevInst;
        public IntPtr Reserved;
    }

    [StructLayout(LayoutKind.Sequential)]
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

    [StructLayout(LayoutKind.Sequential)]
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

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern IntPtr SetupDiCreateDeviceInfoList(IntPtr ClassGuid, IntPtr hwndParent);

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern IntPtr SetupDiGetClassDevs(IntPtr ClassGuid, string Enumerator, IntPtr hwndParent, int Flags);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiEnumDeviceInfo(IntPtr DeviceInfoSet, int MemberIndex, ref SP_DEVINFO_DATA DeviceInfoData);

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool SetupDiGetDeviceInstanceId(IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, StringBuilder DeviceInstanceId, int DeviceInstanceIdSize, out int RequiredSize);

    [DllImport("setupapi.dll", SetLastError = true, CharSet = CharSet.Unicode)]
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
    public static extern bool SetupDiCallClassInstaller(int InstallFunction, IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData);

    [DllImport("setupapi.dll", SetLastError = true)]
    public static extern bool SetupDiDestroyDeviceInfoList(IntPtr DeviceInfoSet);

    [DllImport("newdev.dll", SetLastError = true)]
    public static extern bool DiInstallDevice(IntPtr hwndParent, IntPtr DeviceInfoSet, ref SP_DEVINFO_DATA DeviceInfoData, ref SP_DRVINFO_DATA DriverInfoData, int Flags, out bool NeedReboot);
}
"@

$targetInstanceId = "USB\VID_2717&PID_FF40\56C90D22"

Write-Host "=== Finding Xiaomi device ===" -ForegroundColor Cyan

# Get all devices
$devInfoSet = [SetupApi]::SetupDiGetClassDevs([IntPtr]::Zero, "USB", [IntPtr]::Zero, 6) # PRESENT | ALLCLASSES

$devInfo = New-Object SetupApi+SP_DEVINFO_DATA
$devInfo.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($devInfo)

$found = $false
$idx = 0
while ([SetupApi]::SetupDiEnumDeviceInfo($devInfoSet, $idx, [ref]$devInfo)) {
    $sb = New-Object System.Text.StringBuilder 256
    $reqSize = 0
    if ([SetupApi]::SetupDiGetDeviceInstanceId($devInfoSet, [ref]$devInfo, $sb, 256, [ref]$reqSize)) {
        if ($sb.ToString() -eq $targetInstanceId) {
            Write-Host "Found: $($sb.ToString())" -ForegroundColor Green
            $found = $true
            break
        }
    }
    $idx++
}

if (-not $found) {
    Write-Host "Device not found!" -ForegroundColor Red
    Read-Host; exit
}

# Set DriverPath to our INF directory
Write-Host "=== Setting driver path ===" -ForegroundColor Cyan
$installParams = New-Object SetupApi+SP_DEVINSTALL_PARAMS
$installParams.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($installParams)
[SetupApi]::SetupDiGetDeviceInstallParams($devInfoSet, [ref]$devInfo, [ref]$installParams) | Out-Null
$installParams.DriverPath = "C:\Users\rayss\xiaomi-recover\oem64_export"
$installParams.FlagsEx = $installParams.FlagsEx -bor 0x800 # DI_FLAGSEX_ALLOWEXCLUDEDDRVS
[SetupApi]::SetupDiSetDeviceInstallParams($devInfoSet, [ref]$devInfo, [ref]$installParams) | Out-Null

# Build compatible driver list (type 2 = SPDIT_COMPATDRIVER)
Write-Host "=== Building driver list ===" -ForegroundColor Cyan
$buildResult = [SetupApi]::SetupDiBuildDriverInfoList($devInfoSet, [ref]$devInfo, 2)
$buildErr = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
Write-Host "BuildDriverInfoList: $buildResult (err=$buildErr)"

# Enumerate available drivers
Write-Host "=== Available drivers ===" -ForegroundColor Cyan
$drvIdx = 0
$libusbkDriver = $null
while ($true) {
    $drvInfo = New-Object SetupApi+SP_DRVINFO_DATA
    $drvInfo.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($drvInfo)

    if (-not [SetupApi]::SetupDiEnumDriverInfo($devInfoSet, [ref]$devInfo, 2, $drvIdx, [ref]$drvInfo)) {
        break
    }

    Write-Host "  [$drvIdx] $($drvInfo.Description) - Provider: $($drvInfo.ProviderName) - Mfg: $($drvInfo.MfgName)"

    if ($drvInfo.ProviderName -like "*libusbK*" -or $drvInfo.Description -like "*libusbK*") {
        $libusbkDriver = $drvInfo
        Write-Host "  >>> THIS IS libusbK! <<<" -ForegroundColor Green
    }

    $drvIdx++
}

Write-Host "Total drivers found: $drvIdx"

if ($libusbkDriver -ne $null) {
    Write-Host ""
    Write-Host "=== Installing libusbK driver ===" -ForegroundColor Cyan

    # Select the libusbK driver
    $selResult = [SetupApi]::SetupDiSetSelectedDriver($devInfoSet, [ref]$devInfo, [ref]$libusbkDriver)
    $selErr = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Host "SetSelectedDriver: $selResult (err=$selErr)"

    # Install
    $needReboot = $false
    $instResult = [SetupApi]::DiInstallDevice([IntPtr]::Zero, $devInfoSet, [ref]$devInfo, [ref]$libusbkDriver, 0, [ref]$needReboot)
    $instErr = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Host "DiInstallDevice: $instResult (err=$instErr, reboot=$needReboot)"

    if ($instResult) {
        Write-Host "SUCCESS!" -ForegroundColor Green
    } else {
        Write-Host "Failed. Trying SetupDiCallClassInstaller..." -ForegroundColor Yellow
        $callResult = [SetupApi]::SetupDiCallClassInstaller(6, $devInfoSet, [ref]$devInfo) # DIF_INSTALLDEVICE
        $callErr = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
        Write-Host "CallClassInstaller: $callResult (err=$callErr)"
    }
} else {
    Write-Host "libusbK not found in compatible drivers list!" -ForegroundColor Red
    Write-Host "Trying class driver list (type 1)..." -ForegroundColor Yellow

    # Try class drivers instead
    $buildResult2 = [SetupApi]::SetupDiBuildDriverInfoList($devInfoSet, [ref]$devInfo, 1)
    $drvIdx2 = 0
    while ($true) {
        $drvInfo2 = New-Object SetupApi+SP_DRVINFO_DATA
        $drvInfo2.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($drvInfo2)
        if (-not [SetupApi]::SetupDiEnumDriverInfo($devInfoSet, [ref]$devInfo, 1, $drvIdx2, [ref]$drvInfo2)) { break }
        Write-Host "  [$drvIdx2] $($drvInfo2.Description) - $($drvInfo2.ProviderName)"
        if ($drvInfo2.ProviderName -like "*libusbK*") {
            $libusbkDriver = $drvInfo2
            Write-Host "  >>> FOUND libusbK in class list! <<<" -ForegroundColor Green
        }
        $drvIdx2++
    }
    Write-Host "Total class drivers: $drvIdx2"
}

# Check final state
Write-Host ""
Write-Host "=== Final device state ===" -ForegroundColor Cyan
$d = Get-PnpDevice -InstanceId $targetInstanceId -ErrorAction SilentlyContinue
Write-Host "Name: $($d.FriendlyName)"
Write-Host "Class: $($d.Class)"
Write-Host "Status: $($d.Status)"

"Class=$($d.Class) Status=$($d.Status) Name=$($d.FriendlyName)" | Out-File "C:\Users\rayss\xiaomi-recover\devmgr_result.txt" -Encoding UTF8

[SetupApi]::SetupDiDestroyDeviceInfoList($devInfoSet) | Out-Null

Write-Host ""
Write-Host "Press Enter to close."
Read-Host

