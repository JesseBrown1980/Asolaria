# Restart Xiaomi USB device to apply libusbK driver
$id = "USB\VID_2717&PID_FF40\56C90D22"

Write-Host "Disabling..." -ForegroundColor Yellow
pnputil /disable-device $id
Start-Sleep 3

Write-Host "Enabling..." -ForegroundColor Green
pnputil /enable-device $id
Start-Sleep 3

Write-Host "Result:" -ForegroundColor Cyan
$d = Get-PnpDevice -InstanceId $id -ErrorAction SilentlyContinue
Write-Host "Name: $($d.FriendlyName)"
Write-Host "Class: $($d.Class)"
Write-Host "Status: $($d.Status)"
$d | Select-Object FriendlyName, Class, Status | Out-File "C:\Users\rayss\xiaomi-recover\restart_result.txt" -Encoding UTF8
Write-Host "Done. Press Enter."
Read-Host

