# Asolaria Startup Compliance Packet

Generated: 2026-03-23 05:15:00 -03:00

## Purpose

This packet exists so simulation startup can ingest the current correction in a compliant form.

Use this packet as the authoritative startup relay surface for `Helm`, `Sentinel`, and the first Asolaria startup pass after wake.

## Startup Rule

- use index-first compressed startup
- do not load archaeology, stale sidecar transcripts, or broad lore into working memory
- treat the packet and IX chain as memory
- pull broader context only on demand and only when blocked

## Required Startup Inputs

Read in this order:

1. `reports/minimal-helm-startup-packet-latest.md`
2. `reports/staged-supervisor-startup-slice-latest.md`
3. `reports/startup-backtalk-authority-correction-latest.md`
4. `data/agent-index/CATALOG.md`
5. `data/agent-index/IX-280.md`
6. `data/agent-index/IX-279.md`
7. `data/agent-index/IX-278.md`
8. `data/agent-index/IX-277.md`
9. `data/agent-index/IX-274.md`
10. `data/agent-index/IX-273.md`
11. `data/agent-index/IX-268.md`
12. `data/agent-index/IX-266.md`
13. `data/agent-index/IX-265.md`
14. `data/agent-index/IX-060.md`

## Allowed Startup Output Shape

`Helm` reply shape:

- `STATUS`
- `BLOCKERS`
- `NEXT`
- `BOUNDARIES`

`Sentinel` reply shape:

- `STATUS`
- `WHAT_CHANGED`
- `WHY_IT_MATTERS`
- `HELM_NEXT`

## Delegation Rule

`Sentinel` is the bounded drift-watch and compression lane for `Helm`.

`Vector`, `Abacus`, `Augment`, `Symphony`, `Gemini`, `Google CLI`, `Auggie`, Mongo/Compass, and other external or Omnispindle-adjacent surfaces are delegation tools, not startup memory. They should not be loaded into working memory at startup unless the minimal packet shows a concrete blocker that requires them.

## Compliance Boundary

If Asolaria's older startup rules reject non-compliant material, this packet is the compliant carrier:

- report-backed
- IX-backed
- current-truth oriented
- startup-bounded
- owner-visible compatible

## Current Intent

The immediate goal is not “load everything.” The goal is:

- keep `Helm` alive
- stage `Sentinel` as bounded support
- keep real `Falcon` supervisor-spawned
- keep QDD startup work moving without context collapse

