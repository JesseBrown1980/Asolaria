param(
  [string]$Username = "DESKTOP-PTSQTIE\rayss",
  [string[]]$Targets = @("192.168.100.2", "DESKTOP-PTSQTIE"),
  [switch]$SkipCmdKey,
  [switch]$SkipAsolariaVault,
  [switch]$TestSmb
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$securePassword = Read-Host "Liris Windows password for $Username (hidden input)" -AsSecureString
$password = [System.Net.NetworkCredential]::new("", $securePassword).Password

if ([string]::IsNullOrWhiteSpace($password)) {
  throw "Password is required."
}

$storedTargets = @()
if (-not $SkipCmdKey) {
  foreach ($target in $Targets) {
    & cmdkey /generic:$target /user:$Username /pass:$password | Out-Null
    $storedTargets += $target
  }
}

$vaultKey = "nodes.liris.windows.credential"
if (-not $SkipAsolariaVault) {
  $payload = [ordered]@{
    service = "windows-smb-winrm"
    node = "liris"
    hostname = "DESKTOP-PTSQTIE"
    directEthernetIp = "192.168.100.2"
    username = $Username
    password = $password
    targets = $Targets
    status = "active"
    source = "owner_secure_prompt"
    note = "Stored for Acer to access Liris over direct Ethernet. Do not print or commit plaintext."
  }

  $payloadJson = $payload | ConvertTo-Json -Depth 8 -Compress

  $nodeScript = @'
const fs = require("fs");
const path = require("path");
const { setSecret, getSecretMeta } = require(path.join(process.cwd(), "src", "secureVault"));

const key = process.argv[2];
const value = JSON.parse(fs.readFileSync(0, "utf8"));
const meta = {
  label: "Liris Windows credential",
  service: "windows-smb-winrm",
  kind: "password",
  node: "liris",
  hostname: value.hostname,
  directEthernetIp: value.directEthernetIp,
  username: value.username,
  capturedFrom: "secure_prompt",
  app: "Asolaria",
  component: "liris-omniprocessor",
  actor: "owner",
  updatedBy: "secure_prompt",
  credentialOwner: "owner"
};
setSecret(key, value, meta, { namespace: "owner" });
const stored = getSecretMeta(key, { namespace: "owner" });
process.stdout.write(JSON.stringify({
  ok: true,
  namespace: stored.namespace,
  key: stored.name,
  value: "<redacted>",
  updatedAt: stored.updatedAt
}, null, 2));
'@

  $tempScriptPath = Join-Path $env:TEMP "asolaria-store-liris-credential.js"
  [System.IO.File]::WriteAllText($tempScriptPath, $nodeScript, [System.Text.Encoding]::ASCII)
  try {
    $vaultResult = $payloadJson | node $tempScriptPath $vaultKey
  } finally {
    Remove-Item $tempScriptPath -Force -ErrorAction SilentlyContinue
  }
}

$smbResults = @()
if ($TestSmb) {
  foreach ($target in $Targets) {
    $path = "\\$target\C$"
    $ok = $false
    try { $ok = Test-Path $path } catch { $ok = $false }
    $smbResults += [ordered]@{ target = $target; path = $path; accessible = [bool]$ok }
  }
}

$password = $null
Remove-Variable securePassword -ErrorAction SilentlyContinue

[ordered]@{
  ok = $true
  username = $Username
  cmdKeyTargetsStored = $storedTargets
  asolariaVaultKey = if ($SkipAsolariaVault) { $null } else { $vaultKey }
  vaultValue = "<redacted>"
  smbTests = $smbResults
} | ConvertTo-Json -Depth 8
