Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AsolariaProjectRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Get-AsolariaInstanceRoot {
  $explicit = [string]$env:ASOLARIA_INSTANCE_ROOT
  if (-not [string]::IsNullOrWhiteSpace($explicit)) {
    try {
      return (Resolve-Path -LiteralPath $explicit -ErrorAction Stop).Path
    } catch {
      return $explicit
    }
  }

  $preferred = "E:\runtime\asolaria-instance"
  if (Test-Path -LiteralPath $preferred) {
    return (Resolve-Path -LiteralPath $preferred).Path
  }

  return Get-AsolariaProjectRoot
}

function Get-RunningKeeperProcesses {
  return Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like "*Keep-Asolaria-PhoneBackground.ps1*" }
}

$instanceRoot = Get-AsolariaInstanceRoot
$pidFile = Join-Path $instanceRoot "logs\phone-link-keeper.pid"
$running = @(Get-RunningKeeperProcesses)
if ($running.Count -eq 0) {
  Write-Host "No phone background keeper process is running."
  if (Test-Path $pidFile) {
    Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
  }
  return
}

foreach ($proc in $running) {
  try {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
    Write-Host ("Stopped phone background keeper pid={0}" -f $proc.ProcessId)
  } catch {
    Write-Warning ("Failed to stop pid={0}: {1}" -f $proc.ProcessId, $_.Exception.Message)
  }
}

if (Test-Path $pidFile) {
  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}
