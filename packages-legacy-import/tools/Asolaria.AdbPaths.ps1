Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot "Asolaria.HostPaths.ps1")

function Resolve-AsolariaAdbPath {
  $localAppData = Get-AsolariaLocalAppData

  try {
    $cmd = Get-Command adb -ErrorAction Stop
    if ($cmd.Source) { return $cmd.Source }
    if ($cmd.Path) { return $cmd.Path }
  } catch {
    # continue
  }

  $candidates = @(
    [string]$env:ASOLARIA_ADB_PATH,
    $(if ($localAppData) { Join-Path $localAppData "Android\Sdk\platform-tools\adb.exe" }),
    "C:\Android\platform-tools\adb.exe",
    "C:\platform-tools\adb.exe",
    "C:\Program Files\Android\platform-tools\adb.exe",
    $(if ($localAppData) { Join-Path $localAppData "Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe" })
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }

  foreach ($path in $candidates) {
    if (Test-Path -LiteralPath $path) {
      return $path
    }
  }

  $wingetPackagesRoot = if ($localAppData) { Join-Path $localAppData "Microsoft\WinGet\Packages" } else { "" }
  if (-not [string]::IsNullOrWhiteSpace($wingetPackagesRoot) -and (Test-Path -LiteralPath $wingetPackagesRoot)) {
    $wingetAdb = Get-ChildItem $wingetPackagesRoot -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "Google.PlatformTools*" } |
      ForEach-Object { Join-Path $_.FullName "platform-tools\adb.exe" } |
      Where-Object { Test-Path -LiteralPath $_ } |
      Select-Object -First 1
    if ($wingetAdb) {
      return $wingetAdb
    }
  }

  return $null
}
