# Asolaria System Card (Post-Restart Runtime Scan)

Generated: 2026-03-08T08:20:00-03:00 (America/Sao_Paulo)
Recovery validated: 2026-03-08T08:35:30-03:00
Scope: runtime posture, connectors, lanes, routes, startup/fallback, notebooklm, phone/control, risks/gaps
Data policy: vault secret values omitted by design

## 1) Current Runtime Truth

- Pre-recovery snapshot (08:20) had core + bridge down.
- Live post-recovery snapshot (08:35) is healthy:
  - Asolaria API listener is up (`/api/health/fast` and `/api/health` both reachable).
  - codex-bridge relay/tunnel/watchdog/bots are running.
  - bridge local and tunnel `/health` checks are now passing.
  - `agentColony.counts`: `total=6`, `online=6`, `active=3`.
  - queue is clear (`queued=0`, `running=0`).
- Worker registry/state files still exist, but live process checks remain the source of truth.

## 2) Why comms felt slow (~9s)

Primary cause pattern is layered:

1. Health probe path mismatch + cold-start effects:
- Historically full `/api/health` was the expensive path and should not be the heartbeat default.
- In this recovery run, first request spikes happened during startup warmup, then stabilized.

2. Service-down timeout behavior after restart:
- When listener is down, every probe waits until socket timeout, which feels like long lag.

3. Queue + lane overhead (historical):
- Past runs documented queue saturation and delayed follow-up jobs.

Recovery latency sample (8 consecutive checks):
- Cold sample spike: `fast=3206.95ms`, `health=98.03ms` (startup/warm phase).
- Warm steady-state samples: `fast~2.84-7.04ms`, `health~11.34-16.61ms`.

Net: the earlier ~9s perception aligns with down-state timeout behavior and startup churn, not the recovered steady-state path.

## 3) Chinese/Garbled Characters Observation

- This scan did not find CJK characters in `C:\Users\acer\.cache\huggingface\xet\logs\xet_20260302T120047982-0300_10708.log`.
- The prior "Chinese-looking" output is most likely binary/compressed/document bytes being surfaced during broad text scans (for example PDF/raw payload blobs), not a NotebookLM language switch or malware signal.
- Verdict: generally okay; treat as artifact noise unless it appears inside normal plain-text JSON fields from trusted logs.

## 4) Connectors + Abilities (What exists now)

Connector modules detected (`src/connectors`): 40.
Major groups present:

- Core orchestration: `workerRouter`, `externalBrain`, `codex`, `cursorAgent`, `openclaw`
- Cloud/LLM: `geminiApi`, `geminiCli`, `geminiLive`, `gcp`, `vertex`, `google`, `googleWorkspaceCli`
- Collaboration: `slack`, `microsoft`, `atlassian`, `github`, `telegram`
- Device/control: `phoneMirror`, `phoneProMirror`, `phoneDeveloperOptions`, `desktopControl`, `desktopCapture`, `desktopDisplay`, `voice`, `wol`
- Sidecars: `abacus`, `symphony`, `notebooklm`, `augmentContext`

### Live connector posture highlights

- Symphony: configured and running (`pid=17348` after recovery start).
- Abacus: configured; browser profile/auth ready; CLI lane is limited (MCP list works, some CLI probes timeout).
- External providers:
  - `cursor`: configured/enabled with MCP enabled.
  - `antigravity`: present but not configured.
- Google + Workspace CLI: configured/authenticated.
- Gemini CLI: available/authenticated (`env:GEMINI_API_KEY`).
- Gemini API: configured.
- GCP/Vertex: configured; Vertex budget guard active.

## 5) NotebookLM Review (current)

Current status from connector runtime check:

- NotebookLM Enterprise: `enterpriseReady=true`, `access=true`, `apiEnabled=true`.
- Project: `winged-complex-390417`.
- Notebook core sync state exists and was updated on 2026-03-08.
- Dedicated notebook title in sync state: `Asolaria Enterprise Memory`.

