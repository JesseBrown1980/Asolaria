$ports = 4781,4791,4810,4811,4812,3389,5900,18883,1883,6379,7777
Write-Host "=== LISTENING PORTS OF INTEREST ==="
Get-NetTCPConnection -State Listen | Where-Object { $ports -contains $_.LocalPort } | ForEach-Object {
  $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
  "{0,-15} {1,-7} pid={2,-7} {3}" -f $_.LocalAddress, $_.LocalPort, $_.OwningProcess, $p.Name
}
Write-Host ""
Write-Host "=== ESTABLISHED RDP/VNC CONNECTIONS ==="
Get-NetTCPConnection -State Established | Where-Object { $_.LocalPort -in 3389,5900 -or $_.RemotePort -in 3389,5900 } | Format-Table LocalAddress,LocalPort,RemoteAddress,RemotePort,OwningProcess -AutoSize
Write-Host ""
Write-Host "=== USER SESSIONS ==="
& "$env:WINDIR\System32\quser.exe" 2>&1
Write-Host ""
Write-Host "=== ALL SESSIONS (qwinsta) ==="
& "$env:WINDIR\System32\qwinsta.exe" 2>&1
Write-Host ""
Write-Host "=== NODE/PYTHON WITH START TIME ==="
Get-Process node,python -ErrorAction SilentlyContinue | Select-Object Id,Name,StartTime,@{n='Mem(MB)';e={[math]::Round($_.WorkingSet64/1MB,0)}} | Format-Table -AutoSize
