# Liris Agent Keyboard Delta-Only Patch 2026-04-08

D11_PROOF 0x745F
- prior delivery was wrong artifact class = acer mirror, not liris delta
- confirmed regressions if full replacement is used:
  - port drift `4820 -> 4913`
  - host/profile drift
  - dry-run regression risk

D6_GATE 0x895
- DO NOT replace Liris `tools/agent-keyboard.js` wholesale with Acer copy
- preserve all Liris-local constants and identity surfaces
- preserve `PORT = 4820`
- preserve Liris host/profile/spec headers

D8_CHAIN 0x1ACB
apply only these semantic deltas to the Liris-side file:

1. target resolution
- add helper to parse:
  - `window_title`
  - `window_id`
- if `window_id` is present and > 0, prefer it over title matching

2. verified focus prefix
- replace blind `AppActivate(...) | Out-Null`
- require:
  - `$focused = $wsh.AppActivate(...)`
  - `if (-not $focused) { throw ... }`
- support both:
  - `AppActivate([int]window_id)`
  - `AppActivate('window_title')`

3. richer target enumeration
- extend `/windows` and `/status`
- return full target list:
  - `id`
  - `process`
  - `handle`
  - `title`
- do not return title strings only

4. /press shift support
- in `/press`, read `body.shift === true`
- map to SendKeys token:
  - `+{ENTER}` when shift=true
  - `{ENTER}` otherwise

5. /type enter delay
- in `/type`, accept optional `enter_delay_ms`
- clamp to sane range, e.g. `0..2000`
- if `press_enter` is true:
  - type text
  - wait `enter_delay_ms`
  - then press ENTER

6. response proof fields
- include in success payloads where possible:
  - `window_title`
  - `window_id`
  - `press_enter`
  - `enter_delay_ms`

D22_TRANSLATION 0x785AF
safe rule for Liris deployment:
- patch receiver semantics only
- do not import Acer cube constants
- do not import Acer port/bind/identity values
- do not invert Liris defaults unless explicitly intended in existing file

D24_INTENT 0x3600
expected result after Liris-side delta patch:
- no port drift
- no identity drift
- stronger focus proof
- real `shift` support
- adjustable submit timing for Claude Code
