Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$googleAuthDisableFlag = Join-Path $repoRoot "runtime\flags\google-auth-surfaces-disabled.flag"

function Test-GoogleAuthSurfacesDisabled {
  foreach ($scope in @("Process", "User", "Machine")) {
    $value = [string][Environment]::GetEnvironmentVariable("ASOLARIA_DISABLE_GOOGLE_AUTH_SURFACES", $scope)
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      switch ($value.Trim().ToLowerInvariant()) {
        "1" { return $true }
        "true" { return $true }
        "yes" { return $true }
        "on" { return $true }
      }
    }
  }
  return (Test-Path -LiteralPath $googleAuthDisableFlag)
}

if (Test-GoogleAuthSurfacesDisabled) {
  Write-Output "NotebookLM upgrade loop blocked by local Google auth security lock."
  exit 0
}

$scriptPath = Join-Path $PSScriptRoot "Complete-NotebookLM-Upgrade-Loop.ps1"

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $scriptPath `
  -BaseUrl "http://127.0.0.1:4781" `
  -Account "plasmatoid@gmail.com" `
  -Project "winged-complex-390417" `
  -Location "global" `
  -IntervalSec 60 `
  -MaxHours 8
