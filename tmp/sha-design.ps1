$f = 'C:\Users\acer\Asolaria\data\designs\stage2-publisher-acer-blind.md'
Write-Host ('size=' + (Get-Item $f).Length)
Write-Host ('sha256=' + (Get-FileHash -Algorithm SHA256 $f).Hash.ToLower())
