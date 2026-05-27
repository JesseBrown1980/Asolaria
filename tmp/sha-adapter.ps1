$f = 'C:\Users\acer\Asolaria\tools\cube\resono-bridge-adapter.js'
Write-Host ('size=' + (Get-Item $f).Length)
Write-Host ('sha256=' + (Get-FileHash -Algorithm SHA256 $f).Hash.ToLower())
