# Clean restore: remove device, delete Zadig leftovers, rescan
$id = "USB\VID_2717&PID_FF40\56C90D22"

Write-Host "Removing device..."
pnputil /remove-device $id /subtree 2>&1
Start-Sleep 2

Write-Host "Scanning for hardware..."
pnputil /scan-devices
Start-Sleep 5

$d = Get-PnpDevice -InstanceId $id -ErrorAction SilentlyContinue
if ($d) {
    "Class=$($d.Class) Status=$($d.Status)" | Out-File "C:\Users\rayss\xiaomi-recover\clean_result.txt" -Encoding UTF8
    Write-Host "Result: Class=$($d.Class) Status=$($d.Status)"
} else {
    "GONE" | Out-File "C:\Users\rayss\xiaomi-recover\clean_result.txt" -Encoding UTF8
    Write-Host "Device gone after remove. Replug cable."
}