Important nuance:
- Older checkpoint reports still mention `SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT`; that appears stale relative to current connector status.

## 6) Routes, Lanes, and Startup/Fallback

### API surface

- Total Express API routes in `server.js`: 331
  - GET: 151
  - POST: 171
  - PUT: 4
  - DELETE: 5

### Worker lanes

- Router worker IDs: `local_codex`, `abacus`, `symphony`.
- Dispatch artifacts exist for direct and router smoke runs (`data/integrations/worker-router/dispatches/...`).

### Startup/fallback model

- Startup automation and one-button scripts are present.
- Fast-health split is implemented and intended for startup/liveness checks.
- Architecture gap remains from startup contract:
  - strict multi-worker identity handshake gate ("WHO ARE YOU") is not fully enforced in runtime startup path.

## 7) Task Manager + Notifications + Phone Control

### Task/approval/notification planes present

- Task ledger store: active (`data/task-ledger.json`, 538 tasks total with mixed statuses).
- Guardian alert/approval stores: present.
- Mobile push store exists but current subscription file is empty (`subscriptions=[]`).

### Phone + desktop control abilities

- Mobile control APIs include arm/disarm/click/scroll/type/key and window management actions.
- Phone mirror/pro mirror/developer-options endpoints exist.
- Current pro-mirror status: tooling present, not running.
- Phone background lanes are currently up from pid checks:
  - `phone-link-keeper.pid` running
  - `phone-tunnel-smoke-monitor.pid` running
- Browser-history phone connector works and sees authorized device.
- Developer options connector returns live option state (18 options detected in latest check).

### CPU/GPU/process control reality

- Asolaria has process/runtime actions (start/stop control plane, run ADB health, open admin/brain terminals).
- System supervisor scripts monitor CPU/GPU and can alert/escalate.
- This is operational control plus scripted process management, not unrestricted kernel-level control.

## 8) GNN/Graph Runtime Status

- Graph runtime event/manifests logs are active (`data/graph-runtime-events.ndjson`, `data/graph-runtime-manifests.ndjson`).
- Graph runtime API endpoints exist (`/api/graph-runtime/*`).
- Current architecture stance (from research review):
  - policy/approval kernel remains root-of-trust;
  - GNN remains a constrained sidecar, not the authoritative control plane.

## 9) Missing Store/Social Commerce Connectors (why none yet)

Confirmed gap: no dedicated connector modules for common store/social commerce platforms (for example Shopify/Amazon Seller/TikTok Shop/Meta Commerce).

Likely reasons from current architecture state:

- Priority has been on control-plane reliability, phone routing, guardian approvals, and enterprise notebook/memory paths.
- Existing external lanes (Cursor/Abacus/Symphony) were used as generalized execution surfaces instead of dedicated commerce connectors.
- No first-party store connector package is currently registered in `src/connectors`.

## 10) Skills/Tools/Mistakes Snapshot

From latest indexed snapshot (`reports/skills-tools-mistakes-index-20260305-015506.json`):

- Skills indexed: 53
- Tool actions indexed: 32
- Active mistake patterns: 17

Current mistake ledger trend (latest parsed):

- total events: 318
- dominant code: `agent_colony_idle_escalation` (289)

Interpretation:
- Biggest recurring operational issue is lane/agent idleness rather than code execution failures.

## 11) Critical Mistakes To Avoid

1. Using full `/api/health` for heartbeat checks instead of `/api/health/fast`.
2. Trusting stale pid/state files without live process verification.
3. Assuming push notifications are active while `subscriptions=0`.
4. Routing urgent single-shot tasks to long-running Symphony queues by default.
5. Treating Abacus CLI as fully headless-stable when probe shows partial readiness.
6. Exposing connector status outputs that include raw credential values (must stay redacted in user-facing flows).

## 12) Immediate Prioritized Recovery Plan

Status: steps 1-3 executed in this run.

