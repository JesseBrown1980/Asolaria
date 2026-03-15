# Asolaria Rebuild Notes

Date: 2026-02-18

## Implemented in this slice

- Added isolated authenticated gateway scaffold:
  - `config/asolaria.gateway.json`
  - `src/gateway/server.js`
  - `src/gateway/package.json`
- Added isolated sandbox execution scaffold:
  - `services/sandbox-manager/asolaria.sandbox.json`
  - `services/sandbox-manager/server.js`
  - `services/sandbox-manager/package.json`
- Added tool manifest scaffolding:
  - `scripts/gen-tool-manifests.ps1`
  - `tools-manifests/githubConnector/githubConnector.create_issue.schema.json`
- Added setup helper:
  - `tools/Setup-Asolaria-Rebuild.ps1`

## Important integration decisions

- Gateway port defaulted to `4791` to avoid conflict with current Asolaria port `4781`.
- Existing `server.js` was not modified in this slice.
- WS authentication is enforced at handshake (`/ws?token=...`) and rejects bad origin/token.
- Heartbeat uses explicit ack contract:
  - `HEARTBEAT_OK` when all probes pass
  - `HEARTBEAT_DEGRADED` otherwise
- Cron is implemented in-process with a lightweight matcher and execution history.

## Known follow-up items

- Bridge gateway tool calls into existing connector layer safely (current gateway has registry + heartbeat + cron handlers only).
- Add Vault AppRole flow for per-connector machine identities (current project uses local encrypted vault namespaces).
- Add memory indexer service (`living-files` + ChromaDB) and wire query tool into gateway.
- Add dashboard app (`apps/dashboard`) using authenticated WS and token bootstrap flow.

## 2026-02-18 additional slice

- Added canonical-source and handover roadmap docs:
  - `docs/CANONICAL_SOURCE.md`
  - `docs/HANDOVER_ROADMAP.md`
- Added control-plane operations scripts:
  - `tools/Start-Asolaria-ControlPlane.ps1`
  - `tools/Stop-Asolaria-ControlPlane.ps1`
  - `tools/Get-Asolaria-ControlPlaneStatus.ps1`
  - `Start-Asolaria-ControlPlane.cmd`
  - `Stop-Asolaria-ControlPlane.cmd`
- Added public release pipeline:
  - `config/public-release.manifest.json`
  - `tools/Build-PublicRelease.ps1`
  - `docs/PUBLIC_RELEASE_PIPELINE.md`
- Added gateway tool authority layer:
  - `src/gateway/toolAuthority.js`
  - `docs/GATEWAY_TOOL_AUTHORITY.md`
  - `POST /invoke`, `GET /approvals`, `POST /approvals/:id/decide`, `GET /tools/policy`
- Added authority mode state machine:
  - `src/gateway/authorityMode.js`
  - `docs/AUTHORITY_MODES.md`
  - `GET /authority/status`, `POST /authority/mode/request`, `POST /authority/mode/confirm`, `POST /authority/mode/rollback`
- Added Vault AppRole scaffold:
  - `infra/vault/vault.hcl`
  - `infra/vault/setup-connectors.ps1`
  - `docs/VAULT_APPROLE_RUNBOOK.md`
- Added root `.gitignore` focused on runtime/private artifacts.
