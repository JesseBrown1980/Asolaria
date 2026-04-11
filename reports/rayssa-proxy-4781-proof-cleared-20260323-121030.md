# Rayssa PROXY_4781 Proof Cleared

Generated: 2026-03-23 12:10:30 -03:00

## Proof Received

Rayssa/Liris reported the compatibility proxy is live and provided the required gate evidence.

### `4781` listener

`netstat -ano | findstr :4781`

- `TCP 127.0.0.1:4781 0.0.0.0:0 LISTENING 2060`

### `4791` gateway health

`Invoke-WebRequest http://127.0.0.1:4791/health`

- `STATUS=200`
- payload reported `ok=true`

### `4781` compat health

`Invoke-RestMethod http://127.0.0.1:4781/api/health/fast`

- `ok=true`
- `compatSurface=proxy_4781`
- returned gateway metadata including the gateway start time

## Caveat

Rayssa also found one real bug in the compat launcher:

- on rerun, the launcher can report a fresh start even if the original `4781` listener is still the real process holding the port

That is a launcher accounting bug, not a gate failure. The live listener and health proof are already present.

## Operational Consequence

- Rayssa-host `PROXY_4781` branch is now live enough for `Helm`
- the host gate is cleared
- the remaining follow-up is to tighten the compat launcher so reruns key off the actual listening PID on `4781`
