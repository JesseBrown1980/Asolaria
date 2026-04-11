param(
  [string]$RepoRoot = "",
  [string]$StageRoot = "",
  [string]$ReportPath = "",
  [bool]$RequireZip = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-DefaultRepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Ensure-Dir([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -Path $Path -ItemType Directory -Force | Out-Null
  }
}

function Add-CheckResult {
  param(
    [System.Collections.Generic.List[object]]$Results,
    [string]$Id,
    [bool]$Ok,
    [string]$Detail,
    [string]$Fix = ""
  )

  $Results.Add([ordered]@{
      id = $Id
      ok = $Ok
      detail = $Detail
      fix = $Fix
    }) | Out-Null
}

function Resolve-LatestStageRoot([string]$RepoRootPath) {
  $distRoot = Join-Path $RepoRootPath "dist"
  if (-not (Test-Path -LiteralPath $distRoot)) {
    return ""
  }

  $roots = @(Get-ChildItem -Path $distRoot -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "public-release*" })
  if ($roots.Count -eq 0) {
    return ""
  }

  $stageDirs = New-Object System.Collections.Generic.List[object]
  foreach ($root in $roots) {
    $children = @(Get-ChildItem -Path $root.FullName -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "Asolaria-Public-*" })
    foreach ($child in $children) {
      $stageDirs.Add([ordered]@{
          path = $child.FullName
          lastWriteTime = $child.LastWriteTime
        }) | Out-Null
    }
  }

  if ($stageDirs.Count -eq 0) {
    return ""
  }

  return [string](($stageDirs | Sort-Object -Property lastWriteTime -Descending | Select-Object -First 1).path)
}

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = Resolve-DefaultRepoRoot
} else {
  $RepoRoot = (Resolve-Path $RepoRoot).Path
}

if ([string]::IsNullOrWhiteSpace($StageRoot)) {
  $StageRoot = Resolve-LatestStageRoot -RepoRootPath $RepoRoot
}

$results = New-Object System.Collections.Generic.List[object]

