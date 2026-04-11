Set-StrictMode -Version Latest

$script:AdminTerminalSidecarDefaultRoot = "C:\Users\acer\Asolaria\runtime\admin-terminals"
$script:AdminTerminalRegistryPath = "C:\Users\acer\codex-bridge\profiles\admin-terminal-identities.json"

function Get-AdminTerminalRegistry {
  if (-not (Test-Path -LiteralPath $script:AdminTerminalRegistryPath)) {
    throw "Admin terminal registry not found: $script:AdminTerminalRegistryPath"
  }

  return (Get-Content -Raw -LiteralPath $script:AdminTerminalRegistryPath | ConvertFrom-Json)
}

function Get-AdminTerminalRegistryEntries {
  $registry = Get-AdminTerminalRegistry
  $entries = @($registry.adminTerminals)
  if ($entries.Count -lt 1) {
    throw "Admin terminal registry has no adminTerminals entries: $script:AdminTerminalRegistryPath"
  }
  return $entries
}

function Get-AdminTerminalRegistryEntry {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $requested = $TerminalId.Trim().ToLowerInvariant()
  foreach ($entry in Get-AdminTerminalRegistryEntries) {
    $callName = [string]$entry.callName
    if (-not [string]::IsNullOrWhiteSpace($callName) -and $callName.Trim().ToLowerInvariant() -eq $requested) {
      return $entry
    }
  }

  $supportedIds = @(
    Get-AdminTerminalRegistryEntries |
      ForEach-Object { [string]$_.callName } |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
      Sort-Object -Unique
  )
  throw ("Unsupported admin terminal id: {0}. Supported ids: {1}" -f $TerminalId, ($supportedIds -join ", "))
}

function Resolve-AdminTerminalId {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $entry = Get-AdminTerminalRegistryEntry -TerminalId $TerminalId
  return [string]$entry.callName
}

function Get-AdminTerminalProfilePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $entry = Get-AdminTerminalRegistryEntry -TerminalId $TerminalId
  $profilePath = [string]$entry.profilePath
  if ([string]::IsNullOrWhiteSpace($profilePath)) {
    throw "No profile path registered for $([string]$entry.callName)"
  }
  return $profilePath
}

function Get-AdminTerminalProfile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $path = Get-AdminTerminalProfilePath -TerminalId $TerminalId
  return (Get-Content -Raw $path | ConvertFrom-Json)
}

function Get-OptionalObjectPropertyValue {
  param(
    [Parameter(Mandatory = $true)]
    $Object,
    [Parameter(Mandatory = $true)]
    [string]$PropertyName
  )

  if ($null -eq $Object) {
    return $null
  }

  $property = $Object.PSObject.Properties[$PropertyName]
  if ($null -eq $property) {
    return $null
  }

  return $property.Value
}

function New-DefaultAdminTerminalSidecarPaths {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $resolved = Resolve-AdminTerminalId -TerminalId $TerminalId
  $terminalKey = $resolved.ToLowerInvariant()
  $root = Join-Path $script:AdminTerminalSidecarDefaultRoot $terminalKey
  return [ordered]@{
    terminalId = $resolved
    terminalKey = $terminalKey
    root = $root
    screenPath = Join-Path $root "screen.txt"
    transcriptPath = Join-Path $root "transcript.log"
    inboxPath = Join-Path $root "inbox.ndjson"
    statusPath = Join-Path $root "status.json"
    sidecarPidPath = Join-Path $root "sidecar.pid"
    childPidPath = Join-Path $root "child.pid"
  }
}

function ConvertTo-CompactJson {
  param(
    [Parameter(Mandatory = $true)]
    $Value
  )

  return ($Value | ConvertTo-Json -Depth 12 -Compress)
}

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    $Value
  )

  $directory = Split-Path -Parent $Path
  if (-not [string]::IsNullOrWhiteSpace($directory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }
  Set-Content -Path $Path -Value ($Value | ConvertTo-Json -Depth 12) -Encoding UTF8
}

function New-AdminTerminalSidecarPaths {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $defaults = New-DefaultAdminTerminalSidecarPaths -TerminalId $TerminalId
  $profile = Get-AdminTerminalProfile -TerminalId $defaults.terminalId
  $sidecar = $profile.PSObject.Properties["sidecar"]
  $rawSidecar = if ($null -ne $sidecar) { $sidecar.Value } else { $null }
  $runtimeRoot = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "runtimeRoot"
  $screenPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "screenPath"
  $transcriptPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "transcriptPath"
  $inboxPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "inboxPath"
  $statusPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "statusPath"
  $sidecarPidPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "sidecarPidPath"
  $childPidPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "childPidPath"
  $root = if (-not [string]::IsNullOrWhiteSpace([string]$runtimeRoot)) {
    [string]$runtimeRoot
  } else {
    [string]$defaults.root
  }

  return [ordered]@{
    terminalId = [string]$defaults.terminalId
    terminalKey = [string]$defaults.terminalKey
    root = $root
    screenPath = if (-not [string]::IsNullOrWhiteSpace([string]$screenPath)) { [string]$screenPath } else { Join-Path $root "screen.txt" }
    transcriptPath = if (-not [string]::IsNullOrWhiteSpace([string]$transcriptPath)) { [string]$transcriptPath } else { Join-Path $root "transcript.log" }
    inboxPath = if (-not [string]::IsNullOrWhiteSpace([string]$inboxPath)) { [string]$inboxPath } else { Join-Path $root "inbox.ndjson" }
    statusPath = if (-not [string]::IsNullOrWhiteSpace([string]$statusPath)) { [string]$statusPath } else { Join-Path $root "status.json" }
    sidecarPidPath = if (-not [string]::IsNullOrWhiteSpace([string]$sidecarPidPath)) { [string]$sidecarPidPath } else { Join-Path $root "sidecar.pid" }
    childPidPath = if (-not [string]::IsNullOrWhiteSpace([string]$childPidPath)) { [string]$childPidPath } else { Join-Path $root "child.pid" }
  }
}

