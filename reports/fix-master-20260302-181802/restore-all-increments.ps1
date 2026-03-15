$ErrorActionPreference = "Continue"
$dirs = @(
  "C:\Users\acer\Asolaria\reports\fix-increment9-20260302-180827"
  "C:\Users\acer\Asolaria\reports\fix-increment8-20260302-180641"
  "C:\Users\acer\Asolaria\reports\fix-increment7-20260302-180528"
  "C:\Users\acer\Asolaria\reports\fix-increment6-20260302-180448"
  "C:\Users\acer\Asolaria\reports\fix-increment5-20260302-180421"
  "C:\Users\acer\Asolaria\reports\fix-increment4-20260302-180346"
  "C:\Users\acer\Asolaria\reports\fix-increment3-20260302-175542"
  "C:\Users\acer\Asolaria\reports\fix-increment3-20260302-175514"
  "C:\Users\acer\Asolaria\reports\fix-increment3-20260302-175404"
  "C:\Users\acer\Asolaria\reports\fix-increment2-20260302-175235"
  "C:\Users\acer\Asolaria\reports\fix-increment12-20260302-181402"
  "C:\Users\acer\Asolaria\reports\fix-increment1-20260302-171650"
  "C:\Users\acer\Asolaria\reports\fix-increment11-20260302-181330"
  "C:\Users\acer\Asolaria\reports\fix-increment10-20260302-181116"
)
foreach($d in $dirs){
  Write-Host "Checking $d"
  $scripts = @("restore-moves.ps1","restore-task.ps1","restore-startup-link.ps1","restore-env.ps1")
  foreach($s in $scripts){
    $p = Join-Path $d $s
    if(Test-Path -LiteralPath $p){ Write-Host "Running $p"; & powershell -NoProfile -ExecutionPolicy Bypass -File $p }
  }
}
