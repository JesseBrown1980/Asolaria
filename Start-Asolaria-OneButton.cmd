@echo off
setlocal
set "ASOLARIA_REMOTE_APPROVAL_BASE_URL="
set "ASOLARIA_CONNECTION_PREFERENCE=usb,private_internet"
set "ASOLARIA_CONNECTION_AVAILABLE=usb,private_internet"
set "ASOLARIA_CONNECTION_ALLOW_PUBLIC=false"
set "ASOLARIA_ALLOW_PUBLIC_INTERNET=false"
set "ASOLARIA_PUBLIC_INTERNET_IS_PRIVATE=false"
set "ASOLARIA_NETWORK_REMOTE_AUTH_REQUIRED=true"
set "ASOLARIA_NETWORK_REQUIRE_ENCRYPTED_REMOTE=true"
set "ASOLARIA_NETWORK_STEALTH_DENY=true"
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0tools\Start-Asolaria-OneButton.ps1" -SkipPublicTunnelKeeper -SkipTunnelMonitor -HealthGuardrailSkipOli %*
endlocal
