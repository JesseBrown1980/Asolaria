param(
  [string]$Sandbox = "read-only",
  [string]$Reasoning = "medium",
  [switch]$CheckProfile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$botPath = Join-Path $scriptRoot "this-codex-bot.js"
$profilePath = Join-Path $scriptRoot "friend-derek-laptop-codex.profile.json"
if (-not (Test-Path -LiteralPath $botPath)) {
  throw "Missing bridge bot: $botPath"
}
if (-not (Test-Path -LiteralPath $profilePath)) {
  throw "Missing profile file: $profilePath"
}

$node = (Get-Command node -ErrorAction Stop).Source
$args = @(
  $botPath,
  "--profile", $profilePath,
  "--workdir", $scriptRoot,
  "--agentName", "Derek-Laptop Codex",
  "--profileId", "friend-derek-laptop-codex-v1",
  "--mentionAliases", "friend-derek-laptop-codex",
  "--pingTo", "this-codex",
  "--bridgeAutoSync", "1",
  "--supervisorRequiresMention", "1",
  "--requireActionablePrefix", "1",
  "--sandbox", $Sandbox,
  "--reasoning", $Reasoning
)
if ($CheckProfile) {
  $args += "--checkProfile"
}

& $node @args
