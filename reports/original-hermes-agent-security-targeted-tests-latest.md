# Original Hermes Security Targeted Tests

Generated: 2026-04-25T00:42:22.388Z
Status: SECURITY_TARGETED_TESTS_PASS_PATCHES_BLOCKED
Validation: PASS
Digest: 7557df23715606380b1dd310f6077c10773dd94a63c99034cf054c3080c996ef

## Command Checks

- api_auth_enforcement: pass (node --check src/gateway/toolAuthority.js, shell=false, 147ms)
- path_traversal_checkpoint_guard: pass (node --check tools/c-drive-junction-migrator.js, shell=false, 127ms)
- sandbox_write_shell_injection_guard: pass (node --check services/sandbox-manager/server.js, shell=false, 121ms)
- ssrf_redirect_guard: pass (node --check src/riskEngine.js, shell=false, 141ms)
- webhook_signature_validation: pass (node --check routes/hooks.js, shell=false, 154ms)

## Connector Surface Review

- Connector files reviewed: 47
- Files with env refs: 37
- Files with vault refs: 17
- Files with auth terms: 44
- Status: review_only

## Honesty Boundary

- Shellless command execution only.
- Syntax/review tests only.
- No patch application.
- No provider calls.
- No secret values read or printed.
- No daemon launch.
- No shadow file edits.