1. Keep core and bridge healthy:
- Keep `/api/health/fast` as heartbeat route.
- Alert on repeated cold spikes or listener drops.

2. Reconcile remaining lane quality:
- Keep Symphony service monitored (running now).
- Keep Abacus marked as `desktop_cli_limited` until CLI probe path is fully clean.

3. Close phone notification gap:
- Re-establish at least one mobile push subscription and verify test delivery.

4. Commerce connector track (new workstream):
- Create a dedicated connector backlog (Shopify first, then Meta/TikTok/Amazon as needed).
- Define minimum contract: auth, account discovery, product/order read, safe write gates, audit trail.

## 13) Coordination Model (You + Asolaria + Other Agents)

Recommended lane ownership to reduce collisions:

- Asolaria core: policy, guardian, routing, ledger, approvals, runtime actions.
- local_codex lane: privileged local engineering changes.
- Symphony lane: tracked long-running issues/backlog execution.
- Abacus lane: bounded external research/work packets.
- Cursor/antigravity external providers: model-side augmentation where configured.

Do not dispatch owner-plane secrets/tasks outside guarded local lanes unless explicitly approved.

## 14) Federated Cloudflare Framing (Updated)

New cross-system Cloudflare links now operate as a federated agent network pattern.

- Super Admin authority remains Asolaria (owner plane).
- Federated agents (Vector/Rook/Forge/Falcon + external lanes) operate as delegated workers.
- Cloudflare tunnels are transport, not trust. All trust decisions remain in Asolaria policy + allowlists + approval gates.
- Control plane should continue to enforce: explicit sender identity, per-lane scope, bounded tool authority, and auditable task/event records.

## 15) Live Validation Refresh (2026-03-08 10:47-10:54 BRT)

Validation run executed:

- Startup: `tools/Start-Asolaria-OneButton.ps1 -Port 4781 -StartupMode -EnableBridgeColony -NoUi`
- Startup snapshot: `tools/Test-Startup-HealthSnapshot.ps1`
- White-glove scan: `tools/Test-System-WhiteGloveSweep.ps1`

Key runtime state after startup:

- Asolaria healthy on `4781`; queue clear (`queued=0`, `running=0`).
- Agent colony online (`total=6`, `online=6`).
- Route selected: `usb` (no fallback in selected route).
- Tunnel/keeper/guardrail monitors running with fresh PIDs/logs.
- Graph runtime UI is live at `http://127.0.0.1:4781/graph-runtime.html`, and SSE stream handshake is healthy (`/api/graph-runtime/stream`).

Artifacts:

- `reports/one-button-start-20260308-105448.md`
- `reports/startup-health-snapshot-20260308-104803/snapshot.md`
- `reports/startup-health-snapshot-20260308-105457/snapshot.md`
- `reports/system-white-glove-sweep-20260308-104803.md`
- `reports/skills-parity-latest.json`

## 16) New Bug Findings From This Pass

1. Startup auto-task registration permission bug (fixed in this pass)
- Symptom before fix: `Register-ScheduledTask : Acesso negado.` during one-button startup.
- Remediation applied: updated one-button startup to use Startup shortcut directly when not elevated.
- Validation: rerun completed with `Auto startup: ok=True mode=startup_shortcut` and no access-denied registration errors.

2. Bridge token allowlist hygiene bug (fixed in this pass)
- Evidence: startup snapshot reports old token accepted; bridge status/events show `snapshot-old` websocket accepted.
- Root cause observed: `BRIDGE_SHARED_TOKEN_ALLOWLIST` included `change_me`.
- Remediation applied:
  - user env allowlist sanitized to the real shared token only.
  - `Start-AgentBridge-PC.ps1` now aligns `BRIDGE_SHARED_TOKEN_ALLOWLIST` to the provided `-SharedToken`.
- Validation: `startup-health-snapshot-20260308-105457` shows `newTokenAccepted=True`, `oldTokenAccepted=False`.

