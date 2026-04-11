param(
  [string]$TaskName = "Asolaria Omni Consolidation Cascade",
  [int]$RepetitionMinutes = 60
)

$ErrorActionPreference = "Stop"

$scriptPath = "C:\Users\acer\Asolaria\tools\Run-OmniConsolidationCascade.ps1"
if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Launcher script not found: $scriptPath"
}

$startTime = (Get-Date).AddMinutes(1).ToString("HH:mm")
$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

schtasks /Create /TN $TaskName /TR $taskCommand /SC MINUTE /MO $RepetitionMinutes /ST $startTime /F | Out-Null
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
