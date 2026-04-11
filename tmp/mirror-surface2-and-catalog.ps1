$src = 'C:\Users\acer\Asolaria\data\falcon-dump-rehydrated\agent-index'
$mirror = 'D:\safety-backups\session-20260407-asolaria\usb-rehydration\falcon-dump-agent-index'
New-Item -ItemType Directory -Force -Path $mirror | Out-Null
robocopy $src $mirror /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null

# Also mirror the BHC manifest itself
$bhcSrc = 'E:\safety-backups\session-20260406-asolaria\paper-v10-bhc-integrate-all\_BHC_INTEGRATE_ALL_MANIFEST.json'
$bhcDstLocal = 'C:\Users\acer\Asolaria\data\sovereignty-usb-rehydration-20260407\_BHC_INTEGRATE_ALL_MANIFEST.json'
$bhcDstD = 'D:\safety-backups\session-20260407-asolaria\usb-rehydration\_BHC_INTEGRATE_ALL_MANIFEST.json'
Copy-Item $bhcSrc $bhcDstLocal -Force
Copy-Item $bhcSrc $bhcDstD -Force

# Build catalog: per-axis tagged ndjson with v1.1 cube assignments
$axisMap = @{
    'identity'      = @{cube=6859;   prime=19; dim='D8_IDENTITY'}
    'mistake'       = @{cube=29791;  prime=31; dim='D11_PROOF'}
    'pattern'       = @{cube=29791;  prime=31; dim='D11_PROOF'; subtype='pattern'}
    'plan'          = @{cube=704969; prime=89; dim='D24_INTENT'}
    'project'       = @{cube=205379; prime=59; dim='D16_OWNERSHIP'}
    'reference'     = @{cube=10648;  prime=22; dim='D22_TRANSLATION'}
    'rule'          = @{cube=704969; prime=89; dim='D24_INTENT'}
    'skill'         = @{cube=8;      prime=2;  dim='D2_VERB'}
    'task'          = @{cube=2197;   prime=13; dim='D6_GATE'}
    'tool'          = @{cube=3375;   prime=15; dim='D15_DEVICE'}
    'gaia-catalogs' = @{cube=10648;  prime=22; dim='D22_TRANSLATION'}
    'gaia-ix-refs'  = @{cube=10648;  prime=22; dim='D22_TRANSLATION'}
}

$catalogPath = 'C:\Users\acer\Asolaria\data\sovereignty-usb-rehydration-20260407\04-surface2-axis-tagged-catalog.ndjson'
$catalogFp = [System.IO.StreamWriter]::new($catalogPath)
$count = 0
foreach ($axis in $axisMap.Keys) {
    $axisDir = Join-Path $src $axis
    if (-not (Test-Path $axisDir)) { continue }
    $files = Get-ChildItem $axisDir -File
    foreach ($f in $files) {
        $rec = @{
            ts = '2026-04-07T21:55:00Z'
            event = 'BHC_SURFACE2_AXIS_TAG'
            axis = $axis
            cube = $axisMap[$axis].cube
            prime_root = $axisMap[$axis].prime
            dim = $axisMap[$axis].dim
            subtype = $axisMap[$axis].subtype
            file = $f.Name
            bytes = $f.Length
            local_path = $f.FullName
            mirror_path = (Join-Path $mirror "$axis\$($f.Name)")
            axis_map_version = 'v1.1_DRAFT_pending_dual_cosign'
        }
        $catalogFp.WriteLine(($rec | ConvertTo-Json -Compress))
        $count++
    }
}
$catalogFp.Close()
Copy-Item $catalogPath 'D:\safety-backups\session-20260407-asolaria\usb-rehydration\04-surface2-axis-tagged-catalog.ndjson' -Force
Write-Host "catalog_records=$count"
Write-Host "catalog_path=$catalogPath"
