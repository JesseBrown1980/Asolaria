$f = 'C:\Users\acer\Asolaria\data\omni-processor\paper-draft\incoming\paper-draft\stage-2-publisher-design-liris-blind.md'
$expected = '0a72c6e15871f7c003e117b187c77f332efdca12628841f77b0e8a0e60b71fcc'
$sz = (Get-Item $f).Length
$sha = (Get-FileHash -Algorithm SHA256 $f).Hash.ToLower()
Write-Host ('size=' + $sz)
Write-Host ('sha256=' + $sha)
Write-Host ('expected=' + $expected)
if ($sha -eq $expected) { Write-Host 'VERDICT=MATCH_byte_identical' } else { Write-Host 'VERDICT=MISMATCH' }
