$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = 
'Asolaria Admin Terminal - Helm'
Set-Location 
'C:\Users\acer'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$profileId = 
'admin-helm-v1'
$commandPath = 
'codex'
$commandArgs = @(
'-a', 'never', '-s', 'danger-full-access'
)
$transcriptPath = 
'C:\Users\acer\Asolaria\runtime\admin-terminals\helm\transcript.log'
try { if (Test-Path -LiteralPath $transcriptPath) { Remove-Item -LiteralPath $transcriptPath -Force -ErrorAction SilentlyContinue } } catch {}
Start-Transcript -Path $transcriptPath -Force | Out-Null
Write-Host ("Asolaria Admin Terminal: " + $profileId) -ForegroundColor Cyan
Write-Host ("Working directory: " + (Get-Location).Path) -ForegroundColor DarkCyan
Write-Host "Interactive Codex session is starting..." -ForegroundColor DarkCyan
Write-Host ""
$launchArgs = @("--no-alt-screen") + $commandArgs
$exitCode = 0
try {
  & $commandPath @launchArgs
  $exitCode = if ($LASTEXITCODE -ne $null) { [int]$LASTEXITCODE } else { 0 }
} catch {
  $exitCode = 1
  Write-Host ("Terminal launch failed: " + $_.Exception.Message) -ForegroundColor Red
}
Write-Host ""
Write-Host ("[Asolaria] interactive terminal exited code=" + [string]$exitCode) -ForegroundColor Yellow
try { Stop-Transcript | Out-Null } catch {}
exit $exitCode
