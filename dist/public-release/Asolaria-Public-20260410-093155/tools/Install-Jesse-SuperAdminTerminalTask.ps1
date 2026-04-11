[CmdletBinding()]
param(
  [string]$TaskName = "Jesse Super Admin Terminal",
  [switch]$Preview,
  [switch]$StartNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Resolve-ShellPath {
  $pwsh = Get-Command pwsh.exe -ErrorAction SilentlyContinue
  if ($pwsh -and $pwsh.Source) {
    return $pwsh.Source
  }
  return "powershell.exe"
}

function Get-StartupLauncherPath {
  $startupDir = [Environment]::GetFolderPath("Startup")
  if ([string]::IsNullOrWhiteSpace($startupDir)) {
    throw "Could not resolve the current user's Startup folder."
  }
  return Join-Path $startupDir "Jesse Super Admin Terminal.cmd"
}

function Install-StartupLauncher {
  param(
    [Parameter(Mandatory = $true)][string]$LauncherPath,
    [Parameter(Mandatory = $true)][string]$StartScriptPath
  )

  $content = @(
    "@echo off",
    "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""$StartScriptPath"" -AtLogon"
  )
  Set-Content -LiteralPath $LauncherPath -Value $content -Encoding ASCII
}

function Remove-StartupLauncher {
  param([Parameter(Mandatory = $true)][string]$LauncherPath)
  if (Test-Path -LiteralPath $LauncherPath) {
    Remove-Item -LiteralPath $LauncherPath -Force
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$startScript = Join-Path $PSScriptRoot "Start-Jesse-SuperAdminTerminal.ps1"
if (-not (Test-Path -LiteralPath $startScript)) {
  throw "Launcher script not found: $startScript"
}

$shellPath = Resolve-ShellPath
$userId = "{0}\{1}" -f $env:USERDOMAIN, $env:USERNAME
$argumentString = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -AtLogon' -f $startScript
$startupLauncherPath = Get-StartupLauncherPath

if (-not $Preview.IsPresent -and -not (Test-IsAdmin)) {
  Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $PSCommandPath,
    "-TaskName", $TaskName
  ) | Out-Null
  return
}

$action = New-ScheduledTaskAction -Execute $shellPath -Argument $argumentString
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

if ($Preview.IsPresent) {
  [pscustomobject]@{
    ok = $true
    taskName = [string]$TaskName
    userId = [string]$userId
    execute = [string]$shellPath
    arguments = [string]$argumentString
    repoRoot = [string]$repoRoot
    runLevel = "Highest"
    trigger = "AtLogOn"
    startupLauncher = [string]$startupLauncherPath
  }
  return
}

try {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
  Remove-StartupLauncher -LauncherPath $startupLauncherPath
  $mode = "scheduled_task"
  $registeredTask = Get-ScheduledTask -TaskName $TaskName
  $state = [string]$registeredTask.State
} catch {
  Install-StartupLauncher -LauncherPath $startupLauncherPath -StartScriptPath $startScript
  $mode = "startup_folder"
  $state = "Installed"
}

if ($StartNow.IsPresent) {
  if ($mode -eq "scheduled_task") {
    Start-ScheduledTask -TaskName $TaskName
  } else {
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", $startScript,
      "-AtLogon"
    ) | Out-Null
  }
}

[pscustomobject]@{
  ok = $true
  taskName = [string]$TaskName
  mode = [string]$mode
  state = [string]$state
  startupLauncher = [string]$startupLauncherPath
}
