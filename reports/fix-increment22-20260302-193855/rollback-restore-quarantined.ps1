param()
$manifest = Join-Path $PSScriptRoot 'moved-manifest.csv'
if(-not (Test-Path $manifest)){ throw "Manifest not found: $manifest" }
$rows = Import-Csv $manifest
foreach($r in $rows){
  $src=$r.QuarantinePath; $dst=$r.OriginalPath
  if(Test-Path -LiteralPath $src){
    $dstDir = Split-Path -Parent $dst
    if(-not (Test-Path -LiteralPath $dstDir)){ New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    Move-Item -LiteralPath $src -Destination $dst -Force
    Write-Host ("Restored: {0}" -f $dst)
  }
}
