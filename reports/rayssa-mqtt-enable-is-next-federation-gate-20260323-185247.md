# Rayssa MQTT Enable Is The Next Federation Gate

Timestamp: 2026-03-23 18:52:47 -03:00

## Owner-Relayed Host Evidence

Liris reports that Rayssa local memory/index now matches the corrected federation gate.

The important host-scoped read is:

- `GET /api/federation/self/compute-readiness` already shows `nodeId=liris`
- `GET /api/federation/self/compute-readiness` already shows `computeWorkerReady=true`
- the blocker is no longer self-readiness or route archaeology
- the blocker is Rayssa MQTT being off on that host

Reported Rayssa MQTT state:

- `enabled=false`
- `configured=false`
- `connection.ok=false`
- `state=idle`

## Durable Meaning

Step 1 of the remote federation gate is already satisfied on Rayssa host.

The next real move is:

1. enable/configure the Rayssa MQTT connector
2. connect it to the broker Jesse can observe
3. make Jesse actually see `liris` in `GET /api/federation/nodes`
4. then prove one bounded remote compute job

## Boundary

Do not:

- reopen self-readiness proof on Rayssa unless it regresses
- patch route surfaces first
- claim remote federation from phone-lane health
- claim cross-host compute before Jesse sees `liris` online
