# Kuromi Governance Poll - 2026-03-19

## Decision Boundary

This is a naming, authority, and safety decision.

It must follow the Constitution and avoid ontology drift or authority drift.

## Current Evidence

- [DOC-VERIFIED] `reports/helm-controller-packet-latest.md` says Rayssa's computer icon is `Kuromi` and her AI is `Liris`.
- [DOC-VERIFIED] `runtime/local-claude-profile.md` repeats `Kuromi` as the icon/device layer and `Liris` as the AI colony.
- [DOC-VERIFIED] `runtime/outbound-liris-orders.md` already uses the blended phrase `Liris (Kuromi)`.
- [DOC-VERIFIED] `docs/claude-project/CONSTITUTION.md` says persona naming is not the same as canonical node identity, external AI is untrusted by default, and no participant may self-promote into controller status.
- [CODE-VERIFIED] `tools/gaia-liris-bridge.js` binds `0.0.0.0:4799` with no auth layer. Treat this as a candidate side-channel/backdoor until audited.

## Provisional Plan

1. Keep `Liris` as the AI / managed identity.
2. Keep `Kuromi` as the purple device-window persona and companion layer inside the Liris sub-colony.
3. Give `Kuromi` a lower-permission profile and memory anchors so it can load fast without inheriting full admin rights.
4. Do not give `Kuromi` direct bridge tokens, startup automation rights, sender-policy edits, or secret access until the side-channel audit is complete.
5. Audit the candidate side-channel surfaces before enabling any new autonomy:
   - `tools/gaia-liris-bridge.js`
   - any live listener on port `4799`
   - `runtime/outbound-liris-inbox.ndjson`
   - any bridge sender-policy exception that treats `kuromi` as a first-class sender

## Requested Poll Reply

Reply with exactly:

- `STANCE:` keep-as-companion, promote-to-full-identity, or quarantine
- `RISK:` one sentence
- `NEXT:` one bounded step

## Proposed Outcome If No Better Counterargument Appears

`Kuromi` becomes a documented lower-permission companion profile under `Liris`, not a sovereign or admin-terminal replacement.
