# System Upgrade Loop Log (2026-02-19)

## Snapshot
- Goal: Move Asolaria external brain flow to an MCP-ready OpenAI Responses architecture with safer runtime controls and stronger operational memory.

## Implemented (Code)

### 1) External provider MCP runtime (Responses API)
- File: `Asolaria/src/connectors/externalBrainConnector.js`
- Added provider-side MCP config model in encrypted provider config:
  - `mcp.enabled`
  - `mcp.serverLabel` (`server_label`)
  - `mcp.serverUrl` (`server_url`) or `mcp.connectorId` (`connector_id`)
  - `mcp.authorization`
  - `mcp.headers`
  - `mcp.allowedTools` (`allowed_tools` / `tool_names`)
  - `mcp.approvalMode` (`always|never|auto`)
  - `mcp.dynamicAllowlistMax`
  - `mcp.contextTtlSeconds`
- Added OpenAI Responses MCP request builder:
  - injects `tools: [{ type: "mcp", ... }]`
  - injects `previous_response_id` only when explicit `mcpContextKey` is provided
- Added runtime heuristics:
  - explicit allow-list override support
  - dynamic allow-list selection from cached `mcp_list_tools` results
  - automatic approval split between read-like and write-like intents
- Added validation gates:
  - blocks MCP usage on non-Responses style
  - blocks incomplete MCP server pointer config

### 2) MCP response caching for token/latency reduction
- File: `Asolaria/src/connectors/externalBrainConnector.js`
- Added in-memory cache for:
  - provider-level discovered tool names from MCP list/call responses
  - context-key-scoped `previous_response_id`
- Added TTL pruning for cache safety.

### 3) API wiring for MCP config and per-run overrides
- File: `Asolaria/server.js`
- Updated config route:
  - `POST /api/integrations/external/config`
  - now accepts MCP fields and persists through `setExternalProviderConfig`
- Updated run route:
  - `POST /api/providers/external/run`
  - forwards MCP runtime overrides:
    - `mcp`, `mcpEnabled`, `mcpContextKey`, `mcpAllowedTools`, `mcpApprovalMode`, `mcpDynamicAllowlistMax`

### 4) Codex brain preference explicitly configurable
- Files:
  - `Asolaria/src/connectors/codexConnector.js`
  - `Asolaria/src/brainOrchestrator.js`
  - `Asolaria/server.js`
- Added explicit Codex run options:
  - `model`
  - `modelReasoningEffort`
- Added server settings:
  - `settings.codexModel` (default `gpt-5.3-codex`)
  - `settings.codexModelReasoningEffort` (default `xhigh`)
- Brain orchestrator now forwards these settings into Codex runs.

### 5) MCP policy presets and cache observability
- File: `Asolaria/src/connectors/externalBrainConnector.js`
- Added MCP policy presets:
  - `read_only`
  - `balanced`
  - `write_guarded`
- Presets tune default `approvalMode` and `dynamicAllowlistMax` while preserving explicit overrides.
- Added cache observability/control exports:
  - `getExternalMcpCacheStatus()`
  - `clearExternalMcpCache(options)`
  - `getExternalMcpPolicyPresets()`

### 6) New MCP cache API endpoints
- File: `Asolaria/server.js`
- Added:
  - `GET /api/integrations/external/mcp-cache`
  - `POST /api/integrations/external/mcp-cache/clear` (loopback-only)
- Extended:
  - `GET /api/integrations/external/status`
  - `GET /api/providers/external/status`
  - now include MCP cache summary + preset metadata.

### 7) Smoke test script
- File: `Asolaria/tools/Test-Asolaria-ExternalMcpUpgrade.ps1`
- Validates:
  - MCP fields in external integration status
  - MCP preset metadata
  - MCP cache status shape
  - scoped cache-clear endpoint behavior

## Runtime Activation Check
- Asolaria is active on `http://127.0.0.1:4781`.
- Main process was restarted to load upgraded code after edits.
- Post-restart validation:
  - `GET /api/integrations/external/status` returns MCP status/cache/preset metadata.
  - `GET /api/settings` returns `codexModel` and `codexModelReasoningEffort`.

## Validation Results
- Syntax checks passed:
  - `node --check Asolaria/src/connectors/externalBrainConnector.js`
  - `node --check Asolaria/src/connectors/codexConnector.js`
  - `node --check Asolaria/src/brainOrchestrator.js`
  - `node --check Asolaria/server.js`
- Runtime endpoint checks passed:
  - `GET /api/integrations/external/status`
  - `GET /api/integrations/external/mcp-cache`
  - `POST /api/integrations/external/mcp-cache/clear`
