@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Install-Jesse-SuperAdminTerminalTask.ps1" %*
endlocal
