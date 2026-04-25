# README Sanitization Checklist

Status: plan only. Do not execute publication from this file.

Purpose: convert `README.md` from a private-runtime-adjacent document into a credible public entrypoint.

## Audience And Positioning

The README must read like:

- a product/architecture overview
- a credible local-first system description
- a bounded public surface

The README must not read like:

- a private operator runbook
- a topology dump
- a manifesto with unsupported claims
- a runtime status board

## Claims Policy

Allowed labels:

- `LIVE`
  - only for tracked, reproducible, public-facing facts
- `LOCAL_OBSERVED`
  - only with `as_of` context and only if not exposing private runtime details
- `PROPOSAL`
  - for `49D+`, future rollout layers, and unsealed claims
- `PRIVATE`
  - for runtime-only or operator-only surfaces
- `DENIED`
  - for claims that must not appear publicly

Must relabel or remove:

- `100% accurate`
- `unhackable`
- `fully autonomous`
- `finished runtime`
- `production-ready everywhere`
- `ASI` as a factual public claim

## Link Policy

README must not link to:

- `data/`
- `runtime/`
- `logs/`
- `captures/`
- raw `reports/`

README must link to:

- tracked `specs/`
- tracked `projections/`
- tracked `examples/`
- tracked `tools/`

## Security And Privacy Scrub

Remove or replace:

- absolute local paths
- local hostnames
- usernames
- internal IPs
- internal ports
- local URLs
- session IDs
- device IDs
- command lines
- raw runtime counts that imply unpublished topology

Replace with:

- `<REPO_ROOT>`
- tracked public projections
- synthetic or redacted examples

## Demo Narrative

README should expose one credible path:

- what Asolaria is
- what is public today
- one example capsule
  - `MiniMax-M2.7`
- one validator path
- one statement of current limits

README should not promise:

- live runtime access
- internal dashboards
- operator-only routes
- sealed `49D` runtime claims

## Proof Pointers

README may point to:

- public `47D` spec
- public `49D` proposal
- public projection map
- public release index contract
- public examples
- public validators

README must not point to:

- ignored runtime artifacts
- waiver files
- raw proof bundles
- internal operator evidence

## Current Known Violations To Fix Later

Known issues in the current README that block public use:

- links to ignored `data/...` artifacts
- internal ports and local URLs
- runtime/live wording that exceeds public proof posture
- research or paper wording that reads like validated public claims

## Final Publish Gates

Before the README is considered public-ready:

- no internal paths
- no internal ports or URLs
- no ignored/private links
- no unsupported extreme claims
- one tracked example path exists
- one tracked validator path exists
- one limits banner exists
- `SKIPPED` is never presented as `PASS`
