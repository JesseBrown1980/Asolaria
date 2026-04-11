@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Start-Jesse-SuperAdminTerminal.ps1" %*
endlocal
