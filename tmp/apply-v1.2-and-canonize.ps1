# Apply v1.2 axis map: retag rule records D24→D5, write per-axis cube index files,
# canonize LX-492 (CANDIDATE→PROMOTED), mirror all to D.

$root = 'C:\Users\acer\Asolaria'
$catalogPath = "$root\data\sovereignty-usb-rehydration-20260407\04-surface2-axis-tagged-catalog.ndjson"
$retaggedPath = "$root\data\sovereignty-usb-rehydration-20260407\04b-surface2-axis-tagged-catalog-v1.2.ndjson"
$cubesRoot = "$root\data\cubes"

# v1.2 axis map (canonical, post-dual-cosign)
$axisMapV12 = @{
    'identity'      = @{cube=6859;   prime=19; dim='D8_IDENTITY'}
    'mistake'       = @{cube=29791;  prime=31; dim='D11_PROOF'}
    'pattern'       = @{cube=29791;  prime=31; dim='D11_PROOF'; subtype='pattern'}
    'plan'          = @{cube=704969; prime=89; dim='D24_INTENT'}
    'project'       = @{cube=205379; prime=59; dim='D16_OWNERSHIP'}
    'reference'     = @{cube=10648;  prime=22; dim='D22_TRANSLATION'}
    'rule'          = @{cube=1331;   prime=11; dim='D5_LAYER'}
    'skill'         = @{cube=8;      prime=2;  dim='D2_VERB'}
    'task'          = @{cube=2197;   prime=13; dim='D6_GATE'}
    'tool'          = @{cube=3375;   prime=15; dim='D15_DEVICE'}
    'gaia-catalogs' = @{cube=10648;  prime=22; dim='D22_TRANSLATION'}
    'gaia-ix-refs'  = @{cube=10648;  prime=22; dim='D22_TRANSLATION'}
}

# 1. Retag the surface2 catalog with v1.2 (rule moves D24→D5)
$retaggedFp = [System.IO.StreamWriter]::new($retaggedPath)
$ruleRetagCount = 0
$totalRecords = 0
foreach ($line in Get-Content $catalogPath) {
    $rec = $line | ConvertFrom-Json
    $axis = $rec.axis
    if ($axisMapV12.ContainsKey($axis)) {
        $oldDim = $rec.dim
        $newDim = $axisMapV12[$axis].dim
        $rec.cube = $axisMapV12[$axis].cube
        $rec.prime_root = $axisMapV12[$axis].prime
        $rec.dim = $newDim
        $rec.axis_map_version = 'v1.2_PROMOTED_dual_cosign_2026-04-07T22:05Z'
        if ($oldDim -ne $newDim) { $ruleRetagCount++ }
    }
    $retaggedFp.WriteLine(($rec | ConvertTo-Json -Compress))
    $totalRecords++
}
$retaggedFp.Close()
Write-Host "retagged_total=$totalRecords retagged_dim_changes=$ruleRetagCount"

# 2. Write per-axis cube index files at data/cubes/<axis>/index.ndjson
$indexCounts = @{}
foreach ($axis in $axisMapV12.Keys) {
    $axisCube = $axisMapV12[$axis].cube
    $cubeDir = Join-Path $cubesRoot ("{0}-{1}" -f $axis, $axisCube)
    New-Item -ItemType Directory -Force -Path $cubeDir | Out-Null
    $indexPath = Join-Path $cubeDir 'index.ndjson'
    $indexFp = [System.IO.StreamWriter]::new($indexPath)

    # Header record describing the cube
    $header = @{
        ts = '2026-04-07T22:06:00Z'
        event = 'BHC_CUBE_INDEX_HEADER'
        axis = $axis
        cube = $axisCube
        prime_root = $axisMapV12[$axis].prime
        dim = $axisMapV12[$axis].dim
        subtype = $axisMapV12[$axis].subtype
        axis_map_version = 'v1.2'
        cosign_chain = @('COSIGN_MERGED_014_rayssa', 'COSIGN_MERGED_015_rayssa_grant', 'COSIGN_MERGED_016_jesse', 'COSIGN_MERGED_017_jesse_grant')
        ref = 'LX-492_PROMOTED'
    }
    $indexFp.WriteLine(($header | ConvertTo-Json -Compress))

    # Read retagged records and emit per-axis entries
    $axisRecCount = 0
    foreach ($line in Get-Content $retaggedPath) {
        $rec = $line | ConvertFrom-Json
        if ($rec.axis -eq $axis) {
            $entry = @{
                ts = $rec.ts
                cube = $rec.cube
                dim = $rec.dim
                file = $rec.file
                bytes = $rec.bytes
                local_path = $rec.local_path
                subtype = $rec.subtype
                axis_map_version = $rec.axis_map_version
            }
            $indexFp.WriteLine(($entry | ConvertTo-Json -Compress))
            $axisRecCount++
        }
    }
    $indexFp.Close()
    $indexCounts[$axis] = $axisRecCount
    Write-Host ("cube_index axis={0,-15} cube={1,-7} dim={2,-20} records={3}" -f $axis, $axisCube, $axisMapV12[$axis].dim, $axisRecCount)
}

# 3. Mirror everything to D safety-backups
$dMirror = 'D:\safety-backups\session-20260407-asolaria\usb-rehydration'
Copy-Item $retaggedPath (Join-Path $dMirror '04b-surface2-axis-tagged-catalog-v1.2.ndjson') -Force
robocopy $cubesRoot (Join-Path $dMirror 'cubes') /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null

Write-Host ""
Write-Host "DONE: v1.2 retag + cube indexes + D mirror"
Write-Host "retagged_path=$retaggedPath"
Write-Host "cubes_root=$cubesRoot"
Write-Host "d_mirror=$dMirror"
