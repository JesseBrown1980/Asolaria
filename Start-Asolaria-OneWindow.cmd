@echo off
setlocal
set "ASOLARIA_REMOTE_APPROVAL_BASE_URL="
set "ASOLARIA_CONNECTION_PREFERENCE=usb,private_internet,public_internet"
set "ASOLARIA_CONNECTION_AVAILABLE=usb,private_internet,public_internet"
set "ASOLARIA_CONNECTION_ALLOW_PUBLIC=true"
set "ASOLARIA_ALLOW_PUBLIC_INTERNET=true"
set "ASOLARIA_PUBLIC_INTERNET_IS_PRIVATE=false"
set "ASOLARIA_NETWORK_REMOTE_AUTH_REQUIRED=true"
set "ASOLARIA_NETWORK_REQUIRE_ENCRYPTED_REMOTE=true"
set "ASOLARIA_NETWORK_STEALTH_DENY=true"

set "UI_MODE=%~1"
if /I "%UI_MODE%"=="" set "UI_MODE=simple"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Open-Asolaria-AppShell.ps1" -Mode "%UI_MODE%" %2 %3 %4 %5 %6 %7 %8 %9
endlocal
