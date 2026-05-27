# Gaia Rayssa Phone Compat Wait State

Generated: 2026-03-23 15:46:31 -03:00

## Current Local Anchor

While waiting for Gaia, use these as the current Jesse-side reference surface:

- `reports/gaia-rayssa-phone-compat-packet-ingest-latest.md`
- `data/agent-index/IX-294.md`

## Exact Next Comparison If Gaia Replies With A Delta

Check only these points first:

1. Does Gaia still carry the older Rayssa-host `/api/mobile/bootstrap = 404` assumption?
2. Does Gaia still default Rayssa's phone/mobile surface to `Falcon` instead of `liris/kuromi`?
3. Does Gaia disagree with the newer compat-route contract:
   - `GET /api/mobile/bootstrap = 200`
   - `viewer=liris`
   - `GET /api/mobile/session = 200`
   - `GET /api/mobile/control/status = 200`
4. Does Gaia raise the bundled smoke contradiction:
   - route checks pass
   - smoke ADB/reverse subsection still lags

## Decision Branch

### If Gaia agrees

- keep `IX-294` as the current host-scoped Rayssa packet
- do not reopen the old `404` packet
- next technical cleanup is one fresh single-source Rayssa smoke/probe bundle so the stale ADB/reverse subsection is replaced

### If Gaia disagrees

- ask for the exact conflicting packet, report, or raw probe lines
- compare only against the four points above
- do not reopen OpenClaw archaeology, notebook taxonomy, or broader startup lore

## Priority Rule

The goal while waiting is not another broad synthesis.

The goal is:

- keep the current Rayssa host packet pinned
- compare only deltas
- collapse the stale smoke contradiction with one fresh proof bundle if needed
