# Registry-level driver swap: MTP -> libusbK
# Must run as Administrator

$devKey = "HKLM:\SYSTEM\CurrentControlSet\Enum\USB\VID_2717&PID_FF40\56C90D22"

Write-Host "=== Current driver info ===" -ForegroundColor Cyan
$service = Get-ItemProperty $devKey -Name Service -ErrorAction SilentlyContinue
$class = Get-ItemProperty $devKey -Name ClassGUID -ErrorAction SilentlyContinue
Write-Host "Service: $($service.Service)"
Write-Host "ClassGUID: $($class.ClassGUID)"

Write-Host ""
Write-Host "=== STEP 1: Disable device ===" -ForegroundColor Cyan
pnputil /disable-device "USB\VID_2717&PID_FF40\56C90D22"
Start-Sleep 2

Write-Host ""
Write-Host "=== STEP 2: Change Service to libusbK ===" -ForegroundColor Yellow
Set-ItemProperty $devKey -Name "Service" -Value "libusbK"

# Change class to libusbk devices
$libusbkGUID = "{ECFB0CFD-74C4-4f52-BBF7-343461CD72AC}"
Set-ItemProperty $devKey -Name "ClassGUID" -Value $libusbkGUID

Write-Host "Service set to: libusbK"
Write-Host "ClassGUID set to: $libusbkGUID"

Write-Host ""
Write-Host "=== STEP 3: Enable device ===" -ForegroundColor Cyan
pnputil /enable-device "USB\VID_2717&PID_FF40\56C90D22"
Start-Sleep 3

Write-Host ""
Write-Host "=== STEP 4: Check result ===" -ForegroundColor Cyan
$dev = Get-PnpDevice -InstanceId "USB\VID_2717&PID_FF40\56C90D22" -ErrorAction SilentlyContinue
if ($dev) {
    Write-Host "FriendlyName: $($dev.FriendlyName)" -ForegroundColor White
    Write-Host "Class: $($dev.Class)" -ForegroundColor White
    Write-Host "Status: $($dev.Status)" -ForegroundColor White
} else {
    Write-Host "Device not found" -ForegroundColor Red
}

$dev | Select-Object FriendlyName, Class, Status | Out-File "C:\Users\rayss\xiaomi-recover\registry_result.txt" -Encoding UTF8

# Also verify registry
$svc2 = (Get-ItemProperty $devKey -Name Service).Service
Write-Host ""
Write-Host "Registry Service now: $svc2"

Write-Host ""
Write-Host "Press Enter to close."
Read-Host

