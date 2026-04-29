#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const { getSecret } = require("../src/secureVault");

function extractCredential(record) {
  if (!record || !record.value) {
    throw new Error("Missing owner/nodes.liris.windows.credential");
  }

  const value = record.value;
  if (typeof value === "string") {
    return {
      username: "DESKTOP-PTSQTIE\\rayss",
      password: value,
    };
  }

  if (value && typeof value === "object") {
    return {
      username: value.username || value.user || "DESKTOP-PTSQTIE\\rayss",
      password: value.password || value.pass || value.secret || value.value,
    };
  }

  throw new Error("Unsupported Liris credential vault value shape");
}

const record = getSecret("nodes.liris.windows.credential", { namespace: "owner" });
const credential = extractCredential(record);

if (!credential.password) {
  throw new Error("Liris credential password is empty");
}

const script = String.raw`
$ErrorActionPreference = "Stop"
$pass = ConvertTo-SecureString $env:LIRIS_PASSWORD -AsPlainText -Force
$cred = [System.Management.Automation.PSCredential]::new($env:LIRIS_USERNAME, $pass)

$remote = {
  $ErrorActionPreference = "Continue"

  try { Set-NetConnectionProfile -InterfaceAlias Ethernet -NetworkCategory Private } catch {}
  try { Set-NetConnectionProfile -InterfaceAlias Wi-Fi -NetworkCategory Private } catch {}

  Start-Service LanmanServer -ErrorAction SilentlyContinue
  Start-Service FDResPub -ErrorAction SilentlyContinue
  Start-Service fdPHost -ErrorAction SilentlyContinue

  Enable-NetFirewallRule -Group "@FirewallAPI.dll,-28502" -ErrorAction SilentlyContinue
  Enable-NetFirewallRule -Group "@FirewallAPI.dll,-32752" -ErrorAction SilentlyContinue

  $everyone = ([System.Security.Principal.SecurityIdentifier]"S-1-1-0").Translate([System.Security.Principal.NTAccount]).Value

  function Ensure-BridgeShare {
    param(
      [Parameter(Mandatory = $true)] [string] $Name,
      [Parameter(Mandatory = $true)] [string] $Path,
      [switch] $ReadOnly
    )

    if (-not (Test-Path -LiteralPath $Path)) {
      New-Item -ItemType Directory -Force -Path $Path | Out-Null
    }

    if ($ReadOnly) {
      icacls $Path /grant "*S-1-1-0:(OI)(CI)RX" | Out-Null
      if (-not (Get-SmbShare -Name $Name -ErrorAction SilentlyContinue)) {
        New-SmbShare -Name $Name -Path $Path -ReadAccess $everyone | Out-Null
      }
    } else {
      icacls $Path /grant "*S-1-1-0:(OI)(CI)M" | Out-Null
      if (-not (Get-SmbShare -Name $Name -ErrorAction SilentlyContinue)) {
        New-SmbShare -Name $Name -Path $Path -ChangeAccess $everyone | Out-Null
      }
    }
  }

  Ensure-BridgeShare -Name "LirisBridge" -Path "C:\Users\rayss\Asolaria-Bridge"

  if (Test-Path -LiteralPath "C:\Users\rayss\Asolaria-BEHCS-256") {
    Ensure-BridgeShare -Name "LirisAsolaria" -Path "C:\Users\rayss\Asolaria-BEHCS-256"
  }

  Set-Content -LiteralPath "C:\Users\rayss\Asolaria-Bridge\liris-local-join-stamp.txt" -Value "Liris WinRM share join completed at $(Get-Date -Format o)" -Encoding UTF8

  [pscustomobject]@{
    Computer = $env:COMPUTERNAME
    Shares = (Get-SmbShare -Name LirisBridge,LirisAsolaria -ErrorAction SilentlyContinue | Select-Object Name,Path)
  }
}

Invoke-Command -ComputerName DESKTOP-PTSQTIE -Credential $cred -ScriptBlock $remote
`;

const result = spawnSync("C:\\Program Files\\PowerShell\\7\\pwsh.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
  cwd: "C:\\Users\\acer\\Asolaria",
  encoding: "utf8",
  env: {
    ...process.env,
    LIRIS_USERNAME: credential.username,
    LIRIS_PASSWORD: credential.password,
  },
  timeout: 120000,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status || 0);
