# Doc Surface Classification

Status: local overlay-only execution artifact. Do not treat this file as release approval.

Purpose: define which docs are currently allowed into the public bundle, which remain internal-only, and which are excluded until later sanitization.

## Public Bundle Allowlist

These docs are part of the current public-surface tranche:

- `docs/PUBLIC_ROLLOUT_DEEP_WAVE_SECOND_CASCADE.md`
- `docs/PUBLIC_PROJECTION_MAP.md`
- `docs/RELEASE_INDEX_CONTRACT.md`
- `docs/README_SANITIZATION_CHECKLIST.md`
- `docs/PUBLIC_TREE_DIRECTORY_CONTRACT.md`
- `docs/ABSORBABILITY_ACCEPTANCE_AMYROSE_ORACLE.md`
- `docs/DOC_LINK_CLOSURE_AUDIT.md`
- `docs/P0_REWRITE_BLUEPRINTS.md`
- `docs/PUBLIC_VALIDATOR_INTERFACE.md`
- `docs/PUBLIC_RELEASE_PIPELINE.md`
- `docs/PUBLISHABLE_RELEASE.md`

## Internal-Only Or Exclude-From-Bundle

These docs are operator-heavy and must stay out of the public bundle until separately sanitized:

- `docs/ADMIN_TERMINAL_SIDECAR.md`
- `docs/APP_REGISTRATION_DEMO_RUNBOOK.md`
- `docs/ASOLARIA_SHORTCUT_ICON_LIVE.md`
- `docs/AUGMENT_CONTEXT_SIDECAR.md`
- `docs/AUTHORITY_MODES.md`
- `docs/BEHCS-OMNIDIRECTIONAL-MIRROR.md`
- `docs/CANONICAL_SOURCE.md`
- `docs/GATEWAY_AUDIT_LOG.md`
- `docs/GATEWAY_TOOL_AUTHORITY.md`
- `docs/HANDOVER_ROADMAP.md`
- `docs/HELM_CONTROLLER_SURFACES.md`
- `docs/VAULT_APPROLE_RUNBOOK.md`
- `docs/claude-project/**`
- `docs/adr/**`

## Bundle Rule

The public release manifest should include the allowlist above explicitly and should not ship the rest of `docs/` by default.

## Remaining Truth

- This classification does not make the bundle public-ready.
- Promotion remains denied until real proof artifacts replace placeholders.
