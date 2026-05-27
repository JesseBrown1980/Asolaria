param(
  [Parameter(Mandatory = $true)]
  [string]$ReportPath,
  [string]$OutputDir = "",
  [string]$Prefix = "liris-startup-validation"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AsolariaRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Ensure-Dir {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) {
    throw "Path cannot be empty."
  }
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -Path $Path -ItemType Directory -Force | Out-Null
  }
}

function New-Stamp {
  return (Get-Date).ToString("yyyyMMdd-HHmmss")
}

function Find-Line {
  param(
    [string]$Text,
    [string[]]$Patterns
  )

  foreach ($pattern in $Patterns) {
    $match = [regex]::Match($Text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Multiline)
    if ($match.Success) {
      if ($match.Groups.Count -gt 1 -and -not [string]::IsNullOrWhiteSpace($match.Groups[1].Value)) {
        return $match.Groups[1].Value.Trim()
      }
      return $match.Value.Trim()
    }
  }
  return ""
}

function Add-Check {
  param(
    [System.Collections.Generic.List[object]]$Checks,
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )
  $Checks.Add([pscustomobject]@{
      name = $Name
      ok = $Ok
      detail = $Detail
    }) | Out-Null
}

function Coalesce-Text {
  param(
    [string]$Value,
    [string]$Fallback = "missing"
  )
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Fallback
  }
  return $Value
}

$root = Get-AsolariaRoot
$resolvedReportPath = (Resolve-Path $ReportPath).Path
if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $root "reports"
}
Ensure-Dir -Path $OutputDir

$raw = Get-Content -LiteralPath $resolvedReportPath -Raw
$checks = New-Object 'System.Collections.Generic.List[object]'

$branchLine = Find-Line -Text $raw -Patterns @(
  "^\s*(?:[-*]\s*)?branch\s*[:=-]\s*(.+)$",
  "^\s*branch\b.+$"
)
$commitLine = Find-Line -Text $raw -Patterns @(
  "^\s*(?:[-*]\s*)?commit\s*[:=-]\s*(.+)$",
  "^\s*commit\b.+$"
)
$nodeLine = Find-Line -Text $raw -Patterns @(
  "^\s*(?:[-*]\s*)?node(?:\s+version)?\s*[:=-]\s*(.+)$",
  "node(?:\.js)?\s+v?\d+[^\r\n]*"
)
$npmLine = Find-Line -Text $raw -Patterns @(
  "^\s*(?:[-*]\s*)?npm(?:\s+version)?\s*[:=-]\s*(.+)$",
  "npm\s+v?\d+[^\r\n]*"
)
$codexLine = Find-Line -Text $raw -Patterns @(
  "^\s*(?:[-*]\s*)?codex(?:\s+version)?\s*[:=-]\s*(.+)$",
  "codex\s+v?\d+[^\r\n]*"
)
$installLine = Find-Line -Text $raw -Patterns @(
  "^\s*(?:[-*]\s*)?(?:npm install result|install result)\s*[:=-]\s*(.+)$",
  "^.*npm install.*$"
)
$healthBlock = Find-Line -Text $raw -Patterns @(
  '```json\s*([\s\S]*?)```',
  '(\{[\s\S]*?"ok"\s*:\s*(?:true|false)[\s\S]*?\})'
)
$mqttLine = Find-Line -Text $raw -Patterns @(
  "^\s*(?:[-*]\s*)?(?:mqtt port result|mqtt result)\s*[:=-]\s*(.+)$",
  "TcpTestSucceeded\s*[:=]\s*(True|False)",
  "127\.0\.0\.1\s+-Port\s+18883[^\r\n]*"
)

$installFailed = ($raw -match '(?im)^\s*(?:npm install result|install result)\s*[:=-]\s*.*(?:fail|failed|error|exit 1)') -or ($raw -match '(?im)^.*npm install.*(?:ERR!|failed|error).*$')
$healthOk = $raw -match '(?i)"ok"\s*:\s*true' -or $raw -match '(?im)\bok\s*[:=]\s*true\b'
$mqttSuccess = $raw -match '(?im)TcpTestSucceeded\s*[:=]\s*True' -or $raw -match '(?im)mqtt(?:\s+port)?\s+(?:result|status)\s*[:=-]\s*.*\btrue\b'

