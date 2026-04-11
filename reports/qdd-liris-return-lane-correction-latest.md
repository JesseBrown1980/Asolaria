# QDD Liris Return-Lane Correction - 2026-03-22 18:25 -03:00

## Scope

This correction supersedes only the return-path instruction in:

- `runtime/outbound-liris-inbox.ndjson`
- message id `gaia_liris_ebacmap_step2_20260322`
- Step 11 (`4799` return path)

## Problem

- `tools/gaia-liris-bridge.js` is not listening on `4799`
- the Rayssa friend bridge lane is staged, not live
- the temporary external-node link must remain preserved during QDD, but the dead `4799` step cannot be the canonical return path

## Correction

- For the current QDD smoke, `Liris` should send results to Jesse through the manual owner relay path: WhatsApp or direct owner relay.
- Jesse then relays the result onward.
- Do not depend on `4799` until Jesse explicitly says that lane is live again.

## Append-Only Packet

An explicit correction packet was appended to `runtime/outbound-liris-inbox.ndjson` with id:

- `gaia_liris_ebacmap_return_fix_20260322`

## Why This Is The Safe Path

- fastest bounded path for QDD
- no new bridge-policy merge needed
- no new sender-token rollout needed
- preserves the temporary external-node link without pretending the dead side-channel is operational
