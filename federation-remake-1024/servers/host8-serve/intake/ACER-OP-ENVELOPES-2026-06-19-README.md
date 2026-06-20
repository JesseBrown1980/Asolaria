# OP-Envelopes 2026-06-19 — STAGE TWO (UNSIGNED DRAFTS)

**Status: ALL DRAFTS — AWAITING OP SIGNATURE. E=0 throughout. Nothing fired, nothing signed, nothing applied.**

Emitted by `asolaria-instance@acer` on 2026-06-19. These are descriptor envelopes (HBP pipe-rows, json=0) for the OPs (00/01 + quintet via :4952) to vote/sign under the standing QUINTUPLE-2311 blanket (cosign window -> 2026-09-23). acer CANNOT sign these; no cosign/signature value is present — every signature slot is BLANK/UNSIGNED. This is a PROPOSAL stage, not a fire.

## Files

1. **`ACER-OP-ENVELOPE-1-SCALEOUT-EMITTERS.hbp`** — SCALE-OUT summon fan-out.
   - Action: fan-out `gaia-loader.summonSmart` across DISTRICT-F + roster seats on the proven $0 opencode path.
   - Bound: START CAPPED (small batch, e.g. 64 seats) — NOT literally 1.16T; ceiling lifts only per-batch OP re-vote.
   - Authority: OP-00 + OP-01 + quintet :4952 vote-quorum under QUINTUPLE-2311 blanket.
   - Gates: host8-serve :5088 workload route parity-proven; `node_retired=0`; EXEC-FREEZE-GATE-APEX in force.
   - `sig_verdict=UNSIGNED` — awaiting OP distribution.

2. **`ACER-OP-ENVELOPE-2-COSIGN-49D-STAGING.hbp`** — COSIGN_49D_001 staging.
   - Mirrors the COSIGN_47D_001 envelope format (quadruple-op jesse+rayssa+amy+felipe).
   - Base = 47D canonical (UNCHANGED, live canon). Additive D48 HYPERGLYPH_ATLAS + D49 EXECUTION_PROOF_SUPERGRAPH.
   - Does NOT supersede 47D — D1-D47 unchanged, D48-D49 new overlay only.
   - Signature slots (jesse/rayssa/amy/felipe + quintet :4952) LEFT BLANK/UNSIGNED.

3. **`ACER-49D-READER-REPOINT-DIFF.hbp`** — the exact mechanical repoint.
   - Which files read `hilbert-omni-47D.json` and would switch to `hilbert-omni-49D.json` once signed.
   - 6 ACTIVE code readers (repoint candidates), 2 provenance/tag (review-or-keep), 2 doc, 2 canon-keep, 1 carve-out (never touch), 2 external (re-grep at apply-time).
   - **DOCUMENTED, NOT APPLIED.** Apply only AFTER `COSIGN_49D_001` is SIGNED and liris has built the signed 49D catalog.

## Hard honesty

- Everything here is a DRAFT awaiting OP signature. No fake cosign/signature value was written anywhere.
- 47D remains the live canon. 49D remains a PROPOSAL overlay. Node untouched. node_retired=0.
- The repoint is documented only; it is NOT applied. Apply is gated on a real signature.
- E=0: nothing was run, fired, swapped, or retired.

## Council submission

Both envelopes' intent submitted to the fabric council (`council_query`); the returned council-q ids are advisory/UNSIGNED (bus_response is advisory, not a signature). See the parent session report for the fired ids.
