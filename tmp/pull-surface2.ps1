$src = 'E:\sovereignty\data\falcon-dump\home-extracted\liris-test\Asolaria\data\agent-index'
$dst = 'C:\Users\acer\Asolaria\data\falcon-dump-rehydrated\agent-index'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
robocopy $src $dst /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
$items = Get-ChildItem $dst -Recurse -File
$bytes = ($items | Measure-Object -Property Length -Sum).Sum
Write-Host "files=$($items.Count) bytes=$bytes"
$dirs = Get-ChildItem $dst -Directory
foreach ($d in $dirs) {
    $cnt = (Get-ChildItem $d.FullName -File -ErrorAction SilentlyContinue).Count
    Write-Host ("axis={0,-20} count={1}" -f $d.Name, $cnt)
}
