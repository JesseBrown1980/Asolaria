$moves = Get-Content -Raw .\moves.json | ConvertFrom-Json
foreach($m in $moves){
  if(Test-Path -LiteralPath $m.MovedTo){
    $parent = Split-Path -Parent $m.MovedFrom
    if(-not (Test-Path -LiteralPath $parent)){ New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Move-Item -LiteralPath $m.MovedTo -Destination $m.MovedFrom -Force
  }
}
