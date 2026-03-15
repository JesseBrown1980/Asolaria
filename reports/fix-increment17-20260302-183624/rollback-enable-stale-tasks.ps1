param()
$tasks = @(
  "Asolaria Wake Display 1000 BRT",
  "Asolaria-WakeDisplay-2026-02-24-0900"
)
foreach($t in $tasks){
  try { Enable-ScheduledTask -TaskName $t | Out-Null; Write-Host "Enabled $t" } catch { Write-Warning "Failed to enable $t: $($_.Exception.Message)" }
}
