# Gaia-Liris Federation Proof Gate

Timestamp: 2026-03-23 18:44:55 -03:00

## Current Accepted Truth

- Jesse sovereign is now live as `jesse-sovereign`.
- Jesse `computeWorkerReady` is `true`.
- Rayssa phone lane is healthy again under `liris/kuromi`.
- Federation still has zero remote nodes proven on Jesse.

## Corrected Rule

Do not assume the Rayssa checkout exposes the same MQTT config route surface as Jesse.

On Jesse, `POST /api/integrations/mqtt/config` is verified and live.

On Rayssa, the next proof step is not route patching by default. The next proof step is:

1. `GET /api/federation/self/compute-readiness`
2. raw MQTT-connected / capability evidence already exposed on that host
3. only if those are insufficient, propose the thinnest route patch

## Promotion Gate

Remote federation is not promoted from phone-lane health alone.

The next valid sequence is:

1. Liris proves Rayssa-host self-readiness under `liris`
2. Jesse sees `liris` appear in `GET /api/federation/nodes`
3. Jesse dispatches one bounded remote compute job
4. Liris returns one real compute result

## Boundary

Do not:

- mutate Jesse MQTT config again
- claim remote federation from Rayssa phone health alone
- patch Rayssa routes before checking self-readiness
- claim shared phone CPU/RAM from this state

## Result

The durable decision tree is now:

- `Jesse node identity live` -> yes
- `Rayssa phone lane live` -> yes
- `Remote node proven` -> not yet
- `Cross-host compute proven` -> not yet
