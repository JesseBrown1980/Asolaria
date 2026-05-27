param(
  [string]$VaultKey = "nodes.liris.windows.credential",
  [string[]]$Targets = @("192.168.100.2", "DESKTOP-PTSQTIE"),
  [switch]$TestSmb
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$nodeScript = @'
const path = require("path");
const { getSecret } = require(path.join(process.cwd(), "src", "secureVault"));

const key = process.argv[2];
const entry = getSecret(key, { namespace: "owner" });
if (!entry || !entry.value) {
  process.stdout.write(JSON.stringify({ ok: false, error: "VAULT_SECRET_NOT_FOUND", key }, null, 2));
  process.exit(2);
}

const value = entry.value;
if (!value.username || !value.password) {
  process.stdout.write(JSON.stringify({ ok: false, error: "VAULT_SECRET_MISSING_USERNAME_OR_PASSWORD", key }, null, 2));
  process.exit(3);
}

process.stdout.write(JSON.stringify({
  ok: true,
  key,
  username: value.username,
  password: value.password,
  targets: Array.isArray(value.targets) ? value.targets : []
}));
'@

$tempScriptPath = Join-Path $env:TEMP "asolaria-read-liris-credential-for-cmdkey.js"
[System.IO.File]::WriteAllText($tempScriptPath, $nodeScript, [System.Text.Encoding]::ASCII)
try {
  $raw = node $tempScriptPath $VaultKey
} finally {
  Remove-Item $tempScriptPath -Force -ErrorAction SilentlyContinue
}

$secret = $raw | ConvertFrom-Json
if (-not $secret.ok) {
  throw "Could not read Liris credential from owner vault key '$VaultKey': $($secret.error)"
}

$username = [string]$secret.username
$password = [string]$secret.password
$allTargets = New-Object System.Collections.Generic.List[string]
foreach ($target in $Targets) {
  if (-not [string]::IsNullOrWhiteSpace($target)) { [void]$allTargets.Add($target) }
}
foreach ($target in @($secret.targets)) {
  if (-not [string]::IsNullOrWhiteSpace($target) -and -not $allTargets.Contains($target)) {
    [void]$allTargets.Add($target)
  }
}

$stored = @()
foreach ($target in $allTargets) {
  & cmdkey /generic:$target /user:$username /pass:$password | Out-Null
  $stored += $target
}

$smbResults = @()
if ($TestSmb) {
  foreach ($target in $allTargets) {
    $path = "\\$target\C$"
    $ok = $false
    try { $ok = Test-Path $path } catch { $ok = $false }
    $smbResults += [ordered]@{ target = $target; path = $path; accessible = [bool]$ok }
  }
}

$password = $null
Remove-Variable secret -ErrorAction SilentlyContinue

[ordered]@{
  ok = $true
  vaultKey = $VaultKey
  username = $username
  cmdKeyTargetsStored = $stored
  secretValue = "<redacted>"
  smbTests = $smbResults
} | ConvertTo-Json -Depth 8
