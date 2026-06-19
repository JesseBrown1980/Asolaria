$shell = New-Object -ComObject Shell.Application
$mypc = $shell.NameSpace(17)
foreach ($item in $mypc.Items()) {
    if ($item.Name -like '*Mi*' -or $item.Name -like '*Xiaomi*' -or $item.Name -like '*MTP*' -or $item.Path -like '*2717*') {
        Write-Host "FOUND: $($item.Name)"
        $sub = $item.GetFolder
        if ($sub) {
            foreach ($child in $sub.Items()) {
                Write-Host "  -> $($child.Name)"
            }
        } else {
            Write-Host "  (no access - still locked)"
        }
    }
}

