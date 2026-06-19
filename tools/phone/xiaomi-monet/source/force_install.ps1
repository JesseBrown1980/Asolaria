# Force libusbK driver onto Xiaomi Mi 10 Lite 5G
# Must run as Administrator

$infPath = "C:\Users\rayss\xiaomi-recover\oem64_export\libusbk_generic_device.inf"
$customInf = "C:\Users\rayss\xiaomi-recover\xiaomi_libusbk.inf"
$instanceId = "USB\VID_2717&PID_FF40\56C90D22"

Write-Host "=== STEP 1: Copy custom INF to driver export folder ===" -ForegroundColor Cyan
Copy-Item $customInf "C:\Users\rayss\xiaomi-recover\oem64_export\xiaomi_libusbk.inf" -Force

Write-Host "=== STEP 2: Add custom INF to driver store ===" -ForegroundColor Cyan
pnputil /add-driver "C:\Users\rayss\xiaomi-recover\oem64_export\xiaomi_libusbk.inf" /install

Write-Host ""
Write-Host "=== STEP 3: Disable Xiaomi ===" -ForegroundColor Cyan
pnputil /disable-device $instanceId

Start-Sleep 2

Write-Host ""
Write-Host "=== STEP 4: Remove Xiaomi device ===" -ForegroundColor Cyan
pnputil /remove-device $instanceId

Start-Sleep 2

Write-Host ""
Write-Host "=== STEP 5: Scan for hardware changes ===" -ForegroundColor Cyan
pnputil /scan-devices

Start-Sleep 3

Write-Host ""
Write-Host "=== STEP 6: Check result ===" -ForegroundColor Cyan
$dev = Get-PnpDevice -InstanceId $instanceId -ErrorAction SilentlyContinue
if ($dev) {
    Write-Host "FriendlyName: $($dev.FriendlyName)"
    Write-Host "Class: $($dev.Class)"
    Write-Host "Status: $($dev.Status)"

    if ($dev.Class -ne "WPD") {
        Write-Host ""
        Write-Host "SUCCESS! Driver changed from MTP!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "STILL MTP. Trying devcon updateni..." -ForegroundColor Yellow
    }
} else {
    Write-Host "Device not found after scan. Replug USB cable." -ForegroundColor Yellow
}

# Save result
$dev | Select-Object FriendlyName, Class, Status | Out-File "C:\Users\rayss\xiaomi-recover\force_result.txt" -Encoding UTF8

Write-Host ""
Write-Host "Result saved to force_result.txt"
Write-Host "Press Enter to close."
Read-Host