- Smoke test passed:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File Asolaria/tools/Test-Asolaria-ExternalMcpUpgrade.ps1`

## Current Baseline
- Use this file as the source of truth for the MCP/Codex external-brain flow.
- Keep `AGENTS.md` aligned with this baseline before future upgrades.

## Strategic Policy Integration (Internet-Facing Sharing)
- Decision: adopt abstraction-first sharing as a default for internet/public agent interactions.
- Rationale:
  - reduces leakage risk of sensitive implementation details,
  - reduces unnecessary duplication/storage of full build internals,
  - still preserves execution quality by sharing architecture patterns and minimal reproducible snippets.
- Coverage analysis:
  - Previously covered: secrets handling and channel safety.
  - Gap closed in this cycle: explicit rule to avoid full production blueprint disclosure in untrusted/public channels.
- Integrated into:
  - `C:/Users/acer/AGENTS.md`
  - `C:/Users/acer/Asolaria/AGENTS.md`
  - `C:/Users/acer/Asolaria/tools/Asolaria-Agent-Creation-Rules.md`

## Post-Validation Fixes
- Fixed MCP preset application when config payload contained many undefined top-level MCP keys.
- Root cause: undefined key presence was treated as explicit override and suppressed preset defaults.
- Resolution: MCP patch builder now only treats defined values as overrides.
- Verified:
  - preset-only config now applies defaults (`read_only` -> `mcpApprovalMode=never`, `mcpDynamicAllowlistMax=12`)
  - invalid preset now returns HTTP 400 with no config mutation

## Phone Rebuild/Replace Flow Upgrade
- Added one-command redeploy automation:
  - `C:/Users/acer/Asolaria/tools/Refresh-Asolaria-PhoneDeployment.ps1`
- Flow implemented:
  - optional legacy package cleanup (`com.maazm7d.termuxhub`, optional `com.jessebrown.asolaria`),
  - sanitized release rebuild (`Build-PublicRelease.ps1 -Zip`),
  - private artifact staging to `data/private-downloads`,
  - USB push to phone Download storage,
  - ADB reverse restore (`tcp:4781`),
  - phone mobile-console open via USB URL,
  - notebook memory capture of run summary.
- Latest executed run:
  - Report: `C:/Users/acer/Asolaria/reports/phone-private-redeploy-20260219-191558.md`
  - Private artifact: `C:/Users/acer/Asolaria/data/private-downloads/Asolaria-Public-20260219-191542.zip`
  - SHA256: `EB80A3DDFFE2937D216046270FC898C8D2419AF08E6BC48DAE4225ACE094605E`
  - Notebook note: `note_1771539358643_qmh2wf`

## Phone Background Runtime Upgrade
- Added non-intrusive phone bridge keeper:
  - `C:/Users/acer/Asolaria/tools/Keep-Asolaria-PhoneBackground.ps1`
  - `C:/Users/acer/Asolaria/tools/Start-Asolaria-PhoneBackgroundKeeper.ps1`
  - `C:/Users/acer/Asolaria/tools/Stop-Asolaria-PhoneBackgroundKeeper.ps1`
- Purpose:
  - maintain `adb reverse tcp:4781 tcp:4781` and health checks while phone foreground stays on user apps (e.g., gameplay).
- Integrated into primary phone bootstrap:
  - `C:/Users/acer/Asolaria/tools/Start-Asolaria-Phone.ps1` now auto-ensures keeper by default (`EnableBackgroundKeeper=true`), with tunables for interval/max-hours.
- Activated runtime:
  - PID: `35860`
  - log: `C:/Users/acer/Asolaria/logs/phone-link-keeper-20260219-192128.log`
  - verification: `adb reverse --list` includes `UsbFfs tcp:4781 tcp:4781`

## Output Policy Enforcement v1
- Implemented relay-facing output policy controls in:
  - `C:/Users/acer/Asolaria/src/guardianNotifier.js`
- Added:
  - channel inference from relay URL (`public_internet` vs `private_internet`)
  - policy resolver (`ASOLARIA_RELAY_OUTPUT_MODE=auto|abstraction|full`)
  - abstraction-first summaries for public relay channels
  - outbound redaction guard for secrets/tokens/environment fingerprints (paths, private hosts/IPs, emails)
- Applied to:
  - codex-bridge alerts (`sendCodexBridgeAlert`)
  - emergency relay payloads (`sendIztEmergencyRelay`)
- Validation:
  - `node --check C:/Users/acer/Asolaria/src/guardianNotifier.js` passed

## Agent Profile Framework Baseline
- Added codex-bridge onboarding/spec assets:
  - `C:/Users/acer/codex-bridge/AGENT_PROFILE_SPEC.md`
  - `C:/Users/acer/codex-bridge/profiles/agent-profile.template.json`
  - `C:/Users/acer/codex-bridge/new-agent-profile.ps1`
- Behavior:
  - scaffold per-agent profile JSON with no embedded secrets,
  - scaffold per-agent `.env.example` for relay URL/token/sender-token env wiring,
  - standardize allowlist + room metadata for bridge routing.
- Validation:
  - generated sample profile: `C:/Users/acer/codex-bridge/profiles/asolaria-node-template.profile.json`
  - generated env example: `C:/Users/acer/codex-bridge/profiles/asolaria-node-template.env.example`

## Mobile Bridge Keeper UI Telemetry
- Added live keeper status line in mobile console:
  - `C:/Users/acer/Asolaria/public/mobile-console.html` (`#bridgeKeeperStatus`)
  - `C:/Users/acer/Asolaria/public/mobile-console.js` (format/render + refresh wiring)
