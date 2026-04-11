param(
  [string]$NodePath = "node.exe",
  [string]$ScriptPath = "E:\sovereignty\src\omniConsolidationCascade.js"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ScriptPath)) {
  throw "Cascade script not found: $ScriptPath"
}

& $NodePath $ScriptPath