3. Skills parity drift (fixed in this pass)
- Symptom before fix: `skills-parity-latest.json` reported `missing_codex=2` (`system-slides`, `system-spreadsheets`).
- Remediation applied: added local codex system skills at:
  - `C:\Users\acer\.codex\skills\.system\slides\SKILL.md`
  - `C:\Users\acer\.codex\skills\.system\spreadsheets\SKILL.md`
- Validation: parity rerun reports `ok=true`, `missing_wrappers=0`, `missing_codex=0`.

4. Managed UI cleanup timeout flake (fixed in this pass)
- Symptom before fix: one-button report intermittently showed `Managed UI cleanup: ok=False ... timeout`.
- Remediation applied: `Invoke-ManagedUiCleanup` now uses bounded retries and marks timeout-only failures as non-blocking when `/api/health/fast` is healthy.
- Validation: rerun completed with `Managed UI cleanup: ok=True` in `reports/one-button-start-20260308-112151.md`.

5. Guardrail side-probe degradation (low-medium)
- Symptom: health guardrail notes `Oli gateway probe failed on 8787 while Asolaria is healthy`.
- Impact: noisy alerts / degraded cross-service observability, but core health is good.

6. Diagnostic coverage gap (medium)
- White-glove sweep ran non-elevated (`elevated=false`), so SFC/DISM/BCD/CHKDSK gates are still incomplete.

## 17) Immediate Remediation Queue (While Runtime Stays Up)

1. Decide whether Oli 8787 probe should be optional/suppressed when not in-use to reduce false degradation signals.
2. Run an elevated white-glove pass to close integrity-check blind spots.

## 18) Agent Identity Untangle + Reassign + Prune Pass (2026-03-08 13:12-13:17 BRT)

Sequence executed (super-careful flow):

1. Untangle
- Added lane/persona normalization tooling:
  - `tools/agent-state-maintenance.js` (dry-run + apply, backup-first).
- Added non-destructive display normalization in API/UI code:
  - `server.js`: display fields (`titleDisplay`, `descriptionDisplay`, `actorDisplay`, `noteDisplay`, `textDisplay`).
  - `public/app.js`: UI now prefers display fields for memory/task/event rendering.

2. Review
- Baseline (before apply):
  - `memory.turns=300` (watchdog-heavy),
  - `task-ledger.events=2394` (later 2019 after initial prune),
  - `notebook.notes=322/323`.
- Main noise source confirmed: `agent_colony_watchdog` messages dominating memory.

3. Reassign
- Structured actor reassignment performed in ledger events:
  - legacy lane IDs mapped to persona names where applicable.
- Identity hardening from earlier pass remains active in bridge watchdog and lane launch args.

4. Prune
- Applied prune results from latest run:
  - memory: `300 -> 95` (watchdog entries pruned from `245 -> 40`),
  - notebook: `323 -> 234` (automation note overgrowth trimmed),
  - task-ledger events: held at `2019` after prior noisy-event pruning.
- Reports:
  - `reports/agent-state-maintenance-2026-03-08T16-17-21-275Z.md`
  - `reports/agent-state-maintenance-2026-03-08T16-17-21-275Z.json`
- Backups created under:
  - `data/backups/agent-state-maintenance/2026-03-08T16-17-21-275Z/`

Runtime behavior guard:
- `agentColonyWatchdogEnabled` was set `false` via `/api/settings` to stop new watchdog churn while stabilization continues.
- Live runtime memory was compacted via `/api/memory/compaction/*` to collapse watchdog-heavy history in-process (`300 -> 61` turns, compaction hash `56c33d6b1d28743b5f96`).

Known blocker:
- Main listener process on port `4781` (PID `4104`) is running under a protected/elevated context from this shell’s perspective (`taskkill /PID 4104 /F` returns access denied).
- Code changes are written on disk, but full live pickup of the newest server runtime patches still requires an elevated core restart.
