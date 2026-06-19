# THE KEY SWAP — LX-130 > LX-131 > LX-132
# Disable MTP driver, launch scrcpy --otg in the gap
# The selector swap: MTP -> raw USB -> scrcpy AOA keyboard -> type PIN -> ADB

$devId = "USB\VID_2717&PID_FF40\56C90D22"
$scrcpy = "C:\Users\rayss\AppData\Local\Microsoft\WinGet\Packages\Genymobile.scrcpy_Microsoft.Winget.Source_8wekyb3d8bbwe\scrcpy-win64-v3.3.4\scrcpy.exe"

Write-Host "=== THE KEY SWAP ===" -ForegroundColor Cyan
Write-Host "Step 1: Killing ADB server..." -ForegroundColor Yellow
& adb kill-server 2>$null
Start-Sleep 1

Write-Host "Step 2: Disabling MTP driver on Xiaomi..." -ForegroundColor Yellow
Disable-PnpDevice -InstanceId $devId -Confirm:$false -ErrorAction SilentlyContinue
Start-Sleep 1

Write-Host "Step 3: Re-enabling device..." -ForegroundColor Yellow
Enable-PnpDevice -InstanceId $devId -Confirm:$false -ErrorAction SilentlyContinue

Write-Host "Step 4: LAUNCHING SCRCPY OTG IMMEDIATELY!" -ForegroundColor Green
# Launch scrcpy in OTG mode - it will grab the device via libusb before MTP reclaims
Start-Process -FilePath $scrcpy -ArgumentList "--otg" -NoNewWindow
Start-Sleep 5

Write-Host "Step 5: Checking..." -ForegroundColor Yellow
$dev = Get-PnpDevice -InstanceId $devId -ErrorAction SilentlyContinue
Write-Host "Device status: $($dev.Status)" -ForegroundColor Cyan