- Data source:
  - `/api/mobile/control/status` `phoneBridgeKeeper` payload (`running`, `pid`, `latestLogStaleSeconds`, `latestLogUpdatedAt`, `latestLogTail`)
- Behavior:
  - keeper status is refreshed with control polling (5s interval) and during `refreshAll`
  - token-required and token-invalid paths now explicitly set keeper UI status
- Validation:
  - `node --check C:/Users/acer/Asolaria/public/mobile-console.js` passed

## Tunnel Validation Snapshot
- Added report:
  - `C:/Users/acer/Asolaria/reports/tunnel-validation-20260219.md`
- Confirmed:
  - remote base is active and served via tailnet URL
  - desktop-side remote mobile console/API checks pass (`/api/health`, `/mobile-console.html`, `/api/mobile/session`, `/api/mobile/control/status`)
  - phone-side tailnet DNS/ping and active Tailscale VPN routing are present
- Note:
  - raw ADB shell `toybox nc` HTTP probe returned `502`; treated as probe-path limitation pending final browser/WebView confirmation.

## Automated Tunnel Smoke Check
- Added script:
  - `C:/Users/acer/Asolaria/tools/Test-Asolaria-PhoneTunnelPath.ps1`
- Script output:
  - JSON summary to stdout
  - markdown report in `C:/Users/acer/Asolaria/reports/phone-tunnel-smoke-*.md`
- Checks included:
  - local `/api/health` and `/api/mobile/bootstrap`
  - remote `/api/health`, `mobile-console.html`, authenticated `/api/mobile/session`, authenticated `/api/mobile/control/status`
  - keeper telemetry extraction (`running`, `pid`, `staleSeconds`)
  - ADB authorized device count + reverse mapping presence
  - phone-side tailnet host ping (when ADB device present)
  - optional raw phone HTTP probe (`-IncludePhoneRawProbe`)
- Integrated into startup flow:
  - `C:/Users/acer/Asolaria/tools/Start-Asolaria-Phone.ps1` now supports
    - `RunPhoneTunnelSmokeTest` (default `true`)
    - `PhoneTunnelSmokeIncludeRawProbe` (default `false`)
- Integrated into redeploy flow:
  - `C:/Users/acer/Asolaria/tools/Refresh-Asolaria-PhoneDeployment.ps1` now supports
    - `RunTunnelSmokeTest` (default `true`)
    - `TunnelSmokeIncludeRawProbe` (default `false`)
  - redeploy report now records smoke status and smoke report path.
- Validation:
  - direct run report: `C:/Users/acer/Asolaria/reports/phone-tunnel-smoke-20260219-194626.md` (`ok=true`)
  - startup-integrated run report: `C:/Users/acer/Asolaria/reports/phone-tunnel-smoke-20260219-194639.md` (`ok=true`)
  - redeploy-integrated run report: `C:/Users/acer/Asolaria/reports/phone-private-redeploy-20260219-194826.md` with smoke report `C:/Users/acer/Asolaria/reports/phone-tunnel-smoke-20260219-194826.md` (`ok=true`)

## Background Tunnel Monitor
- Added monitor scripts:
  - `C:/Users/acer/Asolaria/tools/Keep-Asolaria-PhoneTunnelSmoke.ps1`
  - `C:/Users/acer/Asolaria/tools/Start-Asolaria-PhoneTunnelMonitor.ps1`
  - `C:/Users/acer/Asolaria/tools/Stop-Asolaria-PhoneTunnelMonitor.ps1`
- Monitor behavior:
  - runs smoke checks on interval (default 300s) without opening phone UI
  - logs state transitions to `logs/phone-tunnel-smoke-monitor-*.log`
  - updates stable latest report `reports/phone-tunnel-smoke-latest.md`
- Runtime activated:
  - PID file: `C:/Users/acer/Asolaria/logs/phone-tunnel-smoke-monitor.pid`
  - log file: `C:/Users/acer/Asolaria/logs/phone-tunnel-smoke-monitor-20260219-195018.log`
  - latest report: `C:/Users/acer/Asolaria/reports/phone-tunnel-smoke-latest.md`

