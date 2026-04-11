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

function Get-RunningMonitorProcesses {
  return Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like "*Keep-Asolaria-PhoneTunnelSmoke.ps1*" }
}

$instanceRoot = Get-AsolariaInstanceRoot
$pidFile = Join-Path $instanceRoot "logs\phone-tunnel-smoke-monitor.pid"
$running = @(Get-RunningMonitorProcesses)
if ($running.Count -eq 0) {
  Write-Host "No phone tunnel smoke monitor process is running."
  if (Test-Path $pidFile) {
    Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
  }
  return
}

foreach ($proc in $running) {
  try {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
    Write-Host ("Stopped phone tunnel smoke monitor pid={0}" -f $proc.ProcessId)
  } catch {
    Write-Warning ("Failed to stop pid={0}: {1}" -f $proc.ProcessId, $_.Exception.Message)
  }
}

if (Test-Path $pidFile) {
  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}
