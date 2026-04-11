# Setup-SubColony.ps1
# Run on Rayssa's PC (admin PowerShell) to fully equip the Asolaria sub-colony
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools\Setup-SubColony.ps1

$ErrorActionPreference = "Continue"
Write-Host "`n=== Asolaria Sub-Colony Setup ===" -ForegroundColor Cyan
Write-Host "Target: $env:COMPUTERNAME ($env:USERNAME)" -ForegroundColor Gray

# --- 1. Install core tools via winget ---
$tools = @(
    @{ Id = "BurntSushi.ripgrep.MSVC";  Name = "ripgrep (rg)" },
    @{ Id = "Cloudflare.cloudflared";    Name = "cloudflared" },
    @{ Id = "Git.Git";                   Name = "Git" }
)

foreach ($tool in $tools) {
    Write-Host "`n[*] Checking $($tool.Name)..." -ForegroundColor Yellow
    $installed = winget list --id $tool.Id 2>$null | Select-String $tool.Id
    if ($installed) {
        Write-Host "    Already installed." -ForegroundColor Green
    } else {
        Write-Host "    Installing $($tool.Name)..." -ForegroundColor Yellow
        winget install --id $tool.Id --accept-source-agreements --accept-package-agreements -e
    }
}

# --- 2. Verify Node.js ---
Write-Host "`n[*] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "    Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "    Node.js NOT found. Installing..." -ForegroundColor Red
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -e
}

# --- 3. Install npm dependencies ---
$asoRoot = "C:\Users\rayss\Asolaria"
if (Test-Path "$asoRoot\package.json") {
    Write-Host "`n[*] Installing npm dependencies..." -ForegroundColor Yellow
    Push-Location $asoRoot
    npm install --omit=dev 2>&1 | Select-Object -Last 3
    Pop-Location
    Write-Host "    Done." -ForegroundColor Green
} else {
    Write-Host "`n[!] No package.json found at $asoRoot" -ForegroundColor Red
}

# --- 4. Verify ripgrep works ---
Write-Host "`n[*] Verifying ripgrep..." -ForegroundColor Yellow
$rgPath = (Get-Command rg -ErrorAction SilentlyContinue).Source
if ($rgPath) {
    Write-Host "    rg found at: $rgPath" -ForegroundColor Green
    $rgVersion = rg --version 2>$null | Select-Object -First 1
    Write-Host "    $rgVersion" -ForegroundColor Green
} else {
    Write-Host "    rg NOT in PATH. You may need to restart the terminal." -ForegroundColor Red
}

# --- 5. Verify cloudflared ---
Write-Host "`n[*] Verifying cloudflared..." -ForegroundColor Yellow
$cfPath = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if ($cfPath) {
    Write-Host "    cloudflared found at: $cfPath" -ForegroundColor Green
} else {
    $fallback = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
    if (Test-Path $fallback) {
        Write-Host "    cloudflared found at: $fallback (not in PATH)" -ForegroundColor Yellow
    } else {
        Write-Host "    cloudflared NOT found." -ForegroundColor Red
    }
}

# --- 6. Setup port proxy for MCP bridge (LAN access) ---
Write-Host "`n[*] Configuring LAN port proxy for MCP bridge (4793)..." -ForegroundColor Yellow
$existing = netsh interface portproxy show v4tov4 2>$null | Select-String "4793"
if ($existing) {
    Write-Host "    Port proxy already configured." -ForegroundColor Green
} else {
    netsh interface portproxy add v4tov4 listenport=4793 listenaddress=0.0.0.0 connectport=4793 connectaddress=127.0.0.1
    Write-Host "    Port proxy added (0.0.0.0:4793 -> 127.0.0.1:4793)." -ForegroundColor Green
}

# --- 7. Firewall rule ---
Write-Host "`n[*] Checking firewall rule for MCP bridge..." -ForegroundColor Yellow
$fwRule = Get-NetFirewallRule -DisplayName "MCP Bridge 4793" -ErrorAction SilentlyContinue
if ($fwRule) {
    Write-Host "    Firewall rule exists." -ForegroundColor Green
} else {
    New-NetFirewallRule -DisplayName "MCP Bridge 4793" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4793 | Out-Null
    Write-Host "    Firewall rule created." -ForegroundColor Green
}

# --- 8. Restart MCP bridge with full tooling ---
Write-Host "`n[*] Restarting MCP bridge..." -ForegroundColor Yellow
$bridgeProc = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "augment-mcp-bridge" -or $_.CommandLine -match "Start-AugmentMcpBridge"
}
# Don't kill existing bridge - just report status
$bridgeListening = netstat -an 2>$null | Select-String "4793.*LISTENING"
if ($bridgeListening) {
    Write-Host "    MCP bridge already running on port 4793." -ForegroundColor Green
} else {
    Write-Host "    MCP bridge not running. Start it with:" -ForegroundColor Yellow
    Write-Host "    powershell -NoProfile -ExecutionPolicy Bypass -File tools\Start-AugmentMcpBridge.ps1" -ForegroundColor White
}

# --- 9. Summary ---
Write-Host "`n=== Sub-Colony Setup Complete ===" -ForegroundColor Cyan
Write-Host "Installed: ripgrep, cloudflared, git, node dependencies" -ForegroundColor Gray
Write-Host "Configured: port proxy, firewall, MCP bridge check" -ForegroundColor Gray
Write-Host "`nNext: Restart MCP bridge to pick up ripgrep for codebase search." -ForegroundColor Yellow
Write-Host "Then the host colony can query this sub-colony's full codebase.`n" -ForegroundColor Gray
