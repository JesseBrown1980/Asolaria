$p = 'E:\safety-backups\session-20260406-asolaria\paper-v10-bhc-integrate-all\_BHC_INTEGRATE_ALL_MANIFEST.json'
if (Test-Path $p) {
    $sz = (Get-Item $p).Length
    $sha = (Get-FileHash -Algorithm SHA256 $p).Hash.ToLower()
    $exp = 'baf5052374826fddd199127177e5f9954edf67c286814d34a376e129988d784c'
    Write-Host "path=$p"
    Write-Host "size=$sz"
    Write-Host "sha256=$sha"
    Write-Host "expected=$exp"
    if ($sha -eq $exp) { Write-Host "VERDICT=MATCH" } else { Write-Host "VERDICT=MISMATCH" }
} else {
    Write-Host "MISSING $p"
    Get-ChildItem 'E:\safety-backups' -Recurse -Filter '_BHC_INTEGRATE_ALL_MANIFEST.json' -ErrorAction SilentlyContinue | Select-Object FullName | Format-List
}
