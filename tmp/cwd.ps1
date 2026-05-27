Write-Host "=== CWDs of the suspect processes ==="
foreach ($pid in 13068,18140,18208,38788) {
  try {
    $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$pid"
    if ($cim) {
      "pid=$pid name=$($cim.Name)"
      "  cmdline: $($cim.CommandLine)"
      "  parent : $($cim.ParentProcessId)"
    }
  } catch {}
}
Write-Host ""
Write-Host "=== Open windows by visible processes ==="
Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object Id,Name,MainWindowTitle | Sort-Object Name | Format-Table -AutoSize
