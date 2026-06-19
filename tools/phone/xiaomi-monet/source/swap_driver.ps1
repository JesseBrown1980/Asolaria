# Swap Xiaomi from MTP to libusbK
# Run as Administrator

$instanceId = "USB\VID_2717&PID_FF40\56C90D22"

Write-Host "=== STEP 1: Disable MTP device ==="
Disable-PnpDevice -InstanceId $instanceId -Confirm:$false
Start-Sleep -Seconds 2

Write-Host "=== STEP 2: Remove device ==="
pnputil /remove-device $instanceId
Start-Sleep -Seconds 2

Write-Host "=== STEP 3: Re-install with libusbK ==="
pnputil /add-driver "C:\Windows\INF\oem64.inf" /install
Start-Sleep -Seconds 2

Write-Host "=== STEP 4: Scan for hardware changes ==="
pnputil /scan-devices
Start-Sleep -Seconds 3

Write-Host "=== STEP 5: Check result ==="
Get-PnpDevice -InstanceId $instanceId | Select-Object FriendlyName, Class, Status | Format-List

Write-Host "DONE. Press Enter to close."
Read-Host

