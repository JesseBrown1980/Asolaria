param(
  [string]$OutputRoot = "",
  [string]$VersionTag = "",
  [switch]$Zip,
  [switch]$AllowLeakFindings
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path $Path)) {
    New-Item -Path $Path -ItemType Directory -Force | Out-Null
  }
}

function Load-Manifest([string]$ManifestPath) {
  if (-not (Test-Path $ManifestPath)) {
    throw "Public release manifest not found: $ManifestPath"
  }
  return (Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json)
}

function Copy-IncludedItems {
  param(
    [string]$RepoRoot,
    [string]$StageRoot,
    $Manifest
  )

  foreach ($dir in @($Manifest.includeDirectories)) {
    $src = Join-Path $RepoRoot $dir
    if (-not (Test-Path $src)) { continue }
    $dst = Join-Path $StageRoot $dir
    Ensure-Dir (Split-Path $dst -Parent)
    Copy-Item -Path $src -Destination $dst -Recurse -Force
  }

  foreach ($file in @($Manifest.includeFiles)) {
    $src = Join-Path $RepoRoot $file
    if (-not (Test-Path $src)) { continue }
    $dst = Join-Path $StageRoot $file
    Ensure-Dir (Split-Path $dst -Parent)
    Copy-Item -Path $src -Destination $dst -Force
  }
}

function Path-ContainsAny([string]$Path, [string[]]$Fragments) {
  $normalized = $Path.Replace("/", "\\").ToLowerInvariant()
  foreach ($fragment in $Fragments) {
    if ([string]::IsNullOrWhiteSpace($fragment)) { continue }
    if ($normalized.Contains($fragment.ToLowerInvariant())) { return $true }
  }
  return $false
}

function Name-MatchesAny([string]$Name, [string[]]$Patterns) {
  foreach ($pattern in $Patterns) {
    if ([string]::IsNullOrWhiteSpace($pattern)) { continue }
    if ($Name -like $pattern) { return $true }
  }
  return $false
}

function Prune-ExcludedItems {
  param(
    [string]$StageRoot,
    $Manifest
  )

  $excludePathContains = @($Manifest.excludePathContains)
  $excludeFileNameLike = @($Manifest.excludeFileNameLike)

  $allItems = Get-ChildItem -Path $StageRoot -Recurse -Force | Sort-Object FullName -Descending
  foreach ($item in $allItems) {
    $removeByPath = Path-ContainsAny -Path $item.FullName -Fragments $excludePathContains
    $removeByName = Name-MatchesAny -Name $item.Name -Patterns $excludeFileNameLike
    if ($removeByPath -or $removeByName) {
      try {
        if ($item.PSIsContainer) {
          Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction Stop
        } else {
          Remove-Item -Path $item.FullName -Force -ErrorAction Stop
        }
      } catch {}
    }
  }
}

function Sanitize-Export {
  param([string]$StageRoot)

  $startScript = Join-Path $StageRoot "tools\\Start-Asolaria.ps1"
  if (Test-Path $startScript) {
    $content = Get-Content -Path $startScript -Raw
    $content = $content -replace 'ASOLARIA_REMOTE_APPROVAL_BASE_URL\s*=\s*"[^"]*"', 'ASOLARIA_REMOTE_APPROVAL_BASE_URL = "http://127.0.0.1:4781"'
    [System.IO.File]::WriteAllText($startScript, $content, [System.Text.Encoding]::UTF8)
  }
}

function New-ReleaseNotes {
  param(
    [string]$StageRoot,
    [string]$VersionLabel
  )

  $notesPath = Join-Path $StageRoot "PUBLIC_RELEASE_NOTES.md"
  $notes = @"
# Asolaria Public Release

Version: $VersionLabel
Generated: $((Get-Date).ToString("o"))

## Security posture

- This package is generated from allowlisted source paths only.
- Runtime/private data folders are excluded.
- Vault files, token files, PID/log/temp artifacts are excluded.
- Leak scan is executed before release completion.

## Operator steps

1. Install dependencies with `npm install` in:
   - repository root
   - `src/gateway`
   - `services/sandbox-manager`
2. Start app:
   - `Start-Asolaria.cmd` (core app only), or
   - `Start-Asolaria-ControlPlane.cmd` (core app + gateway + sandbox)
3. Set local secrets using the local vault flows. Do not place secrets in source files.
"@
  [System.IO.File]::WriteAllText($notesPath, $notes, [System.Text.Encoding]::UTF8)
}

