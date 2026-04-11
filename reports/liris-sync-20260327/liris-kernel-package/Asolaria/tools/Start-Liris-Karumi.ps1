param(
  [switch]$NoOverlayRefresh
)

Set-StrictMode -Version Latest
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Resolve-Path (Join-Path $ScriptRoot "..")

Push-Location $ProjectRoot
try {
  Write-Host "Karumi launcher: starting Liris sub-colony..."
  Start-Process -FilePath "$ProjectRoot\Start-Asolaria-SubColony.cmd" -WorkingDirectory $ProjectRoot -WindowStyle Normal

  $termTitle = "Liris SuperAdmin"
  $psCommand = @"
`$host.UI.RawUI.BackgroundColor = 'DarkMagenta'
`$host.UI.RawUI.ForegroundColor = 'White'
Clear-Host
Write-Host 'Karumi terminal ready – superadmin track engaged.' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Press any key to keep this terminal alive for extra inspectors...' -ForegroundColor Gray
`$null = `$host.UI.RawUI.WindowTitle = '$termTitle'
Read-Host -Prompt 'Karumi terminal prompt (CTRL+C to exit)'
"@

  $terminalArgs = @{
    FilePath = "powershell.exe"
    ArgumentList = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $psCommand)
    WorkingDirectory = $ProjectRoot
    WindowStyle = "Normal"
  }

  Start-Process @terminalArgs

  if (-not $NoOverlayRefresh) {
    try {
      Start-Sleep -Seconds 4
      Invoke-RestMethod -Uri "http://127.0.0.1:4791/__karumi-refresh" -Method Post -ErrorAction SilentlyContinue | Out-Null
    } catch {
      Write-Host "Karumi overlay refresh endpoint not ready yet." -ForegroundColor DarkYellow
    }
  }

  Write-Host "Karumi overlay launched. Use the Asolaria icon to refresh the UI if needed."
} finally {
  Pop-Location
}
