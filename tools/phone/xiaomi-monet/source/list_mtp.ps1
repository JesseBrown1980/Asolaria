$shell = New-Object -ComObject Shell.Application
$mypc = $shell.NameSpace(17)
foreach ($item in $mypc.Items()) {
    Write-Host "$($item.Name) | $($item.Path)"
    if ($item.Name -like '*Mi*' -or $item.Name -like '*Xiaomi*' -or $item.Name -like '*MTP*' -or $item.Name -like '*phone*' -or $item.Name -like '*telefone*') {
        Write-Host "  ^^^ PHONE FOUND ^^^"
        $sub = $item.GetFolder
        if ($sub) {
            foreach ($child in $sub.Items()) {
                Write-Host "  -> $($child.Name)"
            }
        } else {
            Write-Host "  (no folder access - phone locked?)"
        }
    }
}

