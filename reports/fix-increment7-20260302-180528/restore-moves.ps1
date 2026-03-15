$moves = Get-Content -Raw .\moves.json | ConvertFrom-Json
foreach($m in $moves){ if(Test-Path -LiteralPath $m.MovedTo){ Move-Item -LiteralPath $m.MovedTo -Destination $m.MovedFrom -Force } }
