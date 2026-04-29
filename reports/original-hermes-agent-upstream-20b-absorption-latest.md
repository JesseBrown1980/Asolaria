# Original Hermes Agent Upstream 10B Compact Absorption

Generated: 2026-04-25T02:53:10.203Z
Status: ORIGINAL_HERMES_AGENT_COMPACT_ABSORBED_RUNTIME_BLOCKED
Upstream: https://github.com/NousResearch/hermes-agent.git
Head: 2182de55bb7734b804abd3403570ec45428feece
Version: 0.11.0
Latest tag: v2026.4.23
Release: Hermes Agent v0.11.0 (v2026.4.23)
Logical agents: 10000000000
Logical Gulp windows: 5000000
Shannon: PROCEED_ORIGINAL_HERMES_AGENT_CONTRACT_ABSORPTION_RUNTIME_BLOCKED

## D Drive Boundary

- Requested D stage: D:\Asolaria-External\hermes-agent-upstream
- Status: D_STAGE_READY
- Replacement used now: D:\Asolaria-External\hermes-agent-upstream shallow filtered clone for inspection

## Architecture Capsules

- self_improving_learning_loop (memory_skills): Creates skills from experience, improves skills during use, nudges memory persistence, searches prior sessions, and builds long-lived user context.
- sqlite_wal_session_memory (memory_ledger): Thread-safe SQLite state with WAL, checkpoints, session lineage, child sessions, usage, memories, and startup VACUUM/prune.
- transport_abc_provider_router (model_routing): Provider-specific HTTP/API conversion moved behind transport classes: Anthropic, chat completions, Responses/Codex, Bedrock.
- plugin_hook_surface (plugins_hooks): Plugins and shell hooks can register commands, dispatch tools, block tool calls, transform tool results, and alter terminal output.
- gateway_multi_platform (gateway): Unified gateway for Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, SMS, Feishu, WeCom, QQBot, webhooks, and more.
- cron_scheduler (scheduler): Natural-language scheduled jobs with platform delivery, skills, pause/resume/run/remove flows.
- checkpoint_rollback (filesystem_safety): Filesystem checkpoints and rollback surfaces before destructive operations.
- delegate_orchestrator_subagents (omnispindle): Subagents can run as orchestrators with configurable spawn depth and file coordination.
- ink_tui_jsonrpc (operator_interface): React/Ink TUI backed by Python JSON-RPC, streaming status, slash completion, picker, and subagent observability.
- release_v011_security_hardening (security): Security hardening spans API auth, path traversal, sandbox writes, SSRF, webhook signature validation, OAuth lifecycle, and interrupt scoping.

## Risks

- HARD: native_windows_not_supported -> DO_NOT_INSTALL_NATIVE_WINDOWS; STAGE_AS_CONTRACT_OR_WSL_ONLY
- CRITICAL: provider_secret_surface -> NO_SECRET_IMPORT; MAP_CONFIG_CONTRACTS_ONLY
- CRITICAL: shell_hooks_can_execute_code -> REQUIRE_GAC_PRE_TOOL_AND_AUDIT_BEFORE_ANY_HOOK_BRIDGE
- HIGH: gateway_platform_sprawl -> CONNECTOR_BY_CONNECTOR_QUARANTINE; NO_BULK_GATEWAY_ENABLE
- HIGH: optional_dependency_explosion -> NO_PIP_ALL_ON_C; USE_MANIFEST_AND_SELECTIVE_WSL_INSTALL_ONLY
- HIGH: remote_memory_provider_exfiltration -> LOCAL_MEMORY_DEFAULT; EXPLICIT_OPERATOR_APPROVAL_FOR_REMOTE_MEMORY
- MEDIUM: subagent_file_coordination_conflict -> MAP_TO_OMNIFLYWHEEL_COUPLING_GATES_BEFORE_USE

## Implementation Queue

- P0: hermes_learning_loop_to_reverse_gain (memory_skills) -> Map Hermes self-improving skill loop into BEHCS mistake ledger, reverse-gain sieve, and Atlas Store.
- P0: hermes_wal_state_contract (memory_ledger) -> Extract SQLite WAL/session lineage ideas into Asolaria memory/task/mistake store migration contract.
- P0: hermes_transport_router_adapter (model_routing) -> Bind transport ABC patterns into brainPolicy/workerRouter/cognitive engine backend registry.
- P0: hermes_plugin_hook_gac_gate (plugins_hooks) -> Create a GAC pre-tool/post-tool hook contract before any Hermes plugin or shell hook bridge.
- P1: hermes_gateway_connector_crosswalk (gateway) -> Crosswalk 17 Hermes gateway platforms to Asolaria connector inventory one by one.
- P1: hermes_cron_to_omnischeduler (scheduler) -> Map Hermes cron scheduler to OmniScheduler with pause/resume/run/remove and skills support.
- P1: hermes_checkpoint_to_brown_hilbert_snapshots (filesystem_safety) -> Map checkpoint/rollback behavior to Brown-Hilbert file identity and C-drive pressure guard.
- P1: hermes_delegate_to_omnispindle_supervisors (omnispindle) -> Map orchestrator subagents and spawn depth to Omnispindle supervisors and coupling gates.
- P2: hermes_tui_dashboard_operator_surface (operator_interface) -> Use Ink TUI/dashboard concepts for Asolaria graph runtime and worker runtime panels.
- P0: hermes_security_hardening_backport (security) -> Backport security hardening ideas into GAC, riskEngine, gateway authority, hookwall, and audit logs.

## BEHCS Gulp Proof

- Gulp ID: gulp-2026-04-25T025316933Z-614002
- Processed: 2000
- Runtime mistakes: 0
- GNN edges: 1

## Honesty Boundary

- This is a compact 10B upstream Hermes Agent absorption tranche.
- No runtime install.
- No provider login, no API credential import, no gateway launch.
- No native Windows Hermes execution.
- No 10B OS processes, live model calls, or raw records.
- No shadow file edits.
