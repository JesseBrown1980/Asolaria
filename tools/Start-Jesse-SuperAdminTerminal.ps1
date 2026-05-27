param(
  [switch]$AtLogon,
  [switch]$Preview,
  [switch]$NoElevate
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

function Ensure-Directory {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function New-BootScript {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$AsolariaRoot,
    [Parameter(Mandatory = $true)][string]$QddRoot
  )

  $asolariaLiteral = $AsolariaRoot.Replace("'", "''")
  $qddLiteral = $QddRoot.Replace("'", "''")
  $lines = @(
    '$ErrorActionPreference = "Stop"',
    '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
    '$Host.UI.RawUI.WindowTitle = "Jesse Super Admin Terminal"',
    ('$global:AsolariaRoot = ''{0}''' -f $asolariaLiteral),
    ('$global:QddRoot = ''{0}''' -f $qddLiteral),
    'function Go-Asolaria { Set-Location $global:AsolariaRoot }',
    'function Go-Qdd {',
    '  if (Test-Path -LiteralPath $global:QddRoot) {',
    '    Set-Location $global:QddRoot',
    '    return',
    '  }',
    '  Write-Host ("QDD repo not found: {0}" -f $global:QddRoot) -ForegroundColor Yellow',
    '}',
    'Set-Alias aa Go-Asolaria',
    'Set-Alias qq Go-Qdd',
    'function qstatus {',
    '  Write-Host "[Asolaria]" -ForegroundColor DarkCyan',
    '  try { git -C $global:AsolariaRoot status --short --branch } catch { Write-Host $_.Exception.Message -ForegroundColor Yellow }',
    '  Write-Host ""',
    '  Write-Host "[QDD]" -ForegroundColor DarkCyan',
    '  try { git -C $global:QddRoot status --short --branch } catch { Write-Host $_.Exception.Message -ForegroundColor Yellow }',
    '  Write-Host ""',
    '  Write-Host "[Ports]" -ForegroundColor DarkCyan',
    '  try {',
    '    Get-NetTCPConnection -State Listen -ErrorAction Stop |',
    '      Where-Object { $_.LocalPort -in 4781,4782,4791,5443,18883,18884,18885 } |',
    '      Sort-Object LocalPort |',
    '      Format-Table -AutoSize',
    '  } catch {',
    '    Write-Host $_.Exception.Message -ForegroundColor Yellow',
    '  }',
    '}',
    'Set-Location $global:AsolariaRoot',
    '$identity = [Security.Principal.WindowsIdentity]::GetCurrent()',
    '$principal = New-Object Security.Principal.WindowsPrincipal($identity)',
    'Write-Host "Jesse Super Admin Terminal" -ForegroundColor Cyan',
    'Write-Host ("User: {0}" -f $identity.Name)',
    'Write-Host ("Elevated: {0}" -f $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))',
    'Write-Host ("Asolaria: {0}" -f $global:AsolariaRoot)',
    'Write-Host ("QDD: {0}" -f $global:QddRoot)',
    'Write-Host ""',
    'Write-Host "Quick commands:" -ForegroundColor DarkCyan',
    'Write-Host "  aa        -> C:\Users\acer\Asolaria"',
    'Write-Host "  qq        -> D:\projects\QDD\ebacmap-master"',
    'Write-Host "  qstatus   -> repo + listener snapshot"',
    'Write-Host ""'
  )

  Set-Content -LiteralPath $Path -Value $lines -Encoding UTF8
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$qddRoot = "D:\projects\QDD\ebacmap-master"
$shellPath = Resolve-ShellPath
$tempRoot = Join-Path $env:TEMP "jesse-super-admin-terminal"
$bootScript = Join-Path $tempRoot "boot.ps1"

Ensure-Directory -Path $tempRoot
New-BootScript -Path $bootScript -AsolariaRoot $repoRoot -QddRoot $qddRoot

$argumentList = @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-File", $bootScript
)

if ($Preview.IsPresent) {
  [pscustomobject]@{
    ok = $true
    atLogon = [bool]$AtLogon.IsPresent
    elevatedNow = [bool](Test-IsAdmin)
    shellPath = [string]$shellPath
    bootScript = [string]$bootScript
    workingDirectory = [string]$repoRoot
    arguments = @($argumentList)
  }
  return
}

if (-not $NoElevate.IsPresent -and -not (Test-IsAdmin)) {
  Start-Process -FilePath $shellPath -Verb RunAs -WorkingDirectory $repoRoot -ArgumentList $argumentList | Out-Null
  return
}

Start-Process -FilePath $shellPath -WorkingDirectory $repoRoot -ArgumentList $argumentList | Out-Null
