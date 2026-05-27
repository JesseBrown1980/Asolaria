Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('C:\Users\acer\Asolaria\captures\whatsapp-send\screen-01-initial.png')
Write-Host "original: $($src.Width)x$($src.Height)"
$ratio = 900.0 / $src.Width
$nw = 900
$nh = [int]($src.Height * $ratio)
$dst = New-Object System.Drawing.Bitmap $nw, $nh
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($src, 0, 0, $nw, $nh)
$dst.Save('C:\Users\acer\Asolaria\captures\whatsapp-send\screen-01-initial-900.png')
$g.Dispose()
$src.Dispose()
$dst.Dispose()
Write-Host "resized: $nw x $nh"
