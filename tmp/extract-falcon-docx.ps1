Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = 'C:\Users\acer\Asolaria\tmp\falcon-pull-20260406\ray-liris-convo.docx'
$out = 'C:\Users\acer\Asolaria\tmp\falcon-pull-20260406\ray-liris-convo-extracted.txt'
$zip = [System.IO.Compression.ZipFile]::OpenRead($src)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = $xml -replace '</w:p>', "`r`n" -replace '<w:tab/>', "`t" -replace '<[^>]+>', '' -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>' -replace '&quot;','"'
$text | Out-File -FilePath $out -Encoding UTF8
Write-Host ('Extracted ' + $text.Length + ' chars to ' + $out)