Add-Check -Checks $checks -Name "branch_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($branchLine)) -Detail (Coalesce-Text -Value $branchLine)
Add-Check -Checks $checks -Name "commit_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($commitLine)) -Detail (Coalesce-Text -Value $commitLine)
Add-Check -Checks $checks -Name "node_version_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($nodeLine)) -Detail (Coalesce-Text -Value $nodeLine)
Add-Check -Checks $checks -Name "npm_version_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($npmLine)) -Detail (Coalesce-Text -Value $npmLine)
Add-Check -Checks $checks -Name "codex_version_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($codexLine)) -Detail (Coalesce-Text -Value $codexLine)
Add-Check -Checks $checks -Name "install_result_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($installLine)) -Detail (Coalesce-Text -Value $installLine)
Add-Check -Checks $checks -Name "install_not_failed" -Ok (-not $installFailed) -Detail ($(if ($installFailed) { "install failure detected" } else { "no install failure detected" }))
Add-Check -Checks $checks -Name "health_json_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($healthBlock)) -Detail ($(if ($healthBlock) { "health block present" } else { "missing" }))
Add-Check -Checks $checks -Name "health_ok_true" -Ok $healthOk -Detail ($(if ($healthOk) { "runtime reports ok=true" } else { "missing ok=true" }))
Add-Check -Checks $checks -Name "mqtt_result_recorded" -Ok (-not [string]::IsNullOrWhiteSpace($mqttLine)) -Detail (Coalesce-Text -Value $mqttLine)
Add-Check -Checks $checks -Name "mqtt_success" -Ok $mqttSuccess -Detail ($(if ($mqttSuccess) { "18883 reachable" } else { "18883 not confirmed reachable" }))

$requiredReady = @(
  "branch_recorded",
  "commit_recorded",
  "node_version_recorded",
  "npm_version_recorded",
  "codex_version_recorded",
  "install_result_recorded",
  "install_not_failed",
  "health_json_recorded",
  "health_ok_true",
  "mqtt_result_recorded",
  "mqtt_success"
)
$requiredOk = @($checks | Where-Object { $requiredReady -contains $_.name -and $_.ok }).Count
$ready = ($requiredOk -eq $requiredReady.Count)

$verdict = "incomplete_report"
if ($ready) {
  $verdict = "ready_for_next_phase"
} elseif ($installFailed) {
  $verdict = "blocked_install"
} elseif (-not $healthOk) {
  $verdict = "blocked_runtime"
} elseif (-not $mqttSuccess) {
  $verdict = "runtime_up_mqtt_unconfirmed"
}

$recommendations = New-Object 'System.Collections.Generic.List[string]'
if ($ready) {
  $recommendations.Add("Liris report is complete enough to compare against host state and choose the next bridge/rollout move.") | Out-Null
  $recommendations.Add("Next local move: roll the protected 4781 listener so indexed-memory retrieval is live on the main runtime before deeper federation work.") | Out-Null
} else {
  if ($installFailed) {
    $recommendations.Add("Do not move to bridge or policy work. Resolve the install failure on the Rayssa machine first.") | Out-Null
  }
  if (-not $healthOk) {
    $recommendations.Add("Ask Liris for the exact /api/health/fast response or the startup error from the `npm start` shell.") | Out-Null
  }
  if (-not $mqttSuccess) {
    $recommendations.Add("Keep manual owner relay as the only return path. Do not assume MQTT reachability yet.") | Out-Null
  }
  if (-not [string]::IsNullOrWhiteSpace($healthBlock) -and -not $healthOk) {
    $recommendations.Add("If the health JSON is present but `ok` is not true, treat the Rayssa runtime as blocked, not partially ready.") | Out-Null
  }
  if ($checks.Where({ -not $_.ok }).Count -gt 0) {
    $recommendations.Add("Ask for a resend using the report template if key fields are missing.") | Out-Null
  }
}

$stamp = New-Stamp
$reportBase = Join-Path $OutputDir ("{0}-{1}" -f $Prefix, $stamp)
$jsonPath = "$reportBase.json"
$mdPath = "$reportBase.md"
$checksArray = @($checks | ForEach-Object { $_ })
$recommendationsArray = @($recommendations | ForEach-Object { $_ })

$result = [pscustomobject]@{
  ok = $true
  reportPath = $resolvedReportPath
  generatedAt = (Get-Date).ToString("o")
  verdict = $verdict
  readyForNextPhase = $ready
  checks = $checksArray
  recommendations = $recommendationsArray
}

$jsonText = $result | ConvertTo-Json -Depth 6
Set-Content -LiteralPath $jsonPath -Value $jsonText -Encoding UTF8

$lines = New-Object 'System.Collections.Generic.List[string]'
$lines.Add("# Liris Startup Validation") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("- Generated: ``$($result.generatedAt)``") | Out-Null
$lines.Add("- Source report: ``$resolvedReportPath``") | Out-Null
$lines.Add("- Verdict: ``$verdict``") | Out-Null
$lines.Add("- Ready for next phase: ``$ready``") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Checks") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Check | OK | Detail |") | Out-Null
$lines.Add("|---|---|---|") | Out-Null
foreach ($check in $checks) {
  $status = if ($check.ok) { "yes" } else { "no" }
  $detail = ([string]$check.detail).Replace("|", "\|")
  $lines.Add(("| {0} | {1} | {2} |" -f $check.name, $status, $detail)) | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Recommendations") | Out-Null
$lines.Add("") | Out-Null
foreach ($item in $recommendations) {
  $lines.Add(("- {0}" -f $item)) | Out-Null
}
$lines.Add("") | Out-Null
Set-Content -LiteralPath $mdPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8

$stdout = [pscustomobject]@{
  ok = $true
  verdict = $verdict
  readyForNextPhase = $ready
  json = $jsonPath
  markdown = $mdPath
}
$stdout | ConvertTo-Json -Depth 4
