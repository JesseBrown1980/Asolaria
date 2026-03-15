# Voice Bridge Caption Push Auth Smoke

Generated: 2026-03-04T22:50:38.6809768+00:00
Base URL: http://127.0.0.1:4781
Session ID: bridge_auth_20260304_195038_184d76
BridgePushToken provided to script: no

## Runtime Auth Status

- required: no
- requiredBySetting: no
- configured: no
- mode: open

## Probe Results

| Probe | Token Provided | HTTP Status | Accepted | Error |
| --- | --- | ---: | --- | --- |
| no_token | no | 200 | yes |  |
| wrong_token | yes | 200 | yes |  |

## Assertions

| Assertion | Expected | Observed | Result |
| --- | --- | --- | --- |
| open_mode_no_token_allows_push | status 2xx | status 200 | PASS |

Overall: PASS
