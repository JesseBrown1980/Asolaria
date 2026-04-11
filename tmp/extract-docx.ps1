Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = 'C:\Users\acer\Downloads\Shannon omni waves and reflection problem.docx'
$out = 'C:\Users\acer\Asolaria\tmp\shannon-omni-waves-extracted.txt'
$zip = [System.IO.Compression.ZipFile]::OpenRead($src)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
# Convert paragraph breaks to newlines, then strip all other XML tags
$text = $xml -replace '</w:p>', "`r`n" -replace '<w:tab/>', "`t" -replace '<[^>]+>', '' -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>' -replace '&quot;','"'
$text | Out-File -FilePath $out -Encoding UTF8
Write-Host ('Extracted ' + $text.Length + ' chars to ' + $out)
