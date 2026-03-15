$startup=[Environment]::GetFolderPath('Startup')
$disabled=Join-Path $startup 'Asolaria One Button Startup.lnk.disabled'
$lnk=Join-Path $startup 'Asolaria One Button Startup.lnk'
if(Test-Path -LiteralPath $disabled){ Rename-Item -LiteralPath $disabled -NewName 'Asolaria One Button Startup.lnk' -Force }
