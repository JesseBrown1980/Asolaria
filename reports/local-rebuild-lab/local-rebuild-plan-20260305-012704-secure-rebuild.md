# Local Secure Rebuild Plan

- Generated: 2026-03-05T04:27:04.220Z
- App: Local skill smoke
- Objective: smoke
- Evidence files loaded: 1
- Evidence chars loaded: 45

## Top Signals
- adb: 1
- clipboard: 1
- mcp: 1
- oauth: 1
- slack: 1
- transcript: 1

## Capability Profile
- live_transcription | confidence=0.51 | matches=2
- clipboard_pipeline | confidence=0.43 | matches=1
- identity_oauth | confidence=0.43 | matches=1
- integrations_collab | confidence=0.43 | matches=1
- mobile_bridge | confidence=0.43 | matches=1
- tool_orchestration | confidence=0.43 | matches=1

## Timeline
- Estimated hours: 62
- Days @6h: 10.3
- Days @8h: 7.8

## Security Gates
- No proprietary binary/code extraction; rely on observed behavior and public docs only.
- Pin dependency versions and generate SBOM for every local replacement service.
- Run secrets scan on generated artifacts before commits.
- Enforce egress allowlist for all connector calls.
- Keep raw audio local by default; require opt-in for cloud ASR.
- Mask secrets/PII before transcript persistence.
- Use append-only transcript audit logs with retention limits.
- Treat clipboard entries as sensitive user data.
- Avoid privileged clipboard extraction paths.
- Apply secret-pattern redaction before export.
- Never persist refresh/access tokens in plaintext artifacts.
- Mask account identifiers in reports by default.
- Fail closed on redirect/auth anomalies.
- Enforce workspace/domain allowlists before any send action.
- Separate read-only review from posting capabilities.
- Block mass-send operations without explicit approval.
- Require explicit device allowlist and serial pinning.
- Block privileged shell paths unless owner-approved.
- Store captures in local evidence folders with checksum metadata.
- Default-deny tool execution with explicit allowlist.
- Run tool actions through risk scoring and approval gates.
- Log tool payload summaries without leaking secrets.

## Test Matrix
- Unit tests for capability parsers and policy evaluators
- Contract tests for each enabled connector
- Red-team prompt test for unsafe automation denial paths
- Mic-only and loopback transcription accuracy regression test
- Transcript drop-resilience test under queue pressure
- Copy-paste chat formatting validation test
- Copy payload formatting test
- Sensitive-token redaction test
- Clipboard failure fallback test
- Per-account OAuth viability smoke test
- Masked-report verification test
- Auth error taxonomy regression test
- Integration configured/not-configured path test
- Workspace allowlist deny test
- Outbound posting approval-gate test
- Multi-device targeting fallback test
- USB/LAN route consistency check
- Phone capture artifact integrity check
- Tool allowlist deny/allow matrix
- Policy preset integrity test
- Approval hook bypass prevention test

## Legal Boundary
- Rebuild from behavior/spec observations only; do not extract proprietary source code or bypass paid/licensed controls.
