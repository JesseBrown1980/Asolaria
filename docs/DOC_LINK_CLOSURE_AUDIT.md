# Doc Link Closure Audit

Status: local overlay-only sanitization in progress. Do not execute publication from this file.

Purpose: inventory the tracked docs that still reference private/runtime material and define the prioritized rewrite queue required before any public rollout work can proceed.

## Priority Rules

- `P0`: top-level entry docs that shape first trust
- `P1`: release and packaging docs that could leak private execution assumptions
- `P2`: internal docs that should be explicitly marked internal or excluded from public rollout scope

## Rewrite Queue

| Priority | File | Current state | Local tranche action | Owner | Acceptance |
|---|---|---|---|---|---|
| `P0` | `README.md` | local overlay-only sanitization landed | replaced ignored runtime refs and local topology with tracked public paths and labels | `Asolaria` + `Sentinel` + `Falcon` | no private links, no internal ports/URLs, one public example path, one validator path |
| `P0` | `BROWN-HILBERT.md` | local overlay-only sanitization landed | removed absolute local paths and ignored runtime refs; kept proposal/live split | `Gaia` + `Liris` + `Helm` | no ignored runtime refs in public mode, proposal/live labels preserved |
| `P0` | `CODEX.md` | local overlay-only sanitization landed | replaced private boot refs with tracked public placeholders | `Helm` + `Gaia` | no private-tree dependency in public reading path |
| `P0` | `CLAUDE.md` | local overlay-only sanitization landed | replaced private boot refs with tracked public placeholders | `Helm` + `Gaia` | no private-tree dependency in public reading path |
| `P1` | `docs/PUBLIC_RELEASE_PIPELINE.md` | local overlay-only sanitization landed | converted to `<REPO_ROOT>` pathing and projected public gate outputs | `Helm` + `KR` | no absolute local path, no raw private-evidence path in public bundle flow |
| `P1` | `docs/PUBLISHABLE_RELEASE.md` | local overlay-only sanitization landed | converted to neutral public pathing and projected public gate outputs | `Helm` + `Sentinel` | no host-specific paths, no implicit private operator assumptions |
| `P2` | internal operator docs under `docs/` with local paths, internal ports, tokens, or runtime runbooks | remaining blocker | mark internal-only or exclude from public rollout surface | `Sentinel` + `Dasein` + `Watchdogs` | internal docs are labeled or excluded from public package scope |

## Current Known Trigger References

The `P0` and `P1` targets listed above were cleared in this local overlay-only tranche against a boundary-aware forbidden-ref audit.

The remaining trigger set is now the broader internal operator doc surface under `docs/`, where local paths, tokens, ports, runtime runbooks, and private evidence handling still appear by design.

## Exact Line-Hit Summary

The pre-edit line hits that grounded this rewrite queue have been resolved for the six edited files.

Current local audit result for:

- `README.md`
- `BROWN-HILBERT.md`
- `CODEX.md`
- `CLAUDE.md`
- `docs/PUBLIC_RELEASE_PIPELINE.md`
- `docs/PUBLISHABLE_RELEASE.md`

is `no matches` under the boundary-aware forbidden-ref scan used for this tranche.

## Acceptance Gates

This audit is only closed when:

- every `P0` file has an assigned owner
- every `P0` file has a planned replacement path for each private/runtime reference
- every `P1` file uses `<REPO_ROOT>` or tracked public paths
- every `P2` file is either labeled internal-only or removed from the public rollout surface
- proposal/live labels are preserved after rewrite
- release docs no longer depend on raw `reports/`

## Next Execution-Safe Step

After this audit, the next local-only execution-safe step is:

1. classify the remaining operator-heavy docs under `docs/` as `public`, `internal-only`, or `exclude-from-bundle`
2. add explicit internal-only banners where needed
3. keep promotion denied until public proof artifacts are real rather than placeholders
