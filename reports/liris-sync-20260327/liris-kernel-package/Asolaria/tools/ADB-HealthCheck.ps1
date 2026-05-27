param(
  [switch]$FixUnauthorized = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AsolariaRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Resolve-AdbPath {
  $localAppData = [string]$env:LOCALAPPDATA

  try {
    $cmd = Get-Command adb -ErrorAction Stop
    if ($cmd.Source) { return $cmd.Source }
    if ($cmd.Path) { return $cmd.Path }
  } catch {
    # Continue to known paths.
  }

  $candidates = @(
    (Join-Path $localAppData "Android\Sdk\platform-tools\adb.exe"),
    "C:\Android\platform-tools\adb.exe",
    "C:\platform-tools\adb.exe",
    "C:\Program Files\Android\platform-tools\adb.exe",
    (Join-Path $localAppData "Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe")
  )

  foreach ($path in $candidates) {
    if (Test-Path $path) {
      return $path
    }
  }

  $wingetPackagesRoot = Join-Path $localAppData "Microsoft\WinGet\Packages"
  if (Test-Path $wingetPackagesRoot) {
    $wingetAdb = Get-ChildItem $wingetPackagesRoot -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "Google.PlatformTools*" } |
      ForEach-Object { Join-Path $_.FullName "platform-tools\adb.exe" } |
      Where-Object { Test-Path $_ } |
      Select-Object -First 1
    if ($wingetAdb) {
      return $wingetAdb
    }
  }

  return $null
}

function Parse-AdbDevices {
  param([string[]]$Lines)

  $rows = @()
  foreach ($line in $Lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line -like "List of devices attached*") { continue }
    $trimmed = $line.Trim()
    if ($trimmed -match "^(\S+)\s+(\S+)(.*)$") {
      $rows += [pscustomobject]@{
        Serial = $Matches[1]
        State = $Matches[2]
        Extra = $Matches[3].Trim()
      }
    }
  }
  return $rows
}

function Get-HostVisiblePhoneHardware {
  $rows = @()

  try {
    $rows = @(Get-PnpDevice -PresentOnly -ErrorAction Stop |
      Where-Object {
        $name = [string]$_.FriendlyName
        $className = [string]$_.Class
        if ($name -match "Root Hub|Composite Device|Host Controller") { return $false }
        return ($name -match "Android|Galaxy|Samsung|Pixel|Phone|ADB") -or ($className -match "WPD|Portable Devices|Android")
      } |
      Select-Object @{
        Name = "FriendlyName"
        Expression = { [string]$_.FriendlyName }
      }, @{
        Name = "Class"
        Expression = { [string]$_.Class }
      }, @{
        Name = "Status"
        Expression = { [string]$_.Status }
      })
  } catch {
    $rows = @()
  }

  if ($rows.Count -lt 1) {
    try {
      $rows = @(Get-CimInstance Win32_PnPEntity -ErrorAction Stop |
        Where-Object {
          $name = [string]$_.Name
          $className = [string]$_.PNPClass
          if ($name -match "Root Hub|Composite Device|Host Controller") { return $false }
          return ($name -match "Android|Galaxy|Samsung|Pixel|Phone|ADB") -or ($className -match "WPD|Portable Devices|Android")
        } |
        Select-Object @{
          Name = "FriendlyName"
          Expression = { [string]$_.Name }
        }, @{
          Name = "Class"
          Expression = { [string]$_.PNPClass }
        }, @{
          Name = "Status"
          Expression = { [string]$_.Status }
        })
    } catch {
      $rows = @()
    }
  }

  return @($rows)
}

function Print-UnauthorizedHelp {
  Write-Host ""
  Write-Host "Device is connected but unauthorized."
  Write-Host "1) On phone: Settings -> Developer options -> Revoke USB debugging authorizations."
  Write-Host "2) Unplug/replug USB cable."
  Write-Host "3) On phone popup, check 'Always allow from this computer' and tap Allow."
  Write-Host ""
}

$root = Get-AsolariaRoot
$logDir = Join-Path $root "logs"
New-Item -Path $logDir -ItemType Directory -Force | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir ("adb-health-{0}.log" -f $stamp)

Start-Transcript -Path $logPath -Force | Out-Null
try {
  $adbPath = Resolve-AdbPath
  if (-not $adbPath) {
    throw "adb.exe not found. Install platform-tools first."
  }

  Write-Host "ADB executable: $adbPath"
  & $adbPath start-server | Out-Null

  $deviceLines = & $adbPath devices -l
  $rows = @(Parse-AdbDevices -Lines $deviceLines)
  $visiblePhoneHardware = @(Get-HostVisiblePhoneHardware)
  Write-Host ""
  Write-Host "adb devices -l"
  $deviceLines | ForEach-Object { Write-Host $_ }

  if ($rows.Count -eq 0) {
    Write-Host ""
    Write-Host "No device detected."
    if ($visiblePhoneHardware.Count -gt 0) {
      $summary = ($visiblePhoneHardware | ForEach-Object {
        $name = [string]$_.FriendlyName
        $className = [string]$_.Class
        $status = [string]$_.Status
        if ($className) {
          return ("{0} [{1}/{2}]" -f $name, $className, $status)
        }
        return ("{0} [{1}]" -f $name, $status)
      }) -join "; "
      Write-Host ("Windows-visible phone hardware: " + $summary)
      Write-Host "ADB interface is not active yet."
      Write-Host "On phone: unlock it, enable USB debugging, accept this computer, then reconnect once if needed."
    } else {
      Write-Host "Check cable, USB mode, and that phone is unlocked."
    }
    return
  }

  $unauthorized = $rows | Where-Object { $_.State -eq "unauthorized" }
  if ($unauthorized -and $FixUnauthorized) {
    Write-Host ""
    Write-Host "Unauthorized device detected. Restarting adb server once..."
    & $adbPath kill-server | Out-Null
    Start-Sleep -Milliseconds 600
    & $adbPath start-server | Out-Null
    $deviceLines = & $adbPath devices -l
    $rows = @(Parse-AdbDevices -Lines $deviceLines)
    Write-Host ""
    Write-Host "adb devices -l (after reset)"
    $deviceLines | ForEach-Object { Write-Host $_ }
  }

  $first = $rows | Select-Object -First 1
  if ($first.State -eq "device") {
    $model = (& $adbPath shell getprop ro.product.model 2>$null).Trim()
    $android = (& $adbPath shell getprop ro.build.version.release 2>$null).Trim()
    $fingerprint = (& $adbPath shell getprop ro.build.fingerprint 2>$null).Trim()
    Write-Host ""
    Write-Host "Connected and authorized."
    Write-Host "Model: $model"
    Write-Host "Android: $android"
    Write-Host "Fingerprint: $fingerprint"
  } elseif ($first.State -eq "unauthorized") {
    Print-UnauthorizedHelp
  } elseif ($first.State -eq "sideload") {
    Write-Host ""
    Write-Host "Device is in sideload mode. This is expected only during recovery updates."
  } else {
    Write-Host ""
    Write-Host ("Device state: {0}" -f $first.State)
  }
} finally {
  Stop-Transcript | Out-Null
  Write-Host ""
  Write-Host "Health check log saved to:"
  Write-Host $logPath
}
