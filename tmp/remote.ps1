Write-Host "=== REMOTE DESKTOP / VNC PROCESSES ==="
Get-Process | Where-Object { $_.Name -match 'rustdesk|anydesk|teamviewer|parsec|vnc|tightvnc|tigervnc|mstsc|scrcpy|adb|chrome.*remote|remmina|nomachine|splashtop' } | Select-Object Id,Name,@{n='Mem(MB)';e={[math]::Round($_.WorkingSet64/1MB,0)}},MainWindowTitle | Format-Table -AutoSize

Write-Host ""
Write-Host "=== ALL ESTABLISHED CONNECTIONS (remote-ish ports) ==="
Get-NetTCPConnection -State Established | Where-Object {
  $_.RemotePort -in 22,3389,5900,5800,7070,4172,8022,21115,21116,21117,21118,21119
} | ForEach-Object {
  $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
  "{0,-15}:{1,-6} -> {2,-15}:{3,-6} pid={4} {5}" -f $_.LocalAddress, $_.LocalPort, $_.RemoteAddress, $_.RemotePort, $_.OwningProcess, $p.Name
}

Write-Host ""
Write-Host "=== ANY LISTENING ON 5900/3389/5800 ==="
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3389,5900,5800,7070,21118 } | Format-Table

Write-Host ""
Write-Host "=== PROCESS BEHIND :4791 (Liris hooks?) ==="
$p = Get-Process -Id 13068 -ErrorAction SilentlyContinue
$cim = Get-CimInstance Win32_Process -Filter "ProcessId=13068"
"$($p.Name) cmdline: $($cim.CommandLine)"
"WorkingDir: $($cim.ExecutablePath)"
