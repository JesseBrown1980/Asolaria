param([Parameter(Mandatory=$true)][string]$Path, [int]$Width=900)
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($Path)
$nw = $Width
$nh = [int]($src.Height * $Width / $src.Width)
$dst = New-Object System.Drawing.Bitmap $nw, $nh
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($src, 0, 0, $nw, $nh)
$out = $Path -replace '\.png$', "-${Width}.png"
$dst.Save($out)
$g.Dispose()
$src.Dispose()
$dst.Dispose()
Write-Host "wrote $out ($nw x $nh)"
