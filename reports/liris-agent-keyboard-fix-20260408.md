# Liris Agent Keyboard Fix 2026-04-08

D11_PROOF 0x745F
- root cause = transport/key success was being reported without proving app-level submit inside Claude Code
- sender bug = fixed locally earlier (`window` -> `window_title`, foreground-safe path)
- receiver bug = still present on Liris-side keyboard server

D8_CHAIN 0x1ACB
- patched file = `tools/agent-keyboard.js`
- companion senders = `tools/keyboard/type-to-liris.js`
- companion senders = `tools/keyboard/type-multi-to-liris.js`
- companion wrapper = `tools/omni/omni-vision-liris.js`

D22_TRANSLATION 0x785AF
- added `window_id` target support on keyboard server
- added richer `/windows` and `/status` target metadata
- added `shift` support in `/press`
- added `enter_delay_ms` support in `/type`
- kept explicit `window_title` compatibility
- senders now discover `window_id` when the receiver exposes it

D6_GATE 0x895
- local syntax checks = PASS
- local code is ready for Liris-side deployment
- remote issue will persist until Rayssa-side `tools/agent-keyboard.js` is updated

D24_INTENT 0x3600
- deploy `tools/agent-keyboard.js` on Liris side
- restart the Liris keyboard server
- then retest `type` into `Claude Code` with `window_id` path before further packet loops
