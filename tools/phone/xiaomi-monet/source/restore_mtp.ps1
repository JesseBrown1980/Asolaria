# Restore MTP driver on Xiaomi
pnputil /remove-device "USB\VID_2717&PID_FF40\56C90D22"
Start-Sleep 3
pnputil /scan-devices
Start-Sleep 5
$d = Get-PnpDevice -InstanceId "USB\VID_2717&PID_FF40\56C90D22" -ErrorAction SilentlyContinue
"Class=$($d.Class) Status=$($d.Status)" | Out-File "C:\Users\rayss\xiaomi-recover\restore_result.txt" -Encoding UTF8
Write-Host "Result: Class=$($d.Class) Status=$($d.Status)"
Read-Host