function Test-LeakScan {
  param([string]$StageRoot)

  $rules = @(
    @{ Name = "private_key"; Pattern = "-----BEGIN (RSA |EC |)?PRIVATE KEY-----" },
    @{ Name = "openai_key"; Pattern = "sk-[A-Za-z0-9]{20,}" },
    @{ Name = "slack_bot"; Pattern = "xoxb-[A-Za-z0-9-]{10,}" },
    @{ Name = "github_pat"; Pattern = "ghp_[A-Za-z0-9]{20,}" },
    @{ Name = "google_api_key"; Pattern = "AIza[0-9A-Za-z\\-_]{20,}" },
    @{ Name = "url_token_param"; Pattern = "(?i)[\\?&]token=[A-Za-z0-9%._\\-]{12,}" },
    @{ Name = "vault_master_ref"; Pattern = "(?i)vault\\.master\\.key" }
  )

  $hits = New-Object System.Collections.Generic.List[Object]
  $files = Get-ChildItem -Path $StageRoot -Recurse -File -Force
  foreach ($file in $files) {
    if ($file.Length -gt 2MB) { continue }
    $ext = $file.Extension.ToLowerInvariant()
    if ($ext -in @(".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".exe", ".dll", ".pfx", ".jks")) {
      continue
    }
    $text = ""
    try {
      $text = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
    } catch {
      continue
    }
    foreach ($rule in $rules) {
      if ($text -match $rule.Pattern) {
        $hits.Add([ordered]@{
          rule = $rule.Name
          file = $file.FullName
        })
      }
    }
  }
  return $hits
}

function Get-Sha256Hex([string]$Path) {
  if (-not (Test-Path $Path)) { return "" }
  return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLowerInvariant()
}

function Write-JsonUtf8([string]$Path, $Obj) {
  $json = $Obj | ConvertTo-Json -Depth 12
  [System.IO.File]::WriteAllText($Path, $json + "`n", [System.Text.Encoding]::UTF8)
}

function Emit-PublicProjectionReports {
  param(
    [string]$RepoRoot,
    [string]$StageRoot,
    $Manifest,
    $LeakHits,
    [string]$Mode,
    [string]$VersionTag,
    [string]$ZipPath
  )

  $projDir = Join-Path $StageRoot "projections\\hb\\release-demo"
  Ensure-Dir $projDir

  # Sanitize leak hits: keep rule + bundle-relative path only.
  $leakHitsSanitized = @()
  foreach ($hit in @($LeakHits)) {
    $rel = ""
    try { $rel = [System.IO.Path]::GetRelativePath($StageRoot, [string]$hit.file) } catch { $rel = "" }
    $leakHitsSanitized += [ordered]@{
      rule = [string]$hit.rule
      path = ($rel -replace '\\', '/')
    }
  }

  $leakStatus = if ($leakHitsSanitized.Count -eq 0) { "PASS" } else { "FAIL" }
  $denyFlags = @()
  if ($leakStatus -eq "FAIL") { $denyFlags += "LEAK_FINDINGS_PRESENT" }

  $manifestSha256 = Get-Sha256Hex (Join-Path $RepoRoot "config\\public-release.manifest.json")
  $bundleSha256 = ""
  if (-not [string]::IsNullOrWhiteSpace($ZipPath) -and (Test-Path $ZipPath)) {
    $bundleSha256 = Get-Sha256Hex $ZipPath
  }

  $leakPath = Join-Path $projDir "LEAK_SCAN_REPORT.public.json"
  Write-JsonUtf8 $leakPath ([ordered]@{
    reportId = "release-demo.leak-scan.v1"
    ts = (Get-Date).ToString("o")
    mode = $Mode
    versionTag = $VersionTag
    status = $leakStatus
    findings = $leakHitsSanitized
    note = "Sanitized projection generated by Build-PublicRelease.ps1. Paths are bundle-relative."
  })

  $gatesPath = Join-Path $projDir "gates.report.public.json"
  $skipped = @()
  if ([string]::IsNullOrWhiteSpace($bundleSha256)) {
    $skipped += [ordered]@{ name = "bundle_sha256"; reason = "zip not requested; bundle hash not computed" }
  }
  $skipped += [ordered]@{ name = "doc_link_closure"; reason = "public validator not implemented in this script" }
  $skipped += [ordered]@{ name = "required_artifacts_complete"; reason = "public validator not implemented in this script" }

  Write-JsonUtf8 $gatesPath ([ordered]@{
    reportId = "release-demo.gates.v1"
    ts = (Get-Date).ToString("o")
    mode = $Mode
    versionTag = $VersionTag
    gate_results = @(
      [ordered]@{ gate = "leak_scan"; status = $leakStatus; reason = if ($leakStatus -eq "PASS") { "" } else { "findings present" } }
    )
    skipped_checks = $skipped
    deny_flags = $denyFlags
    note = "This is a minimal, fail-closed projection. Any SKIPPED checks must not be treated as PASS."
  })

  $releaseIndexPath = Join-Path $projDir "release.index.public.json"
  Write-JsonUtf8 $releaseIndexPath ([ordered]@{
    version = "v1"
    ts = (Get-Date).ToString("o")
    scope = "public-release.demo"
    mode = $Mode
    manifest_sha256 = $manifestSha256
    bundle_sha256 = if ([string]::IsNullOrWhiteSpace($bundleSha256)) { $null } else { $bundleSha256 }
    artifacts = @(
      [ordered]@{ path = "config/public-release.manifest.json"; sha256 = $manifestSha256; role = "manifest"; claims_class = "contract" },
      [ordered]@{ path = "projections/hb/release-demo/LEAK_SCAN_REPORT.public.json"; sha256 = Get-Sha256Hex $leakPath; role = "proof"; claims_class = "projection" },
      [ordered]@{ path = "projections/hb/release-demo/gates.report.public.json"; sha256 = Get-Sha256Hex $gatesPath; role = "proof"; claims_class = "projection" }
    )
    proofs = @(
      [ordered]@{ id = "leak_scan"; path = "projections/hb/release-demo/LEAK_SCAN_REPORT.public.json"; sha256 = Get-Sha256Hex $leakPath },
      [ordered]@{ id = "gates_report"; path = "projections/hb/release-demo/gates.report.public.json"; sha256 = Get-Sha256Hex $gatesPath }
    )
    gate_results = @(
      [ordered]@{ gate = "leak_scan"; status = $leakStatus; reason = if ($leakStatus -eq "PASS") { "" } else { "findings present" } }
    )
    skipped_checks = $skipped
    deny_flags = $denyFlags
    owner_sig = [ordered]@{ signer = "UNSIGNED"; signature_type = "none"; signature_target_hash = "" }
    note = "Projection-only demo index generated by Build-PublicRelease.ps1. Not a public release claim."
  })

  $summaryPath = Join-Path $projDir "VALIDATOR_SUMMARY.public.json"
  Write-JsonUtf8 $summaryPath ([ordered]@{
    summaryId = "release-demo.validator-summary.v1"
    ts = (Get-Date).ToString("o")
    mode = $Mode
    versionTag = $VersionTag
    manifest_sha256 = $manifestSha256
    bundle_sha256 = if ([string]::IsNullOrWhiteSpace($bundleSha256)) { $null } else { $bundleSha256 }
    leak_scan_status = $leakStatus
    gate_report_path = "projections/hb/release-demo/gates.report.public.json"
    release_index_path = "projections/hb/release-demo/release.index.public.json"
    deny_flags = $denyFlags
    skipped_checks = $skipped
    final_status = if ($denyFlags.Count -eq 0) { "NOT_PUBLISHABLE_SKIPPED_CHECKS" } else { "FAIL_DENY_FLAGS" }
    note = "Minimal projection summary. Public validator contract not fully implemented here."
  })

  if ($denyFlags.Count -gt 0) {
    throw "Fail-closed: deny flags active in stage projections/hb/release-demo. See gates.report.public.json"
  }
}

$repoRoot = Resolve-RepoRoot
$manifestPath = Join-Path $repoRoot "config\\public-release.manifest.json"
$manifest = Load-Manifest -ManifestPath $manifestPath

if ([string]::IsNullOrWhiteSpace($VersionTag)) {
  $VersionTag = (Get-Date).ToString("yyyyMMdd-HHmmss")
}

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $repoRoot "dist\\public-release"
}
Ensure-Dir $OutputRoot

