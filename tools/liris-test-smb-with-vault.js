#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const { getSecret } = require("../src/secureVault");

function extractCredential(record) {
  if (!record || !record.value) throw new Error("Missing owner/nodes.liris.windows.credential");
  const value = record.value;
  if (typeof value === "string") {
    return { username: "DESKTOP-PTSQTIE\\rayss", password: value };
  }
  if (value && typeof value === "object") {
    return {
      username: value.username || value.user || "DESKTOP-PTSQTIE\\rayss",
      password: value.password || value.pass || value.secret || value.value,
    };
  }
  throw new Error("Unsupported Liris credential shape");
}

const credential = extractCredential(getSecret("nodes.liris.windows.credential", { namespace: "owner" }));
if (!credential.password) throw new Error("Stored Liris credential password is empty");

const script = String.raw`
$ErrorActionPreference = "Continue"
$pass = ConvertTo-SecureString $env:LIRIS_PASSWORD -AsPlainText -Force
$cred = [pscredential]::new($env:LIRIS_USERNAME, $pass)
$results = @()

cmd /c "net use \\DESKTOP-PTSQTIE\IPC$ /delete /y" | Out-Null
cmd /c "net use \\192.168.1.6\IPC$ /delete /y" | Out-Null

$targets = @(
  "\\DESKTOP-PTSQTIE\IPC$",
  "\\DESKTOP-PTSQTIE\LirisBridge",
  "\\DESKTOP-PTSQTIE\LirisAsolaria",
  "\\192.168.1.6\IPC$",
  "\\192.168.1.6\LirisBridge",
  "\\192.168.1.6\LirisAsolaria"
)

foreach ($target in $targets) {
  try {
    $ok = Test-Path -LiteralPath $target
    $results += [pscustomobject]@{ Target = $target; TestPath = $ok; Error = $null }
  } catch {
    $results += [pscustomobject]@{ Target = $target; TestPath = $false; Error = $_.Exception.Message }
  }
}

try {
  New-SmbMapping -RemotePath "\\DESKTOP-PTSQTIE\IPC$" -UserName $env:LIRIS_USERNAME -Password $env:LIRIS_PASSWORD -Persistent $false -ErrorAction Stop | Out-Null
  $results += [pscustomobject]@{ Target = "\\DESKTOP-PTSQTIE\IPC$"; ExplicitMap = "ok"; Error = $null }
} catch {
  $results += [pscustomobject]@{ Target = "\\DESKTOP-PTSQTIE\IPC$"; ExplicitMap = "failed"; Error = $_.Exception.Message }
}

foreach ($target in @("\\DESKTOP-PTSQTIE\LirisBridge", "\\DESKTOP-PTSQTIE\LirisAsolaria")) {
  try {
    $items = Get-ChildItem -LiteralPath $target -ErrorAction Stop | Select-Object -First 5 Name,Mode,LastWriteTime
    $results += [pscustomobject]@{ Target = $target; List = "ok"; Items = $items; Error = $null }
  } catch {
    $results += [pscustomobject]@{ Target = $target; List = "failed"; Items = $null; Error = $_.Exception.Message }
  }
}

$results | ConvertTo-Json -Depth 8
`;

const result = spawnSync("C:\\Program Files\\PowerShell\\7\\pwsh.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
  cwd: "C:\\Users\\acer\\Asolaria",
  encoding: "utf8",
  env: {
    ...process.env,
    LIRIS_USERNAME: credential.username,
    LIRIS_PASSWORD: credential.password,
  },
  timeout: 60000,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status || 0);