function Ensure-AdminTerminalSidecarPaths {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Paths
  )

  New-Item -ItemType Directory -Force -Path $Paths.root | Out-Null
}

function Get-AdminTerminalSidecarConfig {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $profile = Get-AdminTerminalProfile -TerminalId $TerminalId
  $paths = New-AdminTerminalSidecarPaths -TerminalId $TerminalId
  $sidecar = $profile.PSObject.Properties["sidecar"]
  $rawSidecar = if ($null -ne $sidecar) { $sidecar.Value } else { $null }
  $rawDefaultArgs = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "defaultArgs"
  $defaultArgs = if ($null -ne $rawDefaultArgs) {
    @($rawDefaultArgs | ForEach-Object { [string]$_ })
  } else {
    @("-a", "never", "-s", "danger-full-access")
  }
  $rawEnabled = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "enabled"
  $runToolPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "runToolPath"
  $startToolPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "startToolPath"
  $stopToolPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "stopToolPath"
  $sendToolPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "sendToolPath"
  $statusToolPath = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "statusToolPath"
  $defaultCommand = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "defaultCommand"
  $defaultWorkdir = Get-OptionalObjectPropertyValue -Object $rawSidecar -PropertyName "defaultWorkdir"

  return [pscustomobject]@{
    enabled = if ($null -ne $rawEnabled) { [bool]$rawEnabled } else { $true }
    terminalId = $paths.terminalId
    runtimeRoot = $paths.root
    screenPath = $paths.screenPath
    transcriptPath = $paths.transcriptPath
    inboxPath = $paths.inboxPath
    statusPath = $paths.statusPath
    sidecarPidPath = $paths.sidecarPidPath
    childPidPath = $paths.childPidPath
    runToolPath = if (-not [string]::IsNullOrWhiteSpace([string]$runToolPath)) { [string]$runToolPath } else { "C:\Users\acer\Asolaria\tools\Run-AdminTerminalSidecar.ps1" }
    startToolPath = if (-not [string]::IsNullOrWhiteSpace([string]$startToolPath)) { [string]$startToolPath } else { "C:\Users\acer\Asolaria\tools\Start-AdminTerminalSidecar.ps1" }
    stopToolPath = if (-not [string]::IsNullOrWhiteSpace([string]$stopToolPath)) { [string]$stopToolPath } else { "C:\Users\acer\Asolaria\tools\Stop-AdminTerminalSidecar.ps1" }
    sendToolPath = if (-not [string]::IsNullOrWhiteSpace([string]$sendToolPath)) { [string]$sendToolPath } else { "C:\Users\acer\Asolaria\tools\Send-AdminTerminalInput.ps1" }
    statusToolPath = if (-not [string]::IsNullOrWhiteSpace([string]$statusToolPath)) { [string]$statusToolPath } else { "C:\Users\acer\Asolaria\tools\Get-AdminTerminalSidecarStatus.ps1" }
    defaultCommand = if (-not [string]::IsNullOrWhiteSpace([string]$defaultCommand)) { [string]$defaultCommand } else { "codex" }
    defaultArgs = $defaultArgs
    defaultWorkdir = if (-not [string]::IsNullOrWhiteSpace([string]$defaultWorkdir)) { [string]$defaultWorkdir } else { "C:\Users\acer" }
  }
}

function Get-AdminTerminalSidecarStatus {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TerminalId
  )

  $paths = New-AdminTerminalSidecarPaths -TerminalId $TerminalId
  if (-not (Test-Path $paths.statusPath)) {
    return $null
  }
  return (Get-Content -Raw $paths.statusPath | ConvertFrom-Json)
}

function Test-PidRunning {
  param(
    [Parameter(Mandatory = $true)]
    [int]$ProcessId
  )

  try {
    $null = Get-Process -Id $ProcessId -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

function Write-AdminTerminalTranscriptLine {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Paths,
    [Parameter(Mandatory = $true)]
    [string]$Stream,
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$Text
  )

  $timestamp = [DateTimeOffset]::Now.ToString("o")
  $line = "[{0}] [{1}] {2}" -f $timestamp, $Stream.ToUpperInvariant(), $Text
  Add-Content -Path $Paths.transcriptPath -Value $line -Encoding UTF8
}

function Format-ProcessArgument {
  param(
    [AllowNull()]
    [string]$Value
  )

  if ($null -eq $Value) {
    return '""'
  }
  if ($Value -notmatch '[\s"]') {
    return $Value
  }

  $escaped = $Value -replace '(\\*)"', '$1$1\"'
  $escaped = $escaped -replace '(\\+)$', '$1$1'
  return '"' + $escaped + '"'
}

function Join-ProcessArguments {
  param(
    [string[]]$Arguments
  )

  if ($null -eq $Arguments -or $Arguments.Count -lt 1) {
    return ""
  }
  return (($Arguments | ForEach-Object { Format-ProcessArgument -Value $_ }) -join " ")
}

function New-AdminTerminalCommandEnvelope {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Text,
    [string]$Source = "unknown",
    [string]$Reason = "manual",
    [string]$Mode = "append"
  )

  return [ordered]@{
    id = "cmd_" + [guid]::NewGuid().ToString("n")
    ts = [DateTimeOffset]::Now.ToString("o")
    source = $Source
    reason = $Reason
    mode = $Mode
    text = $Text
  }
}
