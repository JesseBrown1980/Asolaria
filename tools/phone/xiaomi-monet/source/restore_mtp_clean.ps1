$id = "USB\VID_2717&PID_FF40\56C90D22"
pnputil /remove-device $id /subtree 2>&1
Start-Sleep 3
pnputil /scan-devices 2>&1
Start-Sleep 5
$d = Get-PnpDevice -InstanceId $id -ErrorAction SilentlyContinue
"Name=$($d.FriendlyName) Class=$($d.Class) Status=$($d.Status)" | Out-File "C:\Users\rayss\xiaomi-recover\mtp_restore.txt" -Encoding UTF8
Write-Host "Done: $($d.Class) $($d.Status)"