if ([string]::IsNullOrWhiteSpace($StageRoot) -or -not (Test-Path -LiteralPath $StageRoot)) {
  Add-CheckResult -Results $results -Id "stage_exists" -Ok $false `
    -Detail "No public release stage directory found." `
    -Fix "Run tools/Build-PublicRelease.ps1 -Zip or tools/Invoke-Asolaria-PublishableRelease.ps1 -Zip."
} else {
  Add-CheckResult -Results $results -Id "stage_exists" -Ok $true `
    -Detail ("Using stage root: " + $StageRoot)
}

if (-not [string]::IsNullOrWhiteSpace($StageRoot) -and (Test-Path -LiteralPath $StageRoot)) {
  foreach ($requiredFile in @(
      "package.json",
      "README.md",
      "PUBLIC_DEPLOYMENT.md",
      "PUBLIC_RELEASE_NOTES.md",
      "Start-Asolaria.cmd",
      "Start-Asolaria-ControlPlane.cmd",
      "Stop-Asolaria.cmd",
      "Stop-Asolaria-ControlPlane.cmd"
    )) {
    $requiredPath = Join-Path $StageRoot $requiredFile
    Add-CheckResult -Results $results -Id ("required_" + $requiredFile.Replace(".", "_").Replace("-", "_")) `
      -Ok (Test-Path -LiteralPath $requiredPath) `
      -Detail (if (Test-Path -LiteralPath $requiredPath) { "Present: $requiredFile" } else { "Missing: $requiredFile" }) `
      -Fix (if (Test-Path -LiteralPath $requiredPath) { "" } else { "Update config/public-release.manifest.json so the release includes $requiredFile." })
  }

  foreach ($requiredDir in @("src", "public", "skills", "tools", "services", "config", "docs")) {
    $requiredPath = Join-Path $StageRoot $requiredDir
    Add-CheckResult -Results $results -Id ("required_dir_" + $requiredDir.Replace("-", "_")) `
      -Ok (Test-Path -LiteralPath $requiredPath) `
      -Detail (if (Test-Path -LiteralPath $requiredPath) { "Present: $requiredDir" } else { "Missing: $requiredDir" }) `
      -Fix (if (Test-Path -LiteralPath $requiredPath) { "" } else { "Update config/public-release.manifest.json so the release includes $requiredDir." })
  }

  foreach ($forbiddenPath in @("data", "logs", "captures", "reports", "node_modules", ".git")) {
    $candidate = Join-Path $StageRoot $forbiddenPath
    $exists = Test-Path -LiteralPath $candidate
    Add-CheckResult -Results $results -Id ("forbidden_" + $forbiddenPath.Replace(".", "_")) `
      -Ok (-not $exists) `
      -Detail (if ($exists) { "Forbidden path present: $forbiddenPath" } else { "Forbidden path absent: $forbiddenPath" }) `
      -Fix (if ($exists) { "Add or keep $forbiddenPath in config/public-release.manifest.json exclusion rules." } else { "" })
  }

  $leakReportPath = Join-Path $StageRoot "LEAK_SCAN_REPORT.json"
  if (-not (Test-Path -LiteralPath $leakReportPath)) {
    Add-CheckResult -Results $results -Id "leak_report_present" -Ok $false `
      -Detail "Missing LEAK_SCAN_REPORT.json." `
      -Fix "Rebuild with tools/Build-PublicRelease.ps1 so the leak scan runs."
  } else {
    Add-CheckResult -Results $results -Id "leak_report_present" -Ok $true `
      -Detail ("Leak report found: " + $leakReportPath)

    try {
      $parsed = Get-Content -Path $leakReportPath -Raw -ErrorAction Stop | ConvertFrom-Json
      $findingCount = 0
      if ($null -eq $parsed) {
        $findingCount = 0
      } elseif ($parsed -is [System.Array]) {
        $findingCount = $parsed.Count
      } else {
        $findingCount = 1
      }
      Add-CheckResult -Results $results -Id "leak_report_clean" -Ok ($findingCount -eq 0) `
        -Detail ("Leak report finding count: " + $findingCount) `
        -Fix (if ($findingCount -eq 0) { "" } else { "Review LEAK_SCAN_REPORT.json and remove or redact the findings before publish." })
    } catch {
      Add-CheckResult -Results $results -Id "leak_report_clean" -Ok $false `
        -Detail ("Leak report is not valid JSON: " + $_.Exception.Message) `
        -Fix "Regenerate the release so the leak report is valid JSON."
    }
  }

  if ($RequireZip) {
    $zipPath = $StageRoot + ".zip"
    $exists = Test-Path -LiteralPath $zipPath
    $detail = if ($exists) {
      $sha = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash
      "Zip present: $zipPath (sha256=$sha)"
    } else {
      "Missing release zip: $zipPath"
    }
    Add-CheckResult -Results $results -Id "zip_present" -Ok $exists `
      -Detail $detail `
      -Fix (if ($exists) { "" } else { "Re-run the release build with -Zip." })
  }
}

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
  $ReportPath = Join-Path $RepoRoot "reports\release-demo\publishable-release-report.json"
}
Ensure-Dir (Split-Path -Parent $ReportPath)

$failed = @($results | Where-Object { -not [bool]$_.ok })
$report = [ordered]@{
  checkedAt = (Get-Date).ToString("o")
  repoRoot = $RepoRoot
  stageRoot = $StageRoot
  pass = ($failed.Count -eq 0)
  failedCount = $failed.Count
  checks = $results
}

$report | ConvertTo-Json -Depth 8 | Out-File -FilePath $ReportPath -Encoding UTF8

Write-Host ("Publishable release report: " + $ReportPath)
foreach ($row in $results) {
  $state = if ([bool]$row.ok) { "PASS" } else { "FAIL" }
  Write-Host ("[{0}] {1} :: {2}" -f $state, [string]$row.id, [string]$row.detail)
}

if ($failed.Count -gt 0) {
  throw ("Publishable release verification failed: " + $failed.Count + ".")
}

Write-Host "Publishable release verification passed."
