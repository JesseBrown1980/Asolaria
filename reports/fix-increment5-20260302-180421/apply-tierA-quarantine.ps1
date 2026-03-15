$manifest = Get-Content -Raw .\onedrive-duplicate-manifest.json | ConvertFrom-Json
$quar = Join-Path (Get-Location) "quarantine-onedrive-tierA"; New-Item -ItemType Directory -Path $quar -Force | Out-Null
$moved=@()
foreach($g in $manifest.TierA){ if(@($g.Paths).Count -ne 2){ continue }; $p1=$g.Paths[0]; $p2=$g.Paths[1]; $keep = if($p1 -notmatch "\\(1\\)|copy"){$p1}else{$p2}; $move = if($keep -eq $p1){$p2}else{$p1}; if((Test-Path -LiteralPath $keep) -and (Test-Path -LiteralPath $move)){ $h1=(Get-FileHash -Algorithm SHA256 -LiteralPath $keep).Hash; $h2=(Get-FileHash -Algorithm SHA256 -LiteralPath $move).Hash; if($h1 -eq $h2){ $dest=Join-Path $quar ([IO.Path]::GetFileName($move)); Move-Item -LiteralPath $move -Destination $dest -Force; $moved += [pscustomobject]@{MovedFrom=$move;Kept=$keep;MovedTo=$dest;Hash=$h1} } } }
$moved | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 .\tierA-moves.json
