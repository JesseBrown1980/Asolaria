# Agent Profile + NotebookLM Untangle Report (2026-03-08)

## Scope
- Lock lane identity/profile injection so persona names cannot drift.
- Confirm startup does not overwrite Gemini/Vertex/provider runtime settings.
- Run live relay collaboration smoke test.
- Baseline NotebookLM/task-ledger naming consistency for follow-up cleanup.

## Changes Applied
- `C:\Users\acer\codex-bridge\watchdog.ps1`
  - Added stricter identity guard: validates `--from`, `--agentName`, `--profileId`, and `--mentionAliases`.
  - Keeps strict alias policy (`rook`, `forge`, `falcon`, `vector`) and terminates mismatched lane processes for auto-restart.
- `C:\Users\acer\codex-bridge\this-codex-bot.js`
  - Default supervisor handle for `this-codex` lane now persona-first (`rook`) instead of raw lane ID fallback.
  - Default main-lane mention aliases include `vector`.
- `C:\Users\acer\Asolaria\server.js`
  - Agent-colony watchdog summaries now format persona-first labels (e.g., `Rook (other-codex)`) for idle/digest text.
  - Digest rows now carry a resolved display label (`fromName`) for clearer operator logs.

## Restart + Runtime Validation
- Bridge stack restarted (`bridgectl restart`) and reached healthy state (relay/tunnel/watchdog + all 4 lane bots online).
- Main runtime startup completed via one-button startup mode with colony health check passing.

## Live Identity Validation
- Bot command-lines verified running with `--profile`, `--profileId`, `--agentName`, and strict `--mentionAliases`:
  - this-codex: aliases=`this-codex,this-codex-bot,vector`, pingTo=`rook`
  - other-codex: aliases=`rook`
  - build-codex: aliases=`forge`
  - phone-codex: aliases=`falcon`

## Collaboration Smoke Test
- Dispatched `@rook @forge @falcon #thread:profile-lock-smoke-... TASK_SHELL: Write-Output alive-...`
- ACK + RESULT received from all three worker lanes:
  - `other-codex`
  - `build-codex`
  - `phone-codex`

## Provider Overwrite Safety Findings
- `brainPrimaryProvider` currently reports `codex` on `/api/health` and `/api/settings` (consistent).
- Gemini and Vertex integrations remain enabled and configured after restart (no wipe observed).
- Google + GCP integrations remain configured; Symphony and Abacus integrations report configured.
- `Start-Asolaria-OneButton.ps1` sets process defaults only when envs are absent; runtime `persistedRuntimeSettings` still takes precedence in `server.js` for primary provider/model settings.

## NotebookLM / Ledger Naming Consistency Baseline
- Files scanned:
  - `data/notebook.json`
  - `data/notebooklm-core-sync-state.json`
  - `data/task-ledger.json`
- Observed mixed naming (persona + legacy lane IDs) still present in stored historical content.
- Sample counts:
  - `notebook.json`: `other-codex=3`, `build-codex=2`, `phone-codex=2`, `this-codex=2`, `Rook=2`, `Forge=1`, `Falcon=1`, `Vector=1`, `Vertex=5`
  - `task-ledger.json`: `this-codex=32`, `other-codex=3`, `build-codex=3`, `phone-codex=3`, `Rook=24`, `Forge=23`, `Falcon=15`, `Vertex=38`

## Recommended Next Untangle Step
- Apply a non-destructive normalization layer (display-time alias map) for NotebookLM/task views first.
- Then run a guarded migration for stale string references only in operator-facing summaries (leave raw historical payloads immutable for audit).

## Additional Reliability Fix (One-Button Startup)
- `C:\Users\acer\Asolaria\tools\Start-Asolaria-Phone.ps1`
  - Fixed elevation argument construction to avoid passing empty `-AdbWifiEndpoint` values.
  - This prevents startup failures where `Start-Process -ArgumentList` rejected empty argument entries.

## Post-Restart Validation
- Main runtime restarted and healthy (`/api/health/fast` OK).
- Post-restart relay smoke thread `post-restart-smoke-20260308125925` returned RESULT from all workers (`other-codex`, `build-codex`, `phone-codex`).
