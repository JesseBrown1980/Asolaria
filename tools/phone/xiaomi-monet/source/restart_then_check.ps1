# Restart device AFTER Zadig install to force new driver load
$id = "USB\VID_2717&PID_FF40\56C90D22"

Write-Host "BEFORE:" -ForegroundColor Yellow
$d = Get-PnpDevice -InstanceId $id
Write-Host "  Class=$($d.Class) Status=$($d.Status) Name=$($d.FriendlyName)"

Write-Host "`nRestarting device..." -ForegroundColor Cyan
pnputil /restart-device $id
Start-Sleep 5

Write-Host "`nAFTER:" -ForegroundColor Green
$d2 = Get-PnpDevice -InstanceId $id -ErrorAction SilentlyContinue
if ($d2) {
    Write-Host "  Class=$($d2.Class) Status=$($d2.Status) Name=$($d2.FriendlyName)"
    "Class=$($d2.Class) Status=$($d2.Status) Name=$($d2.FriendlyName)" | Out-File "C:\Users\rayss\xiaomi-recover\restart_check.txt" -Encoding UTF8
} else {
    # Device might have new instance after restart
    Write-Host "  Original instance gone. Scanning for VID 2717..." -ForegroundColor Yellow
    $d3 = Get-PnpDevice | Where-Object { $_.InstanceId -like '*2717*' }
    if ($d3) {
        Write-Host "  FOUND: Class=$($d3.Class) Status=$($d3.Status) Name=$($d3.FriendlyName) ID=$($d3.InstanceId)"
        "Class=$($d3.Class) Status=$($d3.Status) Name=$($d3.FriendlyName)" | Out-File "C:\Users\rayss\xiaomi-recover\restart_check.txt" -Encoding UTF8
    } else {
        "DEVICE_GONE" | Out-File "C:\Users\rayss\xiaomi-recover\restart_check.txt" -Encoding UTF8
    }
}