$stageRoot = Join-Path $OutputRoot ("Asolaria-Public-" + $VersionTag)
if (Test-Path $stageRoot) {
  Remove-Item -Path $stageRoot -Recurse -Force
}
Ensure-Dir $stageRoot

Copy-IncludedItems -RepoRoot $repoRoot -StageRoot $stageRoot -Manifest $manifest
Prune-ExcludedItems -StageRoot $stageRoot -Manifest $manifest
Sanitize-Export -StageRoot $stageRoot
New-ReleaseNotes -StageRoot $stageRoot -VersionLabel $VersionTag

$hits = @(Test-LeakScan -StageRoot $stageRoot)
$leakReportPath = Join-Path $stageRoot "LEAK_SCAN_REPORT.json"
if ($hits.Count -eq 0) {
  "[]" | Out-File -FilePath $leakReportPath -Encoding UTF8
} else {
  $hits | ConvertTo-Json -Depth 6 | Out-File -FilePath $leakReportPath -Encoding UTF8
}

if ($hits.Count -gt 0 -and -not $AllowLeakFindings) {
  throw "Leak scan found $($hits.Count) potential findings. Review $leakReportPath. Re-run with -AllowLeakFindings to override."
}

$zipPath = ""
if ($Zip) {
  $zipPath = "$stageRoot.zip"
  if (Test-Path $zipPath) { Remove-Item -Path $zipPath -Force }
  Compress-Archive -Path (Join-Path $stageRoot "*") -DestinationPath $zipPath -Force
}

try {
  Emit-PublicProjectionReports -RepoRoot $repoRoot -StageRoot $stageRoot -Manifest $manifest -LeakHits $hits -Mode "Preview" -VersionTag $VersionTag -ZipPath $zipPath
} catch {
  throw "Public projections contract failed closed: $($_.Exception.Message)"
}

Write-Host "Public release built successfully."
Write-Host " - stage: $stageRoot"
Write-Host " - leak report: $leakReportPath"
if ($Zip) {
  Write-Host " - zip: $zipPath"
}