## Tunnel Telemetry In API/UI
- API updates:
  - `C:/Users/acer/Asolaria/server.js`
  - `/api/mobile/control/status` now includes `phoneTunnelMonitor`
  - new endpoint `/api/mobile/tunnel/monitor/status`
  - `/api/health` now includes `networkPolicy.phoneTunnelMonitor`
- Mobile UI updates:
  - `C:/Users/acer/Asolaria/public/mobile-console.html` adds `#tunnelSmokeStatus`
  - `C:/Users/acer/Asolaria/public/mobile-console.js` renders tunnel smoke summary (pass/fail/monitoring), PID, staleness, and latest log tail from control status payload
- Validation:
  - `GET /api/mobile/control/status` returns both `phoneBridgeKeeper` and `phoneTunnelMonitor`
  - `GET /api/mobile/tunnel/monitor/status` returns monitor telemetry
  - `GET /api/health` returns `networkPolicy.phoneTunnelMonitor`

## Mobile UI Viewport/Scroll Hardening
- Updated:
  - `C:/Users/acer/Asolaria/public/mobile-console.html`
  - `C:/Users/acer/Asolaria/public/mobile-approvals.html`
- Changes:
  - replaced rigid global horizontal clipping with mobile-safe overflow handling on `html/body`
  - added safe-area-aware padding using `env(safe-area-inset-*)`
  - added explicit touch/overscroll behavior for reliable phone scrolling
  - tightened small-screen wrapping (`.row/.bar` children and integration cards) to avoid side truncation
  - kept controls visible on narrow portrait widths (including `Save URL` in Connection Mode)
- Validation:
  - Playwright viewport checks on `320x844`, `390x844`, and `844x390` for both mobile pages
  - `mobile-console` metrics show vertical scroll available and no width overflow (`docScrollWidth == viewport width`)
  - `saveRemoteBaseBtn` confirmed visible at `390x844` (`display=block`, `visibility=visible`, non-zero bounds)
  - screenshots:
    - `C:/Users/acer/Asolaria/captures/postfix-mobile-console-390x844.png`
    - `C:/Users/acer/Asolaria/captures/postfix-mobile-console-844x390.png`
    - `C:/Users/acer/Asolaria/captures/postfix-mobile-approvals-390x844.png`

## Asolaria Her Phone Mode (Desktop Phone Link)
- Added backend phone mirror/control API surface (loopback-only):
  - `C:/Users/acer/Asolaria/server.js`
  - Endpoints:
    - `GET /api/phone/mirror/status`
    - `POST /api/phone/mirror/capture`
    - `GET /api/phone/mirror/image`
    - `POST /api/phone/mirror/control/tap`
    - `POST /api/phone/mirror/control/swipe`
    - `POST /api/phone/mirror/control/text`
    - `POST /api/phone/mirror/control/key`
    - `POST /api/phone/mirror/whatsapp/open`
    - `POST /api/phone/mirror/whatsapp/send`
    - `GET /api/phone/mirror/voice/latest`
- Added ADB phone mirror connector:
  - `C:/Users/acer/Asolaria/src/connectors/phoneMirrorConnector.js`
  - Includes device discovery, screenshot capture, orientation detection, tap/swipe/text/key control, WhatsApp app open, and latest voice output tracking.
- Added direct WhatsApp send helper for her-mode messaging:
  - `C:/Users/acer/Asolaria/src/guardianNotifier.js` (`sendDirectWhatsAppMessage`)
- Hardened WhatsApp config updates to support partial patching without wiping existing credentials:
  - `C:/Users/acer/Asolaria/server.js` (`POST /api/guardian/whatsapp`)
- Added Asolaria-branded desktop UI:
  - `C:/Users/acer/Asolaria/public/phone-mode.html`
  - `C:/Users/acer/Asolaria/public/phone-mode.js`
  - Features: live mirror, tap-to-control, rotation spin animation on orientation change, key/swipe/text controls, WhatsApp send + optional voice clip generation/playback.
- Added launcher entry in main dashboard:
  - `C:/Users/acer/Asolaria/public/index.html`
  - `C:/Users/acer/Asolaria/public/app.js`
- Validation:
  - `node --check` passed for:
    - `server.js`
    - `public/app.js`
    - `public/phone-mode.js`
    - `src/connectors/phoneMirrorConnector.js`
  - Live API checks on `http://127.0.0.1:4781`:
    - `/api/phone/mirror/status` returns authorized ADB device.
    - `/api/phone/mirror/capture` returns snapshot metadata (`1080x2340`, portrait).
    - `/api/phone/mirror/image` returns `200 image/png`.
    - `/phone-mode.html` returns `200`.
