param(
  [int]$Port = 4781,
  [int]$GatewayPort = 4791,
  [string]$BindHost = "127.0.0.1",
  [switch]$ForceRestart
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AsolariaRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Resolve-NodePath {
  try {
    $cmd = Get-Command node -ErrorAction Stop
    if ($cmd.Source) { return $cmd.Source }
    if ($cmd.Path) { return $cmd.Path }
  } catch {
    # continue
  }

  foreach ($candidate in @("C:\nvm4w\nodejs\node.exe", "C:\Program Files\nodejs\node.exe")) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  throw "Node executable not found."
}

function Test-IsCompatCommandLine {
  param(
    [string]$CommandLine,
    [string]$CompatScriptPath
  )

  if ([string]::IsNullOrWhiteSpace($CommandLine) -or [string]::IsNullOrWhiteSpace($CompatScriptPath)) {
    return $false
  }

  $normalizedCommandLine = $CommandLine.Replace("/", "\").ToLowerInvariant()
  $normalizedScript = $CompatScriptPath.Replace("/", "\").ToLowerInvariant()
  $pattern = '(^|\s|")' + [Regex]::Escape($normalizedScript) + '(\s|"|$)'
  return ($normalizedCommandLine -match $pattern)
}

function Get-CompatProcesses {
  param([string]$CompatScriptPath)

  try {
    return @(
      Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop |
        Where-Object { Test-IsCompatCommandLine -CommandLine ([string]$_.CommandLine) -CompatScriptPath $CompatScriptPath }
    )
  } catch {
    return @()
  }
}

function Get-ListeningPidForPort {
  param([int]$ProbePort)

  try {
    $row = Get-NetTCPConnection -LocalPort $ProbePort -State Listen -ErrorAction Stop | Select-Object -First 1
    if ($null -ne $row) {
      return [int]$row.OwningProcess
    }
  } catch {
    # continue
  }

  try {
    $lines = @(netstat -ano -p TCP)
    foreach ($line in $lines) {
      $text = [string]$line
      if ($text -notmatch "LISTENING") {
        continue
      }
      if ($text -match "[:\.]$ProbePort\s+.*LISTENING\s+(\d+)\s*$") {
        return [int]$matches[1]
      }
    }
  } catch {
    # continue
  }

  return 0
}

function Test-CompatHealth {
  param([int]$ProbePort)

  try {
    $health = Invoke-RestMethod -Uri ("http://127.0.0.1:{0}/api/health/fast" -f $ProbePort) -TimeoutSec 3
    return [bool]$health.ok
  } catch {
    return $false
  }
}

function Wait-ForCompatHealth {
  param(
    [int]$ProbePort,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds([Math]::Max(5, [int]$TimeoutSeconds))
  while ((Get-Date) -lt $deadline) {
    if (Test-CompatHealth -ProbePort $ProbePort) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Ensure-CompatPidFile {
  param(
    [string]$PidFilePath,
    [int]$TargetPid
  )

  if ([string]::IsNullOrWhiteSpace($PidFilePath) -or $TargetPid -lt 1) {
    return
  }

  $parent = Split-Path -Parent $PidFilePath
  if (-not [string]::IsNullOrWhiteSpace($parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }
  Set-Content -LiteralPath $PidFilePath -Value ([string]$TargetPid) -Encoding ASCII
}

function Stop-ProcessIfPresent {
  param(
    [int]$TargetPid,
    [string]$Reason = ""
  )

  if ($TargetPid -lt 1) {
    return
  }

  $proc = Get-Process -Id $TargetPid -ErrorAction SilentlyContinue
  if ($null -eq $proc) {
    return
  }

  try {
    Stop-Process -Id $TargetPid -Force -ErrorAction Stop
  } catch {
    $proc = Get-Process -Id $TargetPid -ErrorAction SilentlyContinue
    if ($null -eq $proc) {
      return
    }
    if ([string]::IsNullOrWhiteSpace($Reason)) {
      throw ("Failed to stop pid={0}: {1}" -f $TargetPid, $_.Exception.Message)
    }
    throw ("Failed to stop {0} pid={1}: {2}" -f $Reason, $TargetPid, $_.Exception.Message)
  }
}

$repoRoot = Get-AsolariaRoot
$compatScript = Join-Path $repoRoot "src\gateway\compat4781.js"
if (-not (Test-Path -LiteralPath $compatScript)) {
  throw "Compatibility script not found: $compatScript"
}
$logsDir = Join-Path $repoRoot "logs"
$stdoutLog = Join-Path $logsDir "compat4781.out.log"
$stderrLog = Join-Path $logsDir "compat4781.err.log"
$pidFile = Join-Path $logsDir "compat4781.pid"

$existing = @(Get-CompatProcesses -CompatScriptPath $compatScript)
$listeningPid = Get-ListeningPidForPort -ProbePort $Port
if ($listeningPid -gt 0 -and (Test-CompatHealth -ProbePort $Port) -and -not $ForceRestart.IsPresent) {
  Ensure-CompatPidFile -PidFilePath $pidFile -TargetPid $listeningPid
  [pscustomobject]@{
    ok = $true
    alreadyRunning = $true
    pid = [int]$listeningPid
    listenerPid = [int]$listeningPid
    port = [int]$Port
    gatewayPort = [int]$GatewayPort
    bind = [string]$BindHost
    script = [string]$compatScript
    stdoutLog = [string]$stdoutLog
    stderrLog = [string]$stderrLog
    pidFile = [string]$pidFile
  }
  exit 0
}

if ($listeningPid -gt 0 -and -not $ForceRestart.IsPresent) {
  throw ("Port {0} is already listening under pid {1}, but the compatibility health surface did not answer." -f $Port, $listeningPid)
}

$pidsToStop = New-Object 'System.Collections.Generic.HashSet[int]'
foreach ($row in $existing) {
  $null = $pidsToStop.Add([int]$row.ProcessId)
}
if ($listeningPid -gt 0) {
  $null = $pidsToStop.Add([int]$listeningPid)
}
foreach ($pidToStop in $pidsToStop) {
  $reason = if ($pidToStop -eq $listeningPid) {
    "existing listener on port $Port"
  } else {
    "existing compat4781"
  }
  Stop-ProcessIfPresent -TargetPid $pidToStop -Reason $reason
}

$nodePath = Resolve-NodePath
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$start = Start-Process -FilePath $nodePath `
  -ArgumentList "`"$compatScript`"" `
  -WorkingDirectory $repoRoot `
  -WindowStyle Hidden `
  -PassThru `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -Environment @{
    ASOLARIA_COMPAT_4781_PORT = [string]$Port
    ASOLARIA_COMPAT_4781_BIND = [string]$BindHost
    ASOLARIA_GATEWAY_PORT = [string]$GatewayPort
    ASOLARIA_GATEWAY_HOST = "127.0.0.1"
  }

Ensure-CompatPidFile -PidFilePath $pidFile -TargetPid ([int]$start.Id)

if (-not (Wait-ForCompatHealth -ProbePort $Port -TimeoutSeconds 20)) {
  throw ("Compatibility listener failed to become healthy on port {0}. See logs {1} and {2}." -f $Port, $stdoutLog, $stderrLog)
}

$listenerPid = Get-ListeningPidForPort -ProbePort $Port
if ($listenerPid -lt 1) {
  throw ("Compatibility listener became healthy on port {0}, but no listening PID was detected." -f $Port)
}
Ensure-CompatPidFile -PidFilePath $pidFile -TargetPid $listenerPid

[pscustomobject]@{
  ok = $true
  alreadyRunning = $false
  pid = [int]$listenerPid
  listenerPid = [int]$listenerPid
  startedPid = [int]$start.Id
  port = [int]$Port
  gatewayPort = [int]$GatewayPort
  bind = [string]$BindHost
  script = [string]$compatScript
  stdoutLog = [string]$stdoutLog
  stderrLog = [string]$stderrLog
  pidFile = [string]$pidFile
}
