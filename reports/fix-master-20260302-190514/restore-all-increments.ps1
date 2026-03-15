param()
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$items = Get-Content -Raw (Join-Path $here "increment-index.json") | ConvertFrom-Json
$ordered = @($items) | Sort-Object incrementName -Descending
foreach($it in $ordered){
  if(-not $it.rollbackScripts){ continue }
  foreach($rb in $it.rollbackScripts){
    try {
      if(Test-Path $rb){ Write-Host ("Running rollback: {0}" -f $rb); & powershell -ExecutionPolicy Bypass -File $rb }
    } catch { Write-Warning $_.Exception.Message }
  }
}
