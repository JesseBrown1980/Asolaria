$moves = Get-Content -Raw .\moves.json | ConvertFrom-Json
foreach($m in $moves){ if(Test-Path -LiteralPath $m.QuarantinePath){ Move-Item -LiteralPath $m.QuarantinePath -Destination $m.OriginalPath -Force } }
