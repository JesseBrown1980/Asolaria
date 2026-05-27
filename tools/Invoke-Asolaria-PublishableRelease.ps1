param(
  [string]$RepoRoot = "",
  [string]$OutputRoot = "",
  [string]$VersionTag = "",
  [switch]$Zip,
  [switch]$AllowLeakFindings,
  [string]$ReportPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-DefaultRepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = Resolve-DefaultRepoRoot
} else {
  $RepoRoot = (Resolve-Path $RepoRoot).Path
}

if ([string]::IsNullOrWhiteSpace($VersionTag)) {
  $VersionTag = (Get-Date).ToString("yyyyMMdd-HHmmss")
}

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $RepoRoot "dist\public-release"
}

$stageRoot = Join-Path $OutputRoot ("Asolaria-Public-" + $VersionTag)
$buildScript = Join-Path $RepoRoot "tools\Build-PublicRelease.ps1"
$verifyScript = Join-Path $RepoRoot "tools\Test-Asolaria-PublishableRelease.ps1"

$buildArgs = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", $buildScript,
  "-OutputRoot", $OutputRoot,
  "-VersionTag", $VersionTag
)
if ($Zip) {
  $buildArgs += "-Zip"
}
if ($AllowLeakFindings) {
  $buildArgs += "-AllowLeakFindings"
}

& powershell @buildArgs

$verifyArgs = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", $verifyScript,
  "-RepoRoot", $RepoRoot,
  "-StageRoot", $stageRoot
)
if ($Zip.IsPresent) {
  $verifyArgs += "-RequireZip"
}
if (-not [string]::IsNullOrWhiteSpace($ReportPath)) {
  $verifyArgs += @("-ReportPath", $ReportPath)
}

& powershell @verifyArgs

Write-Host "Publishable Asolaria OS release completed."
Write-Host " - stage: $stageRoot"
if ($Zip) {
  Write-Host " - zip: $stageRoot.zip"
}
