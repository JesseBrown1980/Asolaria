$dirs = @('identity','mistake','pattern','plan','project','reference','rule','skill','task','tool','gaia-catalogs','gaia-ix-refs')
foreach ($d in $dirs) {
    $p = "E:\sovereignty\data\agent-index\$d"
    if (Test-Path $p) {
        $items = Get-ChildItem $p -Force -ErrorAction SilentlyContinue
        $bytes = ($items | Measure-Object -Property Length -Sum).Sum
        Write-Host ("{0,-20} count={1,4} bytes={2}" -f $d, $items.Count, $bytes)
    } else {
        Write-Host ("{0,-20} MISSING" -f $d)
    }
}
$rootFiles = Get-ChildItem 'E:\sovereignty\data\agent-index' -File -Force -ErrorAction SilentlyContinue
$rb = ($rootFiles | Measure-Object -Property Length -Sum).Sum
Write-Host ("{0,-20} count={1,4} bytes={2}" -f '_root_files', $rootFiles.Count, $rb)
